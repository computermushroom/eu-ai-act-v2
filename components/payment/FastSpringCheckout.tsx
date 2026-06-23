// FastSpring Checkout Button Component
// Embeds FastSpring Store Builder Library for popup checkout
// Falls back to hosted checkout URL if SBL is not available

"use client";

import { useState, useCallback } from "react";

/**
 * Props for the checkout button
 */
interface FastSpringCheckoutProps {
  tier: "starter" | "professional" | "business" | "enterprise";
  billingCycle?: "monthly" | "yearly";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * FastSpring Checkout Button
 * Initiates checkout via Store Builder Library popup or redirect
 */
export function FastSpringCheckout({
  tier,
  billingCycle = "monthly",
  children,
  className = "",
  disabled = false,
}: FastSpringCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    try {
      // Call our API to create a checkout session
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingCycle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to create checkout");
      }

      const { checkoutUrl } = await response.json();

      // Redirect to FastSpring checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("[Checkout] Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Checkout failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [tier, billingCycle, isLoading, disabled]);

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center transition-all ${className}`}
      type="button"
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * FastSpring Checkout Link (for anchor tags)
 */
interface FastSpringCheckoutLinkProps {
  tier: "starter" | "professional" | "business" | "enterprise";
  billingCycle?: "monthly" | "yearly";
  children: React.ReactNode;
  className?: string;
}

export function FastSpringCheckoutLink({
  tier,
  billingCycle = "monthly",
  children,
  className = "",
}: FastSpringCheckoutLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (isLoading) return;

      setIsLoading(true);

      try {
        const response = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, billingCycle }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error ?? "Failed to create checkout");
        }

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("[Checkout] Error:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Checkout failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [tier, billingCycle, isLoading]
  );

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`inline-flex items-center ${className}`}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </>
      ) : (
        children
      )}
    </a>
  );
}
