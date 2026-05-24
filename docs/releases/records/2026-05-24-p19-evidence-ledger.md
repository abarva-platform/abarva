# 2026-05-24-p19-evidence-ledger — Evidence Ledger v1

## Release ID

`2026-05-24-p19-evidence-ledger`

## Status

`candidate`

## Plain-English Summary

Adds the first durable Evidence Ledger foundation: an append-only table for tenant-grounded claims, a server service for recording and resolving evidence rows, UI components for evidence chips and proof-point footers, and a browse page for inspecting provenance. Source hard-question answers now prefer exact intake fields over generic evidence categories.

## Layer Impact

- `client-data-lane`: adds `evidence_ledger` with tenant RLS, freshness, confidence, no-evidence flags, supersession linkage, and AI egress audit linkage.
- `agent-quality-lane`: Sentinel reasoning stages now attempt forward-path ledger writes for each emitted stage while preserving local graceful degradation.
- `source-lane`: hard-question fallback evidence references prefer exact fields like `intake.scope.line_items[3]`.
- `app-control-lane`: adds reusable EvidenceChip / ProofPointFooter components and `/evidence-ledger`.
- `ops-release-lane`: adds P19 smoke coverage and this release record.

## Client Applicability

- All clients: receive the schema, service contract, and UI capabilities after migration and deploy.
- Specific clients: Apex gains the immediate audit path for the hard-question evidence specificity gap.
- Internal only: `/evidence-ledger` is an authenticated operator/auditor surface.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260524080000_evidence_ledger_v1.sql`
- Service: `src/lib/evidence/ledger.ts`
- Citation resolver: `src/lib/evidence/citations.ts`
- UI: `src/components/evidence/EvidenceChip.tsx`, `src/components/evidence/ProofPointFooter.tsx`
- Route: `src/app/(maestro)/evidence-ledger/page.tsx`
- Instrumentation: `src/lib/agents/sentinel-reasoning/state-machine.ts`
- Source specificity: `src/lib/source/expert-judgment/source-hard-question-answer.ts`
- Smoke: `scripts/smoke/p19-evidence-ledger.spec.ts`

## QA / Validation

- PASS: `npm run smoke:p19-evidence-ledger`
- PASS: `npm test -- --runTestsByPath src/lib/agents/sentinel-reasoning/__tests__/state-machine.test.ts src/lib/evidence/__tests__/ledger.test.ts src/components/evidence/__tests__/ProofPointFooter.test.tsx src/lib/source/expert-judgment/__tests__/source-hard-question-evidence-ledger.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run db:migrate:dry` found one pending P19 migration and did not apply it.
- PASS: `npm run build`

## Rollout Plan

Merge to main, run `npm run db:migrate` before the application deploy starts serving code paths that write `evidence_ledger`, then allow the normal production deploy. The route and components are additive.

## Rollback Plan

Application rollback is safe because the new route and components are additive. The database migration is append-only; do not drop ledger rows in a rollback. If needed, stop writing to the ledger by reverting the application code while preserving the table for audit continuity.

## Audit Evidence

- PR and CI logs for this branch.
- Migration dry-run output showing the single pending `20260524080000_evidence_ledger_v1.sql` migration.
- P19 smoke output.
- Targeted Jest output for ledger, proof-point footer, Sentinel stage compatibility, and Source exact-field evidence selection.

## Known Gaps

- Historical decisions are not backfilled into the ledger in v1.
- Full claim-site instrumentation is forward-path first; later packet slices should expand individual surfaces without changing the ledger contract.
