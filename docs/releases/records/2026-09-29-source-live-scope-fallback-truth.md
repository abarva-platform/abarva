# 2026-09-29 Source Live Scope Fallback Truth

## Release ID

`2026-09-29-source-live-scope-fallback-truth`

## Status

`candidate`

## Plain-English Summary

When an event lacks computed value analytics, its Scope checklist no longer presents exemplar inventory counts, prefilled decisions, or a sample attachment as live event evidence. The real required inventory step and validated evidence readbacks remain available.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: unchanged.
- Layer 4 Source: the persisted-event fallback now starts unproven Scope tasks open and shows only governed event evidence as completed. Explicit exemplar previews remain unchanged.

## Client Applicability

- All clients: Source events using the no-value-lever Scope fallback.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event access only; no new flag.

## Changes Included

- Remove the duplicate, unbound sample inventory confirmation from the live fallback.
- Clear exemplar task completion, row values, file attachments, named provenance, and unsupported analytical points before event evidence hydration.
- Retain the existing validated ticket-history receipt path and the explicit sample-stage preview behavior.
- No schema, canonical fact, gate policy, approval, supplier action, or shared-runtime setting changes.

## QA / Validation

- Pass: red-first mounted test reproduced the pre-completed inventory control on an event without a computed stage view.
- Pass: removing the duplicate-task filter, restoring sample completion, and restoring the sample attachment each made the focused test fail; the restored behavior passes.
- Pass: five adjacent Source canvas and shell suites, 101 tests; canvas import-closure guard, 21 tests; canonical `npm run typecheck`; scoped ESLint; `npm run release:check`; `git diff --check`.
- Not run: PR CI/review, official deploy/runtime and signed-in replay.

## Rollout Plan

Squash merge only after applicable PR CI and review. The repository-owned ACA main workflow deploys the merge SHA. Verify the digest-pinned web template, 100%-traffic revision and required worker images, then reload a signed-in event with no computed value levers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: required delivery jobs must match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: no exemplar inventory counts, sample file, or pre-completed Scope confirmation; the validated ticket step must stay complete.

## Rollback Plan

Revert in a new PR and redeploy only through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

The private execution ledger records CI, deployment and signed-in acceptance separately. This public record contains no tenant fixture or private file.

## Known Gaps

- This is a truthfulness repair, not a Scope stage exit. The operational inventory, other required evidence, Client Finals and gate criteria remain independent controls.
- The current application-inventory typed template emphasizes per-application financial fields; an operational-service inventory path without unsupported cost claims is not provided by this release.
