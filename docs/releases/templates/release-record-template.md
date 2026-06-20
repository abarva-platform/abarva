# <Release ID> — <Short Title>

## Release ID

`YYYY-MM-DD-short-name`

## Status

`draft | candidate | released | rolled-back`

## Plain-English Summary

Explain the change in ordinary English. A pilot buyer, auditor, or operator should understand what changed without reading the diff.

## Layer Impact

List the affected layer(s), using the policy vocabulary. Explain the impact of each layer in one or two sentences.

## Client Applicability

State exactly who receives the change.

- All clients:
- Specific clients:
- Internal only:
- Public/demo only:
- Feature flag:

## Changes Included

List the PRs, commits, migrations, routes, scripts, or docs that materially changed.

## QA / Validation

List validation performed and the result. Include commands, CI checks, smoke tests, evals, and any manual verification.

## Rollout Plan

Describe how this becomes active: merge to main, Azure Container Apps image build/deploy, Azure control-lane deploy, migration apply, feature flag, manual runbook, or no runtime rollout.

## Deployment Authority

Required when the release can affect Azure Container Apps, deploy workflows, runtime images, feature flags, environment variables, worker jobs, traffic, DNS, or client/product environment promotion.

- Repo-owned deploy workflow:
- Shared runtime mutators:
- Approved image digest:
- ACA runtime invariant:
- Worker image invariant:
- Feature/env flag update path:
- Live signed-in proof required:

## Rollback Plan

Describe the fastest safe rollback path. Include migration rollback constraints if applicable.

## Audit Evidence

List evidence an auditor should inspect: PR URL, CI run, deployment URL, smoke output, screenshots, logs, migration replay, eval report.

## Known Gaps

State what is still open or explicitly out of scope. If none, say `None known`.
