# Layer 1: Pre-Check Before Coding

## Rule
Before writing ANY code for a new feature or bugfix:

1. **Global Scan**: Search the entire repository for related files, types, DB models, API routes, components, and payment logic.
2. **Generate Status List**: Output a "Code Status List" containing:
   - Existing relevant files and their roles
   - Relevant Prisma models and fields
   - Existing payment/webhook logic
   - Existing TS types and interfaces
3. **User Confirmation**: Wait for user confirmation of the status list before coding.

## Forbidden
- Inventing new DB fields that do not exist in `prisma/schema.prisma`
- Assuming payment SDK methods without checking `lib/payment/*.ts`
- Creating API routes that duplicate existing ones
- Using variables or types from "memory" instead of real files

## Checklist
- [ ] All related files located and listed
- [ ] Prisma schema inspected for relevant models
- [ ] Payment logic inspected if applicable
- [ ] User confirmed status list
