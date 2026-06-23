# 2026-06-23-brain-contract-qa-raw-id — Brain Contract QA raw-ID detection

## Release ID

`2026-06-23-brain-contract-qa-raw-id`

## Status

`candidate`

## Plain-English Summary

Tightens the Brain Contract QA harness so long tenant-prefixed internal record
IDs are treated as public-answer leaks. The previous detector caught short IDs
such as `APX-DATA-003`, but missed longer IDs such as `APEXRETAIL-DATA-0011`,
which made the deployed reality-crawl score look better than the captured
answers deserved.

## Layer Impact

- `internal-admin`: Updates QA/proof scripts and Brain Contract progress docs
  used by operators and agents.
- `global-control-lane`: No product runtime behavior changes. The scripts only
  score deployed-app answers more strictly.
- `client-data-lane`: No schema, migration, tenant data, ingestion, queue, or
  search-index change.

## Client Applicability

- All clients: QA scoring applies to all tenants tested by the harness.
- Specific clients: None.
- Internal only: Yes, QA/proof harness and docs only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs`
- `scripts/qa/reality-crawl.mjs`
- `docs/build/BRAIN_CONTRACT_AUDIT_2026-06-23.md`
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`

## QA / Validation

- Pre-flight: `git fetch origin && git rebase origin/main`.
- Ran signed-in `tenant-matrix-gate.mjs` against `https://app.abarva.ai` with
  all five tenant storage states. Result: `MATRIX FAILED — 1/5 tenants`; First
  Capital failed `visual`, all other current columns passed.
- Ran signed-in `reality-crawl.mjs` against `https://app.abarva.ai`, producing
  290 captured answers across five tenants.
- Rescored the captured JSONL corpus after tightening the raw-ID detector.
  Result: `147/290` overall, tables `45/50`, charts `4/50`, graphs `0/40`,
  grounded data+strategy `63/100`, fence `20/20`.
- Generated `out/reality-crawl/report.html`.
- Captured 15 signed-in browser screenshots under `out/reality-crawl/shots/`.
- `npm run release:check` must pass before merge.

## Rollout Plan

Merge to `main`. No Azure Container Apps image build/deploy, migration, queue
job, DNS change, feature flag, or worker update is required. The change becomes
active the next time the QA scripts are run.

## Deployment Authority

- Repo-owned deploy workflow: Not required; QA/docs-only.
- Shared runtime mutators: None.
- Approved image digest: n/a.
- ACA runtime invariant: Unchanged.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed against `https://app.abarva.ai` as
  QA evidence; no runtime deploy is part of this PR.

## Rollback Plan

Revert this PR. No runtime or data rollback is needed.

## Audit Evidence

- Live tenant matrix output in `docs/build/BRAIN_CONTRACT_AUDIT_2026-06-23.md`.
- Reality-crawl row in `docs/build/BRAIN_CONTRACT_PROGRESS.md`.
- Local evidence bundle: `out/reality-crawl/report.html` and
  `out/reality-crawl/shots/`.

## Known Gaps

- The product is not Brain Contract complete: chart and graph exhibit categories
  remain mostly red, First Capital `visual` remains red in the matrix, and the
  deep crawl found raw-ID leaks on Apex, Meridian, and Lakeshore.
- The local HTML report and screenshots are not committed; attach them to the PR
  as QA evidence.
