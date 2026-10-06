# 2026-09-28-source-request-acceptance-boundary — Separate Request Acceptance From Strategy Promotion

## Release ID

`2026-09-28-source-request-acceptance-boundary`

## Status

`candidate`

## Plain-English Summary

The initial Request decision now opens the Strategy workspace on the standard journey. It no longer claims that a Strategy memo has been reviewed before that memo can be prepared. Leaving Strategy remains a separate governed gate requiring its own evidence and confirmations. The existing tenant-opted Strategy-at-P0 path is unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: No canonical fact or schema change. The existing version-bound Request approval receipt and event lifecycle write are reused.
- Layer 4: Source approval submits a Request-specific confirmation, and the approval route distinguishes intake acceptance from stage promotion.

## Client Applicability

- All clients: Standard Source New journey when the event is awaiting its initial Request acceptance.
- Specific clients: Tenant-opted Strategy-at-P0 behavior is preserved.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `source_strategy_at_p0` opt-in selects the older combined decision path; no flag changes.

## Changes Included

- Request approval card sends `requestFactsReviewed` for standard intake decisions, without attesting to Strategy memo review.
- Approval route validates the current Request version and explicit confirmation, records the decision, activates the event on Strategy, and queues that stage's draft work without promoting past its gate.
- The intake receipt has no stage-gate key, so it cannot be read as an already-cleared Strategy gate. A previously accepted Request version also prevents a returned Strategy decision from being treated as fresh intake.
- The approval page shows Strategy confirmations for that returned decision instead of offering another Request attestation.
- Activity and notification wording identify the Request decision. No recipient policy change.

## QA / Validation

- Fail before fix: focused mounted/route suite had four relevant failures, including a pending Strategy memo blocking initial Request acceptance.
- Pass after fix: 5 focused suites, 99 tests passed. The standard Request acceptance leaves Strategy unadvanced; missing Request confirmation and stale authority version still fail closed; a returned Strategy decision stays on its own gate; tenant-opted Strategy-at-P0 remains unchanged.
- Mutation: forcing the Request-only branch off made the pending-memo positive case fail 409; removing the Request confirmation key made the negative case fail on the wrong missing keys. Both mutations were restored before validation.
- `npm run typecheck`: Pass on Node 24.
- Scoped ESLint for changed source and tests: Pass.
- `npm run release:check`: Pass.
- PR CI and signed-in replay: Not run at candidate creation; recorded separately before release.

## Rollout Plan

Squash-merge after applicable checks and review. Only the repo-owned ACA main workflow may deploy the resulting digest-pinned image. No migration, data build, feature-flag update or traffic command is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from this branch.
- Approved image digest: To be read from the official successful deploy.
- ACA runtime invariant: Verify the web template and sole 100%-traffic revision use that digest and are Healthy/Running.
- Worker image invariant: Verify both delivery jobs use the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, replay the initial Request acceptance and then separately verify that Strategy remains gated.

## Rollback Plan

Revert the PR through the normal main workflow if the Request decision path regresses. Already-recorded approval decisions remain auditable; do not rewrite them or roll back tenant data from an agent session.

## Audit Evidence

Focused test output, mutation runs, PR/CI record, exact ACA workflow run and digest invariant, plus the private signed-in smoke ledger for the synthetic event.

## Known Gaps

End-to-end stage completion, external release, supplier interaction, award and contract execution are not established by this correction.
