// next-intl Request Configuration
// Cookie-based locale switching without URL prefix
// Keeps existing directory structure unchanged

import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { SupportedLocale } from "@/types";

/**
 * Supported locales for the application
 */
const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "de", "fr", "es", "it", "zh", "ja", "ko", "ru", "ar"];
const DEFAULT_LOCALE: SupportedLocale = "en";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  // Validate stored locale
  const locale: SupportedLocale =
    localeCookie && SUPPORTED_LOCALES.includes(localeCookie as SupportedLocale)
      ? (localeCookie as SupportedLocale)
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`@/i18n/${locale}.json`)).default,
  };
});
