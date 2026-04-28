# CLOUD1 · Enterprise Deployment Models

Slice ID: CLOUD1
Document type: Architecture / strategy contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane E (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls, no
infrastructure-as-code, no provisioning.

This document is the canonical statement of **how AbarVa is sold,
deployed, and operated across four enterprise tiers**, and how the
existing AbarVa SaaS dependency stack (Vercel · Supabase · Vercel
Blob · Clerk · Anthropic / OpenAI) maps onto each tier in the
client's chosen cloud.

CLOUD1 governs **deployment strategy**. ARCH1 governs **platform
architecture**. ARCH2 governs **execution flow**. TEN1 / TEN2 (when
landed) govern **tenant isolation**. TRUST1 / TRUST2 (when landed)
govern **client data trust**. MG2 governs the **model gateway
contract**. CLOUD2 / CLOUD3 (forward-reference) will land the
Azure VNet and GCP VPC lab paths.

CLOUD1 makes no live cloud claim. CLOUD1 does not deploy anything.
CLOUD1 records the **vocabulary** every later cloud / tenant /
trust slice inherits.

---

## 1. Tier vocabulary

AbarVa is sold and deployed in **four tiers**. The product surface
(Programs, Tower, Intelligence, Admin, Source) is identical across
tiers; what changes is **where data lives**, **where compute runs**,
**who owns the keys**, and **who carries the operational burden**.

### 1.1 Tier 1 · AbarVa SaaS (shared multi-tenant)

- **Topology** · One control plane, one shared data plane, many
  tenants. Each tenant is isolated at the read-model layer per
  TEN1 / TEN2 and at the request boundary per ARCH1 §S7.
- **Cloud** · AbarVa-owned Vercel project; AbarVa-owned Supabase
  Postgres + Storage; AbarVa-owned Vercel Blob; AbarVa-owned
  Clerk tenant; AbarVa-owned Anthropic / OpenAI keys.
- **Tenant identity** · Clerk org id → AbarVa tenant key.
- **Data co-residency** · Multiple client tenants share the same
  Postgres instance and the same Blob bucket. Row-level isolation
  is enforced by the application layer plus tenant-scoped read
  models. There is **no per-tenant database**.
- **Audience** · Mid-market; pilots; AbarVa-led demos; founder-
  facing operator surfaces.
- **Today's status** · This is the only tier that runs in
  production today (PROD1 / PROD2 / PROD3 tracker; status remains
  `blocked` until a founder-approved deploy verification lands).

### 1.2 Tier 2 · Dedicated Tenant (single-tenant on AbarVa infra)

- **Topology** · One control plane, **one tenant-dedicated** data
  plane, both inside AbarVa's cloud. Same code path as SaaS; the
  dedicated-tenant tag changes deployment topology, not product
  surface.
- **Cloud** · AbarVa-owned Vercel project (separate environment
  or a per-tenant project); **dedicated** Supabase Postgres
  instance for this tenant; **dedicated** Vercel Blob namespace;
  AbarVa-owned Clerk tenant (or a per-customer Clerk org).
- **Tenant identity** · Clerk org id → AbarVa tenant key (same
  contract as Tier 1).
- **Data co-residency** · One client per Postgres / Blob.
- **Audience** · Enterprise customers who require single-tenant
  isolation but accept AbarVa-owned cloud infrastructure.
- **Trust posture** · Data still resides in AbarVa's cloud
  account; AbarVa retains operational access. See §4.

### 1.3 Tier 3 · Private Data Plane (data + compute in client cloud)

- **Topology** · AbarVa control plane in AbarVa cloud; **data
  plane** (Postgres, blob, retrieval index, model egress, audit
  ledger) in the **client's** cloud subscription / project.
- **Cloud (Azure path)** · AbarVa control plane on Vercel;
  client-owned Azure Container Apps for the AbarVa application
  workload; client-owned Azure Postgres Flexible Server; client-
  owned Azure Blob; client-owned Azure AD B2C (or Entra ID)
  tenant; client-owned model contracts (Azure OpenAI, Anthropic
  via private link, or self-hosted) — see §7 for the lab path.
- **Cloud (GCP path)** · AbarVa control plane on Vercel; client-
  owned Cloud Run for the AbarVa application workload; client-
  owned Cloud SQL Postgres; client-owned GCS; client-owned
  Identity Platform; client-owned model contracts — see §8.
- **Tenant identity** · Client IdP (Azure AD B2C / Identity
  Platform / Okta / Ping) → AbarVa tenant key via OIDC.
- **Data residency** · Data never leaves the client cloud
  region. AbarVa's control plane never persists tenant content,
  only the **work-object metadata** required to coordinate
  upgrades and to render the canonical UI.
- **Audience** · Regulated enterprise (financial services,
  healthcare, public sector, EU data residency, Australia data
  sovereignty).
- **Trust posture** · Client owns the keys, owns egress, and
  approves AbarVa upgrade rollouts. See §4.

### 1.4 Tier 4 · Fully Self-Managed (client operates entire stack)

- **Topology** · Client owns control plane and data plane. AbarVa
  ships releases (signed container images + database migration
  bundles + canonical config) and runbooks; client operates.
- **Cloud** · Client choice (any major cloud).
- **Tenant identity** · Client IdP → AbarVa tenant key via OIDC.
- **Data residency** · 100% client cloud.
- **Audience** · Top-end enterprise; sovereign government;
  customers with mature platform engineering and a non-negotiable
  air-gap or non-shared-control-plane policy.
- **Trust posture** · AbarVa has no operational access. Support
  is delivered through customer-led screen-shares, log
  bundles, and version pinning.

---

## 2. Control plane vs data plane separation

The four tiers are coherent only if AbarVa has a **clean
separation** between control plane (what AbarVa runs centrally)
and data plane (where tenant content lives).

### 2.1 Control plane (AbarVa-owned in tiers 1–3)

- The web application shell (Next.js render path).
- The deterministic read-model code (Programs, Tower, Intelligence,
  Admin, Source surfaces).
- The model gateway service (MG2) and its routing / audit logic.
- The release pipeline (container images, migration bundles).
- Operator surfaces (admin tracker, dispatch queue, runbooks).

### 2.2 Data plane (per-tier ownership)

- **Postgres** · the tenant's persisted state (work objects,
  evidence ledger rows, audit events, programs, deliverables,
  Source events).
- **Blob storage** · raw artifacts, deliverable exports,
  ingestion drop zones.
- **Retrieval index** · vector / graph / keyword index over
  tenant content (when present).
- **Model egress path** · the network route from the
  application workload to model providers (and the keys used to
  authenticate).
- **Audit ledger** · the persisted record of every model call
  routed through MG2.

### 2.3 Trust boundary

In tiers **1 and 2**, the trust boundary lives **between** the
client browser and the AbarVa cloud. AbarVa is inside the
boundary.

In tier **3**, the trust boundary moves: AbarVa's control plane
is **outside** the client's data plane. Every cross-boundary call
(control → data) must:

- be initiated **from** the client cloud (the AbarVa workload
  inside the client cloud calls **out** to the AbarVa control
  plane for upgrade orchestration and telemetry; the AbarVa
  control plane does not call **in** to the client data plane);
- carry no tenant content payload (only signed manifests, release
  pointers, version metadata);
- be auditable from inside the client cloud's egress logs.

In tier **4**, AbarVa has no plane access whatsoever; the client
operates both planes.

---

## 3. Dependency replacement matrix

Every dependency in the AbarVa SaaS stack has at least one
private-cloud equivalent. The matrix below names the Tier 3
substitution per cloud, and the Tier 4 client-choice substitution.

| AbarVa SaaS dependency | Tier 1 (SaaS)        | Tier 2 (Dedicated)        | Tier 3 (Azure)            | Tier 3 (GCP)               | Tier 4 (Self-Managed)              |
| --- | --- | --- | --- | --- | --- |
| Web compute (Next.js)  | Vercel (AbarVa)      | Vercel (AbarVa, isolated) | Azure Container Apps      | Cloud Run                  | Client choice (k8s, ECS, etc.)     |
| Postgres               | Supabase (AbarVa)    | Supabase dedicated        | Azure Postgres Flexible   | Cloud SQL Postgres         | Client choice (Postgres-compatible) |
| Object storage         | Vercel Blob (AbarVa) | Vercel Blob (dedicated)   | Azure Blob (RA-GRS)       | GCS                        | Client choice (S3 / Blob / GCS)    |
| Auth / IdP             | Clerk (AbarVa)       | Clerk org per customer    | Azure AD B2C / Entra ID   | Identity Platform          | Client IdP via OIDC                |
| Model providers        | Anthropic / OpenAI direct (AbarVa keys) | Anthropic / OpenAI direct (AbarVa keys) | Azure OpenAI + Anthropic via Private Link | Vertex AI + Anthropic via Private Service Connect | Client-owned contracts |
| Secrets                | Vercel env + Supabase Vault | Vercel env (per-env) | Azure Key Vault           | GCP Secret Manager         | Client choice (Vault / KMS)        |
| Observability          | Vercel logs (AbarVa) | Vercel logs (dedicated)   | Azure Monitor / Log Analytics | Cloud Logging / Cloud Monitoring | Client choice                |
| CI / release pipeline  | GitHub → Vercel      | GitHub → Vercel           | GitHub → ACR → Container Apps | GitHub → Artifact Registry → Cloud Run | Client choice                |
| DNS                    | Vercel-managed       | Vercel-managed            | Client DNS + Azure Front Door | Client DNS + Cloud Load Balancing | Client DNS              |
| Network egress control | None (public)        | None (public)             | VNet + Private Link + NSG | VPC + PSC + VPC SC         | Client choice                      |

The matrix is **deliberately conservative**: every Tier 3 / 4 cell
names a managed service in the target cloud rather than a roll-
your-own component. The intent is that the client's platform team
recognizes every name in the row.

---

## 4. Client data trust implications per tier

The four tiers carry **four different trust postures**. These
postures are inherited by every later TRUST1 / TRUST2 contract.

### 4.1 SaaS (Tier 1)

- **Data location** · AbarVa cloud; one Postgres / Blob shared
  with other tenants.
- **Encryption keys** · AbarVa-owned (managed by Supabase /
  Vercel Blob).
- **AbarVa operational access** · Yes, for upgrades, rotations,
  incident response.
- **Auditability of AbarVa access** · AbarVa's internal audit
  trail (Vercel + Supabase logs).
- **Cross-tenant blast radius** · Mitigated by TEN1 / TEN2
  read-model isolation and by S7 tenant boundary checks.

### 4.2 Dedicated Tenant (Tier 2)

- **Data location** · AbarVa cloud; one Postgres / Blob
  dedicated to this tenant.
- **Encryption keys** · AbarVa-owned by default; customer-
  managed keys (CMK) optional via Supabase / Vercel Blob CMK
  features when GA.
- **AbarVa operational access** · Yes.
- **Cross-tenant blast radius** · Topologically zero (separate
  Postgres / Blob), regardless of read-model isolation.

### 4.3 Private Data Plane (Tier 3)

- **Data location** · Client cloud; client-owned Postgres / Blob
  / retrieval index.
- **Encryption keys** · Client-owned (Azure Key Vault / Cloud KMS
  / customer HSM). AbarVa never holds the data-plane key.
- **AbarVa operational access** · Strictly **opt-in** via
  client-controlled break-glass identity; default state is
  zero AbarVa access to the data plane.
- **Egress control** · Client-owned. Model calls flow through
  client-owned Private Link / Private Service Connect to model
  providers; client may reject any egress to public endpoints.
- **Cross-tenant blast radius** · None — this is a single-
  tenant data plane in the client's own cloud.
- **Compliance posture** · Compatible with GDPR, EU data
  residency, Australia data sovereignty, HIPAA (with client-
  configured BAA), and most public-sector regimes.

### 4.4 Fully Self-Managed (Tier 4)

- **Data location** · Client cloud, client-owned everything.
- **Encryption keys** · Client-owned.
- **AbarVa operational access** · None. Support is via customer-
  initiated screen-share or log bundle.
- **Compliance posture** · Whatever the client chooses to
  certify; AbarVa provides release attestations, not runtime
  attestations.

Cross-reference: TRUST1 (forward) will codify the contract a
client signs at each tier; TRUST2 (forward) will codify the
runtime checks AbarVa runs to keep its half of the contract.

---

## 5. Model gateway strategy per tier

The model gateway (MG2) is **non-negotiable** at every tier per
ARCH1 §2.2: agents never call providers directly. What changes
across tiers is **which providers are acceptable** and **where the
call originates**.

### 5.1 SaaS (Tier 1)

- **Acceptable providers** · Anthropic (default), OpenAI
  (fallback), AbarVa-internal scoring models when the gateway
  routes to a deterministic path.
- **Call origin** · AbarVa cloud (Vercel function execution).
- **Keys** · AbarVa-owned.
- **Audit** · Centralized in AbarVa's audit ledger.

### 5.2 Dedicated Tenant (Tier 2)

- **Acceptable providers** · Same as Tier 1 by default; per-
  tenant override possible (e.g., a customer that prohibits
  OpenAI).
- **Call origin** · AbarVa cloud, dedicated egress.
- **Keys** · AbarVa-owned, optionally per-tenant.
- **Audit** · Centralized; per-tenant log slice on request.

### 5.3 Private Data Plane (Tier 3)

- **Acceptable providers** · Client-defined allowlist. Common
  picks: Azure OpenAI in the client subscription, Anthropic via
  Private Link, Vertex AI in the client project, self-hosted
  open-weights model behind the client VPC.
- **Call origin** · **Client cloud** (the AbarVa workload running
  in Container Apps / Cloud Run makes the model call out through
  the client's egress path). Public-internet egress to a model
  provider is allowed only if the client's egress policy permits.
- **Keys** · Client-owned. The gateway reads keys from Key Vault
  / Secret Manager at request time.
- **Audit** · Local to the client cloud (Azure Monitor / Cloud
  Logging). AbarVa's central audit captures **only** that a
  call occurred + non-sensitive routing metadata, not payload.

### 5.4 Fully Self-Managed (Tier 4)

- **Acceptable providers** · 100% client choice.
- **Call origin** · Client cloud.
- **Keys** · Client-owned.
- **Audit** · 100% client-owned.

The gateway code path is the **same binary** in every tier; the
config (provider allowlist, key source, audit destination) is
tier-specific. This is the chokepoint that makes the four-tier
strategy operationally tractable.

---

## 6. Operational responsibilities per tier

| Responsibility               | Tier 1 (SaaS) | Tier 2 (Dedicated) | Tier 3 (Private DP) | Tier 4 (Self-Managed) |
| --- | --- | --- | --- | --- |
| Application upgrades         | AbarVa        | AbarVa             | AbarVa proposes, client approves window | Client pulls release |
| Database migrations          | AbarVa        | AbarVa             | AbarVa-authored, client-applied (or AbarVa-applied via approved break-glass) | Client-applied |
| Backups & restore drills     | AbarVa        | AbarVa             | Client                  | Client                |
| Secret rotation              | AbarVa        | AbarVa             | Client (data plane); AbarVa (control plane) | Client      |
| TLS / certificates           | AbarVa (Vercel) | AbarVa (Vercel)  | Client                  | Client                |
| Identity provider operation  | AbarVa (Clerk) | AbarVa (Clerk)   | Client IdP              | Client IdP            |
| Observability stack ownership | AbarVa       | AbarVa             | Client                  | Client                |
| Incident response            | AbarVa        | AbarVa             | Joint (runbook-led)     | Client                |
| Pen-test scheduling          | AbarVa        | AbarVa             | Client                  | Client                |
| SLA accountability           | AbarVa        | AbarVa             | Joint (split contract)  | None from AbarVa      |

The split is deliberately **stricter** at higher tiers: as the
client takes more control of the data plane, AbarVa shrinks its
operational footprint and its corresponding accountability. The
contract is honest — Tier 4 carries **no** AbarVa SLA on the
runtime stack.

---

## 7. Azure VNet lab path (forward-reference CLOUD2)

This section names what the **CLOUD2** slice will exercise end-to-
end in a controlled lab. CLOUD1 does not provision any of these
resources.

CLOUD2 acceptance:

- Terraform plan that provisions, in a non-production lab Azure
  subscription:
  - One resource group, one VNet with at least three subnets
    (app, db, private endpoints).
  - One Azure Container Apps environment with VNet integration.
  - One Azure Postgres Flexible Server in the db subnet, with
    Private Endpoint and no public access.
  - One Azure Blob Storage account with Private Endpoint.
  - One Azure Key Vault with Private Endpoint.
  - One Azure AD B2C tenant (or Entra External ID) configured
    for the AbarVa OIDC flow.
- A signed AbarVa container image deployed to Container Apps.
- AbarVa application boots, reads config from Key Vault, connects
  to Postgres and Blob via Private Endpoints, completes the
  health check, and renders a tenant page.
- Model gateway routes a single call to **Azure OpenAI** inside
  the same subscription via Private Link.
- Egress from the Container Apps environment is restricted by
  NSG to: Azure OpenAI Private Endpoint, Postgres Private
  Endpoint, Blob Private Endpoint, Key Vault Private Endpoint,
  AbarVa control-plane upgrade endpoint over HTTPS. Public
  internet egress is denied by default.
- Tear-down terraform leaves the subscription clean.

CLOUD2 is **lab only**. It is not a customer deployment. It is
not a promotion of `production_deployment`. Its acceptance is a
working `terraform plan` + `terraform apply` + AbarVa boot +
gateway call + tear-down, recorded in the CLOUD2 slice doc.

---

## 8. GCP VPC lab path (forward-reference CLOUD3)

CLOUD3 acceptance (mirror of CLOUD2 in GCP):

- Terraform plan that provisions, in a non-production lab GCP
  project:
  - One VPC with at least three subnets (app, db, private
    services).
  - Cloud Run service with VPC connector and ingress restricted
    to internal-and-load-balancer.
  - Cloud SQL Postgres instance with Private Service Connect.
  - GCS bucket with VPC Service Controls perimeter.
  - Secret Manager with VPC SC perimeter.
  - Identity Platform tenant configured for OIDC.
- AbarVa application boots, reads config from Secret Manager,
  connects to Cloud SQL and GCS through PSC / VPC SC, renders a
  tenant page.
- Model gateway routes a single call to **Vertex AI** in the
  same project, **or** to Anthropic via PSC.
- Egress restricted by VPC SC and firewall rules.
- Tear-down terraform leaves the project clean.

CLOUD3 is **lab only**, same posture as CLOUD2.

---

## 9. MVP / V1 / V2 path

The deployment-tier work lands in three honest steps.

### 9.1 MVP (today)

- Tier 1 (SaaS) only.
- The CLOUD1 strategy contract (this document) is in place.
- TEN1 / TEN2 / TRUST1 / TRUST2 contracts are forward-referenced.
- `production_deployment` remains `blocked` (PROD1 / PROD2 /
  PROD3 tracker).

### 9.2 V1 (next deployment-strategy cycle)

- TEN1 + TEN2 land — tenant isolation contract for shared and
  dedicated data planes.
- TRUST1 + TRUST2 land — client data trust contract per tier.
- CLOUD2 (Azure VNet lab) lands — terraform plan + AbarVa boot +
  gateway call + tear-down in a non-production Azure
  subscription.
- CLOUD3 (GCP VPC lab) lands — same shape in GCP.
- Tier 2 (Dedicated Tenant) becomes deployable on demand
  (single-tenant Vercel + Supabase project).
- `production_deployment` may move from `blocked` to `scaffolded`
  **only** with a founder-approved verification.

### 9.3 V2 (private deployment GA)

- First **paid** Tier 3 (Private Data Plane) deployment in a
  customer Azure or GCP subscription, using the lab terraform
  plans hardened for production.
- AbarVa control-plane upgrade orchestration (signed releases +
  approved windows) is operational.
- Tier 4 (Self-Managed) release bundle is shippable on demand,
  even if no customer has yet asked for it.
- `production_deployment` may be promoted further only with the
  PROD2 update protocol satisfied (no false promotions per
  AGENT_DISPATCH_OPERATING_MODEL §G/§H).

---

## 10. What can be tested outside the client environment

The honest split between **what AbarVa can validate alone** and
**what requires a client environment**.

### 10.1 Testable outside any client environment

- The CLOUD1 strategy contract itself (this document) — review,
  pattern check, cross-reference check.
- The dependency replacement matrix (§3) — cell-by-cell name
  check against published cloud product names.
- The model gateway tier configuration (§5) — config-shape
  check; no live calls.
- TEN1 / TEN2 read-model isolation tests — pure deterministic
  jest tests against synthetic tenants.
- TRUST1 / TRUST2 contract documents — review only.
- CLOUD2 / CLOUD3 terraform plans against an **AbarVa-owned**
  non-production lab subscription / project. The plan and the
  AbarVa-side hardening can be exercised end-to-end without ever
  touching a customer.
- The gateway routing path against **mock providers** — the
  same code path as production minus the network egress.

### 10.2 Requires a client environment

- A real Tier 3 deployment in a **customer** Azure subscription
  / GCP project.
- Customer-side IdP (Azure AD B2C / Entra ID / Identity
  Platform / Okta / Ping) integration with the customer's
  actual user directory.
- Customer-managed keys (CMK / Key Vault HSM) integration where
  the customer holds the unwrap rights.
- Customer egress policy enforcement (the customer decides
  which model providers are reachable).
- Customer-network DNS, certificate, and load balancer
  integration.
- Customer audit / SIEM ingestion of AbarVa-emitted audit
  events.
- Tier 4 upgrade orchestration validated against the customer's
  actual platform-engineering release process.

The boundary above is the **product release boundary**. AbarVa
can ship CLOUD1 / TEN1 / TEN2 / TRUST1 / TRUST2 / CLOUD2 /
CLOUD3 to the point of "lab green" without any customer access.
Promoting the work past that line — into a real Tier 3 customer
deployment — requires a customer environment and a customer
contract. AbarVa does not fabricate that promotion in the
tracker.

---

## 11. Cross-references

- `docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md`
  — non-negotiable platform principles. CLOUD1 honors §2.2
  (gateway chokepoint) and §S7 (tenant isolation).
- `docs/architecture/ARCH2_NEXUS_END_TO_END_EXECUTION_FLOW.md` —
  the runtime flow. CLOUD1 records that the four tiers preserve
  this flow without modification.
- `docs/build/slices/CLOUD1_ENTERPRISE_PRIVATE_DEPLOYMENT_STRATEGY.md`
  — slice contract for this document.
- TEN1 / TEN2 (forward) — tenant isolation contract for the four
  tiers.
- TRUST1 / TRUST2 (forward) — client data trust contract for
  each tier.
- CLOUD2 (forward) — Azure VNet lab path; §7 of this document.
- CLOUD3 (forward) — GCP VPC lab path; §8 of this document.
- MG2 — model gateway stub; CLOUD1 §5 names which providers are
  acceptable per tier and where calls originate.
- PROD1 / PROD2 / PROD3 — production readiness tracker, update
  rules, and live-refresh API. CLOUD1 records its impact on
  `production_deployment` per PROD2 (notes append + nextAction
  UNION; status preserved at `blocked`).
- AGENT_DISPATCH_OPERATING_MODEL §G / §H — append-only build-
  slices.json policy and conservative-status / union-notes /
  no-false-promotion production-readiness.json policy. CLOUD1
  conforms to both.
