# 2026-08-31-executive-evidence-led-packet-contract

## Release ID

`2026-08-31-executive-evidence-led-packet-contract`

## Status

`candidate`

## Plain-English Summary

This release changes the executive-orientation page-generation packet so the model receives an
explicit evidence-led page contract. Each page packet now names the question, lead evidence,
governing table, required findings, terminal states, and drill links that the generated page must
follow. The goal is to prevent weak slot-filled executive prose and keep page content anchored in
source files and deterministic tables.

## Layer Impact

- `global-control-lane`: updates shared page-generation packet shape for the executive-orientation
  surface.
- Layer 1 client intake: no source files are changed.
- Layer 2 source intelligence: no adapter behavior is changed.
- Layer 3 canonical model: no schema or canonical data is changed.
- Layer 4 products: generation packets now carry a stricter page contract for future content
  generation and proof.

## Client Applicability

- All clients: yes, for executive-orientation page-generation packet shape.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `config/home/evidence-led-pages.json`, a machine-readable evidence-led page contract.
- Updates `scripts/ecl/build_source_intelligence_home_packets.mjs` to attach
  `evidence_led_contract` to page packets and prompts.
- Updates the packet test to assert the new contract, deterministic-table instructions, and
  terminal-state contract.
- Adds `docs/architecture/HOME_EVIDENCE_LED_EXECUTION_CONTRACT_2026_08_31.md`.

## QA / Validation

- Pass: `npm run test:ecl-source-intelligence-home-packets`.
- Pending before merge: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. No Azure Container Apps deploy, migration, data load, feature flag, or traffic
shift is required because this changes offline packet generation inputs and documentation only. The
next content-generation run must consume this packet contract before any refreshed page prose is
considered publishable.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no for this packet-contract change; yes before any generated
  content is claimed live.

## Rollback Plan

Revert this PR. Existing packet generation will return to the prior source-intelligence and
segment-spine packet shape.

## Audit Evidence

- PR URL and CI run for this release.
- `config/home/evidence-led-pages.json`.
- Generated packet manifest from the next packet run.
- Targeted test output from `npm run test:ecl-source-intelligence-home-packets`.

## Known Gaps

- This release does not regenerate, publish, or deploy page prose.
- This release does not implement the record-browser UI or cell-to-row provenance controls.
- This release does not add new segment attribution for domains that still lack a declared join.
