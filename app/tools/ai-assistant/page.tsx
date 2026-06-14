// Embedded AI Compliance Assistant
// Client Component: chat-style interface with real AI responses via API

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AISystem {
  id: string;
  name: string;
}

const QUICK_ACTIONS = [
  "Check Art.6 compliance",
  "What are prohibited practices?",
  "FRIA requirements",
  "Data governance checklist",
  "QMS obligations",
  "How to classify my AI system?",
];

export default function AIAssistantPage() {
  const t = useTranslations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI systems
  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/ai-systems");
        if (res.ok) {
          const data = await res.json();
          setSystems(data.data ?? []);
        }
      } catch {
        // Silently handle fetch errors
      }
    }
    fetchSystems();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const selectedSystemName = systems.find((s) => s.id === selectedSystemId)?.name;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const systemContext = selectedSystemName
          ? `The user is asking about their AI system named "${selectedSystemName}".`
          : undefined;

        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            systemContext,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to get AI response");
        }

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response ?? "",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        // Add error as assistant message for visibility
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `**Error:** ${msg}\n\nPlease try again or contact support if the issue persists.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedSystemName]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t("tools.results")}
          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            AI
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Embedded AI Compliance Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about EU AI Act compliance and get instant guidance with
          relevant article references.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-6">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("tools.selectSystem")}</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.close")}
          </button>
        </div>

        {/* Messages */}
        <div className="h-[480px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("tools.searchPlaceholder")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Responses include relevant EU AI Act article references.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "rounded-lg border border-border bg-muted/30"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p
                  className={`mt-1 text-xs ${
                    msg.role === "user"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0.1s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.searchPlaceholder")}
            disabled={isLoading}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {t("common.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
