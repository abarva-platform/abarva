# Source RFP Design Grounding

## Release ID

`2026-09-09-source-rfp-design-grounding`

## Status

`candidate`

## Plain-English Summary

Source aVa now answers questions about an event's RFP requirements, normalized response structure, and scoring evidence from the accepted RFP and response-control artifacts. RFP-design questions no longer fall through to downstream vendor-response coverage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 — Client intake: no change.
- Layer 2 — Source adapters: no change.
- Layer 3 — Canonical model: no change.
- Layer 4 — Products: Source gains a read-only, governed RFP-design answer path and a more specific intent-routing order.

## Client Applicability

- All clients: yes, when a Source event has accepted RFP and response-control artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source analytics and aVa availability controls apply.

## Changes Included

- Added deterministic extraction of accepted requirement counts, requirement taxonomy, normalized response dispositions, and scoring/evidence fields.
- Added a fail-closed response when either accepted artifact is missing, unreadable, policy-blocked, or internally inconsistent.
- Routed RFP-design intent before vendor-response coverage intent.
- Added focused parser, governance, failure-state, and routing-precedence tests.

## QA / Validation

- Focused RFP-design tests: passed.
- Source aVa route-precedence tests: passed.
- Adjacent selection and composite-summary tests: passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed with an 8 GB Node heap.
- `git diff --check`: passed.
- Live signed-in proof is required after the exact merged SHA deploys.

## Rollout Plan

Merge through a pull request. Allow the repository-owned ACA main deploy workflow to build and deploy the exact merge SHA, then repeat the RFP-stage question in a signed-in Source event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository workflow only.
- Approved image digest: record after deploy.
- ACA runtime invariant: template, active 100% traffic revision, and required workers must match the approved digest.
- Worker image invariant: verify after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; answer must describe accepted RFP controls and must not lead with downstream vendor-response coverage.

## Rollback Plan

Revert the merge through a pull request and allow the main deploy workflow to restore the prior intent order and runtime image. No data or schema rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment run, revision, image digest, and traffic/runtime invariant readback.
- Signed-in exact-question response and rendered structured evidence table.

## Known Gaps

- This answer describes the accepted RFP design; it does not validate vendor response truth or recalculate an award.
- Historical stage-readiness presentation is a separate product-state issue.
