# 2026-07-22-tower-mart-lineage-key-uniqueness — Unique evidence lineage keys

## Release ID

`2026-07-22-tower-mart-lineage-key-uniqueness`

## Status

`candidate`

## Plain-English Summary

After restoring AI use-case candidates, the governed Meridian write failed with `ON CONFLICT DO UPDATE command cannot affect row a second time`. Cause: `mart_evidence_lineage.lineage_key` was built from the **display name** (`<program name> AI-tagged spend`), and many V3 rows legitimately share a `business_name` — 91 duplicate keys appeared once 255 portfolio items existed. Postgres rejects a batch upsert that touches the same conflict key twice, so the whole transaction aborted (mart untouched — fail-safe held).

Two changes:

1. **Root fix** — `lineage_key` is now built from the aggregate's unique `identityKey`, not the display label. The human-readable label stays in `displayed_fact`, where it belongs. Keys remain stable across runs, so the write stays idempotent.
2. **Safety net** — the write module's `upsert()` now dedupes each batch by conflict key (last wins) before insert. A future projection bug can never abort an entire governed write this way again; the assembler still owns key uniqueness.

Verified on the real Meridian CSVs: **0 duplicate keys across all 7 mart tables**, core numbers unchanged and exact.

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/mart-projection/assemble-mart.ts` — lineage key construction.
- `internal-admin` lane: `src/scripts/tower/project-tower-mart-write.ts` — batch dedupe guard.

## Client Applicability

- All clients: tenant-generic.
- Feature flag: none.

## Changes Included

- `assemble-mart.ts` — `pushEvidence()` takes the aggregate `identityKey`; `lineage_key` uses it instead of `displayedFact`.
- `project-tower-mart-write.ts` — `upsert()` dedupes by conflict key before insert.

## QA / Validation

- Pass: `jest src/lib/cio-tower/mart-projection/__tests__/` — 49/49.
- Pass: `tsc --noEmit` — zero errors in changed files.
- Pass: real-CSV dry-run — 0 duplicate keys across ai_portfolio (255), decision_lanes (12), evidence_lineage (267), gaps (15), cxo_actions (3), value_funnel (5), command_center (1); core numbers exact ($650.0M / $487.5M / $162.5M / $53.7M / $3.8M / $0), candidates 243.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds the image. Then re-run the governed `project:tower-mart:meridian:write-job`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: after the re-run write.

## Rollback Plan

Revert the PR. The write is idempotent; re-running restores prior output.

## Audit Evidence

- Failing job log: `error: ON CONFLICT DO UPDATE command cannot affect row a second time`.
- Local reproduction identified 91 duplicate `lineage_key`s; post-fix dry-run shows 0.
- PR URL: pending.

## Known Gaps

- Real `tower_*` telemetry still un-ingested; usage/adoption stays gap-only.
