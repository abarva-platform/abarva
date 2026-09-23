# 2026-09-23-source-accepted-fact-projection — Accepted Fact Boundary

## Release ID

`2026-09-23-source-accepted-fact-projection`

## Status

`candidate`

## Plain-English Summary

Source facts require an accepted, named, current, event-bound assertion before the enterprise-context writeback planner can publish them. Cited but unreviewed rows remain visible in Source but cannot become canonical context through this path. A fact from another event in the same tenant is also excluded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, canonical model: the Source-to-enterprise-context projection now fails closed without accepted review evidence.
- Layer 4, products: Source continues to display candidate evidence; this change does not mark it agent-ready or advance any sourcing gate.

## Client Applicability

- All clients: yes, for the Source context writeback planner.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Accepted-assertion projection with tenant, event, review, provenance, confidence, effective-time, freshness, conflict, and supersession checks.
- The context writeback planner requires an accepted assertion bound to the exact fact, citation, capture time, and value. Wrong-event and review-missing outcomes have explicit skip reasons.
- The persistence boundary passes accepted assertions when an authorized caller has obtained them; the current operator script supplies none and therefore skips canonical publication.
- Behavioral tests cover both previously admitted unreviewed and wrong-event rows, positive projection, and rejection of mismatched review evidence.
- No migration, tenant data build, or live data mutation is included.

## QA / Validation

- Red-first tests reproduced canonical drafts from an unreviewed row and a same-tenant wrong-event row before the fix.
- Focused Jest suites, scoped ESLint, and TypeScript typecheck passed locally.
- Signed-in Source acceptance remains separate and has not been claimed from these unit tests.

## Rollout Plan

Merge through a reviewed PR after applicable checks pass. The repo-owned ACA main workflow alone may deploy the resulting image. Do not run the context writeback script with `--apply` as part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: prove after deploy.
- Worker image invariant: prove after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, separately from merge and runtime proof.

## Rollback Plan

Revert through a new PR and the repo-owned ACA main deploy workflow. Do not restore unreviewed canonical publication; if a validated positive writeback is urgently needed, first connect an authoritative persisted review reader and prove the acceptance path.

## Audit Evidence

- Focused behavioral test output and red-first reproduction in the private execution ledger.
- PR, CI, deploy, runtime digest, and signed-in evidence to be appended only when available.

## Known Gaps

- The current `source_event_facts` operator reader has no persisted accepted-review authority. It remains fail-closed: positive live writeback requires a separately governed, version-bound review source. This release does not apply a schema migration or claim a positive data-plane readback.
