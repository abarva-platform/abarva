# 2026-06-07-context-layer-loaded-copy — Context Layer Loaded-Copy Grounding

## Release ID

`2026-06-07-context-layer-loaded-copy`

## Status

`candidate`

## Plain-English Summary

Sentinel and the Enterprise Context canvas now state clearly that the Enterprise Context layer is the layer being used and that systems, vendors, contracts, KPIs, owners, and evidence are loaded in the context. This fixes unclear/awkward loaded-context wording and keeps the visible surface aligned with the facts passed to the agent.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence/Enterprise Context read-model facts and adjacent dashboard/domain labels. No tenant data, schema, migration, or access-control behavior changes.

## Client Applicability

- All clients: Applies anywhere the shared Enterprise Context read model or canvas is rendered.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/components/intelligence-v3/EnterpriseContextCanvas.tsx`
- `src/lib/pilot-dashboard/aggregates.ts`
- Focused tests for Enterprise Context read-model and pilot dashboard aggregates.

## QA / Validation

- Pre-test candidate revision created before validation per cloud-agent workflow.

## Rollout Plan

Merge to `main`; the updated copy and read-model facts become active with the next application deploy. No data migration or manual runbook is required.

## Rollback Plan

Revert the PR commit to restore the prior Enterprise Context wording and domain-label set. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local validation output: pending.

## Known Gaps

None known.
