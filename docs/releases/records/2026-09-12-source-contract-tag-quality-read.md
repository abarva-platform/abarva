# 2026-09-12-source-contract-tag-quality-read — Tag-quality read and Performance cards

## Release ID

`2026-09-12-source-contract-tag-quality-read`

## Status

`candidate`

## Plain-English Summary

Reads the monthly tag-quality observations that the cloud consumption loader
has been writing, and renders them as the design's three-card Performance row.

The observations were already loaded into Layer 3 and already asserted as
canonical facts, but no read-model query selected them, so the attribution gap
they record could not reach any product surface. This adds the read, threads it
through the contract-detail route and the Contract 360 view builder, and gives
it a surface.

The middle card carries one meter per stored coverage column, read from the
latest check. A column present on the rows but null on every one of them yields
no meter rather than a zero, because nobody looked is not the same as nothing
tagged. Where every loaded check records the same coverage the card says the
figure is unchanged across all of them, rather than presenting one month as if
it described the year.

Card labels follow the stored columns rather than the design's prose. One design
caption reads "attributed to a scope"; the column that would have to supply it
records application tagging, which is a different claim. The design's
basis line also opens with a service-usage observation count, which lives in a
table the read model does not select — the nearest available number counts
commitment-coverage rows, a different measurement under the same label — so the
surface counts only what it reads.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Contract 360 read path and surface for all clients, not feature-gated.
- **Layer 4 / Products:** New read-adapter query, contract-detail route hand-off, Contract 360 view field, and the Performance card row.
- **Layer 3:** No change. The table, its rows, and the canonical assertions over them already existed.
- **Layer 2:** No adapter or intake changes.
- **Schema:** No migration. The query reads existing columns on an existing table.

## Client Applicability

- **All clients:** Any contract with tag-quality observations loaded.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `types.ts`: `SourceCloudTagQualityRow`, documenting that coverage is stored 0-100.
- `read-adapter.ts`: `listCloudTagQualityRows` plus its numeric normalizer.
- `contract-360-view.ts`: optional `cloudTagQuality`, filtered to the contract.
- `contract/[contractId]/route.ts`: reads the rows and passes them to the view builder.
- `Contract360Economics.tsx`: `ContractPerformanceCards` and the meter derivation.
- `WorkspaceExecutiveShell.tsx`: mounts the card row above the consumption mix.
- `workspace.css`: meter and performance-card blocks.
- `contractPerformanceCards.test.tsx`: seven tests.
- `route.test.ts`: pins that the route reads the rows and hands them on.

## QA / Validation

- Focused Jest: 24 suites, 208 tests passed across the workspace slice; 16 passed on the contract-detail route; 208 passed on the read-adapter slice.
- **Mutation-tested both guards.** Making a null-on-every-row column render as a zero meter fails one test; hard-coding the unchanged flag to true fails another. Neither guard is decorative.
- Repository TypeScript: clean.
- ESLint on all eight changed files: clean.
- Static check that every custom property the new CSS references is declared, that every class the component emits has a rule, and that no block is defined twice.
- Required follow-up: signed-in browser proof after ACA deployment must show the meters with the loaded coverage figures, and the not-required card beside them on an archetype with no service-credit lane.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration
and no operator data-build job is required: this reads rows that are already
loaded.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, for the Contract 360 Performance tab.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, mutation-test results, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and signed-in browser proof.

## Known Gaps

Monthly service-usage observations remain unread by the read model, so the
design's observation count is not rendered. That is the same class of gap this
change closes for tag quality — a loaded lane with no query over it — and it
needs its own read, not a substitute figure from a different table.

On the current synthetic package every monthly check records identical
coverage. The card states that rather than hiding it, but a generator that
varies the figure across months would exercise the moving-figure path, which is
presently covered only by tests.
