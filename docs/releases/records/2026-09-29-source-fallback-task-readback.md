# 2026-09-29 Source Fallback Task Readback

## Release ID

`2026-09-29-source-fallback-task-readback`

## Status

`candidate`

## Plain-English Summary

Source now reflects persisted step evidence even when an event has no value lever from which to build a live analytics view. A validated ticket-history receipt can complete its own Scope step after reload; an unrelated or unvalidated receipt cannot.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: unchanged. The existing fact and evidence readers remain the authority.
- Layer 4 Source: the fallback canvas derives step readiness from those already-read records. No data, schema, gate rule, or tenant access policy changes.

## Client Applicability

- All clients: enabled Source event canvas users.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source analytics access only; no new flag.

## Changes Included

- Pass the route's already-read fact inputs, artifact metadata, and verified delegation state to fallback step hydration.
- Hydrate fallback tasks from effective evidence states before constructing the Source shell. The existing live-view hydration path is unchanged.
- Add mounted positive and negative tests for the no-value-lever Scope path.
- Regenerate the audited Source canvas import-closure count for the new readback import; no covered or remainder paths change.
- No migration, data build, notification, supplier action, or approval action.

## QA / Validation

- Pass: red-first mounted test showed a validated ticket receipt still rendered as missing when the stage view was absent.
- Pass: severing the fallback evidence binding made that test fail again; restored binding passes. Unrelated and unvalidated receipts stay locked.
- Pass: 22 adjacent Source canvas, shell, and fact-view suites (225 tests); scoped ESLint; canonical `npm run typecheck`; `git diff --check`.
- Pass: the first PR CI head passed 36 checks but failed its behavior-coverage measurement (committed canvas import closure 435, measured 436). The documented generator changed only that count; the focused guard passes 21/21 with and without regeneration.
- Not run: rerun PR CI, post-merge runtime proof, and signed-in production replay.

## Rollout Plan

Squash merge after applicable PR CI and review. Only the repository-owned ACA main workflow may build and deploy the merge SHA. Verify the digest-pinned web template, 100%-traffic revision, and required worker images before signed-in replay. No migration or operator data job is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: required delivery jobs must match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: reload the same synthetic Scope event, inspect the ticket step's typed-fact readback, and exercise Continue. Do not infer stage exit from the code change.

## Rollback Plan

Revert this release in a new PR and redeploy through the repository-owned main workflow. Existing cited facts and evidence remain untouched. No database rollback is needed.

## Audit Evidence

The PR, CI, official deploy, immutable runtime readback, and signed-in replay are recorded in the private execution ledger. This public record contains no tenant fixture or private screenshot.

## Known Gaps

- Other Scope evidence and approvals remain independently required. This change proves only the per-step readback, not the Scope gate.
- The no-value-lever canvas still contains clearly marked sample analytics; those values are not canonical facts or a finance baseline.
