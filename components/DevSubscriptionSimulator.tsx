"use client";

import { useState, useEffect } from "react";

const TIERS = [
  { id: "free", name: "Free", price: "€0", color: "bg-gray-500" },
  { id: "starter", name: "Starter", price: "€39/mo", color: "bg-primary" },
  { id: "professional", name: "Professional", price: "€89/mo", color: "bg-accent" },
  { id: "business", name: "Business", price: "€159/mo", color: "bg-orange-500" },
  { id: "enterprise", name: "Enterprise", price: "€249/mo", color: "bg-purple-500" },
] as const;

export function DevSubscriptionSimulator() {
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    fetch("/api/dev/simulate-subscription")
      .then((res) => res.json())
      .then((data) => {
        setDevMode(data.devMode);
        if (data.subscription) {
          setCurrentTier(data.subscription.tier);
          setStatus(data.subscription.status);
        }
      })
      .catch(() => {
        // Dev mode not available
        setDevMode(false);
      });
  }, []);

  if (!devMode) return null;

  const handleSimulate = async (tier: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dev/simulate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.tier) {
        setCurrentTier(data.tier);
        setStatus("active");
      }
    } catch (e) {
      console.error("Failed to simulate:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 p-4 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          DEV MODE
        </span>
        <span className="text-xs text-yellow-700">
          Local simulation only — does not affect production
        </span>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-yellow-900">
        🔬 Subscription Simulator
      </h3>

      {currentTier && (
        <div className="mb-3 rounded bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
          Current: <strong className="capitalize">{currentTier}</strong>
          {status && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {status}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => handleSimulate(tier.id)}
            disabled={isLoading || currentTier === tier.id}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              currentTier === tier.id
                ? "ring-2 ring-offset-1 ring-yellow-400 opacity-60 cursor-not-allowed"
                : "hover:scale-105 hover:shadow-md"
            } ${
              tier.id === "free"
                ? "bg-gray-200 text-gray-700"
                : tier.color + " text-white"
            } disabled:opacity-50`}
          >
            {tier.name}
            <span className="opacity-70">{tier.price}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-2 text-xs text-yellow-600">Updating...</div>
      )}

      <div className="mt-3 border-t border-yellow-200 pt-2">
        <p className="text-xs text-yellow-600">
          💡 Click any tier above to instantly switch. All tools, guards, and
          API limits will reflect the new tier. Refresh the dashboard to see
          changes.
        </p>
      </div>
    </div>
  );
}