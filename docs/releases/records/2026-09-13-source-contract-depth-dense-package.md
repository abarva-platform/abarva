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
corresponding opportunity record. The load also promotes the deterministic
contract-purpose summary into the canonical fact layer, while the Source read
path filters stale optimization rows to the active contract dataset.
The follow-up reader fix keeps the contract detail route on the same governed
tenant-compatible canonical read path as the other Source tabs, preventing a
valid loaded contract from appearing unavailable when the preferred canonical
tenant key returns no rows.

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
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `scripts/source/__tests__/load-contract-depth-package.test.ts`
- `src/lib/source/contract-depth-package/adapter.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`
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
- The contract record's deterministic purpose summary is written as a governed
  canonical text fact with package and source-document references.
- Direct Source impact reads only include optimization rows whose dataset
  version matches the currently loaded contract header, preventing old package
  rows from being merged into the active contract view.
- The Layer 3 expected-readback calculation includes the deterministic contract
  purpose fact written for each populated contract, so the transactional gate
  cannot reject a valid enriched package because its expected count is stale.
- Contract detail reads and Layer 4 summary projections now join evidence lanes
  to the active contract load run and dataset version, preventing historical
  rows from being mixed into the current contract tabs. Missing narrative fields
  may only be hydrated from governed facts in that same active version.
- The Layer 4 opportunity summary now carries the load-run identity from the
  projected action candidate rather than assuming the base opportunity table
  has that column. Aggregation, ranking, and the final contract join all use
  the active contract run, so the view can be rebuilt against the live schema.
- The Layer 4 active-run overlay is version-aware: its key is tenant, load run,
  and dataset version. Multiple package versions can therefore share an
  operator run without one activation overwriting the other, and contract
  headers must match the active dataset version before their facts are exposed.
- Contract-depth performance and ticket loaders preserve explicit source period
  dates and use the month field only as a fallback, preventing valid evidence
  rows from reaching Layer 3 with empty date values.
- Contract-depth spend normalization preserves explicit committed, invoiced,
  paid, and actual-spend fields while accepting the legacy commitment and
  spend aliases, so dense packages cannot pass planning but fail during apply.
- Contract-depth opportunity normalization preserves the package's explicit
  opportunity type, title, amount, confidence, evidence family, and action
  fields while accepting legacy aliases, so actionable rows remain governed
  instead of failing closed on an empty canonical type.
- Layer 3 reconciles canonical facts owned by the package before rebuilding
  them inside the existing transaction, preventing stale fact families from
  surviving a valid package refresh.
- The cloud-consumption loader applies the same version-aware overlay migration
  as the contract-depth projector, including re-keying an older run-only
  primary key before Layer 4 activation.
- Regression coverage verifies current-version spend, performance, document,
  optimization, and narrative reads, including the explicit aliasing required
  by the active-contract joins.
- Follow-up regression coverage verifies that a canonical-source miss falls
  back to the tenant-compatible governed reader instead of returning a false
  contract-not-found result.
- Azure data-plane load: completed through the private ACA Job with Layer 2,
  Layer 3, document evidence, and Layer 4 readbacks passing.
- Signed-in tab-by-tab product proof: completed for the Databricks dense
  synthetic contract; the package is synthetic demo content, not client truth.

## Rollout Plan

Merge through the protected main PR lane. Build and deploy the exact merge SHA
through the repo-owned ACA deploy workflow. Run this package only through the
private ACA operator Job with one explicit tenant, dataset version,
idempotency key, and load run ID. Apply Layer 2, verify, apply Layer 3, verify,
load document evidence, apply Layer 4, verify, and then run Tower lineage
reconciliation. Each package must still declare its own dataset version and
idempotency key; packages may share an operator run only when their source
contract headers and readbacks prove the versioned overlay remains disjoint.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: update to the exact digest produced by the final main
  deploy for this release candidate before recording live proof.
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

The loaded dense package covers one synthetic contract; it does not
classify or enrich the remaining register-only portfolio without authoritative
source mappings. Original restricted contract PDFs are not stored in the public
repository; the included page-text rows are synthetic demo summaries. A
multi-package same-run overlay now has version-aware storage, but the browser
serving projection still requires a separately reconciled ECL assessment slice
before it can be called the canonical read path for this package.
