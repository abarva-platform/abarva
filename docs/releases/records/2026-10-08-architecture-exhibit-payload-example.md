# 2026-10-08-architecture-exhibit-payload-example — Architecture exhibits generate with populated lanes

## Release ID

`2026-10-08-architecture-exhibit-payload-example`

## Status

`candidate`

## Plain-English Summary

The P3 "target state architecture" deliverable requires four architecture exhibits
(conceptual, logical, physical, and agent-orchestration). The exhibit validator keeps one of
these only when its lanes carry at least one item. But the generation prompt's own payload
*example* for those kinds showed an empty lane (`"items":[]`) — the exact shape the validator
rejects — so the model copied an empty lane and the exhibits were discarded, blocking the
deliverable with "missing exhibits." Every other payload kind's example shows populated content;
only the architecture one was empty.

This corrects the example to show a populated lane item (a string, matching the architecture lane
type), so the model produces architecture exhibits the validator keeps. Presentation/generation
guidance only — no change to the validator, the quality gate, or the deliverable contract. It also
exports the prompt's schema-hint constant so a regression test can assert no payload example ever
seeds an empty lane again.

## Layer Impact

Release lane: **global-control-lane** (shared generation behavior for all clients; not flag-gated).

- **Layer 4 (Products — deliverable generation):** the exhibit-authoring prompt example for the
  architecture kinds is corrected. Affects any deliverable whose profile requires architecture
  exhibits (today, P3 `target_state_architecture`).
- No change to Layers 1–3. No change to gate logic or evidence rules.

## Client Applicability

- All clients: yes (generation-quality fix; no flag).
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts` — fix the architecture-kind payload example
  from `"items":[]` to a populated string item; export `SYNTHESIS_SCHEMA_HINT` for testability.
- `src/lib/deliverables/orchestrator/__tests__/architecture-exhibit-example.test.ts` — new: asserts
  no payload example seeds an empty lane, and that the validator keeps a populated architecture
  exhibit while rejecting an empty-lane one.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new test file.

## QA / Validation

- New suite: 3/3 pass (prompt-example guard + validator contract both directions).
- Full typecheck: clean. eslint on touched files: clean.
- Coverage census: regenerated; no drift.
- Live verification is still owed: confirm `target_state_architecture` builds with its four
  architecture exhibits present on a P3 run once a Move reaches P3.

## Rollout Plan

Merge to main (squash); active on the next ACA main deploy. No migration, no data change, no
shared-runtime mutation beyond the standard image deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard deploy.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: must hold after deploy (template image = 100%-traffic revision = digest).
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a P3 build producing the four architecture exhibits.

## Rollback Plan

Revert the PR and redeploy. The change is a prompt-string correction plus a test; no migration or
data to unwind.

## Known Gaps

- This removes a deterministic footgun (the empty-item example). Exhibit production remains
  model-driven, so it improves but does not guarantee architecture-exhibit generation; a bounded
  regenerate/repair pass for discarded required exhibits is a separate, broader improvement.
- The related non-deterministic exhibit shortfalls on other P2 deliverables
  (`root_cause_worksheet`, `discovery_report`) are tracked separately and not addressed here.
- Live P3 proof is owed (the Move used for walkthroughs is at P2; P3 is not yet reachable without a
  human crossing the P2 gate).

## Audit Evidence

- PR URL: (to be filled on open).
- CI run: required checks on the PR.
- New test output: 3/3 as above.
