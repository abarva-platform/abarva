# 2026-08-21-table-row-external-benchmark-quality — Table Row External Benchmark Quality Gate

## Release ID

`2026-08-21-table-row-external-benchmark-quality`

## Status

`candidate`

## Plain-English Summary

The generated deliverable quality gate now recognizes a quantified external benchmark when the benchmark label and caveat appear in the same table row. This preserves the evidence guardrail for client-specific financial claims while avoiding a false blocker on cautious wording that explicitly keeps the benchmark external.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves deliverable validation is corrected for generated markdown table rows. The change affects export gating only; it does not create, modify, or load tenant data.

## Client Applicability

- All clients: Strategic Moves generated deliverable quality validation.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts`
- `src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts`

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts --runInBand` — passed.
- Added a regression test for table-row wording that keeps a per-minute benchmark external.
- Existing annual savings laundering test remains in place to ensure an external benchmark label cannot approve an unsupported benefits claim.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming runtime proof.
- Worker image invariant: Required after deploy before claiming runtime proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run the affected generated deliverable path and confirm the table-row external benchmark no longer blocks while annual savings still require evidence.

## Rollback Plan

Revert the PR. The quality gate returns to the prior behavior for table-row external benchmark wording.

## Audit Evidence

- PR URL: TBD.
- Local validation command above.
- Post-merge deploy run and runtime invariant proof: TBD.
- Signed-in Move rerun proof: TBD.

## Known Gaps

This change does not approve or create any client-specific quantified benefit, savings, ROI, or payback claim. It only prevents a labelled external benchmark caution from being treated as an unsupported client fact when the benchmark remains explicitly external.
