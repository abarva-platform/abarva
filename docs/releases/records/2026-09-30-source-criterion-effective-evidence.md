# Source criterion effective evidence

## Release ID

`2026-09-30-source-criterion-effective-evidence`

## Status

`candidate`

## Plain-English Summary

When a person records a Source gate criterion as met, the server now considers validated, cited event facts alongside the persisted upload-status row. This aligns the decision check with the governed evidence shown in the Source stage view. A parsed file by itself is still insufficient when the requirement needs available evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: reads existing event facts with tenant and event scope; no canonical fact is created or changed.
- Layer 4 Source product: the criterion decision check uses the established fact-derived evidence rules. The approval write remains separately authorized and audited.

## Client Applicability

- All clients: yes, for Source event criterion review.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The Source gate-criterion state route reads non-stale event facts through the data plane, verifies tenant and event identity, and merges only trusted fact-derived evidence with persisted evidence before evaluating readiness.
- Focused route tests cover a cited L2/L3 file, missing/stale/uncited tiers, cross-tenant facts, and fact-read failure.
- No migration, evidence-state update, permission change, or external communication.

## QA / Validation

- Red first: a complete cited L2/L3 file remained blocked when its persisted upload row was only Parsed; a failed fact read was not handled.
- Green: 3 focused suites, 53 tests; the route suite alone has 14 passing cases.
- Mutation proof: removing the fact merge made the positive case fail; removing the tenant filter made the complete cross-tenant file pass and its negative test fail.
- Full TypeScript no-emit check and scoped ESLint passed.
- `npm run release:check` and applicable CI to be recorded in the PR.

## Rollout Plan

Squash merge after applicable CI and review. Only the repo-owned ACA main deploy workflow may build and deploy the resulting immutable image. Replay the exact signed-in criterion action after runtime digest verification.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: none from this branch.
- Approved image digest: pending official workflow.
- ACA runtime invariant: web template and sole 100%-traffic revision must match the approved digest.
- Worker image invariant: both delivery worker templates must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, criterion decision and stage readback.

## Rollback Plan

Revert the PR through the same protected-main workflow. No schema or data rollback is needed; existing approval decisions remain audited records.

## Audit Evidence

PR, CI output, official ACA run, digest comparison, and private signed-in smoke ledger. Client event details stay outside this public record.

## Known Gaps

This does not establish evidence quality beyond the existing cited-fact validator, nor does it approve or advance any event automatically.
