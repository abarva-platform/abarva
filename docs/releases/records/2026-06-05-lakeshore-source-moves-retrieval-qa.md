# 2026-06-05-lakeshore-source-moves-retrieval-qa — Lakeshore Source/Moves Retrieval Proof

## Release ID

`2026-06-05-lakeshore-source-moves-retrieval-qa`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable production QA script that proves representative Lakeshore Source artifacts and Moves attachments can be retrieved through authenticated browser product paths. This closes the demo-readiness gap between "rows and blobs exist" and "the actual documents open through the product path."

## Layer Impact

- `client-data-lane`: Validates Lakeshore-specific Source artifact bodies, Source HTML renders, Moves attachment listings, and browser attachment downloads.
- `internal-admin`: Adds an operator/auditor script plus generated HTML/JSON evidence for the Lakeshore same-day demo lane.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore Holdings only.
- Internal only: The script and evidence packet are for AbarVa demo readiness and audit review.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/source-moves-retrieval-qa.mjs`
- Generated evidence under `audit-artifacts/lakeshore-source-moves-retrieval-qa/`

## QA / Validation

- PASS: `node scripts/lakeshore/source-moves-retrieval-qa.mjs` against `https://app.abarva.ai` with the Lakeshore CFO Clerk ticket path returned 8 pass, 0 fail.
- PASS: The script verified Source artifact body routes, Source HTML render routes, two Moves attachment-list routes, and six browser download samples.
- PASS: `node --check scripts/lakeshore/source-moves-retrieval-qa.mjs`.
- Pending before PR: `git diff --check`.
- Pending before PR: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is a script/evidence-only release and does not require a Vercel deploy, migration, or Azure infrastructure change.

## Rollback Plan

Revert the PR if the QA script or evidence format is not useful. There is no runtime state to roll back.

## Audit Evidence

- `audit-artifacts/lakeshore-source-moves-retrieval-qa/*/summary.json`
- `audit-artifacts/lakeshore-source-moves-retrieval-qa/*/report.html`
- PR checks and release-control output.

## Known Gaps

This audit samples representative flagship demo artifacts and attachment downloads. It does not exhaustively fetch every Source artifact or every Move attachment. The d27 Selection Memo is verified through the supported HTML render route rather than the body endpoint.
