# E2E Testing Guide

## Prerequisites

- Node.js 22+
- Chromium browser (installed automatically by Playwright)
- Local dev server running on http://localhost:3000

## Setup

```bash
cd e2e
cp .env.example .env.local
# Edit .env.local with your values
```

## Run Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode (visible browser)
npx playwright test --headed
```

## Test Structure

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Registration, login, password reset |
| `pricing.spec.ts` | Pricing tiers, subscription redirect |
| `tools.spec.ts` | Tool pages loading |
| `dashboard.spec.ts` | Auth guard, settings |
| `landing.spec.ts` | Homepage, navigation |

## CI Configuration

Tests run with:
- 2 retries on failure
- 1 worker (sequential)
- Screenshots on failure
- HTML report generated in `playwright-report/`
