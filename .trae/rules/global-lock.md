# Global Lock - Permanent Tech Stack & Architecture Rules

## Repository Binding
- **Target Repository**: `computermushroom/eu-ai-act-v2`
- **Remote Origin**: `https://github.com/computermushroom/eu-ai-act-v2.git`
- **Primary Branch**: `main`
- **Forbidden**: Creating new repositories, adding extra remotes, or switching repos.

## Locked Tech Stack (Immutable)
| Layer | Technology | Version Lock |
|-------|-----------|--------------|
| Framework | Next.js (App Router) | ^16.2.6 |
| UI | React | ^19.1.0 |
| Language | TypeScript (Strict Mode) | ^5.8.3 |
| Styling | Tailwind CSS | ^4.1.8 |
| i18n | next-intl | ^4.12.0 (8 langs: en/de/fr/es/nl/it/pl/sv) |
| Auth | NextAuth.js v5 | ^5.0.0-beta.25 |
| Database | Neon PostgreSQL + Prisma ORM | Prisma ^7.8.0 |
| Payment Primary | Creem | lib/payment/creem-adapter.ts |
| Payment Fallback | Paddle | lib/payment/paddle-adapter.ts |
| LLM Default | OpenAI gpt-4o-mini | lib/llm/openai-provider.ts |
| LLM Alt | Anthropic Claude | lib/llm/anthropic-provider.ts |
| Email | Nodemailer + Resend | lib/email.ts |
| Cache | SWR | ^2.4.1 |
| Monitoring | Sentry | ^10.59.0 |
| API Docs | Swagger UI | /docs page |
| Unit Tests | Vitest | ^3.2.0 |
| E2E Tests | Playwright | ^1.61.0 |
| Deploy | Vercel + GitHub | Auto-build on push |

## Forbidden Actions (Terminate & Alert)
1. Adding new third-party dependencies not listed above without user approval.
2. Upgrading major versions of locked dependencies.
3. Replacing database, payment, auth, or LLM providers.
4. Hardcoding secrets, API keys, webhook secrets in source code.
5. Creating new top-level directories outside the fixed structure.

## Fixed Directory Structure
```
app/        Next.js pages & API routes
components/ Atomic & business components
lib/        DB connection, payment SDK, APIs, LLM, email
hooks/      Business logic hooks (SWR)
prisma/     Schema + versioned migrations (prisma/migrations/)
e2e/        Playwright E2E tests
__tests__/  Vitest unit tests
docs/       API docs, DB docs, payment docs, requirements, history
docs/en/    English summaries for overseas audit
.trae/      Permanent coding constraint rules
```

## Environment Security
- `.env.local` — local dev only
- `.env.staging` — pre-production
- `.env.prod` — production (keys only in Vercel dashboard)
- Production secrets must NEVER be stored in local files or committed.
