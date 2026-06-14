import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { POST as resetPasswordConfirmHandler } from "@/app/api/auth/reset-password/confirm/route";

// Mock prisma
const mockPrismaTransaction = vi.fn();
const mockUserCreate = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockSubscriptionCreate = vi.fn();
const mockVerificationTokenCreate = vi.fn();
const mockVerificationTokenFindUnique = vi.fn();
const mockVerificationTokenDelete = vi.fn();
const mockVerificationTokenDeleteMany = vi.fn();
const mockSessionDeleteMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: unknown) => mockPrismaTransaction(fn),
    user: {
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    subscription: {
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
    },
    verificationToken: {
      create: (...args: unknown[]) => mockVerificationTokenCreate(...args),
      findUnique: (...args: unknown[]) => mockVerificationTokenFindUnique(...args),
      delete: (...args: unknown[]) => mockVerificationTokenDelete(...args),
      deleteMany: (...args: unknown[]) => mockVerificationTokenDeleteMany(...args),
    },
    session: {
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

// Mock bcryptjs
const mockBcryptHash = vi.fn();
vi.mock("bcryptjs", () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
    compare: vi.fn(),
  },
  hash: (...args: unknown[]) => mockBcryptHash(...args),
  compare: vi.fn(),
}));

// Mock audit log
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
}));

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 })),
}));

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("Auth API - Registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { create: mockUserCreate },
        subscription: { create: mockSubscriptionCreate },
      };
      return fn(tx);
    });
  });

  it("should register a new user successfully", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    mockSubscriptionCreate.mockResolvedValue({ id: "sub-123" });
    mockBcryptHash.mockResolvedValue("hashed-password");

    const req = createJsonRequest({
      name: "Test User",
      email: "test@example.com",
      password: "securePassword123",
    });

    const res = await registerHandler(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toBe("Account created successfully.");
    expect(body.user).toEqual({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    expect(mockBcryptHash).toHaveBeenCalledWith("securePassword123", 12);
    expect(mockUserCreate).toHaveBeenCalled();
    expect(mockSubscriptionCreate).toHaveBeenCalled();
  });

  it("should reject registration with existing email", async () => {
    mockUserFindFirst.mockResolvedValue({
      id: "existing-user",
      email: "test@example.com",
    });

    const req = createJsonRequest({
      name: "Test User",
      email: "test@example.com",
      password: "securePassword123",
    });

    const res = await registerHandler(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain("already exists");
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("should reject invalid input (short password)", async () => {
    const req = createJsonRequest({
      name: "Test User",
      email: "test@example.com",
      password: "123",
    });

    const res = await registerHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("at least 8 characters");
  });

  it("should reject invalid email format", async () => {
    const req = createJsonRequest({
      name: "Test User",
      email: "not-an-email",
      password: "securePassword123",
    });

    const res = await registerHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid email");
  });
});

describe("Auth API - Password Reset Request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create reset token for existing user", async () => {
    mockUserFindFirst.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      password: "hashed",
    });
    mockVerificationTokenCreate.mockResolvedValue({ id: "token-123" });

    const req = createJsonRequest({ email: "test@example.com" });
    const res = await resetPasswordHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain("If an account exists");
    expect(mockVerificationTokenCreate).toHaveBeenCalled();
  });

  it("should return same message for non-existent user (prevent enumeration)", async () => {
    mockUserFindFirst.mockResolvedValue(null);

    const req = createJsonRequest({ email: "unknown@example.com" });
    const res = await resetPasswordHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain("If an account exists");
    expect(mockVerificationTokenCreate).not.toHaveBeenCalled();
  });

  it("should reject invalid email", async () => {
    const req = createJsonRequest({ email: "not-an-email" });
    const res = await resetPasswordHandler(req);

    expect(res.status).toBe(400);
  });
});

describe("Auth API - Password Reset Confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { update: mockUserUpdate },
        verificationToken: { deleteMany: mockVerificationTokenDeleteMany },
        session: { deleteMany: mockSessionDeleteMany },
      };
      return fn(tx);
    });
  });

  it("should reset password with valid token", async () => {
    const futureDate = new Date(Date.now() + 3600000);
    mockVerificationTokenFindUnique.mockResolvedValue({
      token: "valid-token",
      identifier: "reset-password:user-123",
      expires: futureDate,
    });
    mockBcryptHash.mockResolvedValue("new-hashed-password");
    mockUserUpdate.mockResolvedValue({ id: "user-123" });
    mockVerificationTokenDeleteMany.mockResolvedValue({ count: 1 });
    mockSessionDeleteMany.mockResolvedValue({ count: 1 });

    const req = createJsonRequest({
      token: "valid-token",
      password: "newSecurePassword123",
    });

    const res = await resetPasswordConfirmHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain("reset successfully");
    expect(mockBcryptHash).toHaveBeenCalledWith("newSecurePassword123", 12);
    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockSessionDeleteMany).toHaveBeenCalled();
  });

  it("should reject expired token", async () => {
    const pastDate = new Date(Date.now() - 3600000);
    mockVerificationTokenFindUnique.mockResolvedValue({
      token: "expired-token",
      identifier: "reset-password:user-123",
      expires: pastDate,
    });
    mockVerificationTokenDelete.mockResolvedValue({ id: "expired-token" });

    const req = createJsonRequest({
      token: "expired-token",
      password: "newSecurePassword123",
    });

    const res = await resetPasswordConfirmHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("expired");
  });

  it("should reject invalid token", async () => {
    mockVerificationTokenFindUnique.mockResolvedValue(null);

    const req = createJsonRequest({
      token: "invalid-token",
      password: "newSecurePassword123",
    });

    const res = await resetPasswordConfirmHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid");
  });

  it("should reject short password", async () => {
    const req = createJsonRequest({
      token: "valid-token",
      password: "123",
    });

    const res = await resetPasswordConfirmHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("at least 8 characters");
  });
});
