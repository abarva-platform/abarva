# 2026-07-23-source-guidebook-rfp-seed — Author the RFP-stage facilitator guidebook

## Release ID

`2026-07-23-source-guidebook-rfp-seed`

## Status

`candidate` — local tests/typecheck/lint clean. Database migration not yet applied to the
live database — requires the governed migration lane's `apply` dispatch after merge, matching
the exact pattern used for the original Strategy guidebook seed
(`docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`).

## Plain-English Summary

`SOURCE-GUIDEBOOK-001`'s Known Gaps flagged that only the Strategy stage had an authored
facilitator guidebook; the other 10 canonical Source stages, including RFP, had none. This was
independently confirmed during Delta Airlines demo-readiness auditing: the `d09_rfp_pack`
document-generation prompt contract is strong and detailed (version 10, 11 required sections,
mandatory tables, a 15-exhibit evidence coverage map, `block_until_complete` missing-input
policy — verified directly against `prompt-registry.ts` and `source-artifact-profiles.ts`), but
the human facilitator/session layer for the RFP stage was empty — nothing existed to help a
sourcing lead actually run the readiness review before the RFP goes vendor-facing.

This release authors the RFP-stage guidebook content, grounded directly in the real
`d09_rfp_pack` prompt contract rather than generic procurement filler: scope-lock confirmation
against the approved Scope Memo, a checklist walk-through of the real 15-exhibit evidence
coverage map (exact exhibit labels pulled from `D09_RFP_EVIDENCE_COVERAGE_RULES`), a sign-off on
the 8-component Vendor Response Control Pack, and an evaluation-weights/disqualification-rules
check — closing with a real decision (ready to issue / held for gap closure / sent back to
Scope), matching the exact section-type vocabulary and voice the Strategy guidebook already
established.

## Layer Impact

- `global-control-lane`: one new, purely additive seed row in the existing
  `source_stage_guidebooks` table. No schema change, no application code change, no new read
  surface (the same `getSourceStageGuidebook()` repository and Guidebook workspace tab that
  already render the Strategy guidebook will render this one once applied — no new wiring
  needed).
- **Database migration**:
  `supabase/migrations/20260723230000_source_stage_guidebooks_seed_rfp.sql` — a single
  `INSERT ... ON CONFLICT DO NOTHING`, identical shape to the existing Strategy seed migration.
  No `ALTER` on any existing table, no mutation of any existing row.

## Client Applicability

- All clients: yes — `client_key = NULL` (global default), so every tenant's RFP-stage
  Guidebook tab will render this content once the migration is applied and the stage is
  reached.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `supabase/migrations/20260723230000_source_stage_guidebooks_seed_rfp.sql` — one published,
  global RFP-stage guidebook: purpose, a 35-minute agenda, facilitator talking points, a
  15-exhibit evidence-coverage checklist worksheet, a decision-capture section, and a
  pre-mortem — all grounded in the real `d09_rfp_pack` prompt contract (verified line-by-line
  against `src/lib/source/agent-generation/prompt-registry.ts` and
  `src/lib/source/documentation-standards/source-artifact-profiles.ts` before authoring).
- This release record.

## QA / Validation

- `pass` — `npx jest --runTestsByPath src/lib/source/stage-guidebooks/__tests__/repository.test.ts --runInBand`
  — 7/7 passed. The repository is stage-key-generic (mocked, not content-specific), so it
  already covers the RFP stage transparently — no test changes needed.
- `pass` — confirmed neither `source-event-shell-v2.test.ts` nor
  `SourceAnalyticsCanvas.guidebook.test.tsx` hard-codes an "RFP has no guidebook" assertion
  that this content would break (grepped for `'rfp'`/`"rfp"` in both files — no matches).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors (a pure SQL migration has no TS surface, included for completeness).
- `pending` — live signed-in proof that the RFP Guidebook tab actually renders this content —
  requires the migration to be applied first (see Rollout Plan).

## Rollout Plan

Merge to `main` via PR (code-lane CI only builds/deploys application code, not this
migration — confirmed no auto-apply step exists in `aca-main-deploy.yml`, matching the prior
guidebook release). After merge, dispatch `db-migration-lab.yml` in `status` mode first, then
`apply` mode, against the same live lab database `ca-abarva-web-lab-eastus` reads from. After
apply, live-verify signed-in by opening a Source event's RFP stage and confirming the Guidebook
tab now renders "RFP Readiness Review" instead of staying hidden.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — ships code only, no
  migration-apply step.
- Governed migration workflow: `.github/workflows/db-migration-lab.yml` — manually dispatched,
  status then apply, against the real live database.
- Shared runtime mutators: none until the migration lane's `apply` dispatch, which is itself the
  sanctioned mutator for this exact class of change.
- Approved image digest: N/A — no application code changed.
- ACA runtime invariant: N/A — no code deploy triggered by this release.
- Live signed-in proof required: yes — after migration apply.

## Rollback Plan

Revert the merge commit — removes the migration file from the tracked set, but the already-
applied row (if `apply` already ran) would need a follow-up migration to remove; this matches
the same disclosed asymmetry as the original Strategy seed's rollback plan. The insert is
additive (`ON CONFLICT DO NOTHING`) — no existing row is touched, so there is no data-loss risk.

## Audit Evidence

- PR: to be recorded on open.
- Migration status/apply dispatch runs: to be recorded after dispatch.
- Live signed-in proof: to be recorded after apply.

## Known Gaps

- The other 9 non-Strategy, non-RFP canonical stages (scope, responses, evaluation, pricing,
  bafo, executive_decision, selection, transition, value) still have no authored guidebook —
  this release closes exactly one of the ten gaps the original foundation release named, not
  all of them.
- No authoring/admin UI — same disclosed simplification as the original Strategy seed; this
  content was authored directly via a migration `INSERT`.
- No per-tenant override authored for RFP — the schema/repository support one, none exists.
