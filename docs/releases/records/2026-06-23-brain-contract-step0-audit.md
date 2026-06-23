# 2026-06-23-brain-contract-step0-audit — Brain Contract Step 0 audit baseline

## Release ID

`2026-06-23-brain-contract-step0-audit`

## Status

`candidate`

## Plain-English Summary

Adds the required Step 0 Brain Contract audit and updates the progress tracker
with the current live signed-in matrix result. This does not change product
runtime behavior. It records that the current deployed app is green on most
current gate columns, but First Capital failed `visual` on the fresh run and the
HTML reality-crawl report cannot be generated from `origin/main` until the
missing crawl runner/bank land.

## Layer Impact

- `internal-admin`: Updates build/progress documentation used by operators and
  agents to coordinate Brain Contract work.
- `global-control-lane`: No runtime code change. The audit identifies later
  global-control-lane work, but this PR does not implement it.
- `client-data-lane`: No schema, ingestion, corpus, search index, tenant data,
  queue, or migration change.

## Client Applicability

- All clients: No runtime effect.
- Specific clients: No runtime effect.
- Internal only: Yes, documentation/progress tracking only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/build/BRAIN_CONTRACT_AUDIT_2026-06-23.md`
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`

## QA / Validation

- Pre-flight run from a clean worktree: `git fetch origin && git rebase origin/main`.
- Read the Brain Contract runbook, contract, brief, progress tracker, tenant matrix gate,
  report generator, and the source files named in the runbook.
- Ran signed-in live gate against `https://app.abarva.ai`:
  `tenant-matrix-gate.mjs` returned `MATRIX FAILED — 1/5 tenants` because First Capital
  failed `visual`; Apex, SkyHarbor, Meridian, and Lakeshore passed all current columns.
- Did not run `reality-crawl.mjs` because that file and its bank are not on `origin/main`;
  they are owned by open PR #3881.
- `npm run release:check` must pass before PR.

## Rollout Plan

Merge to `main`. No ACA deploy, migration, queue job, DNS change, feature flag,
or worker update is required for this docs-only audit.

## Deployment Authority

- Repo-owned deploy workflow: Not required for runtime; docs-only PR.
- Shared runtime mutators: None.
- Approved image digest: n/a.
- ACA runtime invariant: Unchanged.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Already captured as gate output; screenshot-backed
  report remains blocked until the crawl runner/bank land.

## Rollback Plan

Revert this PR. No runtime or data rollback is needed.

## Audit Evidence

- Step 0 audit file.
- Progress tracker update.
- Live tenant matrix command/result in the audit file.
- Open PR #3881 status for the missing reality crawl runner/bank.

## Known Gaps

- `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html` is not present on `origin/main`;
  the architecture doc was read from `/Users/anand/Downloads/AbarVa-How-The-Brain-Works.html`.
- `scripts/qa/reality-crawl.mjs` and `scripts/qa/reality-crawl-bank.mjs` are not
  present on `origin/main`, so `out/reality-crawl/report.html` cannot be produced
  from main yet.
- First Capital `visual` failed on the fresh deployed-app matrix run.
