// Tools Layout
// Server Component: provides shared metadata for all tool pages

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance Tools",
  description:
    "Interactive EU AI Act compliance assessment tools: risk classification (Art.6), prohibited practices check (Art.5), transparency obligations (Art.50).",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
