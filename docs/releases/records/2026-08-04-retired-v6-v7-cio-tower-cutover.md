# 2026-08-04-retired-v6-v7-cio-tower-cutover

## Release ID

`2026-08-04-retired-v6-v7-cio-tower-cutover`

## Status

`candidate`

## Plain-English Summary

Tower and aVa active read paths are cut over from retired V6/V7/CIO Tower layers to the current governed layers. Intelligence no longer retrieves the V7 dossier fallback. Tower chat and Atlas Tower turns now answer from the current `tower.*` read model, while Source-owned vendor, contract, AI usage, cloud, rate-card, and sourcing evidence remains served through the Source V4 Cube lenses.

## Layer Impact

Release lane: `global-control-lane` plus controlled `client-data-lane` operator script.

Products:

- Home: already disabled V6/V7 fallback and bridges to Source V4 evidence where relevant.
- Intelligence: removes the active V7 dossier retrieval branch.
- Tower: routes aVa/Tower chat through the current Tower semantic read model instead of `cio_tower` and `intelligence_v7`.
- Source: unchanged runtime; Source V4 Cube remains the semantic serving layer for Source commercial analysis.

Data plane:

- Adds a dry-run-first operator script for retired schema inventory and exact purge.
- No database objects are dropped by this PR.

## Client Applicability

All clients: yes, because it removes retired fallback behavior from shared product answer paths.

Specific clients: none.

Internal only: the purge script is an operator tool and must run through the ACA job lane.

## Changes Included

- Tower `/api/tower/ask` and `/api/tower/cio-chat` now call `answerCurrentTowerQuestion`.
- Atlas Tower turn now calls the same current-layer Tower adapter.
- Tower grounding no longer falls back to `intelligence_v7`.
- Tower budget rollups no longer prefer `cio_tower.facts`.
- Intelligence ask no longer retrieves `intelligence_v7` dossiers.
- Retired CIO Tower exported readers are fail-closed or inert.
- Adds `scripts/ops/purge-retired-data-layers.mjs`.
- Adds `npm run ops:purge-retired-data-layers`.

## QA / Validation

Current status:

- Pass: focused ESLint on changed Tower/Atlas/Intelligence files.
- Pass: TypeScript with expanded Node heap.
- Pass: purge script validate-only smoke with no database mutation.
- Pending: release check after this record update.
- Pending: secrets staged scan before commit.
- Not run: live database retired-layer dry run, because that must run through the ACA operator job after app cutover deploys.
- Not run: physical retired-layer purge.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime.
- Shared runtime mutators: none in this branch.
- Database mutation lane: ACA operator job only, using `npm run ops:purge-retired-data-layers`.
- Approved image digest: to be produced by the deploy workflow after merge.
- ACA runtime invariant: required before live claim.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for Home, Intelligence, Source and Tower aVa paths before applying physical purge.

## Rollout Plan

1. Merge through PR.
2. Deploy through the repo-owned ACA main deploy workflow.
3. Verify signed-in Home, Intelligence, Source, and Tower aVa routes.
4. Run the retired-layer purge script in dry-run mode through the ACA operator job.
5. Review dependency inventory and row-count proof.
6. If no active dependencies remain, run the same operator job with `--apply`.
7. Capture the proof bundle in Downloads and Blob.

## Rollback Plan

Revert the application PR and redeploy through ACA. If the purge has not run, no data rollback is needed. If the purge has run, restore retired schemas only from the proof/archive backup through the database operator lane; do not add runtime fallbacks back to retired layers.

## Audit Evidence

To be attached after validation:

- PR checks.
- ACA deploy evidence.
- Retired-layer dry-run proof JSON.
- Retired-layer apply proof JSON if approved.

## Known Gaps

- Physical database purge is not performed by this code PR.
- Old files and migrations may still mention V6, V7, and CIO Tower for history, tests, and migration lineage.
- Source V4 Cube exists for Source analysis; a separate Tower Cube model is not present in this checkout. Tower uses `tower.*` as its current semantic read model.
