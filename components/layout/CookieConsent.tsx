// Cookie Consent Banner - GDPR / CCPA Compliant
// "use client" required for localStorage state and user interactions
// Rules enforced:
//   - No cookies loaded until explicit consent
//   - Three options: Accept All / Reject All / Customize
//   - No pre-checked boxes, no forced consent
//   - Analytics scripts only load after consent

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "cookie-consent";

/**
 * GDPR/CCPA compliant cookie consent banner
 * Stores user preference in localStorage
 * Blocks non-essential cookies until user explicitly consents
 */
export default function CookieConsent() {
  const t = useTranslations();

  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: "",
  });

  // Check existing consent on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsVisible(true);
        return;
      }
      const parsed: ConsentState = JSON.parse(stored);
      setConsent(parsed);
    } catch {
      // Invalid stored data - show banner again
      setIsVisible(true);
    }
  }, []);

  const saveConsent = useCallback((newConsent: ConsentState) => {
    const withTimestamp: ConsentState = {
      ...newConsent,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    setConsent(withTimestamp);
    setIsVisible(false);
    setShowCustomize(false);

    // Dispatch event so analytics components can react
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", {
        detail: withTimestamp,
      })
    );
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: "",
    });
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: "",
    });
  }, [saveConsent]);

  const handleSavePreferences = useCallback(() => {
    saveConsent(consent);
  }, [consent, saveConsent]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg sm:p-6"
    >
      <div className="container mx-auto max-w-7xl">
        {!showCustomize ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 sm:max-w-2xl">
              <h3 className="text-base font-semibold">{"Cookie Consent"}</h3>
              <p className="text-sm text-muted-foreground">
                {"We use cookies to enhance your experience. Essential cookies are always active. You can choose whether to allow analytics and marketing cookies."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              <button
                onClick={() => setShowCustomize(true)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {"Customize"}
              </button>
              <button
                onClick={handleRejectAll}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {"Reject All"}
              </button>
              <button
                onClick={handleAcceptAll}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {"Accept All"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{"Cookie Preferences"}</h3>
            <div className="space-y-3">
              {/* Essential - always on, disabled */}
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{"Essential"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Required for the site to function. Cannot be disabled."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 cursor-not-allowed opacity-50"
                  aria-label="Essential cookies - always enabled"
                />
              </div>

              {/* Analytics - user choice, default OFF */}
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{"Analytics"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Helps us understand how visitors interact with our website."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) =>
                    setConsent((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                  aria-label="Enable analytics cookies"
                />
              </div>

              {/* Marketing - user choice, default OFF */}
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{"Marketing"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Used to deliver personalized advertisements and measure their effectiveness."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) =>
                    setConsent((prev) => ({
                      ...prev,
                      marketing: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                  aria-label="Enable marketing cookies"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCustomize(false)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleSavePreferences}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to read current cookie consent state
 * Used by analytics/tracking components to conditionally load scripts
 */
export function useCookieConsent(): ConsentState | null {
  const [state, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setState(JSON.parse(stored) as ConsentState);
        }
      } catch {
        setState(null);
      }
    };

    read();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState>).detail;
      setState(detail);
    };

    window.addEventListener("cookieConsentChanged", handler);
    return () => window.removeEventListener("cookieConsentChanged", handler);
  }, []);

  return state;
}
