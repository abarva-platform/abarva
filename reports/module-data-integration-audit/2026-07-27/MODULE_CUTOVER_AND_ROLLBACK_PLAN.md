# Module Cutover and Rollback Plan

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Cutover Pattern

- Use shadow-read and parity reports first.
- Promote one object family at a time, not an entire module in one step.
- Keep original operational read path until signed-in product proof passes.
- Maintain feature flags for consumers, not data writes.

## Rollback Pattern

- Revert consumer flag to domain read path.
- Preserve published projection rows for audit; mark superseded rather than deleting.
- Stop outbox processing if projection quality fails.
- Do not roll back canonical IDs once approved without a reversal record.

## Required Evidence Per Cutover

- Tenant-scoped row counts.
- Identity-map reconciliation report.
- Metric definition parity report.
- aVa answer regression.
- Dashboard/export signed-in screenshots.
- Rollback command and owner.
