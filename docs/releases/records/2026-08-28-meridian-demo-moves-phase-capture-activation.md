# 2026-08-28-meridian-demo-moves-phase-capture-activation — Moves Phase Workspace Activation

## Release ID

`2026-08-28-meridian-demo-moves-phase-capture-activation`

## Status

`candidate`

## Plain-English Summary

The governed Moves activation package now writes the persisted phase-workspace input rows that the Moves detail pages already read. The portfolio page can show activated Moves, and each opened Move can now carry source-backed phase notes instead of showing an empty input state.

## Layer Impact

Release lanes: `public-demo`, `client-data-lane`.

Layer 4 products: updates the Moves activation package used to populate the existing Moves product tables.

Layer 2 source adapters: derives phase-workspace values from the same governed activation inputs already used for the demo Moves portfolio. It does not introduce a new source of truth.

## Client Applicability

- All clients: no
- Specific clients: Meridian/PHS demo lane
- Internal only: no
- Public/demo only: yes
- Feature flag: existing governed data-plane path

## Changes Included

- `scripts/ecl/write_meridian_phs_moves_activation_plan.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-plan-tests.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation` passed.
- `npm run test:ecl-meridian-phs-moves-activation-execute` passed.
- The generated package remains idempotent primary-key upserts only.
- The package still records projected value as pending and does not create claimable value.

## Rollout Plan

Merge through PR, deploy the web image through the repo-owned ACA main deploy workflow, then run the governed ACA operator job for the Meridian/PHS Moves activation package. Verify the signed-in Moves portfolio and a representative Moves phase page.

## Deployment Authority

- Repo-owned deploy workflow: required for web image rollout
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: governed operator job image is digest-pinned
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR and redeploy the previous web image. The activation SQL uses stable primary-key upserts; the prior package can be rerun if the phase-capture rows need to return to the previous shape.

## Audit Evidence

- Local activation plan test output.
- Local activation execute test output.
- Governed ACA job logs after merge.
- Signed-in browser screenshot for `/strategic-moves` and a representative `/strategic-moves/<id>/phase/<n>` page.

## Known Gaps

This release populates phase-workspace input rows for demo continuity. It does not create finance-attested value, approve phase gates, or replace Tower evidence rules.
