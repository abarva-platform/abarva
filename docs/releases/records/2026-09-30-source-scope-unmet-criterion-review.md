# 2026-09-30-source-scope-unmet-criterion-review - Unmet criterion review

## Release ID

`2026-09-30-source-scope-unmet-criterion-review`

## Status

`candidate`

## Plain-English Summary

An authorized Event Owner can record that a Scope gate criterion is not met, with an audit rationale, even when a linked Client Final is missing. This does not approve the criterion or advance the stage. The positive "met" action still requires its linked final and the existing server-side governance checks.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Source presentation only. No canonical data, intake, adapter, or database contract changes.

## Client Applicability

- All clients: Source event workspaces using stage-criterion review.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Expose the existing authenticated `not_met` criterion state with a required rationale.
- Show a recorded unmet state without counting it as a passed criterion.
- Keep the positive action unavailable when a linked Client Final is missing.
- Keep review unavailable to viewers without the existing stage-decision permission.

## QA / Validation

- Red-first mounted regression for the missing-final negative decision.
- A wrong-state payload mutation failed the exact PATCH assertion.
- Focused Source stage-approval tests, TypeScript, scoped ESLint, release check, and diff check before PR.
- Signed-in replay remains required after the official deploy.

## Rollout Plan

Squash merge a reviewed PR to main. Only the repo-owned ACA main workflow may deploy a digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from an agent session.
- Approved image digest: Record from the official workflow after deployment.
- ACA runtime invariant: Verify template digest and sole 100%-traffic revision image match.
- Worker image invariant: Verify required worker job templates match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including negative-decision persistence and blocked stage readiness.

## Rollback Plan

Revert the PR and use the repo-owned main deploy workflow. Existing criterion decisions are retained; this change is presentation-only.

## Audit Evidence

PR, CI results, official deploy run, runtime image readback, and private signed-in smoke ledger.

## Known Gaps

An unmet decision records a review but does not satisfy the gate. Missing evidence or unresolved authority still blocks stage advancement.
