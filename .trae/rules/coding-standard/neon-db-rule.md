# Neon DB & Prisma Rule

## Schema Authority
- Single source of truth: `prisma/schema.prisma`
- ALL model changes require a versioned migration in `prisma/migrations/`

## Migration Workflow
1. Modify `schema.prisma`
2. Generate migration: `prisma migrate dev --name descriptive_name`
3. Review generated SQL before applying
4. Commit both schema change and migration SQL
5. Update `docs/db.md` with change description

## Field Naming
- Use `camelCase` for all Prisma model fields
- Boolean fields: prefix with verb (`isActive`, `hasPermission`)
- Timestamp fields: suffix with `At` (`createdAt`, `updatedAt`)

## Indexes
- Every foreign key field MUST have `@@index`
- Query-heavy fields (email, status, tier) MUST have `@@index`

## Soft Delete Pattern
- Use `deletedAt DateTime?` instead of hard delete for `User` and critical entities
- Queries must filter `deletedAt: null` by default

## Data Integrity
- All relations must specify `onDelete` behavior (`Cascade` or `SetNull`)
- Never leave orphaned records

## SQL Migration Standards
- Each migration file must be reversible where possible
- Add comments for complex schema changes
- migrations must be committed to Git before deployment
