"use client";

import useSWR from "swr";
import { swrConfig, cacheKeys } from "@/lib/swr-config";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR(
    cacheKeys.profile,
    fetcher,
    swrConfig
  );

  return {
    profile: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
