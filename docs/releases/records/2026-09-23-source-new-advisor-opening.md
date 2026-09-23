# 2026-09-23-source-new-advisor-opening - Neutral advisor opening

## Release ID

`2026-09-23-source-new-advisor-opening`

## Status

`candidate`

## Plain-English Summary

The default Source New advisor opening now describes a sourcing event without
assuming it is an IT request. It matches the already-neutral five-fact form.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source presentation only. No intake, adapter, or canonical-model change.

## Client Applicability

- All clients using default manual Source New intake.
- No client-specific or private-data change.
- No feature flag.

## Changes Included

- Correct the default advisor quote shown beside the manual intake.
- Add a rendered component assertion covering the quote and the existing form.
- Preserve imported-request quotes, five-fact readiness, and event-creation gates.

## QA / Validation

- The CI-run rendered component test failed before the quote change and passed
  after it; the former IT wording is explicitly rejected.
- Scoped lint, Node 24 typecheck, and release check run before PR.
- Signed-in verification is required after deployment.

## Rollout Plan

Squash merge after applicable checks pass, deploy only through the repo-owned
ACA main workflow, prove digest alignment, and replay the default intake.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators outside that workflow: none.
- Approved image digest and ACA/worker invariant: pending deployment.

## Rollback Plan

Revert through a PR and redeploy through the same repo-owned workflow. No data
rollback is needed.

## Audit Evidence

- PR, hosted CI, deploy digest, and signed-in quote readback are distinct gates.

## Known Gaps

This copy fix does not import a request, complete classification, or advance a
sourcing event.
