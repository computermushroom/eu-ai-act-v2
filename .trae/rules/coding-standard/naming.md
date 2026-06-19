# Naming Convention Standard

## Files & Directories
- All file names: `kebab-case`
  - Examples: `user-checkout.tsx`, `creem-adapter.ts`, `api-guard.ts`

## React Components
- Component names: `PascalCase`
  - Examples: `CheckoutPay`, `DevSubscriptionSimulator`, `ComplianceAlert`

## Variables & Functions
- Variables and functions: `camelCase`
  - Examples: `handleSubmit`, `isLoading`, `subscriptionTier`

## Constants
- Constants: `UPPER_SNAKE_CASE`
  - Examples: `PADDLE_WEBHOOK_SECRET`, `CREEM_API_KEY`, `MAX_RETRY_COUNT`

## Database Models & Enums (Prisma)
- Model names: `PascalCase` singular
  - Examples: `User`, `Subscription`, `AuditLog`
- Enum names: `PascalCase`
  - Examples: `PaymentGateway`, `SubscriptionStatus`, `AuditAction`
- Field names: `camelCase`
  - Examples: `gatewaySubscriptionId`, `currentPeriodStart`

## API Routes
- File path: `kebab-case`
  - Examples: `app/api/webhooks/creem/route.ts`

## Environment Variables
- `UPPER_SNAKE_CASE` with category prefix
  - Examples: `NEXTAUTH_SECRET`, `NEON_DATABASE_URL`, `CREEM_API_KEY`
