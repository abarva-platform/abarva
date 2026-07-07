# ADR-0004 - Per-User RLS

## Status

Accepted

## Date

2026-06-01

## Context

Tenant-scoped data access must be enforced below the UI. The repository contains route-level tenant guards, SQL-level RLS regression coverage, and audit docs showing that per-user RLS shipped as a Phase 5 security closeout:

- `src/lib/auth/tenant-access.ts` centralizes tenant membership checks for tenant-scoped routes and APIs.
- `tests/security/rls-regression.sql` exercises SQL-level tenant isolation directly.
- `scripts/run-rls-regression.ts` runs the RLS regression SQL against `DATABASE_URL`.
- `docs/build/audit-out/SETUP_AUDIT.md` records F-SU-106 as resolved by the 2026-05-07 Phase 5 rollout with six migrations and 108 tests.
- `docs/build/audit-out/SOURCE_AUDIT_EXECUTIVE_SUMMARY.md` records the same Phase 5 RLS closeout and points to the operations runbook.
- `docs/architecture/azure/DATA-ACCESS-ADAPTER-WRITE-PATH-DESIGN.md` requires write adapters to preserve per-user RLS and carry `actorUserId`.

## Decision

Data-plane tables that hold tenant-scoped user-visible records must preserve per-user RLS semantics. App code may add route-level authorization, but it must not treat route guards as a substitute for database isolation.

New data-plane work must identify how `client_id` or tenant identity is enforced, how actor identity flows into reads/writes where applicable, and what RLS or regression coverage protects cross-client access.

## Consequences

- Per-user and per-client isolation remain database concerns, not only UI concerns.
- Adapter work must carry actor and tenant context rather than using anonymous global reads for user-visible data.
- SQL-level regression coverage remains a release gate for sensitive client-data changes.
- Compatibility paths that still use service-role access need explicit follow-up or containment notes when touched.

## Alternatives

- Rely only on Clerk and route guards. Rejected because backend and SQL paths still need independent isolation.
- Use service-role-only access for all application reads. Rejected for user-visible client data because it bypasses per-user RLS semantics.
- Push all isolation into application filters. Rejected because missed filters can leak data and are harder to prove in audits.

## References

- `src/lib/auth/tenant-access.ts`
- `tests/security/rls-regression.sql`
- `scripts/run-rls-regression.ts`
- `docs/build/audit-out/SETUP_AUDIT.md`
- `docs/build/audit-out/SOURCE_AUDIT_EXECUTIVE_SUMMARY.md`
- `docs/architecture/azure/DATA-ACCESS-ADAPTER-WRITE-PATH-DESIGN.md`
