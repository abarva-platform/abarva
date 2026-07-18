# Multi-Tenant Data Factory

Final status: BLOCKED_BEFORE_PROMOTION

Planning-grade synthetic candidate context only. Not real client production data, not PHI/PII/payment-card data, not active tenant truth, and not a claim of realized financial value.

## What Passed

- FS Demo (first-capital-financial): 4,840 source rows, 216 interview rows, 9,680 facts, 4,200 graph objects.
- Airline Demo (skyharbor-air): 4,840 source rows, 216 interview rows, 9,680 facts, 4,200 graph objects.

## Boundary

The repeatable factory can generate, validate, dry-run plan, reconcile, and locally prove candidate module consumption. It does not yet execute Azure/Postgres candidate writes because the repository loader is intentionally write-locked pending approved non-prod job execution.
