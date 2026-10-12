# 2026-10-11-source-evidence-path - Actionable Contract Input Lineage

## Release ID

`2026-10-11-source-evidence-path`

## Status

`candidate` - locally validated; not merged, deployed or live-proven at authoring.

## Plain-English Summary

The contract Evidence view now shows a compact source-system example to extract/workbook to canonical contract path. Selecting an input shows its required fields, suggested accountable role and the decision it supports. Recorded origins, file and row references, and load-run IDs are displayed only when present in the existing detail payload. Examples are not presented as verified integrations.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 (Products): presentation and read-only interaction in the contract Evidence view. Layers 1 (Client Intake), 2 (Source Adapters) and 3 (Canonical Model) are unchanged. No schema, identity crosswalk, loader, calculation or tenant record is modified.

## Client Applicability

- All clients: users of the Source contract Evidence surface receive the presentation change.
- Specific clients: none; no tenant-specific branch or exception.
- Internal only: local QA fixtures are not included in the release.
- Public/demo only: no new public route.
- Feature flag: none; existing access controls remain unchanged.

## Changes Included

- `ContractAnatomy.tsx`: SVG flow connections, source examples, selected input details and scoped recorded provenance; files and observations must match both tenant and canonical contract identity.
- `workspace.css`: existing design tokens, desktop connections and a stacked narrow layout.
- `WorkspaceExecutiveShell.tsx`: remove empty-document and adjacent readout statements that row presence proves reconciliation, citations or optimization; replace them with availability labels and an input owner/request.
- `contractAnatomy.test.tsx`: rendered disclosure, selection, missing-input and provenance negative controls.

Design reference: `docs/design/source/SOURCE_OPTIMIZE_CONTRACT_CLAUDE_DESIGN_HANDOFF_2026-09-10.md`, lines 409-425. Its rule is: "Do not show a zero-heavy evidence grid if the family is not loaded." The following sentence requires what is missing, who owns it and what it unlocks. This slice advances intelligence and accountable collaboration on the page, without manufacturing records or decisions.

## QA / Validation

- Red-first rendered cases failed on the original implementation before the relevant changes: source-flow disclosure, required input details, provenance, the empty-document overclaim and zero-heavy missing inputs.
- Focused baseline: 22 tests pass before and after mutation proof. Fifteen deliberate mutations were killed by assertion failures, including document and observation tenant/contract fences, synthetic origin labelling, internal-loader rejection, selection, count basis and surrounding readout overclaims.
- Adjacent Source behavior command is taken from the existing CI workflow's exact named 18-suite step: 170 tests pass, with no pending or todo cases. Three focused render/browser-integration suites also pass, 37 tests.
- TypeScript passes on Node 24 with a 12 GB heap. The initial default-runtime 4 GB run exhausted heap; it was not treated as a code verdict.
- Focused ESLint has zero errors; one unchanged unused-parameter warning exists elsewhere in the large shell file.
- Desktop and narrow local browser QA uses the actual edited component and synthetic fixtures. This is not authenticated product acceptance. Recorded lineage disclosure, input selection and absent-input states were exercised.
- No new raw color values, external icon package or client input files.
- All 11 release gates pass. Browser viewports of 1440 and 390 pixels have no horizontal overflow in the local component harness.
- CI exposed one older narrative assertion still expecting the replaced wording. Its replacement checks the evidence boundary and accountable input request; all 40 workspace suites now pass locally, 398 tests. Current-head CI remains required.

## Rollout Plan

Review the diff and current-head CI, then squash merge through the protected PR path. Only `.github/workflows/aca-main-deploy.yml` may build and release the shared runtime. After deployment, capture digest parity and signed-in Evidence-tab proof before calling this live-proven. No data reload or migration accompanies this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repo-owned main workflow; no feature-branch or ad-hoc traffic/template change.
- Approved image digest: determined by the main workflow after merge; none asserted here.
- ACA runtime invariant: template image and healthy 100%-traffic revision image must match the workflow's approved digest.
- Worker image invariant: all required worker job images must match the same approved digest.
- Feature/env flag update path: none required.
- Live signed-in proof required: contract Evidence input selection and lineage, with a populated and missing-input case; example systems must not appear as connected.

## Rollback Plan

Revert this presentation release through a new PR and the repo-owned main deploy workflow. No database rollback, workbook reload or migration is necessary.

## Audit Evidence

Inspect the PR diff, rendered tests, existing Source workspace CI command, release gate output and private local browser/mutation proof. Runtime and signed-in product proof are separate, outstanding evidence at authoring.

## Known Gaps

- This does not repair contract identity binding across portfolio and detail projections or create missing inputs.
- Recorded upstream metadata is not proof of a live connector. The existing document loader can omit upstream-system metadata; the UI does not invent it.
- Spend does not prove payment reconciliation or measured usage. Usage history is not exposed by this component's current read model.
- Scope rows can include reviewed or inferred associations; their presence is not an explicit scope declaration.
- Opportunity counts remain an existing projection signal, not proof that each recommendation has run against cited evidence. The outstanding population reconciliation is not changed here.
- View coverage is not decision readiness, verified savings, archetype evaluation or approval of a commercial action.
- Existing Economics spend-versus-consumption terminology is outside this release and remains a separate financial-measure issue; this release must not be read as a repair of that measure.
