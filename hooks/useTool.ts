// useTool Hook
// Manages tool state: tool list fetching, tier access check, and tool usage tracking
// Used by Dashboard and tool pages for consistent access control

"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionTier } from "@/types";

/**
 * Tool information
 */
interface ToolInfo {
  id: string;
  title: string;
  description: string;
  articleRef: string;
  href: string;
  tier: SubscriptionTier;
}

/**
 * Hook return type
 */
interface UseToolReturn {
  /** List of all available tools */
  tools: ToolInfo[];
  /** Whether tools are being loaded */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Check if a tool is accessible with the given tier */
  isAccessible: (toolId: string, userTier: SubscriptionTier) => boolean;
  /** Get a specific tool by ID */
  getTool: (toolId: string) => ToolInfo | undefined;
  /** Refetch the tool list */
  refetch: () => void;
}

/**
 * Tier hierarchy for access control (lower index = lower tier)
 */
const TIER_ORDER: SubscriptionTier[] = [
  "free",
  "starter",
  "professional",
  "business",
  "enterprise",
];

/**
 * Hook for managing compliance tools
 * Fetches tool list from API and provides access control helpers
 */
export function useTool(): UseToolReturn {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools");
      if (!response.ok) {
        throw new Error("Failed to fetch tools");
      }
      const data = await response.json();
      setTools(data.tools ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tools");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const isAccessible = useCallback(
    (toolId: string, userTier: SubscriptionTier): boolean => {
      const tool = tools.find((t) => t.id === toolId);
      if (!tool) return false;

      const userIndex = TIER_ORDER.indexOf(userTier);
      const toolIndex = TIER_ORDER.indexOf(tool.tier);
      return userIndex >= toolIndex;
    },
    [tools]
  );

  const getTool = useCallback(
    (toolId: string): ToolInfo | undefined => {
      return tools.find((t) => t.id === toolId);
    },
    [tools]
  );

  return {
    tools,
    isLoading,
    error,
    isAccessible,
    getTool,
    refetch: fetchTools,
  };
}
