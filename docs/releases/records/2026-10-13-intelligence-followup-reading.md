# 2026-10-13-intelligence-followup-reading — Complete decision follow-ups

## Release ID

`2026-10-13-intelligence-followup-reading`

## Status

`candidate`

## Plain-English Summary

Short decision questions can require several conditions, even when the question has few words. The reading view now gives eligibility, baseline, measurement, accountability, sourcing and boundary questions up to 300 words so their actual answer is visible. Simple status and owner questions retain the 100-word default. Explicit requested word limits take precedence.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Intelligence reading-budget selection. Source intake, adapters and the canonical model are unaffected.

## Client Applicability

- All clients: Model-authored Intelligence responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing model-authored answer path.

## Changes Included

- `src/lib/intelligence/answer/compact-reading-view.ts`: Classify decision detail independently of question length.
- Existing helper tests: Preserve the complete eligibility conditions, cover short decision questions and verify simple and explicit word limits.

## QA / Validation

- A live follow-up exposed an introduction-only reading view when a complete conditions list exceeded the simple-question budget.
- Pass: 16 focused tests across three helper, reading-view and dock suites; scoped lint and whitespace checks; typecheck; all 11 release checks.
- Protected CI, approved ACA deployment, runtime image parity and signed-in acceptance are required before claiming live proof.

## Rollout Plan

Squash merge the reviewed PR to main, then deploy through the repository-owned ACA workflow. Verify the serving runtime and repeat the bounded question set plus the affected follow-up.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Only that main workflow.
- Approved image digest: Resolved by the approved workflow for the merged main SHA.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest and pass health checks.
- Worker image invariant: Both required workers must match that digest.
- Feature/env flag update path: No flag or environment mutation in this release.
- Live signed-in proof required: Intelligence concise content and clicked follow-up under an authenticated client session.

## Rollback Plan

Revert the reading-budget change through a reviewed PR and deploy the resulting main SHA through the same ACA workflow. No data migration is involved.

## Audit Evidence

PR diff, focused test output, protected CI, ACA workflow evidence, independent runtime invariant and private signed-in screenshots/DOM observations.

## Known Gaps

The concise view is an excerpt of the complete authored answer. It does not generate a replacement summary or establish the truth of business assumptions. Model response latency remains variable.
