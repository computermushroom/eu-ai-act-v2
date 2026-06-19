import type { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 3000,
};

// 缓存键前缀，避免冲突
export const cacheKeys = {
  subscription: "/api/subscription",
  aiSystems: "/api/ai-systems",
  auditLogs: "/api/audit",
  alerts: "/api/alerts",
  documents: "/api/documents",
  profile: "/api/profile",
  tools: "/api/tools",
  fria: "/api/fria",
} as const;
