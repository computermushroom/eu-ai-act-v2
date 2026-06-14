// Email Service
// Centralized email sending using nodemailer
// Supports: password reset, verification, notifications
// GDPR: minimal email content, unsubscribe option

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Common SMTP provider presets
 */
const SMTP_PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  "office365": { host: "smtp.office365.com", port: 587, secure: false },
  yahoo: { host: "smtp.mail.yahoo.com", port: 465, secure: true },
  zoho: { host: "smtp.zoho.com", port: 465, secure: true },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, secure: false },
  mailgun: { host: "smtp.mailgun.org", port: 587, secure: false },
};

function getSmtpPreset(): { host: string; port: number; secure: boolean } | null {
  const provider = process.env.SMTP_PROVIDER?.toLowerCase().trim();
  if (provider && SMTP_PRESETS[provider]) {
    return SMTP_PRESETS[provider];
  }
  return null;
}

/**
 * Email transporter configuration
 * Uses SMTP environment variables with preset support
 */
function createTransporter(): Transporter | null {
  // Priority 1: RESEND_API_KEY (Resend HTTP API)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    // Resend uses its own HTTP API; we can use nodemailer's SMTP interface
    // Resend SMTP: host=smtp.resend.com, port=465, secure=true, user=resend, pass=apikey
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: resendKey,
      },
    });
  }

  // Priority 2: Full SMTP config via env vars
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    const preset = getSmtpPreset();
    const port = preset?.port ?? parseInt(smtpPort ?? "587", 10);
    const secure = preset?.secure ?? (port === 465);

    return nodemailer.createTransport({
      host: preset?.host ?? smtpHost,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Connection resilience
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  // Priority 3: Provider preset with user/pass only
  const preset = getSmtpPreset();
  if (preset && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[EMAIL] No email provider configured. Emails will be logged to console only.");
  }
  return null;
}

/**
 * Common email options
 */
function getBaseOptions(to: string) {
  return {
    from: `"EU AI Act Compliance" <${process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com"}>`,
    to,
    replyTo: process.env.SMTP_REPLY_TO ?? undefined,
  };
}

/**
 * Send email with retry logic
 * @param options - Nodemailer sendMail options
 * @param retries - Number of retries on transient failures
 */
async function sendEmailWithRetry(
  options: nodemailer.SendMailOptions,
  retries = 2
): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log("[EMAIL DEV LOG]", {
        to: options.to,
        subject: options.subject,
        text: options.text?.toString().slice(0, 200),
      });
    }
    // In production without config, we throw so the caller knows email is not configured
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASSWORD.");
    }
    return;
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(options);
      if (process.env.NODE_ENV === "development") {
        console.log(`[EMAIL] Sent to ${options.to} (attempt ${attempt + 1})`);
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTransient =
        lastError.message.includes("ECONNRESET") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("ENOTFOUND") ||
        lastError.message.includes("rate limit") ||
        lastError.message.includes("temporary") ||
        (error as { responseCode?: number })?.responseCode === 421 ||
        (error as { responseCode?: number })?.responseCode === 450 ||
        (error as { responseCode?: number })?.responseCode === 451;

      if (!isTransient || attempt === retries) {
        throw lastError;
      }
      // Exponential backoff: 500ms, 1500ms
      await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
    }
  }

  if (lastError) {
    throw lastError;
  }
}

/**
 * Generic send email interface
 * @param params - Email parameters
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await sendEmailWithRetry({
    ...getBaseOptions(to),
    subject,
    text,
    html,
  });
}

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetUrl - Password reset URL with token
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  await sendEmailWithRetry({
    ...getBaseOptions(email),
    subject: "Reset your password - EU AI Act Compliance",
    text: `Hello,\n\nYou requested a password reset for your EU AI Act Compliance account.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email. Your password will remain unchanged.\n\nFor security, this link can only be used once.\n\nEU AI Act Compliance Team`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#1a1a2e">Reset Your Password</h2><p>You requested a password reset for your EU AI Act Compliance account.</p><p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">Reset Password</a></p><p style="color:#666;font-size:14px">This link expires in 1 hour and can only be used once. If you did not request this, please ignore this email.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">EU AI Act Compliance Tool</p></body></html>`,
  });
}

/**
 * Send email verification (for future use)
 * @param email - Recipient email address
 * @param verifyUrl - Email verification URL with token
 */
export async function sendVerificationEmail(
  email: string,
  verifyUrl: string
): Promise<void> {
  await sendEmailWithRetry({
    ...getBaseOptions(email),
    subject: "Verify your email - EU AI Act Compliance",
    text: `Hello,\n\nPlease verify your email address by clicking the link below:\n${verifyUrl}\n\nEU AI Act Compliance Team`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#1a1a2e">Verify Your Email</h2><p>Please verify your email address to complete your account setup.</p><p style="margin:20px 0"><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">Verify Email</a></p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">EU AI Act Compliance Tool</p></body></html>`,
  });
}

/**
 * Send welcome email (for future use)
 * @param email - Recipient email address
 * @param name - User's name
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`;
  await sendEmailWithRetry({
    ...getBaseOptions(email),
    subject: "Welcome to EU AI Act Compliance",
    text: `Hello ${name},\n\nWelcome to EU AI Act Compliance! Your account has been created successfully.\n\nYou can now:\n- Run AI risk assessments (Art.6)\n- Check prohibited practices (Art.5)\n- Verify transparency obligations (Art.50)\n- Generate compliance reports\n\nGet started by visiting your dashboard.\n\nEU AI Act Compliance Team`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#1a1a2e">Welcome, ${name}!</h2><p>Your EU AI Act Compliance account has been created successfully.</p><ul style="margin:16px 0;padding-left:20px"><li>Run AI risk assessments (Art.6)</li><li>Check prohibited practices (Art.5)</li><li>Verify transparency obligations (Art.50)</li><li>Generate compliance reports</li></ul><p style="margin:20px 0"><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">Go to Dashboard</a></p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">EU AI Act Compliance Tool</p></body></html>`,
  });
}
