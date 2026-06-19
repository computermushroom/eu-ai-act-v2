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
- Creem/Paddle integration (checkout + webhooks)
- Subscription management in dashboard

### Internationalization
- 10 languages: English, German, French, Spanish, Italian, Chinese, Japanese, Korean, Russian, Arabic
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
| Creem/Paddle | SDK | Payments |
| next-intl | 4.x | Internationalization |
| react-pdf | 4.x | PDF report generation |
| bcryptjs | 2.x | Password hashing |
| nodemailer | 6.x | Email delivery (SMTP) |
| Resend | SDK | Email delivery (Resend) |
| OpenAI SDK | 4.x | LLM provider (AI assistant) |
| Anthropic SDK | SDK | LLM provider (AI assistant) |
| zod | 3.x | Schema validation |
| Vitest | 2.x | Unit testing |

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
- `PAYMENT_GATEWAY` - Active payment gateway (creem|paddle)
- `CREEM_API_KEY` - For Creem payments
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` - For password reset emails
- `SMTP_PROVIDER` - SMTP preset (e.g., gmail, sendgrid)
- `RESEND_API_KEY` - For Resend email delivery
- `LLM_PROVIDER` - LLM provider selection (openai|anthropic)
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - OpenAI model name (default: gpt-4o)
- `ANTHROPIC_API_KEY` - Anthropic API key
- `ANTHROPIC_MODEL` - Anthropic model name (default: claude-sonnet-4-20250514)

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

#### Vercel Environment Variables

| Variable | Production | Preview | Notes |
|----------|-----------|---------|-------|
| `DATABASE_URL` | Required | Required | Prisma connection (uses pooler) |
| `DIRECT_DATABASE_URL` | Required | Not needed | Direct connection for migrations |
| `NEXTAUTH_URL` | Required | Required | Auto-set by Vercel |
| `NEXTAUTH_SECRET` | Required | Required | Generate with `openssl rand -base64 32` |
| `PAYMENT_GATEWAY` | Required | Optional | Set to `creem` or `paddle` |
| `CREEM_API_KEY` | Required | Optional | If using Creem |
| `LLM_PROVIDER` | Required | Optional | `openai` or `anthropic` |
| `RESEND_API_KEY` | Optional | Optional | If using Resend for emails |

> **Note:** `DIRECT_DATABASE_URL` is only needed in Production for Prisma migrations. Preview deployments use the pooled `DATABASE_URL`.

#### Webhook URLs

Configure these URLs in your payment provider dashboards:

- **Creem:** `https://your-domain.com/api/payment/webhook/creem`
- **Paddle:** `https://your-domain.com/api/payment/webhook/paddle`

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
│   │   ├── payment/       # Payment webhooks
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
│   ├── chat/              # AI chat widget
│   ├── layout/            # Header, Footer, CookieConsent, LanguageSwitcher
│   ├── tools/             # ComplianceReportPDF
│   └── DevSubscriptionSimulator.tsx  # Dev mode subscription UI
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   └── useTool.ts         # Tool management hook
├── i18n/                  # Translation files (10 languages)
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── auth-guard.ts      # Route protection
│   ├── audit.ts           # Audit logging service
│   ├── dev-mode.ts        # Dev mode subscription simulator
│   ├── email.ts           # Email service (Resend + SMTP)
│   ├── env.ts             # Environment validation
│   ├── llm/               # LLM abstraction layer
│   │   ├── types.ts       # LLM provider types
│   │   ├── openai-provider.ts  # OpenAI implementation
│   │   ├── anthropic-provider.ts # Anthropic implementation
│   │   └── index.ts       # Provider factory
│   ├── payment/           # Payment adapters
│   │   ├── types.ts       # Payment gateway types
│   │   ├── creem-adapter.ts    # Creem gateway
│   │   ├── paddle-adapter.ts   # Paddle gateway
│   │   ├── webhook-handler.ts  # Webhook processing
│   │   └── index.ts       # Gateway factory
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
| `/api/ai-assistant` | POST | AI compliance assistant | Yes |
| `/api/audit` | GET/POST | Audit log query/create | Yes |
| `/api/compliance-generator` | POST | Compliance report generation | Yes |
| `/api/dev/simulate-subscription` | GET/POST | Dev mode subscription simulation | Dev only |
| `/api/fria` | GET/POST | FRIA assessment (Art.27) | Yes (Business tier) |
| `/api/health` | GET | Health check | No |
| `/api/i18n/set-locale` | POST | Switch language | No |
| `/api/payment/webhook/creem` | POST | Creem payment webhook | No |
| `/api/payment/webhook/paddle` | POST | Paddle payment webhook | No |
| `/api/profile` | GET/PATCH | Get/update profile | Yes |
| `/api/profile/export` | GET | GDPR data export | Yes |
| `/api/profile/delete` | POST | GDPR account deletion | Yes |
| `/api/subscription/checkout` | POST | Create payment session | Yes |
| `/api/tools` | GET | List available tools | No |
| `/api/tools/url-scan` | POST | URL compliance scan | Yes |

## Architecture

### Payment System (Adapter Pattern)

The payment system uses the **Adapter Pattern** to support multiple gateways (Creem and Paddle) through a unified interface. Each gateway adapter implements a common `PaymentGateway` interface defined in `lib/payment/types.ts`. The factory function in `lib/payment/index.ts` selects the active adapter based on the `PAYMENT_GATEWAY` environment variable.

```
lib/payment/
├── types.ts              # PaymentGateway interface + shared types
├── creem-adapter.ts      # Creem SDK implementation
├── paddle-adapter.ts     # Paddle SDK implementation
├── webhook-handler.ts    # Unified webhook processing
└── index.ts              # Factory: getPaymentGateway()
```

Webhook endpoints (`/api/payment/webhook/creem`, `/api/payment/webhook/paddle`) receive provider-specific payloads, normalize them through the webhook handler, and update the database.

### LLM System (Abstraction Layer)

The LLM system provides a **provider-agnostic abstraction layer** that supports OpenAI and Anthropic. A shared `LLMProvider` interface (`lib/llm/types.ts`) defines the contract, and concrete implementations handle provider-specific API calls.

```
lib/llm/
├── types.ts              # LLMProvider interface + message types
├── openai-provider.ts    # OpenAI API implementation
├── anthropic-provider.ts # Anthropic API implementation
└── index.ts              # Factory: getLLMProvider()
```

Switch providers by setting `LLM_PROVIDER=openai` or `LLM_PROVIDER=anthropic` in your environment variables.

### Email System (Fire-and-Forget)

Email delivery uses a **fire-and-forget** pattern to avoid blocking webhook responses. The `lib/email.ts` module supports two backends:

- **Resend** (`RESEND_API_KEY`) - Recommended for production
- **SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) - Fallback or custom servers

Emails are sent asynchronously without awaiting completion, ensuring webhook handlers respond within timeout limits.

### Audit System

All critical operations are recorded through the audit logging service (`lib/audit.ts`). The system tracks 17+ action types including user authentication events, tool usage, payment events, and GDPR actions. Audit logs are stored in the `AuditLog` database model and accessible via the `/api/audit` endpoint (authenticated).

### Dev Mode

In development environments (`NODE_ENV=development`), the Dev Mode simulator (`lib/dev-mode.ts`) provides a mock subscription system. The `DevSubscriptionSimulator.tsx` component renders a UI in the dashboard that allows developers to simulate subscription tier changes without real payment processing. The `/api/dev/simulate-subscription` endpoint is only available in development mode.

## Database Schema

### Models
- **User** - Accounts with soft delete support
- **Account** - OAuth provider connections
- **Session** - Active sessions
- **VerificationToken** - Email/password reset tokens
- **Subscription** - Payment subscriptions (Creem/Paddle)
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

## Testing

The project uses [Vitest](https://vitest.dev/) for unit testing with jsdom environment.

```bash
# Run all tests
npx vitest

# Run specific test file
npx vitest __tests__/api/webhook-handler.test.ts

# Run with coverage report
npx vitest --coverage

# Run tests in watch mode
npx vitest --watch
```

Test files are located in `__tests__/` and follow the pattern `*.test.{ts,tsx}`. The test configuration is defined in `vitest.config.ts`.

## Payment Setup

### Creem

1. Sign up at [Creem](https://creem.io/) and create a merchant account
2. Generate an API Key from the dashboard
3. Create a Product for each subscription tier (Starter, Professional, Business, Enterprise)
4. Configure the webhook URL: `https://your-domain.com/api/payment/webhook/creem`

### Environment Variables

```bash
PAYMENT_GATEWAY=creem
CREEM_API_KEY=your-creem-api-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
```

> **Dev Mode:** In development (`NODE_ENV=development`), the Dev Mode simulator bypasses real payment processing. Use the `DevSubscriptionSimulator` component in the dashboard to test subscription flows without a payment provider.

## License

Proprietary - All rights reserved.

## Support

For issues or questions, contact support through the application or email.
# deploy trigger
