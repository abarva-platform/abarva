# 2026-10-01 - Source candidate acceptance return path

## Release ID

`2026-10-01-source-candidate-relative-redirect`

## Status

`candidate`

## Plain-English Summary

After a procurement reviewer accepts a candidate onto a Source event panel, the browser now returns to the event workspace on the same public host. The return path no longer inherits an internal proxy host from the server request URL.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source workflow presentation: changes only the successful form response location. Candidate identity, acceptance authority, tenancy, and Layer 3 facts are unchanged.

## Client Applicability

- All clients: Source New candidate-panel acceptance.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Use a relative, event-scoped return location after successful acceptance.
- Test the response when the server sees an internal proxy URL.

## QA / Validation

- The new route regression failed before the fix and passed after it.
- Restoring the absolute internal-host redirect as a mutation failed the regression.
- Focused and adjacent tests, TypeScript, ESLint, release validation, applicable CI, and signed-in post-deploy replay are recorded in the PR and private smoke ledger as completed.

## Rollout Plan

Squash merge after applicable CI and release through the repo-owned ACA main deploy workflow. No schema migration, data build, candidate mutation, supplier contact, or traffic command outside that workflow is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after the workflow succeeds.
- ACA runtime invariant: Verify the web template and sole 100%-traffic revision use the approved digest.
- Worker image invariant: Verify both required worker jobs use the same approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; accept a synthetic internal candidate and verify return to the event workspace without changing respondent selection or external contact.

## Rollback Plan

Revert through a PR to main and allow the repo-owned workflow to deploy the previous route. No data rollback is needed.

## Audit Evidence

PR and CI results, official deploy run, digest/runtime readback, and private signed-in smoke ledger entry.

## Known Gaps

This does not qualify suppliers, select respondents, establish NDA coverage, or authorize an external package release.
