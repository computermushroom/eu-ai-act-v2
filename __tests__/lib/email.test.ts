/**
 * Email Service Tests
 * Tests for the centralized email sending logic in lib/email.ts
 * Covers sendEmail, sendWelcomeEmail, sendPaymentFailedEmail, sendRefundEmail
 * All tests use mocks - no real SMTP connections or external services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock nodemailer ──────────────────────────────────────────────
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => mockCreateTransport(...args),
  },
  createTransport: (...args: unknown[]) => mockCreateTransport(...args),
}));

import {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
} from "@/lib/email";

// ─── Tests ────────────────────────────────────────────────────────

describe("Email Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockReset();
    mockCreateTransport.mockReset();
    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── sendEmail ──────────────────────────────────────────────────

  describe("sendEmail", () => {
    it("should not throw in development when no SMTP is configured", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      // createTransporter returns null when no config
      mockCreateTransport.mockReturnValue(null);

      // Should not throw
      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "Test",
          text: "Hello",
        })
      ).resolves.toBeUndefined();

      // sendMail should not be called since no transporter
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should throw in production when no SMTP is configured", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      mockCreateTransport.mockReturnValue(null);

      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "Test",
          text: "Hello",
        })
      ).rejects.toThrow("Email service is not configured");
    });

    it("should call sendMail when transporter is configured", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendEmail({
        to: "user@example.com",
        subject: "Test Subject",
        text: "Test body",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Test Subject",
          text: "Test body",
        })
      );
    });

    it("should use default from address when SMTP_FROM is not set", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";
      delete process.env.SMTP_FROM;
      delete process.env.SMTP_USER;

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Hello",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("noreply@example.com"),
        })
      );
    });

    it("should use custom from address when SMTP_FROM is set", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";
      process.env.SMTP_FROM = "custom@company.com";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Hello",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("custom@company.com"),
        })
      );
    });

    it("should retry on transient errors", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      // Fail first attempt with transient error, succeed on second
      mockSendMail
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce({ messageId: "test-msg-id" });

      await sendEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Hello",
      });

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it("should throw after exhausting retries on transient errors", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      // Always fail with transient error
      mockSendMail.mockRejectedValue(new Error("ECONNRESET"));

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Hello",
        })
      ).rejects.toThrow("ECONNRESET");

      // 1 initial + 2 retries = 3 calls
      expect(mockSendMail).toHaveBeenCalledTimes(3);
    });

    it("should not retry on non-transient errors", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      mockSendMail.mockRejectedValue(new Error("Invalid credentials"));

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Hello",
        })
      ).rejects.toThrow("Invalid credentials");

      // No retries for non-transient errors
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  // ─── sendWelcomeEmail ────────────────────────────────────────────

  describe("sendWelcomeEmail", () => {
    it("should call sendEmailWithRetry with correct parameters", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendWelcomeEmail("user@example.com", "John");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Welcome to EU AI Act Compliance",
        })
      );

      // Verify text content includes user name
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain("John");
      expect(callArgs.text).toContain("Welcome");
    });

    it("should include dashboard URL in welcome email HTML", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";
      process.env.NEXTAUTH_URL = "https://app.example.com";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendWelcomeEmail("user@example.com", "Jane");

      const callArgs = mockSendMail.mock.calls[0][0];
      // Dashboard URL is in the HTML version, not the plain text version
      expect(callArgs.html).toContain("https://app.example.com/dashboard");
    });
  });

  // ─── sendPaymentFailedEmail ─────────────────────────────────────

  describe("sendPaymentFailedEmail", () => {
    it("should call sendEmailWithRetry with correct parameters", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendPaymentFailedEmail("user@example.com", "Alice", "professional");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Payment Failed - Action Required - EU AI Act Compliance",
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain("Alice");
      expect(callArgs.text).toContain("professional");
      expect(callArgs.text).toContain("past due");
    });

    it("should include dashboard URL for payment update", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";
      process.env.NEXTAUTH_URL = "https://app.example.com";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendPaymentFailedEmail("user@example.com", "Bob", "business");

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("https://app.example.com/dashboard");
      expect(callArgs.html).toContain("Update Payment Method");
    });
  });

  // ─── sendRefundEmail ─────────────────────────────────────────────

  describe("sendRefundEmail", () => {
    it("should call sendEmailWithRetry with correct parameters", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendRefundEmail("user@example.com", "Charlie", "enterprise");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Refund Processed - EU AI Act Compliance",
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain("Charlie");
      expect(callArgs.text).toContain("enterprise");
      expect(callArgs.text).toContain("refund");
    });

    it("should include pricing page URL for resubscription", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";
      process.env.NEXTAUTH_URL = "https://app.example.com";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendRefundEmail("user@example.com", "Diana", "starter");

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("https://app.example.com/pricing");
      expect(callArgs.html).toContain("View Plans & Resubscribe");
    });

    it("should mention downgrade to Free tier", async () => {
      process.env.NODE_ENV = "test";
      process.env.RESEND_API_KEY = "re-test-key";

      const mockTransporter = { sendMail: mockSendMail };
      mockCreateTransport.mockReturnValue(mockTransporter);

      await sendRefundEmail("user@example.com", "Eve", "professional");

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain("Free");
      expect(callArgs.html).toContain("Free");
    });
  });
});
