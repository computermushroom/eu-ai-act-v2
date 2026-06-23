import "@testing-library/jest-dom";
import { vi, beforeEach, afterEach } from "vitest";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
    update: vi.fn(),
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
  redirect: vi.fn(),
}));

// Mock next-intl (main package exports)
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

// Mock @/lib/auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});
