# 2026-09-11-source-command-action-copy-fidelity — Source Command Action Copy Fidelity

## Release ID

`2026-09-11-source-command-action-copy-fidelity`

## Status

`candidate`

## Plain-English Summary

Source Command Center action cards and drawers now keep machine-oriented lineage tokens out of executive-facing copy. The top freshness control no longer presents a synthetic scenario date as ordinary business freshness when a stamped load-run date is unavailable.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Source workspace rendering changes labels, freshness wording, action-card evidence copy, and action drawer sections.

Layer 3 CANONICAL MODEL: No schema migration. The Source portfolio read projection now prefers human defensibility fields for the action `deterministic_basis` projection while preserving raw payload fields in citation metadata.

## Client Applicability

- All clients: Yes, for Source Command Center workspaces using the shared Source projection.
- Specific clients: None named in this public record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Command Center date control derives a `Refreshed` label from stamped load-run IDs when available.
- Scenario-only dates fall back to `Scenario date` instead of `As of`.
- Action cards humanize evidence-family values and refuse raw machine evidence-row strings.
- Action drawers use client-facing labels: `Deadline`, `Accountable`, `What backs it`, and `If ignored`.
- The Source portfolio adapter projects defensibility text from loaded opportunity rationale/concession fields before falling back to evidence grade.
- Browser-facing regression coverage prevents semicolon/colon lineage strings from rendering in the action card or drawer path.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` — pass, 18 tests.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — pass, 47 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` — pass.
- `npx tsc --noEmit --pretty false` — pass.

## Rollout Plan

Open a PR, squash merge to main, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Source runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow after merge.
- ACA runtime invariant: Must be verified after deploy before live-proven status.
- Worker image invariant: Must remain on the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Command Center action card and drawer path.

## Rollback Plan

Revert the PR and redeploy the prior approved image through the repo-owned ACA workflow. No data rollback or schema rollback is required because this release does not mutate tenant records or add migrations.

## Audit Evidence

- PR URL and merge SHA after PR creation.
- ACA deploy workflow run after merge.
- Runtime invariant output proving web template, traffic revision, and required worker jobs match the approved digest.
- Signed-in Source Command Center smoke evidence for an action card and drawer.

## Known Gaps

This change does not perform a fresh private data reload. Any refresh of governed contract-intelligence rows must run through the approved VNet-attached ACA operator job path and its layer reconciliation gates.
