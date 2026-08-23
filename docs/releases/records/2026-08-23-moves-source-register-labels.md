# 2026-08-23 Moves Source Register Labels

## Release ID

`2026-08-23-moves-source-register-labels`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now render Source Register evidence-family values as reader-facing labels instead of raw internal enum keys. The client-readiness scanner also blocks internal enum-pair tokens and artifact or section type keys so future sign-off catches this class before a document is accepted.

## Layer Impact

- **Layer 4 — Products / `global-control-lane`:** Updates Moves artifact rendering and client-readiness validation only. The change affects generated document presentation and sign-off validation; it does not change tenant inputs, canonical data, projections, registry state, migrations, or runtime routing.

## Client Applicability

- All clients: Applies to Moves generated deliverables and sign-off scanning.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Register renderers defensively humanize evidence-family values across DOCX, HTML, PDF, orchestrated HTML, persisted board-pack facts, and deck bridge mapping.
- Client-readiness scanner now blocks colon-separated internal enum pairs and standalone artifact or section type keys.
- Regression tests cover raw generated-artifact family inputs and scanner positive/negative cases.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — 2 suites, 77 tests passed.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow may build and deploy the resulting image. No manual data-plane action, registry activation, tenant mutation, migration, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming the runtime is current.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This is artifact rendering and sign-off validation; local unit coverage is the release proof, with runtime health/invariant after deploy.

## Rollback Plan

Revert the release commit and redeploy the previous ACA image through the repo-owned main workflow. No database rollback is required.

## Audit Evidence

- PR URL: To be added after opening the PR.
- Local validation: Focused renderer and scanner Jest suites above.
- Deployment evidence: To be captured after merge if the repo-owned workflow deploys.

## Known Gaps

- This does not rewrite or regenerate artifacts already persisted before the change. Existing documents must be regenerated or re-exported to receive the new Source Register labels.
