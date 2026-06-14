import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";
import ConsultationWidget from "@/components/layout/ConsultationWidget";
import AIChatWidget from "@/components/chat/AIChatWidget";

export const metadata: Metadata = {
  title: {
    default: "EU AI Act Compliance Tool - AI Regulation Assessment & Risk Management",
    template: "%s | EU AI Act Compliance",
  },
  description:
    "Comprehensive SaaS platform for EU AI Act compliance assessment, risk classification, prohibited practices detection, and regulatory documentation. Supports 10 languages.",
  keywords: [
    "EU AI Act",
    "AI compliance",
    "risk assessment",
    "Art.6",
    "Art.5",
    "Art.50",
    "GDPR",
    "AI regulation",
    "compliance tool",
    "SaaS",
  ],
  authors: [{ name: "EU AI Act Compliance" }],
  creator: "EU AI Act Compliance",
  publisher: "EU AI Act Compliance",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    siteName: "EU AI Act Compliance",
    title: "EU AI Act Compliance Tool - AI Regulation Assessment & Risk Management",
    description:
      "Comprehensive SaaS platform for EU AI Act compliance assessment, risk management, and regulatory documentation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EU AI Act Compliance Tool",
    description:
      "Comprehensive SaaS platform for EU AI Act compliance assessment, risk management, and regulatory documentation.",
  },
  alternates: {
    canonical: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col antialiased">
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieConsent />
            <ConsultationWidget />
            <AIChatWidget />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
