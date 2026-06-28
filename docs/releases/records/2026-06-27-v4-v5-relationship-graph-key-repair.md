# 2026-06-27-v4-v5-relationship-graph-key-repair — V4/V5 Relationship Graph Key Repair

## Release ID

`2026-06-27-v4-v5-relationship-graph-key-repair`

## Status

`candidate`

## Plain-English Summary

The v4 relationship graph files were pointing at stale synthetic node IDs or narrative labels that the Azure context loader could not resolve to actual loaded records. This release regenerates those graph files from the current source CSV business keys, so graph edges resolve to real applications, capabilities, teams, vendors/contracts, data products, AI assets, and KPIs.

## Layer Impact

- `client-data-lane`: Repairs tenant source dataset graph files and adds a validation gate that fails when graph endpoints do not resolve to loaded source keys.
- `global-control-lane`: Adds one reusable graph-regeneration script and npm command for governed dataset maintenance.

## Client Applicability

- All clients: No.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings / Lakeshore Industries source pack, Meridian Health, SkyHarbor Air.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `scripts/context-packs/regenerate-v4-relationship-graphs.mjs`.
- Added npm script `context:v4:regenerate-graphs`.
- Regenerated `graph/context-relationships.jsonl` for v4 synthetic source packs.
- Extended `scripts/audit/validate-v4-v5-dataset-refresh.mjs` with `graph.edges_resolve_to_loaded_keys`.
- Updated `reports/v4-v5-dataset-refresh-20260627/validation.generated.*`.

## QA / Validation

- PASS: `node scripts/context-packs/regenerate-v4-relationship-graphs.mjs`
- PASS: `NODE_OPTIONS=--conditions=react-server node scripts/audit/validate-v4-v5-dataset-refresh.mjs`
- PASS: `git diff --check`
- Result: all five canonical tenant source packs pass `14/14`, including graph endpoint resolution.

## Rollout Plan

Merge to `main`, build a digest-pinned operator image, then rerun the governed v4 source refresh through the private ACA operator with `DATABASE_URL` projected from Key Vault. After reload, run the live verifier and embedding/read-model/dossier rebuild gates before any browser-visible claim.

## Deployment Authority

- Repo-owned deploy workflow: Not a web runtime deploy by itself; post-merge operator image must be built from `main`.
- Shared runtime mutators: Do not mutate shared ACA web traffic for this release.
- Approved image digest: Required for the post-merge private operator run.
- ACA runtime invariant: `app.abarva.ai` template image and traffic should remain unchanged during private data refresh.
- Worker image invariant: Private operator must run the digest-pinned post-merge image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after data refresh plus embedding/read-model/dossier rebuild, not satisfied by this PR alone.

## Rollback Plan

Revert this PR to restore the previous graph files and validation behavior. If already loaded into Azure, rerun the governed refresh from the prior approved image or source commit.

## Audit Evidence

- Generator: `scripts/context-packs/regenerate-v4-relationship-graphs.mjs`
- Gate: `scripts/audit/validate-v4-v5-dataset-refresh.mjs`
- Report: `reports/v4-v5-dataset-refresh-20260627/validation.generated.json`

## Known Gaps

This release repairs source graph files and static validation. It does not by itself prove Azure/Postgres graph rows, embeddings, read models, L3 dossiers, or browser-visible answers. Those require the post-merge VNet refresh and proof sequence.
