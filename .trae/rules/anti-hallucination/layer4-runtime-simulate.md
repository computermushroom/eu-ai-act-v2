# Layer 4: Runtime Link Simulation Check

## Purpose
Prevent "paper-ready, runtime-broken" code. After static checks pass, simulate full business runtime links.

## Simulation Scenarios
1. **Database CRUD**: Simulate create, read, update, delete for affected models
2. **Payment Full Flow**:
   - Creem/Paddle checkout creation
   - Payment success webhook
   - Payment failure webhook
   - Refund webhook
   - Duplicate webhook idempotency check
3. **Auth Flow**: Login, session validation, protected route access
4. **API Response**: Verify JSON shape matches TS types

## Execution
- Use Vitest to write simulation tests
- Mock external APIs (Creem/Paddle/LLM) with realistic payloads
- Assert DB state after each operation
- Log full execution trace

## Failure Handling
- ANY simulation failure = hallucination defect
- STOP delivery
- Fix root cause
- Re-run ALL four layers from Layer 1

## Success Criteria
- All DB operations complete without Prisma errors
- All webhook handlers return correct status codes
- Idempotency checks prevent duplicate processing
- Auth guards correctly reject unauthorized requests
