# 2026-06-05-lakeshore-source-moves-artifact-depth-audit — Lakeshore Source/Moves Artifact Depth Proof

## Release ID

`2026-06-05-lakeshore-source-moves-artifact-depth-audit`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable audit that checks whether Lakeshore demo Source events and Moves have real synthetic artifacts, authored bodies, parsed chunks/facts/edges, and Azure Blob-backed files for the stages that will be shown in the demo.

## Layer Impact

- `client-data-lane`: Validates Lakeshore-specific Source/Moves data depth, artifact linkage, and attachment availability.
- `internal-admin`: Adds an operator/auditor script and generated HTML/JSON evidence packet for demo readiness.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore Holdings only.
- Internal only: The script and evidence are for AbarVa demo readiness and audit review.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/source-moves-artifact-depth-audit.mjs`
- Generated evidence under `audit-artifacts/lakeshore-source-moves-artifact-depth/`

## QA / Validation

- PASS: `node scripts/lakeshore/source-moves-artifact-depth-audit.mjs` against live Postgres and Azure Blob returned 8 pass, 0 watch.
- PASS: `node --check scripts/lakeshore/source-moves-artifact-depth-audit.mjs`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is a script/evidence-only release and does not require a Vercel deploy, migration, or Azure infrastructure change.

## Rollback Plan

Revert the PR if the audit script or evidence format is not useful. There is no runtime state to roll back.

## Audit Evidence

- `audit-artifacts/lakeshore-source-moves-artifact-depth/*/summary.json`
- `audit-artifacts/lakeshore-source-moves-artifact-depth/*/report.html`
- PR checks and release-control output.

## Known Gaps

The audit validates artifact depth and blob/file presence. It does not click every artifact in the browser; browser route proof is covered by the Lakeshore app demo readiness QA script.
