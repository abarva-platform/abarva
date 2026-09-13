# 2026-09-13 - Source contract depth dense package

## Release ID

`2026-09-13-source-contract-depth-dense-package`

## Status

`candidate`

## Plain-English Summary

Adds a governed dense contract-depth intake package and loader support for
contract anatomy, evidence/page citations, scope, commercial history,
performance, change records, and structured Optimize findings and levers. The
loader now rejects tenant or dataset identity drift and unsupported canonical
opportunity types before mutation, and carries finding-level rationale into the
corresponding opportunity record.

## Layer Impact

- **client-data-lane:** adds a synthetic, PHI-free source package with native
  contract, evidence, usage, scope, and optimization lanes.
- **client-data-lane:** normalizes the package into existing adapter families
  and preserves package, file, and row lineage.
- **client-data-lane:** writes the existing Source contract, evidence,
  observation, canonical-fact, and optimization objects; no product owns data.
- **global-control-lane:** layer-4 projections can render the dense contract tabs and
  governed Optimize context once the controlled data job succeeds.

## Client Applicability

- All clients: loader identity guard and structured adapter behavior.
- Specific clients: none.
- Internal only: operator load and proof workflow.
- Public/demo only: the synthetic contract-depth package.
- Feature flag: none.

## Changes Included

- `scripts/source/load-contract-depth-package.ts`
- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/load-contract-depth-package.test.ts`
- `src/lib/source/contract-depth-package/adapter.ts`
- `datasets/source/contract-depth/`
- `docs/governance/dataset-manifests/`
- `docs/source/SOURCE_CONTRACT_DEPTH_DATA_MODEL.md`

## QA / Validation

- Context-corpus manifest validation: passed.
- CSV structural validation across all source files: passed.
- Adapter and projection preview: passed.
- Contract-depth adapter and projection tests: passed.
- ESLint on changed TypeScript files: passed.
- CI ECL and repository governance checks: passed on the initial candidate;
  follow-up checks rerun after main rebase.
- A Layer 3 readback mismatch was intentionally rolled back before commit; the
  expected QBR fact count was corrected to count only populated fields,
  matching the writer's null handling.
- Layer 4 validation now treats zero unclaimed service credit as valid when the
  package has no service-credit evidence; positive-credit assertions remain
  required for packages whose Layer 3 evidence contains service-credit rows.
- The document-evidence companion now normalizes the dense package's clause
  schema (`clause_id`, `clause_type`, and `source_page_ref`) before writing
  document projections, with a regression test preventing undefined extraction
  identities from reaching the database.
- Azure data-plane load: pending this candidate's merge and ACA Job execution.
- Signed-in tab-by-tab product proof: pending the Azure load.

## Rollout Plan

Merge through the protected main PR lane. Build and deploy the exact merge SHA
through the repo-owned ACA deploy workflow. Run this package only through the
private ACA operator Job with one explicit tenant, dataset version,
idempotency key, and load run ID. Apply Layer 2, verify, apply Layer 3, verify,
load document evidence, apply Layer 4, verify, and then run Tower lineage
reconciliation. Companion packages must use separate load runs and are not
activated by this release because the current Layer-4 overlay has one
dataset-version slot per active run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded after the exact merge-SHA ACA deploy.
- ACA runtime invariant: template image, 100% traffic revision, and required
  worker images must match the approved digest.
- Worker image invariant: private operator Job uses the same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected Source routes and contract
  tabs.

## Rollback Plan

Revert the application PR through the protected PR lane and redeploy the prior
approved digest. The data package is isolated by tenant, dataset version, and
load run; do not delete data as a rollback shortcut. If the load readback or
quality gate fails, the transaction must roll back and the package remains
ineligible for product use.

## Audit Evidence

- PR and CI checks for the merge candidate.
- Package manifest and package SHA in the ACA proof bundle.
- Layer-2, Layer-3, document-evidence, Layer-4, and Tower readback outputs.
- ACA runtime invariant output for the exact deployed digest.
- Signed-in Source tab-by-tab smoke output.

## Known Gaps

Azure execution and live product proof are not asserted by this candidate
record. Original restricted contract PDFs are not stored in the public
repository; the included page-text rows are synthetic demo summaries. A
multi-package same-contract overlay remains a separate design change.
