# 2026-08-08-source-contract360-six-tab-story — Contract 360 Story Layout

## Release ID

`2026-08-08-source-contract360-six-tab-story`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now presents contract optimization as a simpler executive story. Contract pages use six tabs, a compact working header, and a first-screen relationship map that connects contract scope, source systems, evidence feeds, value ledgers, and the optimization workflow.

## Layer Impact

`global-control-lane`: updates the shared Source workspace Contract 360 presentation and navigation for all tenants that use the common Source read models.

`client-data-lane`: read-only impact only. The evidence read adapter now ignores malformed golden evidence rows that do not carry the requested contract identity; no schema, migration, loader, or data mutation is included.

## Client Applicability

- All clients: Yes, the shared Contract 360 UI pattern applies to every tenant with Source contract data.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Contract 360 tab set changes from eight tabs to six tabs: Story, Scope, Economics, Performance, Evidence, Optimize.
- Contract pages use a more compact header and tab treatment.
- Story tab adds a contract relationship map and source-fact summary.
- Evidence tab owns the detailed evidence lineage graph.
- Optimize tab keeps the four-ledger cockpit and workflow launch.

## QA / Validation

- Pass: focused ESLint on the changed Source workspace and evidence adapter files.
- Pass: focused Jest coverage for Source workspace numeric behavior, contract optimization ledger, contract optimization spine, and read adapter.
- Pass: whitespace check.
- Pass: TypeScript validation.
- Pass: release checker.
- Pending: browser smoke test for two governed contract examples.

## Rollout Plan

Merge to main through pull request. The repo-owned Azure Container Apps deployment workflow promotes the change through the standard digest-pinned web image path.

## Deployment Authority

- Repo-owned deploy workflow: Required for live promotion.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main ACA deployment workflow.
- ACA runtime invariant: Verify after deployment before claiming live proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace Contract 360 for two selected contracts.

## Rollback Plan

Revert the UI commit or roll back the web runtime to the previous approved ACA image digest. No data rollback is required.

## Audit Evidence

To be filled after validation:

- PR URL
- CI / release check output
- Browser smoke evidence
- ACA deployment proof if merged and deployed

## Known Gaps

None known for this UI scope.
