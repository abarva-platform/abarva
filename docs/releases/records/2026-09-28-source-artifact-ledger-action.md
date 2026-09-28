# 2026-09-28 Source artifact ledger and review action

## Release ID

`2026-09-28-source-artifact-ledger-action`

## Status

`candidate`

## Plain-English Summary

The Source Files view could count an editing-state slot as a stored file even when no file was registered. This release counts only registered artifacts as files and makes the existing governed draft-generation action available when a required or gate-defining artifact has supporting evidence but no deliverable. A draft remains distinct from a reviewed client-final artifact and cannot itself clear the stage gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event page projection, Files lifecycle and artifact review queue.
- Layer 3 Canonical Model: No schema, authority, or commercial fact change. The registry remains the authority for stored files; canvas state remains an editing state.

## Client Applicability

- All clients: Source events using the Files and artifact review surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Label canvas artifact states and registry artifacts at the page boundary, and exclude canvas states from stored-file counts and lifecycle readiness.
- Keep both kinds available for task hydration while querying acceptance records only for registry artifact IDs.
- Offer the existing governed Generate action for required or gate-defining evidence-only rows. Optional supporting evidence remains review-only.
- Preserve the separate client-final acceptance and stage approval controls.

## QA / Validation

- Pass: red-first shell test showed two canvas slots incorrectly counted as stored/unparsed files; after the change they produce zero stored files and remain unregistered in the lifecycle.
- Pass: red-first mounted test showed a required evidence-only row had no actionable draft generation; after the change it offers Generate and keeps client-final acceptance unavailable.
- Pass: deliberate removal of the canvas-state filter failed the shell test; deliberate removal of the evidence-only Generate branch failed the mounted test. Both mutations were restored.
- Pass: a 409 generation response displays an error and leaves the artifact as evidence-only.
- Pass: 17 related suites, 172 tests, including optional supporting-evidence and stage-approval regressions.
- Pass: TypeScript `tsc --noEmit`, scoped ESLint with zero warnings, `npm run release:check`, and `git diff --check`.
- Not run: post-deployment signed-in replay; required after the exact main deployment.

## Rollout Plan

Squash merge after applicable CI and review. Use only the repo-owned ACA main deployment workflow. Verify digest-pinned web and worker images, then reload a signed-in event's Files workspace and confirm the stored-file count and review action without approving a stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert via a reviewed PR and the same main deploy workflow. No migration or data rollback is required.

## Audit Evidence

PR, applicable CI, official main deploy run, runtime readback and signed-in replay are recorded in the private execution ledger.

## Known Gaps

This does not create missing evidence, accept a client-final deliverable, approve a stage, contact suppliers, or publish an external artifact. Draft generation still depends on its existing governed context and quality checks.
