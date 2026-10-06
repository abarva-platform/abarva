# 2026-09-12-source-contract-anatomy-surface — Contract anatomy surface on Evidence

## Release ID

`2026-09-12-source-contract-anatomy-surface`

## Status

`candidate`

## Plain-English Summary

Adds a read-only explanatory surface at the head of the Contract 360 Evidence
tab that answers "what is a contract, and which of its questions can this one
answer". It renders three columns: what feeds the contract (counted from the
contract's own loaded lanes), the canonical objects a contract resolves to
(schema documentation, not a claim), and the seven governed facets with live
answered / open / not-required state.

The facet column is the only claim on the surface, and it is fully derived. A
facet reads as answered only when the contract's own lane holds rows, as
not-applicable only when the archetype model says the lane is not required, and
as open otherwise. Not-required is rendered as a distinct state rather than a
gap, so an archetype that legitimately has no service-level lane does not read
as missing evidence.

Named upstream systems are deliberately not drawn. Every loaded row on these
contracts records the package loader as its source system, so there is no
integrated named system in the data to display; the surface says so on-page
rather than implying an integration that does not exist.

## Layer Impact

- **Layer 4 / Products:** New presentational component on the Contract 360 Evidence tab, plus its stylesheet block.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** The surface renders for any contract whose detail view is loaded.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `ContractAnatomy.tsx`: new component deriving facet state from archetype requirements and lane counts.
- `contractAnatomy.test.tsx`: five tests covering the required/not-required differential, the answered count, the unmapped-archetype refusal, and the on-surface explanation for absent named systems.
- `WorkspaceExecutiveShell.tsx`: mounts the component once, at the head of the Evidence tab.
- `workspace.css`: `sw-c3-anatomy` and `sw-c3-facet` blocks.

## QA / Validation

- Focused Jest: 23 suites, 201 tests passed across the workspace slice.
- Repository TypeScript: clean.
- ESLint on all changed files: clean.
- Static check that every CSS custom property referenced by the new blocks is declared, and every class name the component emits has a matching rule.
- Required follow-up: signed-in browser proof after ACA deployment must show one anatomy section on Evidence, a facet marked not-applicable rather than open where the archetype excludes it, and feed counts matching the tab's own lane counts.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required for this presentation-only change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, for the Contract 360 Evidence tab.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and signed-in browser proof.

## Known Gaps

The left column counts loaded lanes rather than naming upstream systems, because
no row records an integration with a named system. Restoring the named-system
view requires a real `source_system` value per row, which is a Layer 2 change,
not a presentation change. The surface also does not attempt a tag-quality or
extraction-confidence meter, because no field carries that value today.
