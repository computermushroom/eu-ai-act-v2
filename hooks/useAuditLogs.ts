"use client";

import useSWR from "swr";
import { swrConfig, cacheKeys } from "@/lib/swr-config";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAuditLogs(limit = 50) {
  const { data, error, isLoading, mutate } = useSWR(
    `${cacheKeys.auditLogs}?limit=${limit}`,
    fetcher,
    swrConfig
  );

  return {
    logs: data?.logs ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
