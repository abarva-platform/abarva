# 2026-09-27-source-progressive-step-gates - Progressive Source step gates

## Release ID

`2026-09-27-source-progressive-step-gates`

## Status

`candidate`

## Plain-English Summary

The Source workflow presents the evidence request for the active step and reveals Continue only when that step is complete. At the stage boundary, approval stays out of sight while required evidence or artifact review remains open. A short decision rationale remains editable, but Approve appears only when it meets the server's minimum and any required owner acknowledgement is complete.

## Layer Impact

`global-control-lane`, Layer 4 Products: changes Source workflow and approval presentation only. Canonical facts, evidence state, server authorization, and approval persistence remain owned by their existing contracts.

## Client Applicability

- All clients: Source New users on the shared product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Active-step evidence presentation and readiness-controlled progression.
- Stage-boundary evidence and artifact readiness presentation, including direct navigation to Approvals.
- Request and stage approval action visibility aligned with the existing server rationale and acknowledgement checks.
- Behavioral regression tests for incomplete steps, evidence gaps, and short rationales.

## QA / Validation

- Pass: red-first behavior tests failed on the original visible disabled actions and end-of-stage evidence listing.
- Pass: deliberate mutations reopening Continue and ignoring required evidence both failed their focused tests; guarded code restored.
- Pass: `npx jest src/components/source --runInBand --silent` (90 suites, 611 tests).
- Pass: scoped ESLint and `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Not run: signed-in acceptance of this change, pending main deployment.

## Rollout Plan

Squash merge the reviewed PR, then allow only the repo-owned ACA main deploy workflow to build and deploy the exact main SHA. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned template, healthy 100%-traffic revision, and delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Request approval and active-stage step/evidence visibility without recording a human decision.

## Rollback Plan

Revert the PR through the protected main branch and let the same repo-owned workflow deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

PR review and CI, local test output, official deploy run, ACA digest readback, and signed-in smoke ledger entry.

## Known Gaps

The UI change does not assert that any specific live event has received its required evidence or approval. Those are separate data and signed-in acceptance checks.
