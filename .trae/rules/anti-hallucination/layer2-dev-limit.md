# Layer 2: Development Hard Constraints

## Complete Business Loop Required
Every feature MUST include:
1. UI component(s) rendering
2. Database persistence via Prisma
3. Complete payment flow (if applicable) with Creem/Paddle
4. Global exception handling (try/catch + custom error codes)
5. Edge case handling (empty data, unauthorized access, concurrent requests)

## Forbidden Patterns
- TODO comments left in delivered code
- Mock/fake data in production logic
- Simplified webhook signature checks
- Skipping DB transaction safety
- Missing error handling on async operations

## Testing Requirement
- Payment, order, auth, and DB modification modules MUST have unit tests
- Test coverage: normal case, failure case, refund, webhook anomaly, empty data, concurrency
- No tests = feature incomplete

## Compatibility Check
Before modifying code:
- List ALL affected files
- Ensure changes do NOT break existing pages, APIs, DB schema, or payment flows
- Maintain backward compatibility for existing data
