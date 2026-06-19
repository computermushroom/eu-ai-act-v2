# Database Migrations

## Workflow

### Development

1. Modify `schema.prisma`
2. Run `npm run db:migrate` to create and apply migration
3. Review generated migration file in `prisma/migrations/`
4. Commit migration file to Git

### Production

```bash
npm run db:migrate:deploy
```

This applies pending migrations without interactive prompts.

### Creating Migration Without Applying

```bash
npm run db:migrate:create -- --name add_new_feature
```

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20250619000000_init_baseline` | 2026-06-19 | Baseline: captures current schema state |
