# TEN1 · AbarVa SaaS Tenancy Architecture

Slice ID: TEN1
Slice name: SaaS Tenancy Architecture Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole, Lane A)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract is the canonical statement of how AbarVa is delivered
as a multi-tenant SaaS product, what tiers it offers, what runtime
planes compose the platform, and how tenant isolation is enforced
across each tier. It is the **architecture peer** to ARCH1 (agentic
platform), CLOUD1 (deployment topology), TRUST1 (data trust posture),
and TEN2 (tenant isolation enforcement). It does **not** displace
those contracts — it sits above them and names which planes,
isolation modes, and data namespaces apply per tier.

ARCH1 governs **what AbarVa is**. ARCH2 governs **how a request
flows**. TEN1 governs **where each tenant lives**, **what is shared
vs dedicated vs private**, and **what each tier promises about
data, models, and governance**.

This contract does **not** add infrastructure, does **not** add
provisioning code, and does **not** change the current single-tenant
Vercel + Supabase deployment posture. It defines the target
architecture so every later slice (TEN2, CLOUD1, TRUST1, ADM*) can
be evaluated against it.

---

## A. Purpose and scope

### Product principle

AbarVa is a **multi-tenant agentic intelligence platform**. A
prospect must be able to start on a low-friction shared SaaS tier,
graduate to a dedicated SaaS tier, lift into a private data plane
when regulated data demands it, and (eventually) self-manage in
their own cloud — **without** changing the product surface, the
agentic spine, the evidence model, or the tenant isolation
contract.

Tenancy is not "settings." Tenancy is the **load-bearing axis** that
governs:

- where tenant data lives (which database, which storage, which
  vector index, which graph store);
- which model gateway path serves the tenant's work objects;
- which control-plane operator can see the tenant;
- which audit trail records the tenant's events;
- which SSO / RBAC / governance posture applies.

The same agent contracts, the same canonical surfaces, the same
deterministic read models must hold across **every** tier. Tier
differences must be visible in the data plane, the model gateway,
and the governance surface — never in the product UI shape.

### Scope of this contract

- Defines the **four canonical SaaS tiers** AbarVa supports.
- Defines the **four canonical runtime planes** (control plane,
  tenant runtime plane, data evidence plane, model gateway plane).
- Defines the **three canonical isolation modes** (shared,
  dedicated, private).
- Defines the **tenant registry** as the load-bearing source of
  truth for tenancy.
- Defines the **tenant data namespace** as the unit of isolation
  inside the data evidence plane.
- Defines the **per-tier expectations** for SSO, RBAC, audit, and
  the model gateway.
- Defines the **MVP / V1 / V2 progression** for the architecture.
- Defines the **risks and explicit non-goals**.
- Cross-references **TEN2** (isolation enforcement), **CLOUD1**
  (deployment topology), **TRUST1** (data trust posture).

### Out of scope for this contract

- Tenant-isolation enforcement code (deferred to TEN2).
- Cloud topology, region selection, network egress, and DNS
  (deferred to CLOUD1).
- Data trust posture, classification, retention, and DPA wording
  (deferred to TRUST1).
- Provisioning automation, IaC, or the tenant lifecycle state
  machine (deferred to a future TEN3+ slice).
- Billing, metering, contract terms, and pricing (deferred).
- Self-managed customer-cloud installer (deferred — see Tier 4).

---

## B. The four AbarVa tenancy tiers

AbarVa is offered in four canonical tiers. Tiers are ordered by
isolation strength and operational lift. A prospect typically
starts at Tier 1 and graduates upward as evidence sensitivity,
regulatory posture, or commercial scope demands it.

### Tier 1 — AbarVa SaaS Pilot

**Purpose.** Frictionless first-touch tier for prospects, design
partners, and early pilots. The fastest path from sign-up to
running a program against AbarVa's canonical surfaces.

**Isolation mode.** Shared (logical). Tenant data is row-scoped in
shared infrastructure under a single tenant key.

**Data plane.** Shared Postgres (Supabase), shared object storage,
shared vector index, shared knowledge graph. Cross-tenant reads
are blocked at the read-model layer (TEN2) and at the row-level
guard (`assertTenantAccess`).

**Model gateway.** Shared gateway with per-tenant routing keys.
All model calls audited to a shared `model_gateway_audit` ledger
keyed by tenant id.

**SSO / RBAC.** Clerk-managed sign-in. Built-in roles only
(admin, maestro, client viewer, data owner, governance reviewer,
executive sponsor). No custom IdP federation.

**Audit.** Shared audit ledger; per-tenant filter required on
every read.

**Governance posture.** Suitable for non-regulated, non-PII pilot
data. No HIPAA, no SEC-grade material, no resident-data residency
requirements.

**Surface differences.** None. Pilot tier renders the same canon
surfaces as every higher tier.

**Operator.** AbarVa control plane operates the tier; the tenant
admin operates only inside the tenant.

**Graduation.** Tier 1 graduates to Tier 2 when the tenant signs
a paid contract that requires a dedicated database / dedicated
encryption keys / SSO federation, or when their evidence load
exceeds the shared-tier threshold.

### Tier 2 — AbarVa Enterprise SaaS / Dedicated Tenant

**Purpose.** Paid enterprise tenancy with dedicated isolation
boundaries inside AbarVa-managed infrastructure.

**Isolation mode.** Dedicated. The tenant gets its own database
schema (or its own database), its own object-storage bucket, its
own vector namespace, and its own graph namespace. Application
runtime remains shared but routes are tenant-scoped.

**Data plane.** Dedicated Supabase project (or dedicated schema
within a managed Postgres pool, decided at provisioning time);
dedicated object-storage bucket; dedicated vector index namespace;
dedicated graph namespace. No shared rows across tenants.

**Model gateway.** Shared gateway with per-tenant routing keys
and per-tenant rate limits. Optional per-tenant model allowlist
(e.g., only Anthropic, only Claude Sonnet 4.5+). Audit ledger is
either dedicated or row-scoped, decided at provisioning.

**SSO / RBAC.** SSO federation supported (Google Workspace,
Microsoft Entra ID, Okta). Custom roles allowed. Optional SCIM
provisioning. Optional MFA enforcement.

**Audit.** Dedicated tenant audit stream (or row-scoped read with
strong filter guarantees). Audit export supported.

**Governance posture.** Suitable for non-regulated enterprise
data, sensitive-but-not-restricted data, pre-public material.
Not appropriate for regulated PHI, SEC-restricted material, or
strict-residency data — those graduate to Tier 3.

**Surface differences.** None. Same canon surfaces.

**Operator.** AbarVa control plane operates the tier; the tenant
admin operates only inside the tenant.

**Graduation.** Tier 2 graduates to Tier 3 when the tenant
requires data residency, BYOK encryption, customer-managed keys,
HIPAA / FedRAMP / SEC-grade isolation, or a customer-owned cloud
account.

### Tier 3 — AbarVa Private Data Plane

**Purpose.** Regulated / high-security tenancy where the tenant's
data plane lives in customer-controlled infrastructure (or
AbarVa-managed but customer-owned cloud account) while the
control plane and product runtime remain AbarVa-managed.

**Isolation mode.** Private (data plane separation). Tenant data
never leaves the customer-owned data plane. The application
runtime executes either in a customer-owned VPC or in the AbarVa
runtime with strict outbound controls into the customer data
plane.

**Data plane.** Customer-owned database (Supabase Enterprise on
customer cloud, AWS RDS, GCP Cloud SQL, Azure Database for
Postgres), customer-owned object storage (S3, GCS, Azure Blob)
in the customer's region, customer-owned vector index (pgvector,
Pinecone Enterprise, Weaviate, Vespa) in the customer's region,
customer-owned graph store. BYOK encryption supported.

**Model gateway.** Customer's choice: (a) AbarVa shared gateway
with strict outbound model allowlist, or (b) customer-controlled
gateway routing to the customer's contracted model providers
(e.g., Anthropic on AWS Bedrock in the customer's account,
Azure OpenAI in the customer's tenant, Vertex AI in the
customer's project). All model calls audited to a tenant-private
audit stream.

**SSO / RBAC.** Customer IdP only (Okta, Entra ID, Ping, Auth0,
custom SAML). Customer-managed roles. SCIM mandatory. MFA
mandatory. Optional just-in-time access for AbarVa support
operators with full audit.

**Audit.** Tenant-private audit stream in the customer's data
plane. AbarVa control plane sees only metadata (tenant health
signals), never tenant content.

**Governance posture.** Suitable for HIPAA PHI, SEC-restricted
material, GDPR strict-residency, FedRAMP-aligned posture (not
yet certified). Suitable for material non-public information
under named DPA and signed BAA.

**Surface differences.** None at the product layer. The control
plane shows the tenant as a "private data plane" tenant and
exposes a thinner readiness signal (because tenant content is
not visible to the control plane).

**Operator.** AbarVa control plane operates the runtime; the
customer operates the data plane. Joint operations require
explicit just-in-time access with audit.

**Graduation.** Tier 3 graduates to Tier 4 when the customer
demands full air-gapped self-managed installation. Most Tier 3
customers stay at Tier 3.

### Tier 4 — AbarVa Self-Managed (later)

**Purpose.** Fully air-gapped or customer-operated AbarVa
deployment in the customer's own infrastructure. AbarVa ships
the runtime image; the customer operates it.

**Isolation mode.** Private (full self-host). No AbarVa-managed
control plane visibility. AbarVa support operates only via
customer-initiated tickets.

**Data plane.** Entirely customer-owned and customer-operated.

**Model gateway.** Entirely customer-owned and customer-operated.
The customer chooses every model provider, every routing rule,
every audit destination.

**SSO / RBAC.** Customer-owned IdP only.

**Audit.** Customer-owned audit pipeline.

**Governance posture.** Suitable for the most restricted use
cases (classified, defense, sovereign cloud).

**Surface differences.** None at the product layer.

**Operator.** Customer.

**Maturity.** **Deferred.** Tier 4 is named here as the canonical
target for self-managed installations but is not implemented in
MVP or V1. CLOUD1 will name the deferral explicitly.

---

## C. The four runtime planes

AbarVa decomposes into **four runtime planes**. Every tier maps
its tenants onto these four planes. Every later slice (TEN2,
CLOUD1, TRUST1, ADM*) must reference the canonical names below.

### C.1 Control plane

The plane AbarVa operators use to manage the platform. Owns
tenant lifecycle, tenant registry, tenant health, gateway health,
deploy health, and operator-grade audit. Always AbarVa-managed.
Never holds tenant content.

**Components.** Tenant registry; tenant lifecycle state machine
(provisioning, active, suspended, retired); operator dashboards;
gateway health; deploy health; build / readiness manifests;
operator audit.

**Tenant content access.** Metadata only. Never raw evidence,
never raw model output, never raw transcripts.

**Operator.** AbarVa.

### C.2 Tenant runtime plane

The plane that serves tenant requests. Renders the canon
surfaces (Programs, Tower, Intelligence, Source, Admin, Solution,
Patterns), composes Context Bundles, dispatches agent missions,
renders deterministic read models. Always houses tenant-bound
session state.

**Components.** Next.js application runtime; Server Components;
Server Actions; route handlers; canonical read models; agentic
spine (Nexus, Sentinel, Atlas, Steward); mission queue; pattern
detection runtime; solution composition runtime.

**Tenant content access.** Yes — but always scoped via the
tenant key resolved from the session and verified against the
tenant registry. Never reads cross-tenant.

**Operator.** AbarVa for Tier 1–3; customer for Tier 4. (Tier 3
runtime may run in a customer VPC under joint operations.)

### C.3 Data evidence plane

The plane that holds tenant data: relational rows, object files,
vector embeddings, knowledge graph edges, evidence ledger
entries, audit ledger entries, work-object state. The unit of
isolation is the **tenant data namespace** (§E).

**Components.** Postgres / Supabase; object storage; vector
index; knowledge graph; evidence ledger; audit ledger;
deliverable artifact registry; mission registry; pattern
registry.

**Tenant content access.** Tenant content **lives** here. Cross-
tenant reads are forbidden and enforced by RLS, schema
separation, namespace separation, and the read-model guard.

**Operator.** AbarVa for Tier 1; AbarVa for Tier 2 in dedicated
schema or dedicated DB; **customer** for Tier 3 and Tier 4.

### C.4 Model gateway plane

The plane that mediates every model call. No agent calls a
provider SDK directly (ARCH1 §2.2). The gateway resolves model
routing, applies per-tenant policy, audits the call, and returns
provider output to the tenant runtime. Tier-specific:

- **Shared gateway** (Tier 1, Tier 2): AbarVa-managed gateway,
  per-tenant routing keys, shared audit ledger row-scoped by
  tenant.
- **Tenant-bounded gateway** (Tier 2 optional, Tier 3): same
  gateway image, but per-tenant model allowlist, per-tenant rate
  limits, per-tenant audit stream.
- **Customer-controlled gateway** (Tier 3 optional, Tier 4):
  gateway runs in the customer's account; AbarVa runtime calls
  the customer's gateway endpoint with mTLS or signed requests.

**Components.** Routing layer; provider clients (Anthropic,
OpenAI, Bedrock, Vertex AI, Azure OpenAI); audit emitter;
content-policy filter; cost meter; cache; rate limiter.

**Tenant content access.** Yes (the call payload). Audit row
captures the call shape; policy filter inspects content for
disallowed patterns. Provider calls leave the gateway only after
policy passes.

**Operator.** AbarVa for Tier 1–2; joint or customer for Tier 3;
customer for Tier 4.

### C.5 Plane composition diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Control plane (AbarVa)                                      │
│   tenant registry · tenant lifecycle · operator audit       │
│   deploy / readiness / gateway health                        │
└──────────────┬──────────────────────────────────────────────┘
               │ (metadata only — no tenant content)
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Tenant runtime plane                                        │
│   surfaces · context bundle · agentic spine · missions      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│ Data evidence plane      │     │ Model gateway plane      │
│   postgres · storage ·   │     │   routing · provider     │
│   vector · graph ·       │     │   clients · audit ·      │
│   evidence · audit       │     │   policy · cost meter    │
└──────────────────────────┘     └──────────────────────────┘
```

The four planes compose for every tier; tier differences appear
in **where each plane runs**, **who operates it**, and **how
strong the isolation is**.

---

## D. Tenant isolation modes

Three canonical isolation modes. Every tenant in the registry
declares one. TEN2 is the slice that **enforces** these modes;
TEN1 is the slice that **defines** them.

### D.1 Shared isolation

- One physical database, one schema, one object-storage bucket,
  one vector index, one graph store.
- Tenant separation is **logical**: every row carries a
  `tenant_id`; every read enforces `tenant_id` via Postgres RLS
  policies and the runtime `assertTenantAccess` guard;
  cross-tenant joins are forbidden.
- Vector and graph queries carry a tenant-namespace filter on
  every call.
- Backups are shared; tenant export requires a tenant-scoped
  query.
- **Used by.** Tier 1.

### D.2 Dedicated isolation

- Tenant has a dedicated logical container inside AbarVa-managed
  infrastructure: dedicated Postgres schema **or** dedicated
  Supabase project; dedicated object-storage bucket; dedicated
  vector namespace; dedicated graph namespace.
- Tenant separation is **physical at the namespace level** but
  shared at the runtime level.
- Backups are tenant-scoped; tenant export is a snapshot of the
  dedicated namespace.
- BYOK encryption optional (per provisioning contract).
- **Used by.** Tier 2.

### D.3 Private isolation

- Tenant's data plane runs in customer-owned infrastructure (or
  in an AbarVa-managed but customer-owned cloud account).
- Tenant separation is **physical at the cloud account level**.
- AbarVa runtime accesses the customer data plane only through
  customer-approved network paths (PrivateLink, VPC peering,
  signed egress, mTLS).
- Backups, encryption, retention, and DR are customer-owned.
- BYOK mandatory.
- **Used by.** Tier 3 and Tier 4.

### D.4 Mode + tier matrix

| Tier | Isolation mode | Database | Storage | Vector | Graph | Audit |
|---|---|---|---|---|---|---|
| 1 — Pilot | shared | shared Postgres, RLS | shared bucket | shared index, namespace filter | shared graph, namespace filter | shared ledger, row-scoped |
| 2 — Enterprise | dedicated | dedicated schema or DB | dedicated bucket | dedicated namespace | dedicated namespace | dedicated stream or row-scoped |
| 3 — Private | private | customer DB | customer storage | customer index | customer graph | customer-owned audit |
| 4 — Self-managed | private (full) | customer DB | customer storage | customer index | customer graph | customer-owned audit |

---

## E. Tenant registry concept

The **tenant registry** is the canonical record of every AbarVa
tenant. It is the single source of truth that the control plane
and tenant runtime consult to resolve a tenant's tier, isolation
mode, data namespace, gateway routing key, IdP federation, and
governance posture.

### E.1 Registry contract (logical)

A registry record carries:

| Field | Meaning |
|---|---|
| `tenantId` | Stable, globally unique tenant identifier. Never reused. |
| `tenantSlug` | Human-readable url-safe slug (e.g., `apex-retail`). |
| `displayName` | Tenant display name. |
| `tier` | One of `pilot`, `enterprise`, `private`, `self_managed`. |
| `isolationMode` | One of `shared`, `dedicated`, `private`. |
| `dataNamespace` | Reference to the tenant's data namespace (§F). |
| `gatewayProfile` | Reference to the tenant's model gateway profile (allowlist, rate limit, audit destination). |
| `idpProfile` | Reference to the tenant's SSO / RBAC profile (Clerk org, Okta org, Entra tenant, custom SAML). |
| `governancePosture` | One of `non_regulated`, `enterprise_sensitive`, `regulated_phi`, `regulated_sec`, `restricted_residency`, `classified`. |
| `lifecycleState` | `provisioning`, `active`, `suspended`, `retired`. |
| `region` | Primary region (Tier 2+). |
| `createdAt`, `updatedAt` | Lifecycle timestamps. |
| `notes` | Operator-grade notes; never contains tenant content. |

The registry **never** holds tenant content. It holds only the
keys, references, and policy declarations needed to **route** to
the tenant's data plane and model gateway.

### E.2 Registry consumers

- **Control plane** reads the registry to render operator
  dashboards, apply lifecycle actions, and audit operator-grade
  events.
- **Tenant runtime** reads the registry on every request to
  resolve the tenant's data namespace and gateway profile from
  the session-bound tenant key.
- **Data evidence plane** is **not** a registry consumer; it
  enforces RLS and namespace separation independently.
- **Model gateway** reads the registry to resolve the tenant's
  gateway profile (allowlist, rate limit, audit destination).

### E.3 Registry residency

- Tier 1, Tier 2, Tier 3: registry lives in the AbarVa-managed
  control plane.
- Tier 4: registry of the customer's own AbarVa instance lives
  in the customer's control plane; AbarVa-managed registry
  records only that the customer instance exists.

### E.4 Registry change discipline

- The registry is the **first** thing provisioning writes and
  the **last** thing decommissioning clears.
- Any change to `tier`, `isolationMode`, `dataNamespace`, or
  `governancePosture` must trigger a control-plane audit row
  with named reason and operator.
- A tenant cannot move from a stronger isolation mode to a
  weaker one without explicit founder approval and an audit row.

---

## F. Tenant data namespace concept

The **tenant data namespace** is the unit of isolation **inside**
the data evidence plane. It is the load-bearing answer to "where
exactly does this tenant's data live?"

### F.1 What a namespace contains

A tenant data namespace contains, for one tenant:

- **Relational data** — the tenant's rows in the canonical tables
  (programs, deliverables, evidence ledger entries, mission
  records, work objects, audit rows, pattern detections).
- **Object data** — the tenant's uploaded artifacts, generated
  deliverable bytes, exported reports.
- **Vector data** — the tenant's chunk embeddings.
- **Graph data** — the tenant's knowledge graph edges (program
  → evidence → pattern → solution → outcome).
- **Audit data** — the tenant's audit ledger.

### F.2 Namespace shapes per isolation mode

| Mode | Relational | Object | Vector | Graph | Audit |
|---|---|---|---|---|---|
| shared | row scope on `tenant_id` | bucket prefix `t/{tenantId}/...` | namespace filter `tenant_id={tenantId}` | namespace filter | row scope |
| dedicated | dedicated schema or DB | dedicated bucket | dedicated index | dedicated graph | dedicated stream |
| private | customer DB | customer storage | customer index | customer graph | customer audit |

### F.3 Cross-namespace contract

- No surface, read model, agent, or pipeline may read across
  namespaces. The only exception is the **AbarVa control plane**
  reading **metadata only** (tenant health, registry state,
  gateway health) — never tenant content.
- Cross-tenant pattern aggregation (anonymized cohort patterns)
  is **deferred**. When implemented, it will run as a separate
  pipeline that emits anonymized aggregates to a dedicated
  control-plane namespace and is **explicitly opted into** per
  tenant in the registry.

### F.4 Namespace evidence + agent boundary

- An agent (Nexus / Sentinel / Atlas / Steward) runs **inside**
  one tenant namespace per request. The agent never opens a
  read against another namespace.
- Evidence citations (`E-###`) resolve only within the active
  tenant namespace. A pattern detection that names an "affected
  program" (I1) names only programs in the active tenant
  namespace.
- The model gateway always carries the active tenant's namespace
  identifier on the audit row.

---

## G. Per-tier expectations: SSO, RBAC, audit, model gateway

### G.1 SSO

| Tier | SSO option | Default IdP | Custom SAML | SCIM | MFA | JIT |
|---|---|---|---|---|---|---|
| 1 — Pilot | Clerk built-in | Clerk | no | no | optional | no |
| 2 — Enterprise | Clerk + federation | Clerk, Google Workspace, Entra ID, Okta | optional | optional | optional | no |
| 3 — Private | customer IdP only | customer Okta / Entra / Ping / Auth0 | yes | required | required | required, audited |
| 4 — Self-managed | customer IdP only | customer-owned | yes | required | required | required, audited |

### G.2 RBAC

| Tier | Role set | Custom roles | Per-program scoping | Per-dataset scoping |
|---|---|---|---|---|
| 1 — Pilot | built-in only | no | tenant-wide default | tenant-wide default |
| 2 — Enterprise | built-in + custom | yes | yes | yes |
| 3 — Private | customer-owned | yes | yes | yes |
| 4 — Self-managed | customer-owned | yes | yes | yes |

The **built-in role set** (admin, maestro, client viewer, data
owner, governance reviewer, executive sponsor) is identical
across tiers — Tier 2+ extends it with custom roles, never
replaces it.

### G.3 Audit

| Tier | Audit destination | Retention | Export | Tenant-only filter |
|---|---|---|---|---|
| 1 — Pilot | shared ledger, row-scoped | best effort | tenant-scoped query | required |
| 2 — Enterprise | dedicated stream or row-scoped | configurable | tenant snapshot | enforced |
| 3 — Private | customer audit pipeline | customer-owned | customer-owned | structural |
| 4 — Self-managed | customer audit pipeline | customer-owned | customer-owned | structural |

Every audit row, regardless of tier, includes the tenant
namespace identifier, the actor, the work-object reference, the
gateway audit reference (if a model call was made), and a
correlation id.

### G.4 Model gateway

| Tier | Gateway location | Model allowlist | Rate limit | Audit destination | BYOK |
|---|---|---|---|---|---|
| 1 — Pilot | AbarVa shared | platform default | shared, per-tenant key | shared ledger | no |
| 2 — Enterprise | AbarVa shared, tenant-bounded | per-tenant | per-tenant | dedicated stream or row-scoped | optional |
| 3 — Private | AbarVa shared with strict egress, or customer-controlled | customer-owned | customer-owned | customer-owned | required |
| 4 — Self-managed | customer-controlled | customer-owned | customer-owned | customer-owned | required |

In every tier, the agent never imports a provider SDK directly
(ARCH1 §2.2). The provider import remains a **single chokepoint**
inside the gateway image.

---

## H. What can run in shared SaaS vs dedicated SaaS vs private data plane

This is the load-bearing **feasibility table** for any new
capability proposed in a future slice. A capability that requires
a stronger isolation tier than the customer carries cannot ship
on that customer.

| Capability | Tier 1 (shared) | Tier 2 (dedicated) | Tier 3 (private) | Tier 4 (self-managed) |
|---|---|---|---|---|
| Program execution (Programs surface) | yes | yes | yes | yes |
| Pattern detection (Sentinel, I1) | yes (cohort-anonymized only if opted in) | yes | yes | yes |
| Executive brief composition (Atlas, S9g) | yes | yes | yes | yes |
| Solution composition (SOL*) | yes | yes | yes | yes |
| Deliverable artifact generation (PDEL*) | yes (Stub / Outline) | yes (Stub / Outline / Rich) | yes (Stub / Outline / Rich) | yes (Stub / Outline / Rich) |
| Evidence ledger ingest from non-PII data | yes | yes | yes | yes |
| Evidence ledger ingest from PHI | **no** | **no** | yes | yes |
| Evidence ledger ingest from SEC-restricted material | **no** | **no** | yes | yes |
| BYOK encryption | no | optional | required | required |
| Customer-controlled model gateway | no | optional | optional | required |
| Cross-tenant pattern aggregation | deferred | deferred | deferred (opt-in only) | n/a |
| Production observability into tenant content | metadata only | metadata only | metadata only | none (customer-owned) |
| Vector retrieval over tenant content | yes (shared index, namespace filter) | yes (dedicated index) | yes (customer index) | yes (customer index) |
| Knowledge graph queries over tenant content | yes (shared graph, namespace filter) | yes (dedicated namespace) | yes (customer graph) | yes (customer graph) |
| Custom SAML IdP | no | optional | required | required |
| Audit export to customer SIEM | no | optional | required | required |
| Strict-residency placement (single region) | no | optional | required | required |

**Reading the table.** A "no" means the capability is structurally
unsafe at that tier. A "deferred" means the capability is on the
roadmap but not yet built and cannot be claimed today. An
"optional" means the capability is supported but not default.

---

## I. MVP / V1 / V2 architecture progression

The four-tier × four-plane architecture is the **target**. The
current state of the platform sits at MVP. The progression below
names what is true today, what V1 must add, and what V2 reaches
for.

### I.1 MVP (today)

- Single-region Vercel deployment of the Next.js application
  runtime.
- Single shared Supabase Postgres carrying all tenant rows.
- Tenant separation is logical via `tenant_id` and the runtime
  `assertTenantAccess` guard plus existing RLS policies.
- Object storage shared (Supabase storage); vector index shared
  if any (today the platform is largely deterministic and the
  live vector path is honestly absent).
- Knowledge graph is not yet implemented as a separate store;
  graph relationships exist as relational rows.
- Model gateway exists as a contract (MG2) with no live provider
  binding. No agent imports a provider SDK directly today.
- Audit ledger contract exists (AUD2); production-grade tenant-
  bounded audit persistence is deferred.
- Tenant registry is **implicit** — tenants are discovered from
  `tenants` rows; there is no explicit registry record carrying
  tier, isolation mode, gateway profile, or governance posture.
- Only Tier 1 is operationally available. Tier 2+ is **not yet
  provisionable**.

**MVP risk surface.** A regulated tenant cannot be onboarded
honestly today. The control plane / tenant runtime / data
evidence plane / model gateway plane separation is **logical**
in the codebase but not enforced as separate deployments.

### I.2 V1 (next milestone)

- **Explicit tenant registry record** carrying tier, isolation
  mode, data namespace, gateway profile, IdP profile, governance
  posture, lifecycle state, region.
- **Tier 2 provisionable** with dedicated Supabase project per
  tenant, dedicated object-storage bucket, dedicated vector
  namespace, dedicated graph namespace.
- **Live model gateway** with per-tenant routing keys, per-tenant
  audit, content-policy filter, cost meter, rate limiter. Single
  chokepoint for provider SDK imports.
- **TEN2** enforces tenant isolation at every read-model entry
  point with structural namespace separation rather than only
  row-level RLS where possible.
- **Production-grade audit ledger** with tenant-scoped retention.
- **CLOUD1** documents the Vercel + Supabase deployment topology
  with explicit region selection, DNS, and rollback path.
- **TRUST1** documents the data trust posture (classification,
  retention, DPA, BAA placeholder, sub-processor list).
- SSO federation supported on Tier 2 (Google Workspace, Entra
  ID, Okta).
- Tier 3 is **named** but not yet provisionable; Tier 4 remains
  deferred.

### I.3 V2 (later)

- **Tier 3 provisionable** with customer-owned data plane in
  customer cloud accounts (AWS, GCP, Azure). BYOK mandatory.
  Customer IdP only.
- **Tenant-bounded model gateway** option for Tier 3 with
  customer-controlled provider routing (Bedrock in customer
  account, Vertex AI in customer project, Azure OpenAI in
  customer tenant).
- **HIPAA / SEC / strict-residency posture** with named
  certifications or attestations.
- **SIEM / audit export** to customer-owned destinations (Splunk,
  Datadog, custom S3).
- **Cross-tenant cohort patterns** as opt-in only, emitted to a
  dedicated control-plane namespace, with anonymization
  guarantees documented in TRUST1.
- **Tier 4 (self-managed)** offered in a constrained shape:
  customer operates the runtime and the data plane; AbarVa ships
  the runtime image and the seed pack of canonical patterns,
  failure modes, and solution archetypes.

The V2 frontier is regulated industries (healthcare payers /
providers, financial services, public sector, defense suppliers).

---

## J. Risks

### J.1 Cross-tenant leak

The single largest risk. Every plane must defend against it:

- **Data evidence plane.** Row-level RLS + namespace separation +
  read-model guard. Test coverage on the read-model boundary is
  non-negotiable (see TEN2).
- **Tenant runtime plane.** Session-bound tenant key resolution
  must not be derivable from URL alone; URL parameters must be
  validated against the session.
- **Model gateway plane.** Audit row carries tenant namespace
  identifier on every call; gateway refuses calls that arrive
  without a resolved tenant context.
- **Control plane.** Operator-grade reads of tenant content are
  forbidden; the control plane sees only metadata.

### J.2 Misclassified tier

A tenant signed up at Tier 1 that later loads regulated data is
a structural violation. Mitigations:

- Steward surfaces **governance posture** on every tenant page
  and refuses to lift a dataset to `usable_as_evidence` if the
  governance posture does not permit the dataset's classification.
- Provisioning sets `governancePosture` at sign-up; uplift
  requires an explicit operator action and an audit row.

### J.3 Provider lock-in

The model gateway centralizes provider imports. The risk is that
the gateway grows so opinionated about one provider (Anthropic
today) that switching is expensive. Mitigations:

- Gateway interface is provider-agnostic at the call layer;
  per-provider clients are isolated.
- Solution and pattern packs **never** name a provider — they
  name a model class (e.g., "high-context reasoning", "long-form
  synthesis", "code-generation").
- Per-tier model allowlist is a registry concern, not a code
  concern.

### J.4 Customer-cloud operational drift

Tier 3 (and Tier 4) lives partly in customer infrastructure.
Operational drift (the customer's database fell behind, the
customer's gateway is mis-configured) is a real risk. Mitigations:

- AbarVa control plane sees **health metadata** from Tier 3
  tenants (gateway health, data plane reachability, audit pipe
  health) without seeing tenant content.
- Joint operations runbook (CLOUD1 / TRUST1) names the support
  paths and the just-in-time access flow.

### J.5 Implicit tenancy in code

Today's runtime treats tenancy as a row scope. As Tier 2 lands,
the runtime must learn to compose tenant-bounded read paths,
tenant-bounded gateway calls, and tenant-bounded audit emission
from the registry rather than from hard-coded shared
infrastructure. Risk: a code path that reads from "the database"
without resolving the tenant's namespace will silently leak.

Mitigation: every database / storage / vector / graph access
must go through a **tenant-scoped client** factory that resolves
the namespace from the registry on entry; direct shared-client
imports are forbidden once V1 lands. (TEN2 enforces this.)

### J.6 Knowledge fabric maturity

The knowledge graph and the production evidence ledger are
honestly absent today (data_evidence_knowledge_fabric is at
`scaffolded`). The four-plane separation is therefore **partial**
in MVP. Tier 2+ requires the data evidence plane to be
production-grade. Mitigation: V1 explicitly blocks Tier 2
provisioning until the data evidence plane is production-ready.

---

## K. Non-goals

The following are **explicitly not goals** of TEN1, and any
later slice that proposes them must do so in its own contract:

- **No multi-region active-active.** Tier 1–2 are single-region
  per tenant in V1; multi-region is deferred.
- **No real-time cross-tenant analytics.** Cross-tenant cohort
  patterns are deferred and opt-in only when they land.
- **No tenant-content visibility from the control plane.** The
  control plane sees only metadata. There is no "look inside
  this tenant" operator capability.
- **No sub-tenant hierarchy in MVP / V1.** Each tenant is flat.
  Customer org structure can be expressed via roles and program
  scoping, not sub-tenants. Sub-tenant hierarchy is a V2+
  conversation.
- **No on-prem deployment in MVP / V1.** Tier 4 is the canonical
  target for on-prem / self-managed and is V2+ at the earliest.
- **No customer-owned source code.** AbarVa runtime is not
  open-sourced; Tier 4 ships a runtime image, not a code drop.
- **No model-training over tenant content.** Tenant content is
  never used to train, fine-tune, or distill a model. This is a
  TRUST1 commitment that TEN1 inherits.
- **No silent tier downgrade.** A tenant cannot move from
  dedicated to shared, or from private to dedicated, without an
  explicit operator action and an audit row.
- **No surface differences between tiers.** The product UI is
  identical across tiers. Tier differences live in the data
  plane, the gateway, and the governance surface — never in the
  surface shape.

---

## L. Cross-references

- **ARCH1** (`docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md`)
  — the agentic platform contract. TEN1 inherits ARCH1's
  non-negotiable principles (every output traces to evidence,
  agents never call providers directly, the agentic spine is
  shared across tiers, the surface is calm).
- **ARCH2** (`docs/architecture/ARCH2_NEXUS_END_TO_END_EXECUTION_FLOW.md`)
  — the end-to-end execution flow. TEN1 names the planes through
  which an ARCH2 request flows.
- **ADM1** (`docs/build/slices/ADM1_STEWARD_SETUP_ADMIN_CONTROL_PLANE_CONTRACT.md`)
  — the admin / Steward control-plane contract. TEN1 names the
  control plane that ADM1 surfaces; ADM1 surfaces the registry
  fields TEN1 defines.
- **TEN2** (planned) — tenant isolation enforcement. TEN2 is the
  enforcement peer of TEN1: namespace separation in the data
  evidence plane, namespace-bounded clients in the tenant runtime
  plane, namespace-tagged audit in the model gateway plane,
  test coverage on the read-model boundary.
- **CLOUD1** (planned) — deployment topology. CLOUD1 is the
  deployment peer of TEN1: which cloud accounts, which regions,
  which DNS, which network paths, which rollback path serve each
  tier's planes.
- **TRUST1** (planned) — data trust posture. TRUST1 is the
  governance peer of TEN1: classification, retention, DPA, BAA,
  sub-processor list, residency commitments, model-training
  prohibition, audit export rights.
- **MG2** (`docs/build/slices/MG2_MODEL_GATEWAY_STUB.md`) — the
  model gateway stub contract. TEN1 names how the gateway plane
  composes per tier; MG2 names the gateway interface.
- **AUD2** (`docs/build/slices/AUD2_UNIFIED_AUDIT_EVENT_READ_MODEL.md`)
  — the unified audit event read model. TEN1 names per-tier audit
  destinations; AUD2 names the audit event shape.
- **EVID2 / EVID3** — the evidence ledger and claim-support
  contracts. TEN1 names the evidence ledger as a data evidence
  plane component; EVID2 / EVID3 name its shape.

---

## M. Acceptance criteria

The contract is satisfied when every later tenancy / cloud /
trust slice can be tested against the following criteria.
Promotion of TEN1 to `verified` requires:

1. **Four canonical tiers named.** `pilot`, `enterprise`,
   `private`, `self_managed` are the only tiers; later slices
   refer to these names.
2. **Four canonical planes named.** `control plane`, `tenant
   runtime plane`, `data evidence plane`, `model gateway plane`
   are the only planes; later slices refer to these names.
3. **Three canonical isolation modes named.** `shared`,
   `dedicated`, `private` are the only modes; later slices refer
   to these names.
4. **Tenant registry contract named.** Required fields are
   enumerated and a later TEN slice can implement them without
   re-deriving the field set.
5. **Tenant data namespace contract named.** Per-mode shape
   matrix is explicit (relational, object, vector, graph, audit).
6. **Per-tier expectations explicit.** SSO, RBAC, audit, and
   model gateway expectations are tabulated per tier.
7. **Feasibility matrix explicit.** Capability × tier table
   names which capabilities are safe at which tier.
8. **MVP / V1 / V2 progression explicit.** Today's posture, the
   next milestone, and the V2 frontier are named separately.
9. **Risks and non-goals explicit.** Every named risk has at
   least one mitigation; every non-goal is an explicit refusal.
10. **Cross-references consistent.** TEN2, CLOUD1, TRUST1, ADM1,
    ARCH1, ARCH2, MG2, AUD2, EVID2/3 are referenced and the
    relationship between this contract and each is named.

---

## N. Status

Code complete. Pending founder review for promotion to
`verified`.

## O. What `verified` requires

- Founder confirms the four-tier model reflects the intended
  commercial / operational shape of the product.
- Founder signs off on the four-plane decomposition (§C), the
  three isolation modes (§D), the tenant registry fields (§E),
  the tenant data namespace shape (§F), the per-tier
  expectations (§G), the feasibility matrix (§H), and the
  MVP / V1 / V2 progression (§I).
- Founder confirms the risks (§J) and non-goals (§K) reflect
  intent.
- Founder confirms the cross-reference plan (§L) — that TEN2,
  CLOUD1, TRUST1 are the right peers, in the right order.
