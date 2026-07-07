# 2026-06-14-moves-deliverable-consistency-and-leak-guardrail — Close the Moves deliverable raw-id-leak + count-divergence classes, with a CI guardrail

## Release ID

`2026-06-14-moves-deliverable-consistency-and-leak-guardrail`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor IROPS walkthrough kept surfacing the same two *classes* of bug in the Moves module, one instance at a time. Two parallel audits found the complete sets, and this change fixes both classes at the source and adds CI guardrails so they cannot regress (the bugs become failing tests instead of things a human catches in a live demo).

**Class 1 — internal identifiers leaking into client-visible text.** The grounded-answer engine (`answerGrounded`, served on the Nexus current-state Q&A) rendered raw evidence-family keys (`eng_performance_dora`, `it_systems_landscape`, `it_org_structure`, `stakeholder_map`, and the hard-gap list) directly in answer text. These now resolve to the curated human label (e.g. "IT systems & application landscape") via the readiness instrument label, falling back to the deterministic source-label humanizer. The machine envelope (`citations` / `missingEvidence`) keeps the raw keys for traceability — only the human-facing answer text is humanized. (The prior three PRs — #3469/#3492/#3496 — already cleaned the deliverable card, readiness panel, narrative bodies, and persisted DOCX; the audit confirmed those are the only remaining unhumanized client-visible site is the grounded answer text. Operator-only admin context-layer pages that show chunk UUIDs are deliberately out of scope.)

**Class 2 — the same deliverables counted/listed from divergent sources.** The phase workspace showed "ARTIFACTS — 0" while the File Cabinet showed "DELIVERABLES · 1" for the same generated charter. Root cause: three surfaces used three different phase→deliverable-key conventions — a brittle `p{n}_` string prefix (workspace), the single `PHASE_WORKFLOW[n].deliverableTypeKey` gate key, and the registry's full `PHASE_CANONICAL_KEYS[n]` set (Documents panel) — and these disagreed badly at P3/P4 (which have several canonical deliverables, not one). The phase workspace count + list now use the registry's `PHASE_CANONICAL_KEYS` via a single shared, unit-tested helper `deliverableBelongsToPhase`, so the workspace, the Documents panel, and the File Cabinet agree.

## Layer Impact

- `global-control-lane`: shared Moves grounded-answer rendering and phase deliverable counting for all tenants. Pure display/heuristic changes (`archetype-context-bundle.ts` answer text, `StrategicMovePhaseClient.tsx` count/list filters, new `phase-deliverables.ts` helper). No schema/data/auth/migration change.

## Client Applicability

- All clients: Yes — anyone using Nexus grounded answers or viewing a Move phase workspace.
- Feature flag: None — correctness fix.

## Changes Included

- `src/lib/programs/archetype-context-bundle.ts` — new `familyLabel(b, key)`; humanize all five family-key renders in `answerGrounded` text; envelopes unchanged (machine-raw).
- `src/lib/programs/phase-deliverables.ts` (new) — `deliverableBelongsToPhase(typeKey, phaseNum, canonicalKeys)`; the single phase-membership predicate.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — phase artifact count + list now use `deliverableBelongsToPhase(..., PHASE_CANONICAL_KEYS[phaseNum])` (replaces the brittle `p{n}_` filter at all three sites).
- Tests / guardrails: `__tests__/phase-deliverables.test.ts` (new — canonical-list + back-compat + regression), `__tests__/archetype-context-bundle.test.ts` (new GUARDRAIL describe: no internal id/snake_case key in any answer text, refusal branches use labels).

## QA / Validation

- Unit + guardrail tests: **pass** — `npx jest phase-deliverables archetype-context-bundle deliverable-quality deliverable-narrative-bundle` → 4 suites, 35 tests. The new grounded-answer GUARDRAIL fails on any raw `tower_*`/`document_extract:`/`method:`/`archetype:` tag or bare `snake_case` family key in answer text.
- ESLint on changed files: **pass** (clean).
- `tsc --noEmit`: **pass** — no errors in the touched modules.
- Live state verification on `app.abarva.ai` (ACA prod): **partial/not-run** — the prior leak fixes are already verified live-clean (visible_tower:false on the readiness panel + card); the grounded-answer + count changes here verify once the next CD build ships. Verify by asking Nexus a current-state question (no snake_case keys in the answer) and confirming the P1 workspace artifact count matches the File Cabinet.

## Rollout Plan

Merge to main (squash). Reaches production (`app.abarva.ai`, served by the Azure Container App — see project_azure_aca_runtime memory; NOT Vercel) via the normal `main` CD pipeline (`rc-<sha>` revisions). No manual prod deploy from this change while the ACA revision/traffic-ownership loop is being stabilized.

## Rollback Plan

Pure display/heuristic change, no migration. Revert the squash commit and let CD redeploy.

## Audit Evidence

Two read-only audits drove this change: a raw-internal-id leak sweep across every Moves/Source deliverable, readiness, and agent render surface (result: the grounded-answer family keys were the only remaining unhumanized client-visible site; the card/panel/narrative/persist paths are confirmed humanized by #3469/#3492/#3496), and a deliverable count/list read-model sweep (result: three divergent phase→key conventions, consolidated to `PHASE_CANONICAL_KEYS`). The PR diff is the audit surface; the new guardrail test is the standing evidence that the leak class is gated in CI. PR URL + CI run are the linked evidence.

## Known Gaps

- Deeper data-layer divergence remains as a separate, larger item (flagged by the audit, NOT in this PR): `move_artifacts.artifact_type` ("program_charter") vs `deliverables_v2.deliverable_type_key` ("charter") use different naming, and `move.deliverables` (workspace) vs `/api/.../artifacts` (File Cabinet) are different sources. This change makes the *user-visible counts agree*; unifying the underlying tables/naming needs a migration + live-DB verification and is tracked separately.
- Admin context-layer pages render raw `chunk_id` UUIDs to operators — operator-only surface, intentionally out of scope.
