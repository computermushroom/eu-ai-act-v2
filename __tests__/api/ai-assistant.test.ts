/**
 * AI Assistant API Tests
 * Tests for the POST /api/ai-assistant route handler
 * Covers authentication, rate limiting, input validation, and LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted Mock References ───────────────────────────────────────
// Must be hoisted so vi.mock factory can reference them
const { mockAuth, mockRateLimiterFn, mockProvider } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRateLimiterFn: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 })),
  mockProvider: {
    name: "openai",
    isConfigured: vi.fn(() => true),
    chat: vi.fn(),
  },
}));

// ─── Mock Auth ────────────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// ─── Mock Audit ───────────────────────────────────────────────────
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Rate Limiter ────────────────────────────────────────────
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => mockRateLimiterFn),
}));

// ─── Mock Subscription Guard ──────────────────────────────────────
vi.mock("@/lib/subscription-guard", () => ({
  requireTier: vi.fn(() => () => Promise.resolve(null)),
}));

// ─── Mock LLM Provider ─────────────────────────────────────────────
vi.mock("@/lib/llm", () => ({
  getLLMProvider: () => mockProvider,
}));

import { POST } from "@/app/api/ai-assistant/route";

// ─── Test Helpers ─────────────────────────────────────────────────

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai-assistant", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe("POST /api/ai-assistant", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockRateLimiterFn.mockReset();
    mockProvider.isConfigured.mockReset();
    mockProvider.chat.mockReset();
    // Default: rate limit allowed, provider configured
    mockRateLimiterFn.mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockProvider.isConfigured.mockReturnValue(true);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── Authentication ────────────────────────────────────────────

  describe("authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue(null);

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });

  // ─── API Key Configuration ──────────────────────────────────────

  describe("API key configuration", () => {
    it("should return 503 when provider is not configured", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.isConfigured.mockReturnValue(false);

      const req = createJsonRequest({ message: "What is Art.6?" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain("not configured");
      expect(body.code).toBe("MISSING_API_KEY");
    });
  });

  // ─── Rate Limiting ──────────────────────────────────────────────

  describe("rate limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockRateLimiterFn.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.error).toContain("Too many requests");
    });
  });

  // ─── Input Validation ───────────────────────────────────────────

  describe("input validation", () => {
    it("should return 400 when message is empty", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });

      const req = createJsonRequest({ message: "" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Message is required");
    });

    it("should return 400 when message exceeds 8000 characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });

      const longMessage = "a".repeat(8001);
      const req = createJsonRequest({ message: longMessage });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Message too long");
    });

    it("should return 400 when message is missing from body", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });

      const req = createJsonRequest({});
      const res = await POST(req);
      await res.json();

      expect(res.status).toBe(400);
    });
  });

  // ─── Successful Request ─────────────────────────────────────────

  describe("successful request", () => {
    it("should return AI response on success", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.chat.mockResolvedValue({
        content: "Article 6 of the EU AI Act classifies AI systems based on risk levels.",
        model: "gpt-4o-mini",
      });

      const req = createJsonRequest({ message: "What is Art.6?" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.response).toBe(
        "Article 6 of the EU AI Act classifies AI systems based on risk levels."
      );

      // Verify chat was called with system prompt and user message
      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user", content: "What is Art.6?" }),
        ]),
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 1200,
        })
      );
    });

    it("should pass system context when provided", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.chat.mockResolvedValue({
        content: "Response with context",
        model: "gpt-4o-mini",
      });

      const req = createJsonRequest({
        message: "Analyze this",
        systemContext: "We are a healthcare company",
      });
      await POST(req);

      const messages = mockProvider.chat.mock.calls[0]?.[0];
      const systemMessage = messages?.find((m: { role: string }) => m.role === "system");
      expect(systemMessage?.content).toContain("Additional context: We are a healthcare company");
    });
  });

  // ─── LLM Provider Errors ──────────────────────────────────────

  describe("LLM provider errors", () => {
    it("should return 500 when LLM provider throws an error", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.chat.mockRejectedValue(new Error("Internal server error"));

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Internal server error");
    });

    it("should return 500 when LLM provider returns empty content", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.chat.mockRejectedValue(new Error("OpenAI returned an empty response."));

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("empty response");
    });

    it("should return 500 when LLM provider API call fails", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });
      mockProvider.chat.mockRejectedValue(new Error("OpenAI API error: 500"));

      const req = createJsonRequest({ message: "Hello" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("OpenAI API error");
    });
  });

  // ─── Server Errors ──────────────────────────────────────────────

  describe("server errors", () => {
    it("should return 500 when request body parsing fails", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } });

      // Send invalid JSON
      const req = new NextRequest("http://localhost/api/ai-assistant", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });
});
