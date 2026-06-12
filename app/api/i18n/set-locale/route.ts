// Locale Switch API Route
// Sets NEXT_LOCALE cookie for next-intl language switching
// Uses session cookie (no max-age) for GDPR compliance

import { NextRequest, NextResponse } from "next/server";
import type { SupportedLocale } from "@/types";

const VALID_LOCALES: SupportedLocale[] = ["en", "de", "fr", "es", "it", "zh", "ja", "ko"];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const locale: string = body.locale ?? "";

    if (!VALID_LOCALES.includes(locale as SupportedLocale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, locale });

    // Set session cookie (no max-age = expires when browser closes)
    // GDPR compliant: session cookie for preference
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      sameSite: "lax",
      httpOnly: false, // Allow client-side access for next-intl
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
