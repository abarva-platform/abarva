# 2026-09-21 Source Optimize Action Read Latency

## Release ID

`2026-09-21-source-optimize-action-read-latency`

## Status

`candidate`

## Plain-English Summary

Source Optimize previously resolved action-row supplier names through a complex governed contract view. Under tenant-scoped reads, that view was evaluated repeatedly and delayed the action queue for nearly a minute. The action read now resolves names from the canonical supplier table and keeps the existing fail-closed label when no supplier name is recorded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, canonical model: read-only use of canonical supplier identity; no canonical rows change.
- Layer 4, products: the Source Optimize action-candidate read avoids repeated evaluation of the broader contract projection.

## Client Applicability

- All clients: yes, for Source workspaces using the database projection provider.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replace two direct action-row joins and two compatibility action-row joins from the governed contract view to `source.vendor`.
- Preserve `Vendor name not resolved` when canonical supplier identity is unavailable.
- Add a query-contract regression test that prevents the repeated contract-view lookup from returning.

## QA / Validation

- Red-first focused test: the new query contract failed against the prior implementation.
- Focused Jest suite after repair: 10 of 10 tests passed.
- Read-only live database measurement using the production tenant-context path:
  - prior exact query: 51,907.609 ms, 105 rows, 2,083,934 shared-buffer hits;
  - candidate exact query: 31 ms, 105 rows, 105 resolved display names after deduplication.
- TypeScript, ESLint, release control, PR CI, deployed runtime, and signed-in post-deploy proof remain required before release.

## Rollout Plan

Squash-merge through the protected pull-request lane. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. After the runtime invariant passes, repeat the signed-in Source workspace timing check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending merge and deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash commit and let the repo-owned ACA workflow restore the prior read path. No schema or data rollback is required.

## Audit Evidence

- Focused test output and the before/after read-only query measurements recorded above.
- Pull request, CI run, deployment run, runtime-invariant artifact, and signed-in timing proof to be added after each stage completes.

## Known Gaps

- This release fixes the action-candidate bottleneck only. Other Source workspace reads keep their existing providers and must be measured independently.
- Unresolved canonical supplier identities remain explicitly labeled rather than inferred.
