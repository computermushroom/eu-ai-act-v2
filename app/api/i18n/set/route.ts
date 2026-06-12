// Locale Switch API Route
// Returns a tiny HTML page that sets the cookie and redirects using JavaScript
// This avoids 307 redirect issues in proxied environments
// The HTML page uses relative redirect (window.location.href = from)

import { NextRequest, NextResponse } from "next/server";
import type { SupportedLocale } from "@/types";

const VALID_LOCALES: SupportedLocale[] = ["en", "de", "fr", "es", "it", "zh", "ja", "ko"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "";
  const from = searchParams.get("from") ?? "/";

  if (!VALID_LOCALES.includes(locale as SupportedLocale)) {
    // Invalid locale - redirect back without changing cookie
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>window.location.href=${JSON.stringify(from)}</script></head><body>Redirecting...</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>document.cookie=${JSON.stringify(`NEXT_LOCALE=${locale};path=/;samesite=lax;max-age=31536000`)};window.location.href=${JSON.stringify(from)}</script></head><body>Switching language...</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
