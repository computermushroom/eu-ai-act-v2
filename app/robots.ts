// Robots.txt Configuration
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next";

/**
 * Generate robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
