# 2026-06-04-lakeshore-corpus-coverage-map — Lakeshore Corpus Coverage Map

## Release ID

`2026-06-04-lakeshore-corpus-coverage-map`

## Status

`candidate`

## Plain-English Summary

Adds a generated coverage map for the Lakeshore Holdings corpus. It explains
how the 18 loader-ready templates cover the broader 50+ business dimensions in
the brief, which operating companies appear in each file, which agents/surfaces
should use each template, and what remains before live agent grounding.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific corpus coverage evidence for the
  synthetic package that will be loaded through Data Loads.
- `internal-admin`: Adds a generator/check script so operators can keep the
  coverage map synchronized with the manifest.

## Client Applicability

- All clients: No runtime behavior changes.
- Specific clients: Lakeshore Holdings only.
- Internal only: Operator and reviewer evidence for the Lakeshore pilot.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/lakeshore/generate-corpus-coverage-map.mjs`
- `docs/build/lakeshore/loaded/CORPUS_COVERAGE_MAP.md`
- `package.json` scripts `lakeshore:corpus-map` and
  `lakeshore:corpus-map:check`
- `docs/releases/records/2026-06-04-lakeshore-corpus-coverage-map.md`

## QA / Validation

- PASS: `npm run lakeshore:corpus-map` generated the map from the manifest.
- PASS: `npm run lakeshore:corpus-map:check` confirmed the checked-in map is
  current.
- PASS: `node scripts/lakeshore/verify-synthetic-context.mjs` confirmed 5
  operating companies, 1,329 structured records, 18 CSV files, 21 documents, 65
  ZIP entries, and a non-empty offline review bundle.
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` through PR. No application rollout is required; this is a
generated evidence artifact and read-only operator script.

## Rollback Plan

Revert the PR. No database, Azure, Clerk, or runtime changes are introduced.

## Audit Evidence

- PR URL and CI once opened.
- Generated coverage map at
  `docs/build/lakeshore/loaded/CORPUS_COVERAGE_MAP.md`.
- Generator/check output.
- Existing synthetic package verifier output.

## Known Gaps

- This map proves offline corpus coverage only. Live agent grounding still
  requires governed load commit, embeddings, Data Trust verification, and
  tenant-isolation browser proof.
