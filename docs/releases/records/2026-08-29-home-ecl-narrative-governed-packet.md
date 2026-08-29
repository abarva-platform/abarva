# 2026-08-29-home-ecl-narrative-governed-packet — Governed Home ECL Narrative Packet

## Release ID

`2026-08-29-home-ecl-narrative-governed-packet`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home ECL narrative writer so executive narrative generation receives only governed, agent-ready candidate facts. Candidate rows that fail readiness policy are excluded from the model payload and summarized only as readiness gaps.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Home narrative generation now routes ECL projection rows through the governed agent-context bundle before building the executive signal packet.

Layer 3 Canonical Model: No canonical schema or data changes.

Layer 2 Source Adapters: No adapter changes.

Layer 1 Client Intake: No intake workbook or source-room changes.

## Client Applicability

- All clients: Applies to Home ECL narrative generation once the operator job uses this image.
- Specific clients: None.
- Internal only: Operator proof metadata is written for audit and troubleshooting.
- Public/demo only: None.
- Feature flag: Existing Home provider behavior is unchanged by this script-only candidate.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `git diff --check` — passed.
- TSX import smoke reached the expected `DATABASE_URL` guard, confirming runtime imports resolve in the shared dependency environment.

## Rollout Plan

Merge through a pull request. The behavior becomes active for governed Home narrative builds when the ACA data-build/operator job runs from an image containing this commit. No data-plane mutation is performed by merge alone.

## Deployment Authority

- Repo-owned deploy workflow: Required only if this candidate is promoted into the shared ACA image before operator use.
- Shared runtime mutators: None in this change.
- Approved image digest: To be supplied by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required before claiming any live runtime effect.
- Worker image invariant: Required before running the operator job from the new image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a narrative rebuild and product-route verification.

## Rollback Plan

Revert the merge commit or run the Home narrative job from the previous approved image. Because this change does not mutate data by itself, rollback is code/image-only unless a later operator run has written new narrative rows.

## Audit Evidence

- Local focused proof: `npm run test:ecl-home-narrative-layer`
- Local whitespace proof: `git diff --check`
- Operator readback remains required after any write run.

## Known Gaps

No live narrative rebuild or signed-in browser proof is claimed by this candidate. Those require an approved operator run, independent readback, and Home browser verification.
