# 2026-09-22 Execution Claim Run Identity

## Release ID

`2026-09-22-execution-claim-run-identity`

## Status

`candidate`

## Plain-English Summary

Concurrent runs of one scheduled executor now have distinct ownership identities. Runs may continue in parallel on different items, but one run cannot treat a sibling run's claim as its own work to resume.

## Layer Impact

- Release lane: `internal-admin`.
- Execution control: the generated queue requires a stable per-run identity and the register authority exposes an exact ownership resolver.
- Product layers: no product or tenant-data behavior changes.

## Client Applicability

- All clients: no product behavior changes.
- Specific clients: none.
- Internal only: backlog execution coordination.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add exact per-run claim ownership resolution to the register authority.
- Update generated queue instructions to use `<base-agent>#<run-id>` and forbid cross-run adoption.
- Add behavior cases for own, sibling, legacy, and invalid identities.

## QA / Validation

- Pass: red-first run failed because the ownership resolver did not exist.
- Pass: exact identity resumes; sibling, legacy, and invalid identities fail closed.
- Pass: the existing register suite passed 27 cases and the queue suite passed 103 cases.
- Pass: mutation treating a sibling as the owner failed the behavior suite and was restored.
- Pass: release check and diff check completed before the pull request.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned ACA workflow handles the standard release path; the operational rule becomes visible on the next queue generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none.
- Approved image digest: recorded by the repo-owned deploy.
- ACA runtime invariant: required before calling the merge deployed.
- Worker image invariant: required by the repo-owned deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit through a pull request. Existing append-only claim history remains unchanged.

## Audit Evidence

- Register authority and queue generator behavior suites.
- Pull-request checks and repo-owned ACA runtime-invariant artifact.

## Known Gaps

Legacy unsuffixed claims remain readable but are never treated as the current suffixed run's own claim.
