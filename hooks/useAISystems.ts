"use client";

import useSWR from "swr";
import { swrConfig, cacheKeys } from "@/lib/swr-config";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAISystems() {
  const { data, error, isLoading, mutate } = useSWR(
    cacheKeys.aiSystems,
    fetcher,
    swrConfig
  );

  return {
    systems: data?.systems ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
