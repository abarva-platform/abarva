# 2026-08-23-moves-client-complete-label-polish — Client-facing labels for open-input reasons

## Release ID

`2026-08-23-moves-client-complete-label-polish`

## Status

`candidate`

## Plain-English Summary

Moves generated artifacts now render Client-to-Complete reason codes as plain-English labels instead of internal enum values. The client-readiness scanner also treats deliberate governed uncertainty markers as valid disclosure while surfacing raw workflow vocabulary for reviewer attention.

## Layer Impact

- **Layer 4 — Products / `global-control-lane`:** Updates Moves artifact generation, rendering, and client-readiness scanning. It changes generated artifact wording and validation only; it does not load, mutate, delete, or promote canonical data.

## Client Applicability

- All clients: Yes, wherever Moves generated deliverables are enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/client-complete-labels.ts`
- `src/lib/deliverables/orchestrator/prompt-builder.ts`
- `src/lib/deliverables/orchestrator/renderers.tsx`
- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/shared/client-readiness-scan.ts`
- `src/lib/deliverables/shared/client-readiness-gate.ts`
- Associated focused tests.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — pass, 69/69.
- Full lint, typecheck, release gate, PR checks, deploy proof, and signed-in proof are required before marking released.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the resulting image. No manual Azure command, data-plane load, migration, registry activation, or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Standard workflow invariant applies.
- Feature/env flag update path: None.
- Live signed-in proof required: Generated artifacts should show plain-English Client-to-Complete reason labels rather than internal enum values.

## Rollback Plan

Revert the PR and let the repo-owned ACA deploy workflow roll forward to the reverted image. No data rollback is needed because this release changes generated wording and scan rules only.

## Audit Evidence

- PR URL: pending.
- CI/check run: pending.
- ACA deploy run: pending.
- Signed-in proof bundle: pending.

## Known Gaps

- This does not change the stored internal reason enum values used for workflow routing.
- This does not mutate existing signed-off artifacts; it affects newly rendered/generated artifacts and scanner behavior going forward.
