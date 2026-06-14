const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin HMR requests to prevent browser flickering
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Next.js 16: Turbopack is the default bundler
  // No need to explicitly enable it

  // Server external packages (Node.js native modules used server-side only)
  serverExternalPackages: ["bcryptjs", "nodemailer", "pg"],

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Security headers for GDPR/CCPA compliance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
