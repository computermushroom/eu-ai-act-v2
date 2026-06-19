# TypeScript Type Standard

## Strict Mode Enforcement
- `strict: true` in `tsconfig.json` is mandatory.
- Global `any` is FORBIDDEN. Use `unknown` with type guards instead.

## Type Naming
- Interfaces: `PascalCase`, descriptive noun
  - Examples: `SubscriptionPayload`, `CreemWebhookEvent`
- Type aliases: `PascalCase` with semantic meaning
  - Examples: `PaymentResult`, `LLMResponse`

## Function Signatures
- All functions must declare parameter types and return types.
- Async functions must declare `Promise<ReturnType>`.

## Comments Standard (Bilingual)
- All JSDoc, function docs, and interface comments in **English**.
- Chinese allowed only in `docs/` markdown files.
- Every core module (payment, DB, auth, orders) must document:
  - Parameters
  - Return values
  - Exception scenarios
  - Webhook signature verification logic

## Error Handling
- All async logic, DB operations, and payment calls MUST wrap in `try/catch`.
- Use custom error codes; NEVER expose raw errors to the frontend.
- Example pattern:
  ```ts
  try {
    const result = await processPayment(payload);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Payment failed', { error, payload });
    return { success: false, code: 'PAYMENT_ERROR', message: 'Payment processing failed' };
  }
  ```

## Code Size Limits
- Single business function: <= 25 lines.
- Single component file: <= 200 lines.
- Split large logic into smaller utility functions.
