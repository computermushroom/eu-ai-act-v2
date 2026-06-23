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
- FastSpring integration (checkout + webhooks)
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
| FastSpring | API | Payments |
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
- `FASTSPRING_API_KEY` - FastSpring API key (Basic Auth username)
- `FASTSPRING_API_PASSWORD` - FastSpring API password (Basic Auth password)
- `FASTSPRING_STORE_ID` - FastSpring Store ID
- `FASTSPRING_WEBHOOK_SECRET` - FastSpring webhook secret for HMAC verification
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
# Generate Prisma Client
npx prisma generate

# Development: apply migrations (interactive, creates new migrations if needed)
npx prisma migrate dev

# Production: apply pending migrations (non-interactive)
npx prisma migrate deploy
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
| `FASTSPRING_API_KEY` | Required | Optional | FastSpring API key |
| `FASTSPRING_API_PASSWORD` | Required | Optional | FastSpring API password |
| `FASTSPRING_STORE_ID` | Required | Optional | FastSpring Store ID |
| `FASTSPRING_WEBHOOK_SECRET` | Required | Optional | FastSpring webhook secret |
| `LLM_PROVIDER` | Required | Optional | `openai` or `anthropic` |
| `RESEND_API_KEY` | Optional | Optional | If using Resend for emails |

> **Note:** `DIRECT_DATABASE_URL` is only needed in Production for Prisma migrations. Preview deployments use the pooled `DATABASE_URL`.

#### Webhook URLs

Configure this URL in your FastSpring dashboard:

- **FastSpring:** `https://your-domain.com/api/payment/webhook/fastspring`

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
│   ├── payment/           # FastSpring payment adapter
│   │   ├── types.ts       # Payment types
│   │   ├── fastspring-adapter.ts  # FastSpring gateway
│   │   ├── webhook-handler.ts     # Webhook processing
│   │   └── index.ts       # Export entry
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
| `/api/docs` | GET | OpenAPI 3.0 JSON specification | No |
| `/api/fria` | GET/POST | FRIA assessment (Art.27) | Yes (Business tier) |
| `/api/health` | GET | Health check | No |
| `/api/i18n/set-locale` | POST | Switch language | No |
| `/api/payment/webhook/fastspring` | POST | FastSpring payment webhook | No |
| `/api/profile` | GET/PATCH | Get/update profile | Yes |
| `/api/profile/export` | GET | GDPR data export | Yes |
| `/api/profile/delete` | POST | GDPR account deletion | Yes |
| `/api/subscription/checkout` | POST | Create payment session | Yes |
| `/api/tools` | GET | List available tools | No |
| `/api/tools/url-scan` | POST | URL compliance scan | Yes |

### API Documentation

Interactive Swagger UI documentation is available at `/docs` (powered by `swagger-ui-react`).
The OpenAPI 3.0 JSON spec is served dynamically from `/api/docs`.

| Endpoint | Description |
|----------|-------------|
| [`/docs`](/docs) | Swagger UI interactive documentation |
| [`/api/docs`](/api/docs) | OpenAPI 3.0 JSON specification |

## Architecture

### Payment System (FastSpring)

The payment system uses a single FastSpring gateway for all checkout, subscription, webhook, and invoice operations. The FastSpring adapter implements the `BasePaymentStrategy` interface defined in `lib/payment/types.ts`.

```
lib/payment/
├── types.ts              # Payment types
├── fastspring-adapter.ts # FastSpring REST API implementation
├── webhook-handler.ts    # Webhook processing
└── index.ts              # Export entry
```

Webhook endpoint `/api/payment/webhook/fastspring` receives FastSpring payloads, verifies HMAC signature, normalizes data, and updates the database.

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
- **Subscription** - Payment subscriptions (FastSpring)
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

### FastSpring

1. Sign up at [FastSpring](https://fastspring.com/) and create a seller account
2. Get your Store ID from the dashboard
3. Generate API credentials (API Key + API Password) from Integrations → API Keys
4. Create a Product for each subscription tier (Starter, Professional, Business, Enterprise)
5. Configure the webhook URL: `https://your-domain.com/api/payment/webhook/fastspring`
6. Get your Webhook Secret from Integrations → Webhooks

### Environment Variables

```bash
FASTSPRING_API_KEY=your-api-key
FASTSPRING_API_PASSWORD=your-api-password
FASTSPRING_STORE_ID=your-store-id
FASTSPRING_WEBHOOK_SECRET=your-webhook-secret
```

> **Dev Mode:** In development (`NODE_ENV=development`), the Dev Mode simulator bypasses real payment processing. Use the `DevSubscriptionSimulator` component in the dashboard to test subscription flows without a payment provider.

## License

Proprietary - All rights reserved.

## Support

For issues or questions, contact support through the application or email.
# deploy trigger
