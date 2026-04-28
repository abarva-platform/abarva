# CLOUD6 - Enterprise Dependency Matrix

Slice ID: CLOUD6
Slice name: Enterprise Dependency Matrix
Status: code_complete
Authored: 2026-04-26
Primary agent: Wave3 Lane B
Depends on: CLOUD1, CLOUD2, CLOUD5, TEN3

## Purpose

CLOUD6 lands the **canonical read model** that maps each AbarVa
dependency capability (frontend hosting, compute, postgres, blob,
secrets, IdP, observability, vector search, graph, model gateway,
CI/CD) onto each canonical deployment target (Vercel SaaS, Azure
VNet, GCP VPC, AWS Private, On-Prem Air-Gapped). It records the
readiness today (`available` / `preview` / `deferred` /
`not_supported`) cell-by-cell.

CLOUD6 is a **read model** and a **document-only contract**. It does
NOT deploy. It does NOT call any cloud SDK, ARM, gcloud, aws CLI,
kubectl, terraform, az, or vendor model provider. It does NOT modify
application code, the runtime, auth, the Model Gateway, the agent
runtime, the evidence ledger, the audit ledger, supabase, migrations,
package manifests, or platform-design docs. It does NOT promote
`production_deployment` or any other readiness component.

CLOUD6 complements:
- **CLOUD1** (deployment strategy contract) by giving every tier a
  per-capability readiness cell.
- **CLOUD2 / CLOUD5** (Azure lab path + Bicep starter) by recording
  exactly which Azure cells the starter advances to `preview`.
- **TEN3** (dedicated-tenant blueprint) by giving the per-tenant
  data plane a target-aware shape.

## What Changed

- New architecture document `docs/architecture/CLOUD6_ENTERPRISE_DEPENDENCY_MATRIX.md`
  authoring the matrix, axes (11 capabilities × 5 targets = 55 cells),
  readiness states, and the not-supported combination (model gateway
  × on-prem air-gapped).
- New deterministic read model
  `src/lib/architecture/enterprise-dependency-matrix.ts` exporting:
  - `DEPLOYMENT_TARGETS` and `DeploymentTarget` (5 entries).
  - `DEPENDENCY_CAPABILITIES` and `DependencyCapability` (11 entries).
  - `DEPENDENCY_READINESS_STATES` and `DependencyReadiness` (4 entries).
  - `DependencyMatrixEntry`, `EnterpriseDependencyMatrix`,
    `DependencyMatrixSummary` interfaces.
  - `buildEnterpriseDependencyMatrix()`,
    `summarizeEnterpriseDependencyMatrix()`,
    `getNotSupportedCombinations()` helpers.
  - Every entry carries `createdFrom: 'deterministic_enterprise_dependency_matrix_seed'`.
- New deterministic Jest suite
  `src/__tests__/integration/architecture/enterprise-dependency-matrix.test.ts`
  asserting:
  - All 5 deployment targets present.
  - All 11 capabilities present.
  - All 4 readiness states representable.
  - Byte-equal determinism across repeated `buildEnterpriseDependencyMatrix`
    and `summarizeEnterpriseDependencyMatrix` calls.
  - Coverage: every capability × target pair appears exactly once
    (55 unique cells); every entry id is stable
    (`matrix-{capability}-{target}`); every cell has non-empty
    `defaultOption`, `fallbackOption`, `notes`, `followUp`, `label`.
  - Summary reconciliation: `entriesByTarget`, `entriesByCapability`,
    and `entriesByReadiness` sum to `totalEntries`; per-target
    counts equal the capability count; per-capability counts equal
    the target count.
  - `getNotSupportedCombinations` returns only `not_supported` rows
    and reconciles with the summary.
  - Module hygiene: no `Date.now` / `Math.random` / `new Date` /
    `fetch`; no auth / supabase / source / sentinel / atlas / nexus
    / agent imports; no vendor model names; no `useState` /
    `useEffect`; no placeholder language; no dollar amounts; no
    `production_ready` / `production-ready` claims.
- New slice contract
  [docs/build/slices/CLOUD6_ENTERPRISE_DEPENDENCY_MATRIX.md](./CLOUD6_ENTERPRISE_DEPENDENCY_MATRIX.md)
  (this file).
- `docs/build/build-slices.json` appends a CLOUD6 entry with this
  slice's `allowedFiles`, `forbiddenFiles`, `validationCommands`,
  `dependsOn` (CLOUD1, CLOUD2, CLOUD5, TEN3), `status`
  `code_complete`, `risk` `low`, and `ownerAgent` Wave3 Lane B.
  Manifest top-level `lastUpdated` is bumped to `2026-04-26`.
- `docs/build/production-readiness.json` updates the
  `production_deployment` component:
  - One UNIONed note row recording that the CLOUD6 enterprise
    dependency matrix has landed as a deterministic read model
    covering 55 cells.
  - `nextAction` UNIONed conservatively to acknowledge the matrix
    landing; prior PROD1 / PROD2 / PROD3 / PROD4 / OPS1 / TEN1 /
    TEN2 / CLOUD1 / CLOUD2 / OPS2 / CLOUD5 wording is preserved
    verbatim.
  - The component `status` is preserved (`blocked`, NOT promoted)
    because no resource has been deployed and the matrix only
    records readiness; it does not change it.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, gate statuses, dimensions, and
    blockers are unchanged.
  - Manifest top-level `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- CLOUD6 does not run any cloud CLI command. It does not authenticate,
  it does not provision resources, it does not call ARM, gcloud,
  aws CLI, kubectl, terraform, az, or gh.
- CLOUD6 does not author Bicep, Terraform, ARM JSON, `azd`, or shell
  deploy scripts. CLOUD5 owns the Azure starter; CLOUD3 (forward)
  will own GCP; AWS and air-gapped paths are forward-only.
- CLOUD6 does not promote `production_deployment` or any other
  readiness component.
- CLOUD6 does not modify application code, the runtime, auth, the
  Model Gateway, the agent runtime, the evidence ledger, the audit
  ledger, supabase, migrations, package manifests, or platform-design
  docs.
- CLOUD6 does not authenticate against any IdP, customer subscription,
  or AbarVa SaaS tenant. The IdP capability row records the
  federation contract only.
- CLOUD6 does not push, merge, or open a PR. Lane agents commit
  locally only; the integration agent owns cherry-pick / merge.

## Why It Is Safe

- The read model is a pure function of compile-time seed constants.
  `buildEnterpriseDependencyMatrix()` returns byte-equal JSON across
  repeated calls; the determinism test asserts this.
- No vendor SDK keys, GUID subscription or tenant IDs, literal
  passwords, or PEM blocks appear in the seed.
- The module-hygiene test asserts the source contains no `Date.now`,
  `Math.random`, `new Date(`, `fetch(`, vendor model names, React
  hook usage, placeholder language, dollar amounts, or
  `production_ready` / `production-ready` claims.
- The single `not_supported` cell (model gateway × on-prem air-
  gapped) carries an honest reason: no public model provider is
  reachable from an air-gapped network; the gateway can only resolve
  a customer-approved local model lane today.
- The manifest update is append-only at the note / nextAction level
  and does not change any component status, dimension, gate status,
  blocker list, or overall readiness percent.

## How To Re-Run

1. TypeScript:
   `cd /Users/anand/Projects/nexus-wave3-cloud6 && npx tsc --noEmit --pretty false`
2. Deterministic test suite:
   `cd /Users/anand/Projects/nexus-wave3-cloud6 && npx jest src/__tests__/integration/architecture/enterprise-dependency-matrix.test.ts`
3. ESLint:
   `cd /Users/anand/Projects/nexus-wave3-cloud6 && npx eslint src/lib/architecture/enterprise-dependency-matrix.ts src/__tests__/integration/architecture/enterprise-dependency-matrix.test.ts --max-warnings=0`
4. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION).
- Readiness / status changes: none. `production_deployment` stays
  `blocked`.
- Blockers added or removed: none. The existing
  `prod-deploy-verification` blocker remains in place.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior PROD1 / PROD2 / PROD3 / PROD4 / OPS1 / TEN1 / TEN2 / CLOUD1
  / CLOUD2 / OPS2 / CLOUD5 wording).
- Notes added: one row on `production_deployment` recording the
  CLOUD6 enterprise dependency matrix landing as a deterministic
  read model covering 55 cells (11 capabilities × 5 targets).
