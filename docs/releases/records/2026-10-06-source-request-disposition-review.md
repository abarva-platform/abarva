# 2026-10-06 Source request disposition review

## Release ID

`2026-10-06-source-request-disposition-review`

## Status

`candidate`

## Plain-English Summary

The signed-in request-review endpoint can now record an explicit accept, return, merge, or decline decision about an imported request. The decision is separate from field-mapping review and requires a named operator, the current imported version, and a stored authority readback before reporting success. It does not create an event or send a notification.

## Layer Impact

Release lane: `global-control-lane`.

The request-disposition record is an append-only intake workflow authority linked to an immutable imported request version. The Source product invokes that authority but does not create or alter canonical supplier, price, contract, or financial facts.

## Client Applicability

- All clients: the existing authenticated request-review route gains the decision branch; existing mapping review remains unchanged.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none. A missing disposition table causes an explicit refusal, not an optimistic decision.

## Changes Included

The existing Source intake review route, the request authority repository, and focused behavior tests. This release contains no new schema, data loader, email, or external integration.

## QA / Validation

Red-first tests failed before the branch existed. Focused intake and route tests passed after implementation. Removing the required-facts acceptance guard caused the negative test to fail; restoring it returned the suite to green. Typecheck, scoped lint, release control, and hosted CI results are recorded with the PR.

## Rollout Plan

Merge by PR and let the repo-owned ACA main workflow deploy an immutable image. The separately authored request-disposition table migration must be explicitly authorized and applied before a decision can succeed in a shared environment. The operator UI and signed-in decision replay remain separate work.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved from the official run after merge.
- ACA runtime invariant: web template and sole healthy 100%-traffic revision must match the approved digest.
- Worker image invariant: both required workers must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after separate schema apply and operator-control work.

## Rollback Plan

Revert the route/service commit through a PR and redeploy via the repo-owned main workflow. Do not roll back or delete an already-applied append-only authority table as part of application rollback.

## Audit Evidence

PR diff and hosted checks, local red-first and mutation test logs, official ACA run, and later exact-version database and signed-in readback.

## Known Gaps

The schema migration is not applied, the queue UI does not yet expose these decisions, and no shared-environment request disposition has been recorded or accepted signed in.
