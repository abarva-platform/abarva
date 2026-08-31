# 2026-08-31-source-intelligence-digest-contract — Source Intelligence Digest Contract

## Release ID

`2026-08-31-source-intelligence-digest-contract`

## Status

`candidate`

## Plain-English Summary

Strengthens the source-intelligence generation path so source-file digests carry full-read proof,
column reduction evidence, page mappings, fact/reading separation, and numeric grounding checks
before Home pages consume them.

## Layer Impact

- `global-control-lane`: updates shared source-intelligence build tooling.
- Layer 1 Client Intake: records row-read proof and column profiles from source files.
- Layer 2 Source Adapters: adds digest metadata needed for constant-column reduction and page
  mapping.
- Layer 4 Products: improves Home page packet selection by using explicit source artifact page
  mappings before fallback heuristics.

## Client Applicability

- All clients: yes, as a generation and validation contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: not applicable.

## Changes Included

- `scripts/ecl/build_source_intelligence_inventory.mjs`: adds constant/near-constant column
  profiling, narrative-column routing, rows-read proof, content hash alias, and page mappings.
- `scripts/ecl/run_source_intelligence_model_pass.mjs`: adds fact/reading split, page mappings,
  deterministic numeric grounding, and a planted unsupported-fact failure mode.
- `scripts/ecl/build_source_intelligence_home_packets.mjs`: uses artifact page mappings before
  priority-family fallback and carries fact/reading fields into compact page packets.
- Source-intelligence tests now assert the new contract and planted failure behavior.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-source-intelligence-inventory-tests.mjs`
- PASS: `node scripts/ecl/__tests__/run-source-intelligence-model-pass-tests.mjs`
- PASS: `node scripts/ecl/__tests__/run-source-intelligence-home-packets-tests.mjs`
- PASS: full current-source mock proof against `origin/main`: 28 source files, 5,941 rows,
  0 row-read mismatches, 28/28 model-pass prompts accepted, all source content included,
  16/16 Home page packets produced, 117 source-content contexts, 117 source-evidence tables,
  16/16 packets carrying the deterministic segment-spine context, and 16/16 packets carrying
  the evidence-led page contract.

## Rollout Plan

Squash merge through a pull request to `main`. No runtime deployment, data migration, data load,
route change, or traffic shift is required by this tooling change.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the pull request to restore the prior source-intelligence tooling contract.

## Audit Evidence

- Local source-intelligence tests listed above.
- Pull request URL and CI/release-control output.

## Known Gaps

This release does not run the real model pass, regenerate Home prose, publish new Home claim rows,
or deploy a changed product surface. It prepares the stronger digest and packet contract those
steps require.
