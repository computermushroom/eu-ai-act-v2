"use client";

import useSWR from "swr";
import { swrConfig, cacheKeys } from "@/lib/swr-config";

interface SubscriptionData {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionData>(
    cacheKeys.subscription,
    fetcher,
    swrConfig
  );

  return {
    subscription: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
