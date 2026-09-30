# 2026-09-30-source-rfp-bidder-draft-context - Bound RFP drafting inputs

## Release ID

`2026-09-30-source-rfp-bidder-draft-context`

## Status

`candidate`

## Plain-English Summary

The RFP draft generator no longer copies buyer-internal event details, prior-stage documents, evidence-room excerpts, or workflow status into bidder-facing model prompts. The post-generation workbook helper no longer adds an internal event title or closure message. Missing bidder-approved facts remain unissued in the draft. The existing final-admission disclosure check remains in place.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): Source changes how it projects governed information into an RFP draft. Canonical facts and evidence records are unchanged.

## Client Applicability

- All clients: Source RFP draft generation and quality review.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Bounded D09 model context, revised fallback prompt, and vendor-only completion wording. No schema, ingestion, or data mutation.

## QA / Validation

Red-first tests reproduced the private-context leak in section generation, fallback drafting, quality review, and completion. A deliberate reintroduction of buyer-only scope into the bounded context failed the negative test; restoring the boundary returned it to green. Local TypeScript check passed. All 15 Source generation suites passed (171 tests); adjacent generation and Client Final route suites passed (17 tests). CI and signed-in runtime results will be recorded separately.

## Rollout Plan

Squash merge to main after applicable CI and review. Only the repository-owned ACA main workflow may build and deploy the immutable image. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only.
- Approved image digest: Record after deployment.
- ACA runtime invariant: Verify web template and sole 100%-traffic revision at the same digest.
- Worker image invariant: Verify both delivery-worker jobs at the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Regenerate the same RFP draft and inspect Gate B and rendered content.

## Rollback Plan

Revert the PR through a new reviewed change and deploy through the main workflow. Keep the existing final-admission disclosure check active throughout rollback.

## Audit Evidence

Focused test output, PR checks/review, official deployment run, immutable-digest readback, and signed-in RFP replay in the private smoke ledger.

## Known Gaps

No explicit curated bidder-disclosable artifact packet is bound to this generator yet. A draft can remain incomplete and fail the quality gate; this release does not authorize external publication or legal approval.
