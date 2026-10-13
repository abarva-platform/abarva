# U-654 — ECL serving-route fence no longer trips on a schema-shaped token in prose

## Release ID

`2026-10-12-ecl-serving-fence-prose-schema-token`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

The ECL product serving-route fence is a pre-deploy guard. It walks the import
graph from the Tower runtime entry points, then scans every reachable source
line for tokens shaped like a pre-ECL Tower schema read (`cio_tower.*`,
`consumption.tower_*`, and specific `tower.*` tables). Any match is treated as a
forbidden direct read of a retired schema from the product serving path, and the
fence fails.

The feature registry (`src/lib/features/registry.ts`) is reachable from the
Tower routes because those routes evaluate feature flags. One flag's summary is
a dated, human-readable release note describing the Tower Command Center. That
prose happened to contain the literal token `cio_tower.mart_*` while explaining,
in words, which governed read models the surface reads. The fence's line scan
cannot distinguish a schema name written in documentation prose from an actual
query, so it reported the sentence as a violation and the whole fence — and with
it the `proof` live-proof lane — went red. No runtime code reads that schema;
the only thing wrong was a schema-shaped token sitting in a comment string.

This change rewords that one sentence so it still names the governed
`cio_tower` command-center mart read models and the `mart_*` read-model family,
but no longer embeds the dotted `cio_tower.<name>` token the scanner keys on.
Behaviour, flags, and read paths are unchanged; only the wording of one
registry summary string moves.

## Layer Impact

This change ships in the **global-control-lane**: it is shared control-plane /
CI behaviour with no client-scoped data, schema, or tenant change.

- **Products (layer 4):** none functionally. The edited string is a descriptive
  feature-flag summary; no product surface, flag value, tenant scope, or read
  path changes.
- **Control plane / CI:** the `test:ecl-product-serving-route-fence` guard goes
  from red to green on `main`, restoring the pre-deploy gate and the `proof`
  live-proof lane to a passing state.

## Client Applicability

- All clients: no functional change.
- Specific clients: none.
- Internal only: the CI/fence correctness restoration.
- Public/demo only: no.
- Feature flag: none added or changed.

## Changes Included

- `src/lib/features/registry.ts` — reword one feature-flag summary string so a
  governed-schema name is described without embedding a `cio_tower.<name>`
  token that the serving-route fence scans for.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated from the
  feature registry (`npm run docs:nexus-manual`); the only diff is the same
  reworded sentence in the Tower Command Center flag summary.
- `docs/releases/records/u654-ecl-serving-fence-prose-schema-token.md` — this
  record.

## QA / Validation

- `node scripts/ecl/__tests__/run-ecl-product-serving-route-fence-tests.mjs` —
  PASS (`accepted: true`, `violations: 0`, `preEclTowerViolations: 0`;
  80 Tower runtime files scanned). Before the change this asserted one violation
  at the registry prose line and exited non-zero.
- `npm run test:ecl-product-serving-route-fence` — PASS (CI-exact invocation).
- `npm run docs:nexus-manual` — regenerated the Nexus manual so the committed
  copy matches the registry; `check-nexus-manual-spine` now passes.
- `npm run release:check -- --base origin/main --head HEAD` — PASS (11 of 11
  gates).
- Change is a single string-literal edit; no type surface or control flow
  changes. ESLint: file has no code change to flag.

## Rollout Plan

Merge to `main` via squash PR. No image rebuild is required for correctness of
the running product (no runtime behaviour changes); the fix restores the
pre-deploy gate and the `proof` lane. Standard ACA main deploy picks it up on the
next revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: unchanged; no runtime image mutation in this change.
- ACA runtime invariant: unaffected (no template/traffic/env/secret change).
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no (CI/fence-only correctness; no runtime
  behaviour change).

## Rollback Plan

Revert this PR. The prose reverts to the prior wording and the fence returns to
its prior (red) state; no data, schema, migration, or runtime rollback is
involved.

## Audit Evidence

- PR URL and squash commit (to be filled by the merge).
- Local fence run output captured in QA / Validation above.
- CI `ECL product live proof` / `test:ecl-product-serving-route-fence` run on the
  merge commit.

## Known Gaps

The fence remains a line scan that cannot distinguish a schema name written in
prose from a real query. A future hardening could make the scanner ignore
comments and string literals, or exclude documentation-only files from the Tower
runtime scan, so that descriptive text can name retired schemas without tripping
the guard. Out of scope here; this change only removes the one token that was
failing the gate.
