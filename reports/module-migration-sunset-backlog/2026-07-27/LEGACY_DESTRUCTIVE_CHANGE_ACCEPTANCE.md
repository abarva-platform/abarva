# Legacy Destructive Change Acceptance

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Non-Negotiable Rule

No destructive drop is authorized by the audit or backlog package.

## Future Drop Acceptance Checklist

- Legacy path has completed ACTIVE, DUAL_RUN, NEW_READ_PRIMARY, LEGACY_READ_ONLY, and ARCHIVED states.
- Observation window has elapsed with no writes and no rollback usage.
- Archive restore drill passed.
- Signed-in product proof passed for all affected surfaces.
- aVa and export regressions passed.
- Tenant isolation proof passed.
- Data owner and product owner explicitly approve.
- Release record names rollback limits and irreversible effects.
