# EU AI Act Compliance Tool

A comprehensive SaaS platform for EU AI Act compliance assessment, risk management, and regulatory documentation. Built for acquisition and long-term maintainability.

## Features

### Compliance Tools
- **Risk Classification (Art.6)** - 10-question self-assessment for AI system risk levels
- **Prohibited Practices Check (Art.5)** - 8-category check against banned AI practices
- **Transparency Check (Art.50)** - 5-item verification of transparency obligations
- **URL Compliance Scan** - Scan any website for AI compliance indicators (30+ checks)

### Authentication & Security
- Email/password authentication with bcrypt
- OAuth (Google, GitHub) support
- Password reset with email verification
- Session management with Prisma adapter
- Dashboard route protection

### Payments & Subscriptions
- 5 subscription tiers: Free, Starter (EUR 39), Professional (EUR 89), Business (EUR 159), Enterprise (EUR 249)
- Lemon Squeezy integration (checkout + webhooks)
- Subscription management in dashboard

### Internationalization
- 8 languages: English, German, French, Spanish, Italian, Chinese, Japanese, Korean
- Cookie-based locale switching (no URL prefix)

### GDPR Compliance
- Cookie consent banner (3 options)
- Data export (GDPR Art.20)
- Account deletion (GDPR Art.17)
- Privacy policy (14 sections)
- Terms of service (13 sections)
- Audit logging (17 action types)

### Production Features
- Environment variable validation
- API rate limiting (5 route categories)
- Health check endpoint
- SEO optimization (sitemap, robots, OpenGraph)
- Error boundaries (404, 500)
- Loading skeletons

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.9 | React framework (App Router) |
| React | 19.2 | UI library |
| TypeScript | 5.x | Type safety (strict mode) |
| Prisma | 7.8.0 | ORM with PostgreSQL |
| Tailwind CSS | 4.x | Styling (CSS-first config) |
| NextAuth.js | 5.x | Authentication |
| Lemon Squeezy | SDK | Payments |
| next-intl | 4.x | Internationalization |
| react-pdf | 4.x | PDF report generation |
| bcryptjs | 2.x | Password hashing |
| nodemailer | 6.x | Email delivery |
| zod | 3.x | Schema validation |

## Quick Start

### Prerequisites
- Node.js 22+ (last version supporting macOS 10.15 Catalina)
- PostgreSQL 14+
- npm or pnpm

### 1. Clone and Install

```bash
git clone <repository-url>
cd eu-ai-act-compliance-new
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

Optional variables:
- `LEMONSQUEEZY_API_KEY` - For payments
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` - For password reset emails

### 3. Database Setup

```bash
# Create the database in PostgreSQL, then:
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for Production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables from `.env.local`
4. Deploy

The included `vercel.json` configures:
- EU region deployment (GDPR compliance)
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Environment variable documentation

### Health Check

```bash
curl https://your-domain.com/api/health
```

Returns application and database health status.

## Project Structure

```
eu-ai-act-compliance-new/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register, forgot-password)
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth + register + reset-password
│   │   ├── audit/         # Audit log API
│   │   ├── health/        # Health check
│   │   ├── i18n/          # Locale switching
│   │   ├── lemonsqueezy/  # Payment webhooks
│   │   ├── profile/       # Profile + GDPR export/delete
│   │   └── tools/         # Tool APIs
│   ├── dashboard/         # Dashboard, settings, audit log
│   ├── tools/             # Compliance tool pages
│   ├── layout.tsx         # Root layout (i18n + auth)
│   ├── page.tsx           # Landing page
│   ├── error.tsx          # Global error boundary
│   ├── not-found.tsx      # 404 page
│   ├── loading.tsx        # Global loading skeleton
│   ├── sitemap.ts         # Dynamic sitemap
│   └── robots.ts          # robots.txt
├── components/
│   ├── layout/            # Header, Footer, CookieConsent, LanguageSwitcher
│   └── tools/             # ComplianceReportPDF
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   └── useTool.ts         # Tool management hook
├── i18n/                  # Translation files (8 languages)
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── auth-guard.ts      # Route protection
│   ├── audit.ts           # Audit logging service
│   ├── email.ts           # Email service
│   ├── env.ts             # Environment validation
│   ├── lemonsqueezy.ts    # Payment SDK config
│   ├── prisma.ts          # Prisma client (Driver Adapter)
│   ├── rate-limit.ts      # API rate limiting
│   ├── url-scanner.ts     # URL compliance scanner
│   └── utils.ts           # Utility functions
├── prisma/
│   └── schema.prisma      # Database schema
├── public/
│   ├── logo.svg           # Site logo
│   └── favicon.svg        # Favicon
├── types/                 # TypeScript type definitions
├── .env.example           # Environment template
├── next.config.js         # Next.js configuration
├── prisma.config.ts       # Prisma 7 configuration
├── tsconfig.json          # TypeScript configuration
└── vercel.json            # Vercel deployment config
```

## API Routes

| Route | Method | Description | Auth |
|-------|--------|-------------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js authentication | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/reset-password` | POST | Request password reset | No |
| `/api/auth/reset-password/confirm` | POST | Confirm password reset | No |
| `/api/audit` | GET/POST | Audit log query/create | Yes |
| `/api/health` | GET | Health check | No |
| `/api/i18n/set-locale` | POST | Switch language | No |
| `/api/lemonsqueezy/webhook` | POST | Payment webhooks | No |
| `/api/profile` | GET/PATCH | Get/update profile | Yes |
| `/api/profile/export` | GET | GDPR data export | Yes |
| `/api/profile/delete` | POST | GDPR account deletion | Yes |
| `/api/tools` | GET | List available tools | No |
| `/api/tools/url-scan` | POST | URL compliance scan | Yes |

## Database Schema

### Models
- **User** - Accounts with soft delete support
- **Account** - OAuth provider connections
- **Session** - Active sessions
- **VerificationToken** - Email/password reset tokens
- **Subscription** - Payment subscriptions (Lemon Squeezy)
- **AuditLog** - Compliance action logging (17 action types)

### Enums
- `SubscriptionTier`: free, starter, professional, business, enterprise
- `SubscriptionStatus`: active, inactive, cancelled, expired, paused, past_due
- `AuditAction`: user_login, user_logout, user_registered, tool_risk_assessment, payment_succeeded, etc.

## Compliance Coverage

| EU AI Act Article | Tool | Status |
|-------------------|------|--------|
| Art.4 (AI Literacy) | Knowledge base | Included |
| Art.5 (Prohibited) | Prohibited Practices Check | Active |
| Art.6 (Risk Classification) | Risk Assessment | Active |
| Art.50 (Transparency) | Transparency Check | Active |
| General | URL Compliance Scan | Active |

## License

Proprietary - All rights reserved.

## Support

For issues or questions, contact support through the application or email.
# deploy trigger
