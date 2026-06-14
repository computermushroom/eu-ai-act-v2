// Language Switcher Component
// Uses <a> links to /api/i18n/set?locale=XX&from=YY
// The API returns a tiny HTML page that sets cookie and redirects via JS
// No React state, no React event handlers needed

"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import type { SupportedLocale } from "@/types";

/**
 * Supported locales with display labels
 */
const LOCALES: { code: SupportedLocale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "RU" },
  { code: "ar", label: "AR" },
];

/**
 * Language switcher using plain <a> links
 * No React state or event handlers - just links that navigate to the API
 */
export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      <svg className="mr-1 h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      {LOCALES.map((locale) => (
        <a
          key={locale.code}
          href={`/api/i18n/set?locale=${locale.code}&from=${encodeURIComponent(pathname)}`}
          className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted ${
            locale.code === currentLocale
              ? "bg-muted text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {locale.label}
        </a>
      ))}
    </div>
  );
}
