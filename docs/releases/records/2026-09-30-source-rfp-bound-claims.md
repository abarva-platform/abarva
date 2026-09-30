# 2026-09-30 Source RFP Bound Claims

## Release ID

`2026-09-30-source-rfp-bound-claims`

## Status

`candidate`

## Plain-English Summary

The RFP draft quality review now identifies service targets, quantified commercial claims, and regulated-data obligations that are absent from the vendor-facing context provided to the generator. These claims remain in a reviewable draft, but they cannot receive a passing quality receipt merely because a model reviewer overlooked them. Pending or rejected source terms do not count as support.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: tightens the generated RFP draft quality decision. It does not write canonical facts, change evidence authority, or issue a package externally.

## Client Applicability

- All clients: applies to newly reviewed D09 RFP drafts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- D09-specific deterministic checks in the existing quality-review helper and adjacent behavior tests.
- No migration, data load, supplier delivery, or approval-rule change.

## QA / Validation

- Before: the focused test for unbound 99.9% availability, 30-minute response, and a regulated-data obligation received zero violations; 1 test failed and 30 passed.
- After: the adjacent generation group passed 15 suites / 176 tests, including a positive approved-term case and a negative pending-term case. A mixed-line 100% response-completeness plus 12% commercial-target case failed before the whitelist correction and passed after it. Removing D09 from the gate deliberately made the unbound-obligation test fail again.
- Typecheck, lint, release check, applicable CI, and signed-in post-deploy replay are recorded when completed; they are not claimed by this candidate record.

## Rollout Plan

Squash-merge after applicable validation. The repo-owned ACA main workflow builds and deploys the resulting main image. Re-run a signed-in D09 draft and inspect its saved quality receipt; no traffic or worker changes are made manually.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: verify web template, 100%-traffic revision, and both delivery-worker jobs on the same immutable digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: generate and read back a D09 draft and quality receipt.

## Rollback Plan

Revert through a new reviewed PR and the repo-owned main deploy workflow. No schema or tenant-data rollback is needed.

## Audit Evidence

- Adjacent red/green and deliberate gate-removal mutation in the PR test output.
- PR checks, merge SHA, ACA run and signed-in replay will be linked after completion.

## Known Gaps

The check is a claim-quality backstop, not a complete vendor-release packet or Legal approval. It does not create missing vendor-disclosable facts, a recipient snapshot, or supplier delivery receipts.
