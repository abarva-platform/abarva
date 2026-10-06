# 2026-09-14 — Source Contract Intelligence Provenance

## Release ID

`2026-09-14-source-contract-intelligence-provenance`

## Status

`candidate`

## Plain-English Summary

Adds a governed claim layer for Source contract optimization. Each commercial
statement now has an explicit basis, source references, scenario state, review
state, producer, and load-run lineage. The contract-intelligence read model no
longer classifies a contract from vendor category or invents a purpose sentence
when reviewed purpose context is absent.

## Layer Impact

Release lane: `client-data-lane` with shared read-path impact.

- L2: batch loaders retain the package and row lineage used to create claims.
- L3: adds opportunity claims, playbook rules, archetype sources, benchmark
  comparability fields, and deterministic validation constraints.
- L4: exposes claims through the Contract 360 optimization read model and
  includes claim basis in the Source aVa grounding packet.

## Client Applicability

- All clients: schema and read-path behavior are tenant-scoped and reusable.
- Specific clients: none.
- Internal only: loader diagnostics and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260914150000_source_contract_intelligence_provenance.sql`
- `supabase/migrations/20260914153000_source_contract_intelligence_read_model_hardening.sql`
- Source contract-depth and cloud-consumption loader claim projections
- Contract optimization read adapter claim projection
- Source aVa claim-level grounding and signal amount guard
- Deterministic contract-claim and arithmetic-formula validation
- `docs/governance/SOURCE_CONTRACT_INTELLIGENCE_DATA_MODEL.md`

## QA / Validation

- Targeted Source contract intelligence, projection, read-adapter, loader, and
  aVa tests pass locally.
- TypeScript compilation passes with `tsc --noEmit`.
- Cloud loader syntax passes with `node --check`.
- `git diff --check` passes.
- Azure data-plane batch reload: not run in this release candidate. It requires
  the approved ACA Job, package manifest, quality gate, and readback bundle.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deployment
workflow builds the exact merge SHA, applies the migrations through the normal
release lane, deploys a digest-pinned image, and performs the runtime invariant
check. After deployment, run the governed data-build job separately for each
approved package and capture Layer 2/3/4 readback before enabling any new
contract corpus as client-ready.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: template image, 100% traffic revision, and required
  worker images must match the approved digest
- Worker image invariant: governed data-build job image must be recorded in its
  proof bundle
- Feature/env flag update path: none
- Live signed-in proof required: Source portfolio and Contract 360 route, tabs,
  Optimize claims, and Source aVa contract context

## Rollback Plan

Revert the application commit through a new PR and restore the prior ACA
digest. The migrations are additive; `contract_intelligence_v1` remains
available as the compatibility read model while `v2` is withdrawn or repaired.
Do not delete claim rows during rollback. Reconcile them only through the
governed data-build job after the replacement model is approved.

## Audit Evidence

- PR and merge SHA
- CI results for Source tests, TypeScript, release checks, and migration checks
- ACA deployment run, image digest, revision, and runtime invariant output
- Data-build job idempotency key and proof bundle, when the reload is executed
- Signed-in Source tab-by-tab proof and Source aVa grounding readback

## Known Gaps

- Existing package calculation rules still require conversion from descriptive
  prose to independently evaluable arithmetic before any legacy candidate
  amount may become a calculated claim.
- Existing contract identity populations still require an authoritative mapping
  source before unmapped register headers can be classified.
- Benchmark sources remain explicitly absent until a reviewed comparable source
  is loaded.
