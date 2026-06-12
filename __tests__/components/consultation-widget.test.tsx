import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConsultationWidget } from "@/components/layout/ConsultationWidget";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "consultation.title": "AI Compliance Assistant",
      "consultation.placeholder": "Ask about EU AI Act...",
      "consultation.send": "Send",
      "consultation.close": "Close",
      "consultation.open": "Open Chat",
      "consultation.typing": "Typing...",
    };
    return translations[key] || key;
  }),
  useLocale: vi.fn(() => "en"),
}));

describe("ConsultationWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the chat toggle button", () => {
    render(<ConsultationWidget />);
    expect(screen.getByLabelText(/Open Chat/i)).toBeInTheDocument();
  });

  it("should open chat panel when toggle is clicked", () => {
    render(<ConsultationWidget />);
    const toggle = screen.getByLabelText(/Open Chat/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/AI Compliance Assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about EU AI Act/i)).toBeInTheDocument();
  });

  it("should send a message and receive a response", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open Chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    fireEvent.change(input, { target: { value: "What is the free plan?" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Free Plan/i)).toBeInTheDocument();
    });
  });

  it("should handle follow-up questions with context", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open Chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    // First question
    fireEvent.change(input, { target: { value: "free plan" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Free Plan/i)).toBeInTheDocument();
    });

    // Follow-up question (short, should use context)
    fireEvent.change(input, { target: { value: "what about starter?" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Starter Plan/i)).toBeInTheDocument();
    });
  });

  it("should show typing indicator while generating response", async () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open Chat/i));

    const input = screen.getByPlaceholderText(/Ask about EU AI Act/i);
    const sendButton = screen.getByLabelText(/Send/i);

    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(sendButton);

    // Typing indicator should appear briefly
    expect(screen.getByText(/Typing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Typing/i)).not.toBeInTheDocument();
    });
  });

  it("should not send empty messages", () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open Chat/i));

    const sendButton = screen.getByLabelText(/Send/i);
    fireEvent.click(sendButton);

    // Should not add any message
    const messages = screen.queryAllByRole("listitem");
    expect(messages.length).toBe(0);
  });

  it("should close chat panel when close button is clicked", () => {
    render(<ConsultationWidget />);
    fireEvent.click(screen.getByLabelText(/Open Chat/i));

    const closeButton = screen.getByLabelText(/Close/i);
    fireEvent.click(closeButton);

    expect(screen.queryByText(/AI Compliance Assistant/i)).not.toBeInTheDocument();
  });
});
