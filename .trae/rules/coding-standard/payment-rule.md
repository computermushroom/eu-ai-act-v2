# Payment Rule - Creem & Paddle

## Gateway Architecture
- Primary: **Creem** (`lib/payment/creem-adapter.ts`)
- Fallback: **Paddle** (`lib/payment/paddle-adapter.ts`)
- Unified interface: `lib/payment/types.ts`
- Webhook handler: `lib/payment/webhook-handler.ts`

## Mandatory Checks for Payment Code
1. **Signature Verification**: Every webhook payload MUST verify HMAC signature before processing.
2. **Idempotency**: Duplicate webhook events must be detected and ignored (use `gatewayOrderId` + event type).
3. **Transaction Safety**: DB updates inside webhook handlers must use Prisma transactions.
4. **Error Isolation**: Webhook handler errors must NOT crash the server; return 200 after logging.
5. **Tier Sync**: Subscription tier changes must sync to `Subscription` table and trigger `AuditLog`.

## Webhook Event Handling
- `checkout.completed` / `subscription.activated` -> Create/Update subscription, set tier.
- `subscription.cancelled` -> Set status to `cancelled`, preserve access until `currentPeriodEnd`.
- `subscription.past_due` / `payment.failed` -> Set status to `past_due`, notify user.
- `subscription.refunded` -> Set status to `cancelled`, log refund in `AuditLog`.

## Security Red Lines
- NEVER log full webhook payload containing sensitive card tokens.
- NEVER expose raw payment gateway errors to frontend.
- ALWAYS validate `gatewaySubscriptionId` exists in DB before updating.
