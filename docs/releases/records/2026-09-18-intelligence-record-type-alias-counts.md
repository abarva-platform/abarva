# 2026-09-18-intelligence-record-type-alias-counts

## Release ID

`2026-09-18-intelligence-record-type-alias-counts`

## Status

`draft`

## Plain-English Summary

The Intelligence overview now combines documented legacy and promoted record types in the same domain. Application and service summaries state record counts, not distinct system counts; configuration items are not treated as applications or services.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 (Products): The Intelligence read model combines known record-type aliases for display counts and context summaries. It preserves the original per-type counts for auditability.
- Layers 1-3: No intake, adapter, canonical, schema, or tenant data change.

## Client Applicability

- All clients: The shared Intelligence overview read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Aggregate documented legacy and promoted record-type pairs in the Intelligence overview read model.
- Exclude adjacent but distinct record types from application/service, vendor/contract, and data-domain/stewardship counts. Legacy combined buckets are labeled as records, not distinct entities.
- Add pair-by-pair behavior tests without changing pre-existing test assertions.

## QA / Validation

- Baseline read-model suite: 5 passed, 2 failed.
- New pair/exclusion cases: 20 passed, 7 pre-existing cases skipped in the focused run.
- Final full read-model suite: 25 passed, the same 2 pre-existing cases failed. Their assertions were not edited.
- Mutation check: removing the supported `cmdb_service` alias made its pair test fail; the alias was restored.
- Scoped ESLint and TypeScript `tsc --noEmit --incremental false`: passed.
- Release gate: passed.

## Rollout Plan

After review and merge through a pull request, use the repo-owned ACA main deploy workflow. No migration, loader job, or data reload is required. This draft does not authorize a merge or deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Verify during any later deployment.
- Worker image invariant: Verify during any later deployment if required by the release workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for any claim that the change is live.

## Rollback Plan

Revert the read-model change through a pull request and redeploy the prior approved image digest through the repo-owned workflow. No data rollback is needed.

## Audit Evidence

- Focused read-model behavior test and mutation result in the worktree validation output.
- Pull request, CI, ACA digest and signed-in proof: Not yet available.

## Known Gaps

Domain totals count source rows across aliases; they do not deduplicate entities represented by more than one record type. Two pre-existing read-model tests remain red: one expects configuration items in an application/service count and a contract value field not consumed by the current read model; the other omits an existing insights query from its expected sequence. No live signed-in verification has been performed. No production deployment is claimed.
