# CLOUD6 · Enterprise Dependency Matrix

Slice ID: CLOUD6
Document type: Architecture / dependency matrix contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Wave3 Lane B
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls, no
infrastructure-as-code, no provisioning.

This document is the canonical statement of **which AbarVa
dependency capabilities are available where, today, across the five
canonical deployment targets**. It maps each capability axis
(frontend hosting, compute, postgres, blob, secrets, IdP,
observability, vector search, graph, model gateway, CI/CD) onto each
deployment target axis (Vercel SaaS, Azure VNet, GCP VPC, AWS
Private, On-Prem Air-Gapped) and records the readiness today.

CLOUD6 governs **dependency mapping**. CLOUD1 governs deployment
strategy. CLOUD2 / CLOUD3 (forward) govern the Azure / GCP lab
paths. CLOUD5 ships the Bicep IaC starter. TEN1 / TEN2 / TEN3 govern
tenant isolation and the dedicated-tenant blueprint. ARCH1 governs
platform architecture. MG2 / MG3 govern the model gateway contract.

CLOUD6 makes no live cloud claim. CLOUD6 does not deploy anything.
CLOUD6 records the **shape** every later cloud / pilot / production
slice inherits.

---

## 1. Axes

### 1.1 Capability axis (11 entries, ordered)

1. `frontend_hosting` · Where the Next.js app and edge functions run.
2. `compute` · Where application compute (functions, agents) runs.
3. `postgres` · The operational Postgres data plane.
4. `blob` · Object storage for deliverables and artifacts.
5. `secrets` · Secret management (gateway keys, IdP secrets, etc.).
6. `idp` · Identity provider / SSO federation.
7. `observability` · Logs, metrics, traces.
8. `vector_search` · Vector retrieval index for evidence.
9. `graph` · Knowledge graph index.
10. `model_gateway` · The model gateway runtime.
11. `ci_cd` · CI / CD pipeline.

### 1.2 Deployment target axis (5 entries, ordered)

1. `vercel_saas` · AbarVa Tier 1 SaaS on Vercel + AbarVa-owned data
   plane. The only tier that runs in production-like form today.
2. `azure_vnet` · Customer Azure subscription, private VNet topology.
   CLOUD2 + CLOUD5 cover the lab path and Bicep starter.
3. `gcp_vpc` · Customer GCP project, private VPC topology. CLOUD3
   forward slice will land the lab blueprint.
4. `aws_private` · Customer AWS account, private VPC topology.
   Forward only; no lab blueprint or IaC starter exists today.
5. `on_prem_air_gapped` · Customer-operated infrastructure in an air-
   gapped network. CLOUD3 (docker runtime packaging) and CLOUD4
   (local private deployment lab) cover the container artifact.

### 1.3 Readiness states (4 entries)

- `available` · The capability runs in this target today.
- `preview` · The capability has a starter, blueprint, or scaffold
  but no live deploy is performed.
- `deferred` · The capability is forward; no slice has landed yet.
- `not_supported` · The capability cannot be honestly offered in
  this target today.

---

## 2. Matrix

| Capability ↓ / Target → | Vercel SaaS | Azure VNet | GCP VPC | AWS Private | On-Prem Air-Gapped |
| --- | --- | --- | --- | --- | --- |
| Frontend hosting | available · Vercel project | preview · Azure Container Apps (CLOUD5 starter) | deferred · Cloud Run | deferred · Fargate / App Runner | deferred · customer-operated K8s |
| Application compute | available · Vercel Functions | preview · Container Apps + managed identity | deferred · Cloud Run service | deferred · Fargate task | deferred · customer-operated K8s |
| Operational Postgres | available · managed Postgres pool | preview · Postgres Flexible Server (CLOUD5 starter) | deferred · Cloud SQL private IP | deferred · RDS in private VPC | deferred · customer-operated cluster |
| Object storage | available · managed blob bucket | preview · Storage Account + private endpoint | deferred · GCS + VPC SC | deferred · S3 + VPC endpoint | deferred · customer-operated MinIO |
| Secret management | available · Vercel encrypted env | preview · Key Vault private endpoint | deferred · Secret Manager + VPC SC | deferred · Secrets Manager + VPC endpoint | deferred · customer-operated Vault |
| Identity provider | available · AbarVa-owned Clerk | preview · Entra ID federated to Clerk | deferred · Workspace SAML | deferred · IAM Identity Center | deferred · customer-operated Keycloak |
| Observability | preview · Vercel logs + PostHog | preview · Log Analytics (CLOUD5 starter) | deferred · Cloud Logging | deferred · CloudWatch | deferred · customer-operated Loki / Prom |
| Vector search | preview · pgvector scaffold | deferred · pgvector in tenant Postgres | deferred · pgvector in Cloud SQL | deferred · pgvector in RDS | deferred · pgvector in customer Postgres |
| Knowledge graph | preview · Postgres-backed graph tables | deferred · graph tables in tenant Postgres | deferred · graph tables in Cloud SQL | deferred · graph tables in RDS | deferred · graph tables in customer Postgres |
| Model gateway | preview · AbarVa-owned gateway scaffold | deferred · customer-hosted gateway image | deferred · customer-hosted gateway in Cloud Run | deferred · customer-hosted gateway in Fargate | **not_supported** · no public model provider reachable; customer-approved local lane only |
| CI / CD | available · GitHub Actions + Vercel | preview · GH Actions + az bicep build (dry-run) | deferred · GH Actions + workload identity | deferred · GH Actions + OIDC | deferred · customer-operated runner |

The authoritative read model lives at
`src/lib/architecture/enterprise-dependency-matrix.ts`. The matrix
above mirrors each cell's `defaultOption` and `readiness`. Every
cell additionally records a `fallbackOption`, `notes`, and a
`followUp` describing what must land before the readiness
graduates.

---

## 3. Cell counts

- Total cells: 55 (11 capabilities × 5 deployment targets).
- Per target: each target has exactly 11 cells.
- Per capability: each capability has exactly 5 cells.
- All four readiness states appear at least once.

The `summarizeEnterpriseDependencyMatrix()` helper reconciles the
counts above; the test suite asserts the reconciliation byte-for-
byte across repeated calls.

---

## 4. What is explicitly out of scope

- CLOUD6 does **not** deploy anything. It does not call ARM, gcloud,
  aws CLI, kubectl, terraform, az, gh, or any vendor SDK.
- CLOUD6 does **not** modify application code, runtime, auth, the
  Model Gateway, the agent runtime, the evidence ledger, the audit
  ledger, supabase, migrations, package manifests, or platform-design
  docs.
- CLOUD6 does **not** promote `production_deployment` or any other
  readiness component. `production_deployment` remains `blocked`.
- CLOUD6 does **not** introduce vendor SDK keys, GUID-shaped
  subscription or tenant IDs, literal passwords, or PEM blocks. The
  read model contains only generic option strings.
- CLOUD6 does **not** authenticate or invoke any identity provider.
  The IdP capability row records the federation contract only.
- CLOUD6 does **not** push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick / merge.

---

## 5. Why this is safe

- The read model is a pure function of compile-time seed constants.
  `buildEnterpriseDependencyMatrix()` returns the same byte-equal
  JSON on every call — the determinism test asserts this.
- No `Date.now`, `Math.random`, `new Date(`, or `fetch(` appears in
  the module. The module-hygiene test asserts this with regex guards
  over the on-disk source.
- No vendor model name (`anthropic`, `openai`, `cohere`, `databricks`,
  `pinecone`) appears in the source or the serialized output. The
  test asserts this in both directions.
- No string in the serialized output claims `production_ready` or
  `production-ready`. The test asserts this against the lowercased
  serialization.
- The model-gateway × air-gapped cell is the only `not_supported`
  combination today. It records the honest reason: no public model
  provider is reachable from an air-gapped network, and AbarVa makes
  no live runtime claim for any vendor model in this configuration.

---

## 6. Forward use

- TEN3 onboarding sequences a tenant onto a target by selecting one
  cell per capability axis from this matrix.
- Pilot conversations with a customer in a non-`vercel_saas` target
  start by walking the relevant column and confirming readiness per
  capability cell.
- Future CLOUD slices (CLOUD3, CLOUD7) add cells or graduate
  readiness; the matrix shape remains stable.
- The `getNotSupportedCombinations()` helper returns the exact list
  of cells that must be re-architected (or the target must be
  declined) before a customer can run that target end-to-end.

---

## 7. How to re-run

1. TypeScript:
   `npx tsc --noEmit --pretty false`
2. Deterministic test suite:
   `npx jest src/__tests__/integration/architecture/enterprise-dependency-matrix.test.ts`
3. ESLint:
   `npx eslint src/lib/architecture/enterprise-dependency-matrix.ts src/__tests__/integration/architecture/enterprise-dependency-matrix.test.ts --max-warnings=0`
4. Re-parse manifest JSON:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
