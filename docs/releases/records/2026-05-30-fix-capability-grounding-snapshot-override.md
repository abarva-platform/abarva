# 2026-05-30-fix-capability-grounding-snapshot-override — Dedup capability-grounding snapshot fetch (P0 follow-up)

## Release ID

`2026-05-30-fix-capability-grounding-snapshot-override`

## Status

`candidate`

## Plain-English Summary

Capability-grounding broker no longer re-fetches the inventory snapshot when `/admin` already has it. Eliminates one of two duplicate 3-query bursts on `data_inventory_segments` / `data_inventory_audit_log` / `data_ingestion_runs` that competed for the single Postgres connection-pool slot (default `ABARVA_PG_POOL_MAX=1`). Pairs with PR-2606's TrustSpine snapshot dedup to drop `/admin`'s distinct-query count from approximately 15 to approximately 12.

The amber "Live data temporarily unavailable" banner that surfaced on non-Apex tenants (Meridian, FirstCapital) was traced in `docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md` § 7 to pool exhaustion during cold-pool warmup. This change removes the second of the redundant calls; the third originates from a different broker and is tracked separately.

## Layer Impact

`runtime-app-lane` — performance optimization only, no behavior change. The public contract of `getCapabilityGrounding(tenantKey)` is preserved; a new optional `options.snapshotOverride` parameter is added that callers opt into. The single in-tree caller (the `/admin` page) is updated; all other paths (tests, future callers) continue to work as before.

## Client Applicability

- All clients: Yes — performance fix touches the `/admin` server render path for every tenant.
- Specific clients: Non-Apex tenants (Meridian, FirstCapital) most affected because their broker calls hit cold Postgres pools and were the population reporting the amber banner.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — pure performance dedup, gated by the presence of the explicit `snapshotOverride` parameter at the call site.

## Changes Included

- `src/lib/admin/broker/capability-grounding-broker.ts` — add optional `options.snapshotOverride` parameter using the `Object.prototype.hasOwnProperty.call(options, 'snapshotOverride')` pattern so explicit-`null` is honored without refetch.
- `src/app/(maestro)/admin/page.tsx` — pass the already-fetched `snapshot` to `getCapabilityGrounding` so the second redundant DB read is eliminated.
- `src/lib/admin/broker/__tests__/capability-grounding-broker.test.ts` — add `snapshotOverride` contract test suite mirroring the PR-2606 TrustSpine pattern (override used / no-override refetches / explicit-null honored).
- New release record: this file.

## QA / Validation

- `npx jest src/lib/admin/broker/__tests__/capability-grounding-broker.test.ts` — PASS, all snapshot-override contract tests included.
- `npx tsc --noEmit` — PASS.
- `npx eslint src/lib/admin/broker/capability-grounding-broker.ts src/app/\(maestro\)/admin/page.tsx src/lib/admin/broker/__tests__/capability-grounding-broker.test.ts` — PASS.

## Rollout Plan

Merge to `main`. Vercel production deploy is automatic on merge. No DB / data-plane migration required.

Operational pairing (outside this PR scope): separately set `ABARVA_PG_POOL_MAX=5` in Vercel production env to raise the pool cap so cold-pool warmup absorbs the remaining redundant call. Without that env bump, this PR alone still reduces pool pressure but does not fully eliminate the amber banner.

## Rollback Plan

Revert the PR. No DB / data-plane state to roll back. Pre-change behavior (two redundant snapshot fetches per `/admin` render) is restored on revert.

## Audit Evidence

- Diagnosis: `docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md` § 7.
- Pattern source: PR-2606 (TrustSpine `snapshotOverride` dedup) — `src/lib/admin/broker/trust-spine-broker.ts` lines 555–593 and its test at `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` lines 830–859.
- PR URL: filled in after `gh pr create`.
- CI run: filled in after push.

## Known Gaps

- Operational `ABARVA_PG_POOL_MAX` env var bump is separate and outside this PR's scope. The founder may bump it independently in Vercel production env.
- Pool cap of 5 in code is still conservative — bump to 20 in a follow-up if pressure persists after this PR + the env bump land together.
- A third in-tree caller of `getSetupInventorySnapshot` from a different `/admin`-adjacent broker remains; that is tracked separately and is not in scope here.
