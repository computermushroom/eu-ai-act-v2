import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";

// Mock Prisma
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    $transaction: (fn: unknown) => mockTransaction(fn),
  },
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(() => Promise.resolve("hashed_password_123")),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockReset();
    mockTransaction.mockReset();
  });

  it("should register a new user successfully", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi.fn(() =>
            Promise.resolve({
              id: "user_123",
              email: "test@example.com",
              name: "Test User",
            })
          ),
        },
        subscription: {
          create: vi.fn(() => Promise.resolve({ id: "sub_123" })),
        },
      };
      return fn(tx);
    });

    const req = createRequest({
      name: "Test User",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toBe("Account created successfully.");
    expect(data.user).toEqual({
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
    });
    expect(data.user.password).toBeUndefined();
  });

  it("should reject invalid email format", async () => {
    const req = createRequest({
      name: "Test",
      email: "not-an-email",
      password: "SecurePass123!",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid email");
  });

  it("should reject short password", async () => {
    const req = createRequest({
      name: "Test",
      email: "test@example.com",
      password: "123",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("at least 8 characters");
  });

  it("should reject duplicate email", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing_user", email: "test@example.com" });

    const req = createRequest({
      name: "Test",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toContain("already exists");
  });

  it("should reject missing name", async () => {
    const req = createRequest({
      name: "",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Name is required");
  });

  it("should handle rate limiting", async () => {
    // First 10 requests should be allowed
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi.fn(() =>
            Promise.resolve({ id: `user_${Math.random()}`, email: "test@example.com", name: "Test" })
          ),
        },
        subscription: { create: vi.fn(() => Promise.resolve({ id: "sub" })) },
      };
      return fn(tx);
    });

    for (let i = 0; i < 10; i++) {
      const req = createRequest({
        name: `Test ${i}`,
        email: `test${i}@example.com`,
        password: "SecurePass123!",
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }

    // 11th request should be rate limited
    const req = createRequest({
      name: "Test",
      email: "test11@example.com",
      password: "SecurePass123!",
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
