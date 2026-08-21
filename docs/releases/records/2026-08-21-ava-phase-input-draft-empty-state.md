# 2026-08-21-ava-phase-input-draft-empty-state — aVa Phase Input Draft Empty State

## Release ID

`2026-08-21-ava-phase-input-draft-empty-state`

## Status

`candidate`

## Plain-English Summary

When a phase already has current input values, the aVa draft action now says there is nothing empty to draft instead of implying that upstream source context is missing. This keeps the governed drafting helper honest in complete phases while preserving the existing cited-source refusal for genuinely empty phases with no approved upstream state.

## Layer Impact

Layer 4 Products only. The change affects Moves aVa response wording and the read-only phase-input draft endpoint. It does not change intake templates, adapters, canonical data, projections, persistence rules, gates, or data-plane state.

## Client Applicability

- All clients: Moves phase pages using the aVa phase-input draft helper.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Adds a shared phase-input draft refusal helper that distinguishes complete-current-state from missing-upstream-source cases.
- Wires the helper into the streamed aVa chat path and the read-only phase-input draft endpoint.
- Adds unit coverage for complete-phase and missing-source no-proposal states.

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/__tests__/phase-input-draft-proposals.test.ts src/lib/programs/ava-chat/__tests__/packet.test.ts --runInBand` passed.
- Typecheck, focused ESLint, release control, and staged secret scan must pass before merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Yes, approved for this session.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, repeat the phase-input draft helper check after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL, merge SHA, CI checks, deploy run, runtime invariant proof, and signed-in browser proof to be attached after release.

## Known Gaps

This does not add new drafting sources or save any generated text. It only corrects the no-proposal response when current phase inputs are already populated.
