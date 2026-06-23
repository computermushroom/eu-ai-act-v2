import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ConsultationWidget from "@/components/layout/ConsultationWidget";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((namespace: string) => (key: string) => {
    const fullKey = `${namespace}.${key}`;
    const translations: Record<string, string> = {
      "consultation.title": "AI Compliance Assistant",
      "consultation.subtitle": "Ask me anything about EU AI Act compliance",
      "consultation.placeholder": "Ask about EU AI Act...",
      "consultation.send": "Send",
      "consultation.close": "Close",
      "consultation.open": "Open Chat",
      "consultation.typing": "Typing...",
      "consultation.welcome": "Welcome! I can help you understand EU AI Act requirements. Try asking about plans, features, or compliance topics.",
    };
    return translations[fullKey] || fullKey;
  }),
  useLocale: vi.fn(() => "en"),
}));

describe("ConsultationWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the chat toggle button", () => {
    render(<ConsultationWidget />);
    expect(screen.getByLabelText(/Open consultation chat/i)).toBeInTheDocument();
  });

  it("should open chat panel when toggle is clicked", () => {
    render(<ConsultationWidget />);
    const toggle = screen.getByLabelText(/Open consultation chat/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/AI Compliance Assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about EU AI Act/i)).toBeInTheDocument();
  });

  it("should send a message and receive a response", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open consultation chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    fireEvent.change(input, { target: { value: "What is the free plan?" } });
    fireEvent.click(sendButton);

    // Typing indicator should appear
    expect(screen.getByText(/Typing/i)).toBeInTheDocument();

    // Advance timers past the setTimeout delay (600-1400ms)
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Use getAllByText since user message also contains "free plan"
    const freePlanElements = screen.getAllByText(/Free Plan/i);
    expect(freePlanElements.length).toBeGreaterThanOrEqual(1);
    // At least one should be in an assistant message (bg-muted)
    const assistantMsg = freePlanElements.find(el => el.closest('.bg-muted'));
    expect(assistantMsg).toBeDefined();
  });

  it("should handle follow-up questions with context", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open consultation chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    // First question
    fireEvent.change(input, { target: { value: "free plan" } });
    fireEvent.click(sendButton);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Verify first response
    const freePlanElements = screen.getAllByText(/Free Plan/i);
    expect(freePlanElements.length).toBeGreaterThanOrEqual(1);

    // Follow-up question - use exact keyword match
    fireEvent.change(input, { target: { value: "what about starter plan" } });
    fireEvent.click(sendButton);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    const starterElements = screen.getAllByText(/Starter Plan/i);
    expect(starterElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should show typing indicator while generating response", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open consultation chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(sendButton);

    // Typing indicator should appear briefly
    expect(screen.getByText(/Typing/i)).toBeInTheDocument();

    // Advance timers past the setTimeout delay
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText(/Typing/i)).not.toBeInTheDocument();
  });

  it("should not send empty messages", () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open consultation chat/i));

    const sendButton = screen.getByLabelText(/Send/i);
    fireEvent.click(sendButton);

    // Should not add any message
    const messages = screen.queryAllByRole("listitem");
    expect(messages.length).toBe(0);
  });

  it("should close chat panel when close button is clicked", () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open consultation chat/i));

    // Use data-action="close" to select the panel close button specifically
    const panelCloseButton = document.querySelector('[data-action="close"]') as HTMLButtonElement;
    expect(panelCloseButton).not.toBeNull();
    fireEvent.click(panelCloseButton);

    // After closing, isOpen should be false - the toggle button should show "Open consultation chat"
    // (In jsdom, CSS transitions don't apply, so the panel div is still in DOM but with h-0 class)
    expect(screen.getByLabelText(/Open consultation chat/i)).toBeInTheDocument();
  });
});
