# 2026-09-26-source-stage07-scorecard-write — Human scorecard authority

## Release ID

`2026-09-26-source-stage07-scorecard-write`

## Status

`candidate`

## Plain-English Summary

Authorized Source reviewers can now create and correct draft evaluation criteria, approve exact criterion versions after weights total 100%, enter human scores for accepted event suppliers, and lock only their own scores after the evidence artifact resolves to a current approved file for the same event and tenant. The existing authority readback remains blocked until its required facts are complete. This does not rank suppliers, send BAFOs, advance an event, or approve an award.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: Writes the existing tenant- and event-bound scorecard authority tables; no supplier master, contract, pricing, or financial fact is inferred or changed.
- Layer 4 Source: Adds human controls and scoped route actions to the existing Stage 07 authority view.

## Client Applicability

- All clients: Available only to signed-in users with event-scoped Source stage-approval authority when the event is at Evaluation or BAFO.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds draft criterion creation/correction/retirement, exact-version approval, named evaluator score save, and evaluator-only score lock to the scorecard authority route and repository.
- Adds a compact Stage 07 operator form, conditional controls, and distinct evaluator row identity.
- Uses the existing scorecard authority schema. The schema was separately applied through the repo-owned database migration workflow; this PR contains no migration or data backfill.

## QA / Validation

- Pass: Red-first route, repository, projection, and mounted-workspace behavior tests.
- Pass: Mutation tests caught removal of the Evaluation stage fence and approved-criterion scoring check; both mutations were restored.
- Pass: Focused Jest tests, TypeScript no-emit, scoped ESLint, and release control before PR.
- Not run: Live Stage 07 positive write/readback. No human evaluator score or approval is manufactured for acceptance.
- Blocked: The frozen synthetic journey remains at the genuine Scope evidence gate, so its Stage 07 acceptance cannot be asserted from this release.

## Rollout Plan

Squash merge after applicable CI and review. The repo-owned ACA main workflow is the only shared-web deploy path. Verify the pinned image and serving revision, then inspect the signed-in Stage 07 presentation on an eligible synthetic event without fabricating evaluator decisions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on `main`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: To be recorded after the workflow.
- ACA runtime invariant: Web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: Both required delivery workers must match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; read-only control visibility and blocked frozen-event replay are separate from a positive human score write/readback.

## Rollback Plan

Revert the PR through a controlled release and let the main workflow deploy the revert. Existing approved criteria and locked scores remain immutable; do not delete or rewrite them as an application rollback. The separately applied schema remains in place pending an independent database change decision.

## Audit Evidence

PR, CI run, official ACA main deploy run, digest/runtime readback, focused test output, and private signed-in smoke ledger entry.

## Known Gaps

Positive live scoring requires a real named evaluator and governed response evidence. Criterion version replacement after approval, ranking, BAFO and award actions are outside this slice.
