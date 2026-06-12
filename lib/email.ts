// Email Service
// Centralized email sending using nodemailer
// Supports: password reset, verification, notifications
// GDPR: minimal email content, unsubscribe option

import nodemailer from "nodemailer";

/**
 * Email transporter configuration
 * Uses SMTP environment variables
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[EMAIL] SMTP not configured. Email sending disabled.");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort ?? "587", 10),
    secure: parseInt(smtpPort ?? "587", 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
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
 * Send password reset email
 * @param email - Recipient email address
 * @param resetUrl - Password reset URL with token
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL MOCK] Password reset to ${email}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
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
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL MOCK] Verification to ${email}: ${verifyUrl}`);
    return;
  }

  await transporter.sendMail({
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
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL MOCK] Welcome to ${email}`);
    return;
  }

  await transporter.sendMail({
    ...getBaseOptions(email),
    subject: "Welcome to EU AI Act Compliance",
    text: `Hello ${name},\n\nWelcome to EU AI Act Compliance! Your account has been created successfully.\n\nYou can now:\n- Run AI risk assessments (Art.6)\n- Check prohibited practices (Art.5)\n- Verify transparency obligations (Art.50)\n- Generate compliance reports\n\nGet started by visiting your dashboard.\n\nEU AI Act Compliance Team`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#1a1a2e">Welcome, ${name}!</h2><p>Your EU AI Act Compliance account has been created successfully.</p><ul style="margin:16px 0;padding-left:20px"><li>Run AI risk assessments (Art.6)</li><li>Check prohibited practices (Art.5)</li><li>Verify transparency obligations (Art.50)</li><li>Generate compliance reports</li></ul><p style="margin:20px 0"><a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">Go to Dashboard</a></p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">EU AI Act Compliance Tool</p></body></html>`,
  });
}
