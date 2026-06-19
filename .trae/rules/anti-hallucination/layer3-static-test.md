# Layer 3: Pre-Delivery Static Self-Check

## Automated Batch Checks (Must Pass Before Delivery)
1. **TypeScript**: `tsc --noEmit` — zero errors
2. **Lint**: `eslint .` — zero errors
3. **No Any**: Global search for `: any` type annotations — zero occurrences
4. **Dependency Match**: All installed versions match `package.json` exact versions
5. **Schema Sync**: All Prisma model fields referenced in code exist in schema
6. **Payment SDK Sync**: All payment methods used exist in adapter files
7. **Docs Sync**: Feature docs updated in `docs/` (Chinese + English summary)

## Delivery Report Required
Output must include:
- Changed files list
- New features list
- Test coverage scope
- Online risk assessment

## Block Delivery If
- Fictitious interfaces detected
- Missing payment logic
- Type errors present
- Incomplete functionality
- Missing docs or migration scripts

## Fix Protocol
If defects found:
1. List all defects
2. Provide directly executable fix plan
3. Re-run static checks after fix
4. Only deliver when ALL checks pass
