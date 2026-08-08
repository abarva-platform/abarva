# 2026-08-08-source-ava-rich-contract-context — Source aVa Rich Contract Context

## Release ID

`2026-08-08-source-ava-rich-contract-context`

## Status

`candidate`

## Plain-English Summary

Source Workspace aVa now uses the rich answer path that can stream, cite evidence, and render structured tables, charts, and relationship graphs. The context sent to aVa includes the active Source page, selected contract or vendor, contract economics, scope, optimization ledger lines, evidence gaps, source-system feeds, ranking reasons, and strict rules for missing evidence.

## Layer Impact

`global-control-lane`: updates the shared Source Workspace aVa client path and shared ask-route context labels for every tenant using Source.

`client-data-lane`: read-only impact only. No schema, migration, loader, or tenant data mutation is included.

## Client Applicability

- All clients: Yes, this is the shared Source Workspace aVa behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Workspace aVa calls the rich `/api/intelligence/ask` route instead of the legacy generic chat route.
- Source Workspace aVa parses NDJSON streaming events and preserves `agent-answer` packets for renderer-backed tables, charts, graphs, citations, and caveats.
- The Source view model now publishes flat page, tenant, vendor, source, quality, and graph facts alongside the existing nested Source snapshot.
- The ask surface-context retriever labels source citations by the calling module instead of hardcoding Intelligence.
- Visual exhibit requests from a Source contract surface now attach a deterministic Source packet: four-ledger table, numeric ledger chart when values are present, and contract-to-evidence relationship graph. These artifacts are built from governed Source context, not from model-invented JSON.
- Source contract visual/evidence asks now use a deterministic ask-route fast path when the selected-contract context is available, so table/chart/graph packets are emitted before the generic model prose path can flatten or override the answer.

## QA / Validation

- Pass: focused ESLint on the changed Source workspace and ask-route files.
- Pass: focused Jest coverage for Source aVa contract, Source workspace numeric behavior, contract optimization ledger, contract optimization spine, and read adapter.
- Pass: renderer regression coverage for Source four-ledger table, ledger value chart, and contract evidence relationship graph.
- Pass: whitespace check.
- Pass: TypeScript validation with increased local Node heap.
- Pass: release checker.
- Pending: signed-in browser smoke for Source aVa chart/table/graph output on a selected contract after the fast path is deployed.

## Rollout Plan

Merge to main through pull request. The repo-owned Azure Container Apps deployment workflow promotes the change through the standard digest-pinned web image path.

## Deployment Authority

- Repo-owned deploy workflow: Required for live promotion.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main ACA deployment workflow.
- ACA runtime invariant: Verify after deployment before claiming live proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Workspace aVa on a selected contract with table/chart/graph request.

## Rollback Plan

Revert this PR or roll back the web runtime to the previous approved ACA image digest. No data rollback is required.

## Audit Evidence

To be filled after validation:

- PR URL
- CI / release check output
- Browser smoke evidence
- ACA deployment proof if merged and deployed

## Known Gaps

This change wires Source aVa to governed Source context and rich structured rendering. It does not add new industry benchmark datasets, contract PDFs, invoice feeds, or service-credit rows.
