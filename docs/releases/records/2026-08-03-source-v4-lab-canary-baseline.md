# 2026-08-03-source-v4-lab-canary-baseline — Source v4 Lab Canary Loader and Question Baseline

## Release ID

`2026-08-03-source-v4-lab-canary-baseline`

## Status

`candidate`

## Plain-English Summary

Adds a lab-only canary path for the Source v4 synthetic sourcing-depth package. The change can parse the generated package, verify the package manifest and CSV hashes, plan or apply isolated raw tables plus canary views, and generate a 150-question answer-baseline ledger that explains which questions are supported by the current package and which need richer semantic views.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: reads the Source v4 system-shaped CSV package exactly as supplied and preserves source rows as text with technical lineage.
- Source adapters: adds a canary loader that maps one package CSV to one raw table and records header lineage in `_column_map`.
- Canonical model: no canonical entities, IDs, or product truth are changed.
- Products: no product UI changes are included. The canary views are inputs for later Source/Cube design validation.

## Client Applicability

- All clients: no.
- Specific clients: the synthetic airline demo tenant only, `skyharbor_global`.
- Internal only: yes, lab canary validation.
- Public/demo only: no public surface changes.
- Feature flag: none.

## Changes Included

- `scripts/source/load-skyharbor-v4-lab-canary.mjs`
- `scripts/source/run-skyharbor-v4-canary-answer-baseline.mjs`
- `docs/source/SKYHARBOR_SOURCE_V4_LAB_CANARY_LOAD_AND_BASELINE.md`
- `package.json` Source v4 canary scripts

## QA / Validation

Validated locally:

- `node --check scripts/source/load-skyharbor-v4-lab-canary.mjs`
- `node --check scripts/source/run-skyharbor-v4-canary-answer-baseline.mjs`
- `node scripts/source/load-skyharbor-v4-lab-canary.mjs`
- `node scripts/source/run-skyharbor-v4-canary-answer-baseline.mjs --out /Users/anand/Downloads/SkyHarbor_Source_V4_Canary_Answer_Baseline_20260804T014245Z.json`

Observed local dry-run facts:

- Package SHA-256: `ff9823b96a01f642674bfe1f26aa168025d7a1e8ba5ebcce8925c5491054d695`
- Raw tables planned: `10`
- Raw rows planned: `195,960`
- Contracts represented: `100`
- Vendors represented: `60`
- Annual contract value represented: `$1.4805B`
- Question baseline rows: `150`
- Blocked questions: `0`

The local shell did not expose a lab database URL, so the apply-mode database mutation was not executed locally.

## Rollout Plan

Merge to main to make the canary scripts available. Lab application is a separate operator action using `npm run source:v4:lab-canary:apply` with a lab-only Postgres URL or an ACA operator job configured with the same script and package path.

## Deployment Authority

- Repo-owned deploy workflow: not required for local script availability, required only if the web runtime later consumes these views.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable for this script-only candidate.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required only after a product page or Cube runtime consumes the canary views.

## Rollback Plan

Revert the PR to remove the canary scripts and documentation. If the apply script has been run in lab, drop `consumption_v4_canary` and `raw_source_v4` or delete rows matching `tenant_key = 'skyharbor_global'` and `dataset_id = 'skyharbor-source-v4-202608'`.

## Audit Evidence

- Local dry-run loader output for the v4 package.
- Offline 150-question canary baseline JSON in `/Users/anand/Downloads`.
- PR diff and post-merge commit once merged.

## Known Gaps

- Lab database apply was not executed from this local shell because no lab database URL was available.
- Cube model changes are not included in this candidate.
- Product UI/browser proof is not included because no product surface reads these canary views yet.
