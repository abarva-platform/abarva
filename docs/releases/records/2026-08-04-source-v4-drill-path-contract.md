# 2026-08-04-source-v4-drill-path-contract - Source v4 Drill Path Contract

## Release ID

`2026-08-04-source-v4-drill-path-contract`

## Status

`candidate`

## Plain-English Summary

Hardens the Source v4 Cube/UI contract so each Source Workspace lens names the default Cube hierarchy that backs its drill path. The catalog, aVa context and Cube model now agree on the ordered drill levels for portfolio, vendor, renewal, scope, spend, service credit, AI usage, cloud, rate-card and sourcing-event exploration.

## Layer Impact

- `global-control-lane`: strengthens a shared semantic/UI contract used by Source Workspace and aVa grounding.
- `client-data-lane`: no client data is loaded, changed or promoted.
- SOURCE ADAPTERS: no intake, raw-load or adapter behavior changes.
- CANONICAL MODEL: no canonical model changes.
- PRODUCTS: Source Workspace and aVa receive explicit default hierarchy metadata; visual behavior remains unchanged until UI components consume it.
- Semantic layer: Cube v4 hierarchy levels are expanded where the loaded dimensions already support deeper drill paths.

## Client Applicability

- All clients: contract pattern applies to Source semantic consumption.
- Specific clients: current values target the synthetic airline v4 canary.
- Internal only: yes, until the v4 Source/Cube path is promoted beyond canary use.
- Public/demo only: no public route change.
- Feature flag: none.

## Changes Included

- Adds `defaultHierarchy` to the Source v4 UI lens catalog and includes it in the aVa-facing semantic catalog.
- Aligns every `defaultDrillPath` with an ordered Cube hierarchy in `cube/model/source_sourcing_v4.yml`.
- Expands Cube hierarchies for renewal exposure, scope confidence, spend consumption, AI usage value proof and sourcing events where supported dimensions already existed.
- Adds a Jest contract test that parses the Cube YAML and fails if any UI/aVa default drill path drifts from the backed Cube hierarchy.
- Updates the Source v4 UI/Cube consumption contract documentation.

## QA / Validation

- PASS: `npx jest src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts --runInBand`
- Pending: focused ESLint.
- Pending: TypeScript.
- Pending: release gate.
- Pending: PR checks.
- Not run: Cube private runtime verifier, because this shell does not have `CUBEJS_API_SECRET`.
- Not run: signed-in Source Workspace browser proof.

## Rollout Plan

Merge through the normal PR path. Cube changes should trigger the repo-owned Cube lab deploy workflow, which builds and verifies the private Source Cube runtime. The web app deploy workflow will also publish the updated aVa-facing catalog after merge.

## Deployment Authority

- Repo-owned deploy workflows: `.github/workflows/aca-cube-lab-deploy.yml` for Cube changes and `.github/workflows/aca-main-deploy.yml` for web changes.
- Shared runtime mutators: repo-owned workflows only.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: enforced by the workflows.
- Worker image invariant: enforced by the web workflow where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming the Source Workspace interaction is live-proven.

## Rollback Plan

Revert this PR and rerun the repo-owned deploy workflows. No data rollback is required because this release does not mutate Source data.

## Audit Evidence

- PR checks.
- Cube lab deploy artifact after merge.
- Web deploy artifact after merge.
- Local Jest output proving every default drill path is backed by an ordered Cube hierarchy.

## Known Gaps

- This release does not implement new visual interactions by itself; it makes the semantic drill paths explicit for UI and aVa consumers.
- Cube private runtime proof must be captured by the deploy workflow after merge.
- Signed-in Source Workspace proof remains a separate UI/runtime verification gate.
