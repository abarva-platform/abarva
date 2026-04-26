# TEN3 · Dedicated Tenant Deployment Blueprint

Slice ID: TEN3
Slice name: Dedicated Tenant Deployment Blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane E (controlled multi-agent build)
Type: Architecture document and pure read model. No application
runtime change, no migrations, no provisioning automation, no
model calls.

This document is the canonical statement of how AbarVa onboards a
**Tier 2 (Enterprise SaaS / Dedicated Tenant)** customer onto
AbarVa-managed infrastructure with **dedicated** isolation
boundaries: a per-tenant database, a per-tenant object storage
bucket, per-tenant vector and graph namespaces, a per-tenant
model gateway policy, a per-tenant audit log boundary, customer
SSO federation, a named tenant administrator separate from AbarVa
platform admins, a deterministic onboarding sequence, and the
operational responsibilities (upgrades, maintenance windows,
backup / retention, secret rotation, cost observability,
offboarding, incident response) that AbarVa accepts for a
dedicated tenant.

TEN3 is the **shape contract** for dedicated-tenant deployment.
It sits alongside TEN1 (tenancy architecture) and TEN2 (isolation
enforcement). TEN3 does **not** displace either — it inherits
TEN1's tier vocabulary and TEN2's isolation level ladder and
records what changes when a tenant graduates from Tier 1 (shared)
to Tier 2 (dedicated).

This document does **not** change the current single-tenant Vercel
+ Supabase deployment posture. It defines the **target** so every
later slice (TEN3 successor provisioning, CLOUD2 / CLOUD3 lab
acceptance, ADM* admin surfaces) can be evaluated against it.

---

## A. Purpose and scope

### Product principle

AbarVa promises that the product surface is identical across
every tier (TEN1 §A). Tier differences live in the **data plane**,
the **model gateway**, and the **governance surface** — never in
the surface shape. Tier 2 (Dedicated) is the first tier where
those differences become **physical at the namespace level**: a
tenant's database, storage, vector index, graph store, gateway
policy, and audit stream are dedicated, even though the
application runtime remains shared.

### Scope of this contract

- Defines **dedicated database options**: per-tenant Postgres
  Flexible Server (default) or schema-per-tenant inside a managed
  Postgres pool (fallback).
- Defines **dedicated storage**: per-tenant blob container or
  per-tenant S3 bucket with managed-identity access.
- Defines **per-tenant vector and graph namespaces**: how the
  TEN2 vector and graph boundaries narrow at Tier 2.
- Defines the **per-tenant model gateway policy**: which providers
  are acceptable, which keys are used, where calls originate, and
  where audit lands.
- Defines the **audit log boundary**: dedicated tenant audit
  stream (or row-scoped audit with strong filter guarantees) with
  tenant-scoped retention.
- Defines **customer SSO integration**: per-tenant IdP
  federation (Google Workspace, Microsoft Entra ID, Okta, custom
  SAML) and the rules that keep AbarVa platform admins out of
  tenant identity.
- Defines **tenant admin**: who owns the admin role inside the
  customer organization and how it is separated from AbarVa
  platform admins.
- Defines the **deterministic onboarding sequence** (initialize
  tenant record → provision data stores → wire SSO → seed roles →
  register tenant admin → activate gateway policy → enable audit
  boundary → set up agents → verify smoke).
- Defines the **upgrade strategy**: rolling, per-tenant
  maintenance windows, with the tenant admin in the loop.
- Defines the **backup / retention** posture: tenant-scoped
  backups, contracted retention, restore tests.
- Defines the **cost / ops** considerations.

### Out of scope for this contract

- The provisioning automation itself (deferred to a later TEN3
  successor that wires the runbook into `Steward` admin actions
  and the deployment topology of CLOUD1 / CLOUD2 / CLOUD3).
- Live tenant isolation enforcement (covered by TEN2 successor
  slices that wire the boundaries into the runtime).
- Cloud topology, region selection, network egress, DNS, and
  rollback paths (covered by CLOUD1, CLOUD2, CLOUD3).
- Data trust posture, classification, retention windows, DPA /
  BAA wording, and the agent data access policy (covered by
  TRUST1, TRUST2).
- Billing, metering, contract terms, and pricing.
- Tier 3 (Private Data Plane) and Tier 4 (Self-Managed) — TEN3
  scopes the **dedicated** isolation mode only.

---

## B. The Tier 2 deployment envelope

A Tier 2 tenant runs inside the **same AbarVa-managed runtime
plane** as Tier 1 tenants but on **dedicated** data evidence and
gateway namespaces. The four-plane decomposition (TEN1 §C) is
preserved exactly:

- **Control plane.** AbarVa-managed; sees only metadata about the
  Tier 2 tenant; never reads tenant content.
- **Tenant runtime plane.** AbarVa-managed; renders the canonical
  surfaces; resolves the tenant key on every request and binds
  every subsequent read / gateway call / audit emission to that
  tenant key.
- **Data evidence plane.** Tier-2 dedicated. Per-tenant database,
  per-tenant storage bucket, per-tenant vector namespace, per-
  tenant graph namespace, per-tenant audit stream.
- **Model gateway plane.** Shared image, **per-tenant policy**.
  Gateway resolves the tenant policy (allowlist, rate limit,
  audit destination) on every invocation; calls without a
  tenant key are rejected.

The TEN3 read model encodes this envelope at
`src/lib/architecture/dedicated-tenant-blueprint.ts` as a single
`DedicatedTenantDeploymentEnvelope` value with default isolation
level `database_isolated` and fallback `schema_isolated` (both
drawn from the TEN2 ladder).

---

## C. Dedicated database options

### C.1 Default — per-tenant Postgres Flexible Server

A managed Postgres Flexible Server (or equivalent regional
managed Postgres offering) is provisioned **per tenant**. The
tenant's relational rows (programs, deliverables, evidence ledger
entries, mission records, work objects, audit rows, pattern
detections) live in this dedicated database. Tenant separation is
**physical at the database level**; no other tenant has any
connection to this database.

- Public network access disabled by default.
- Connections only via the AbarVa runtime, through a tenant-bound
  client factory that resolves the database from the tenant
  registry.
- BYOK encryption optional per provisioning contract (TRUST1
  governs the trust posture).

### C.2 Fallback — schema-per-tenant inside a managed Postgres pool

When a per-tenant database is not commercially viable (e.g., a
small Tier 2 tenant graduating up from Tier 1), the fallback is a
**dedicated schema** inside a managed Postgres pool with
**deny-by-default RLS** policies and the same tenant-bound client
factory. This fallback maps to the TEN2 `schema_isolated`
boundary. It is honestly weaker than `database_isolated` and is
recorded as such in the blueprint readiness state (`contract_only`
today).

### C.3 What never changes between default and fallback

- The tenant_key column is `NOT NULL` on every tenant-scoped
  table.
- Every read goes through a tenant-bound helper that binds
  `tenant_key` at the call site.
- Every persisted state change emits a unified audit event
  carrying the tenant key.

---

## D. Dedicated storage

A **per-tenant blob container** (default: cloud blob storage,
managed-identity access, public network access disabled) holds
the tenant's uploaded artifacts, generated deliverable bytes, and
exported reports. The fallback is a **per-tenant S3-style bucket**
with a bucket policy bound to the tenant principal.

- Signed URLs are tenant-scoped and time-bounded.
- No code path may construct a storage client without a tenant
  key.
- Every artifact read or write emits an `evidence_used` or
  `deliverable_generated` audit event with the tenant key.

The dedicated bucket maps to the TEN2 storage boundary at the
`database_isolated` isolation level.

---

## E. Vector and graph namespaces per tenant

### E.1 Vector

Tier 2 tenants get a **dedicated vector namespace** inside the
managed pgvector index by default, with a dedicated external
vector index as fallback. The TEN2 vector boundary
(`mandatoryFilterField: 'tenant_key'`) narrows at Tier 2: the
namespace itself is dedicated, not just the filter. The TEN2
isolation level for the vector store at Tier 2 is
`schema_isolated`.

- Vector helpers refuse to run without a resolved tenant key.
- Cross-tenant retrieval is forbidden.
- Every retrieval emits an `evidence_used` audit event with the
  tenant key and the namespace identifier.

### E.2 Graph

Tier 2 tenants get a **dedicated graph namespace** inside the
managed pg-graph store by default, with a dedicated external
graph database as fallback. The TEN2 graph boundary
(`tenantPropertyName: 'tenant_key'`) narrows at Tier 2: every
node and edge belongs to the dedicated namespace; traversals
refuse to cross namespaces.

- Graph helpers require the tenant key on every traversal.
- Knowledge fabric writes emit a `tool_invocation` or
  `governance_decision` audit event with the tenant key.

---

## F. Per-tenant model gateway policy

The gateway image is **shared**; the **policy is per-tenant**.
Each Tier 2 tenant has a `gatewayProfile` in the tenant registry
(TEN1 §E.1) that names:

- **Acceptable providers.** Generic at the contract layer (e.g.,
  "high-context reasoning", "long-form synthesis"). The actual
  provider mapping happens inside the gateway and is never
  surfaced to tenant code.
- **Provider keys.** AbarVa-owned at Tier 2 (per TEN1 §G.4 and
  CLOUD1). BYOK is **optional** at Tier 2.
- **Where calls originate.** Tier 2 calls originate inside the
  AbarVa runtime; they do **not** originate in customer
  infrastructure (that is Tier 3).
- **Audit destination.** Dedicated tenant audit stream (or
  row-scoped audit with strong filter guarantees). Decided at
  provisioning.
- **Rate limits.** Per-tenant.
- **Allowlist.** Per-tenant; the gateway refuses calls that
  resolve to a model lane outside the allowlist.

The gateway resolves the tenant policy on every invocation; calls
without a resolved tenant key are rejected. The TEN2
`model_gateway` boundary at the `environment_isolated` level
applies. **No agent imports a provider SDK directly** (ARCH1
§2.2); the gateway remains the single chokepoint.

---

## G. Audit log boundary

Tier 2 tenants get a **dedicated audit stream** by default — a
per-tenant log space with **tenant-scoped retention** and
**tenant-scoped export**. The fallback is a **shared audit ledger
row-scoped on tenant key** with an enforced per-tenant filter on
every read; this fallback is honestly weaker and is recorded as
such in the blueprint readiness state.

- Every unified audit event (TEN1 §G.3, AUD2) carries the tenant
  key.
- Audit readers require a tenant filter on every read.
- Audit export tooling refuses an empty tenant key.
- Cross-tenant audit reads are forbidden.

Retention: configurable per tenant, with a default of the longest
contracted retention across the Tier 2 tenants AbarVa serves at
any given time. The actual retention window is tenant-specific
and recorded in the tenant registry; this document does not name
a default in days.

---

## H. Customer SSO integration

Tier 2 tenants federate to **their own identity provider**. The
tenant registry's `idpProfile` field names the IdP — Google
Workspace, Microsoft Entra ID, Okta, or custom SAML. SCIM is
optional at Tier 2; MFA is optional but strongly recommended.

- Tenant users authenticate against their IdP, not against AbarVa
  platform sign-in.
- AbarVa platform admins **cannot** sign in as tenant users.
- A just-in-time access flow for AbarVa support operators is
  **not** part of Tier 2 (that is Tier 3 — see TEN1 §G.1).
- Custom roles are supported on top of the canonical built-in
  role set (admin, maestro, client viewer, data owner, governance
  reviewer, executive sponsor).

---

## I. Tenant admin

The customer names a **tenant administrator** in writing. The
tenant admin holds the `admin` role inside the customer tenant.
**AbarVa platform administrators do not hold any role inside the
customer tenant.** This separation is enforced by the tenant SSO
profile and audited at every privileged action.

- AbarVa platform admins operate the **control plane** (tenant
  registry, lifecycle actions, deploy / readiness manifests).
- The customer tenant admin operates the **tenant runtime plane**
  inside the customer's tenant (programs, deliverables,
  intelligence, source, solution, admin / steward surfaces).
- Joint operations require an explicit operator action and an
  audit row.

---

## J. Onboarding sequence

The deterministic onboarding sequence is encoded in the read
model as nine steps with contiguous `sequence` numbers and the
TEN3 step kinds:

1. **`initialize_tenant_record`** — write the canonical tenant
   registry record (tenantId, tenantSlug, displayName, tier,
   isolationMode, governancePosture, region, lifecycleState =
   `provisioning`).
2. **`provision_data_stores`** — provision the per-tenant
   database, object storage container, vector namespace, and
   graph namespace; bind each to the tenant registry record.
3. **`wire_customer_sso`** — wire the customer IdP into the
   tenant SSO profile.
4. **`seed_tenant_roles`** — seed the canonical role set and any
   contracted custom roles.
5. **`register_tenant_admin`** — register the named customer-side
   administrator.
6. **`activate_model_gateway_policy`** — bind the tenant gateway
   profile (allowlist, rate limit, audit destination).
7. **`enable_audit_boundary`** — enable the dedicated tenant
   audit stream (or row-scoped audit with strong filter
   guarantees).
8. **`set_up_agents`** — bind the canonical agentic spine to the
   tenant namespace.
9. **`verify_tenant_smoke`** — run the deterministic tenant-smoke
   harness; lift `lifecycleState` from `provisioning` to `active`.

Each step records `responsibleParties`, `preconditions`, and
`postconditions`. The validator (`validateDedicatedTenantBlueprint`)
rejects any sequence that is non-contiguous or that omits a
canonical step kind.

---

## K. Upgrade strategy

AbarVa rolls runtime upgrades **per tenant in a rolling fashion**,
never simultaneously across all tenants. Tenants in elevated
lifecycle states (e.g., a regulated audit window) opt out of a
given wave.

- An upgrade wave touches **at most one tenant at a time**.
- Each tenant has a contracted **maintenance window**; out-of-
  window changes require the tenant admin's named approval in
  writing.
- Every tenant upgrade emits a `governance_decision` audit event
  in the tenant audit stream with the upgrade revision and
  rationale.

This is the Tier 2 instance of the operational responsibility
matrix in CLOUD1 §6 (operational responsibilities). At Tier 2,
upgrades are owned by **AbarVa platform**, not the customer.

---

## L. Backup and retention

AbarVa runs **tenant-scoped backups** of the per-tenant database,
storage bucket, vector namespace, and graph namespace. Retention
follows the **contracted tenant retention** recorded in the
tenant registry.

- Daily backup of each tenant data store.
- Tenant export available on request.
- Restore tests run on cadence; restore tests emit a
  `tool_invocation` audit event in the tenant audit stream.
- Disaster recovery RPO and RTO are documented per tenant; the
  annual DR exercise is contracted.
- Multi-region active-active is **explicitly deferred** per
  TEN1 §K.

---

## M. Cost and ops considerations

- AbarVa tracks **per-tenant runtime cost** (compute, storage,
  vector / graph capacity, gateway model spend) and surfaces it
  to the tenant admin.
- The control plane sees only **metadata** about per-tenant cost
  — no per-tenant content is exposed to the AbarVa control plane.
- Cost rollups emit a `readiness_update` audit event in the
  tenant audit stream.
- Secret rotation runs every 90 days at most; emergency rotation
  on any signal of compromise.
- Tenant offboarding is a **deterministic runbook**: export,
  decommission, registry retirement; the tenant registry record
  moves to `retired` and is **never reused**.
- Incident response runs with the tenant admin in the loop;
  tenant content is not shared with parties outside the tenant
  during incident handling.

---

## N. Risks

### N.1 Cross-tenant leak from a misconfigured shared client

**Risk.** A code path that opens a database / storage / vector /
graph client without going through the tenant-bound factory could
read another tenant's namespace. This is the same risk TEN1 §J.5
names ("implicit tenancy in code").

**Mitigation.** Every entry point goes through a tenant-bound
factory that resolves the namespace from the tenant registry on
entry. Direct shared-client imports are forbidden. TEN2's
boundary contract is the structural assertion; TEN3 names how
that contract narrows at Tier 2.

### N.2 Gateway policy drift

**Risk.** A Tier 2 tenant's gateway profile drifts from the
contracted allowlist (e.g., a new model lane is added without the
tenant admin's approval). This would silently expand the model
surface the tenant pays for and is exposed to.

**Mitigation.** The gateway resolves the policy on every
invocation; the tenant admin sees gateway policy changes in the
tenant audit stream; founder approval is required to change the
allowlist.

### N.3 Tenant admin is also an AbarVa employee

**Risk.** A customer names an AbarVa employee as their tenant
admin. This collapses the admin separation that Tier 2 promises.

**Mitigation.** Tenant admin registration runbook requires a
**named customer-side individual**; AbarVa employees are
explicitly disallowed from holding tenant admin roles inside
customer tenants.

### N.4 Backup window misses a tenant store

**Risk.** A backup runner that backs up the database but forgets
the storage bucket / vector / graph namespace would leave the
tenant exposed on a restore.

**Mitigation.** The backup runbook treats the four data stores as
a **single tenant-scoped backup unit**; a backup is not complete
until all four stores have been backed up; restore tests verify
all four.

### N.5 Tier 2 promised before V1 milestone is met

**Risk.** A customer is told they can be onboarded as a Tier 2
tenant before the V1 milestone (TEN1 §I.2) has been met. This
would force AbarVa to onboard a paid Tier 2 tenant onto a
production posture that is not yet built.

**Mitigation.** TEN3 readiness is `contract_only` until the V1
milestone is met. The blueprint readiness checklist (§J of the
read model) names every blocker explicitly. No Tier 2 tenant is
provisionable until the checklist clears.

---

## O. Non-goals

The following are **explicitly not goals** of TEN3:

- **No Tier 3 (Private Data Plane) coverage.** TEN3 is the
  dedicated-tenant blueprint only. Tier 3 (customer-owned data
  plane) and Tier 4 (self-managed) live in CLOUD1 and successor
  CLOUD slices.
- **No multi-region active-active.** Tier 2 is single-region per
  tenant in V1; multi-region is deferred per TEN1 §K.
- **No customer-controlled gateway.** A customer-controlled
  gateway is a Tier 3 / Tier 4 concern (TEN1 §G.4); Tier 2 uses
  the AbarVa shared gateway with a per-tenant policy.
- **No BYOK requirement at Tier 2.** BYOK is optional at Tier 2
  and required at Tier 3.
- **No surface differences.** The product UI is identical between
  Tier 1 and Tier 2; tier differences live in the data plane,
  the gateway, the audit boundary, and the SSO posture.
- **No silent tier downgrade.** A Tier 2 tenant cannot move back
  to Tier 1 without explicit operator action and an audit row
  (TEN1 §K).
- **No model-training over tenant content.** Tenant content is
  never used to train, fine-tune, or distill a model. This is a
  TRUST1 commitment that TEN3 inherits.

---

## P. Cross-references

- **TEN1** — `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md`
  — the four-tier × four-plane × three-isolation-mode architecture
  contract. TEN3 inherits TEN1's tier vocabulary and refers to
  the tenant registry, the tenant data namespace, the per-tier
  expectations, and the MVP / V1 / V2 progression.
- **TEN2** — `src/lib/architecture/tenant-isolation-boundary.ts`
  — the tenant isolation enforcement read model. TEN3 references
  the TEN2 isolation level ladder via a type-only import; TEN3
  does not duplicate the boundary catalog.
- **TRUST1** — `src/lib/admin/dataset-trust-model.ts` /
  `docs/build/slices/TRUST1_DATASET_TRUST_MODEL.md` — the dataset
  trust model + sharing levels. TEN3 inherits TRUST1's trust
  ladder; tenant content classification is governed by TRUST1.
- **TRUST2** — `src/lib/admin/agent-data-access-policy.ts` /
  `docs/build/slices/TRUST2_AGENT_DATA_ACCESS_POLICY_MATRIX.md`
  — the agent data access policy matrix. TEN3 names the tenant-
  bound enforcement; TRUST2 names the per-agent / per-purpose
  access matrix that the gateway and the runtime tool dispatcher
  consume.
- **CLOUD1** — `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md`
  — the four-tier enterprise deployment strategy. TEN3 narrows
  CLOUD1's Tier 2 row into a deployment blueprint with
  deterministic onboarding and operational responsibility shape.
- **CLOUD2** — `docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md`
  — the Azure VNet reference lab blueprint. TEN3 is the
  dedicated-tenant deployment shape; CLOUD2 names the lab path
  through which a private-VNet AbarVa shell is validated. A
  CLOUD3 GCP VPC reference lab is named in CLOUD1 and is the
  symmetric path on GCP.
- **MG2** — `docs/build/slices/MG2_MODEL_GATEWAY_STUB.md` — the
  model gateway stub contract. TEN3 names how the gateway plane
  composes per-tenant at Tier 2; MG2 names the gateway interface.
- **AUD2** — `docs/build/slices/AUD2_UNIFIED_AUDIT_EVENT_READ_MODEL.md`
  — the unified audit event read model. TEN3 names the per-tenant
  audit destination; AUD2 names the audit event shape.
- **ARCH1** — `docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md`
  — the agentic platform contract. TEN3 inherits ARCH1's
  non-negotiable principles (every output traces to evidence,
  agents never call providers directly, the agentic spine is
  shared across tiers, the surface is calm).

---

## Q. Acceptance criteria

The contract is satisfied when every later Tier 2 provisioning
slice can be tested against the following criteria. Promotion of
TEN3 to `verified` requires:

1. **Six canonical store kinds.** `database`, `storage`,
   `vector`, `graph`, `model_gateway`, `audit` are the only store
   kinds; later slices refer to these names.
2. **Nine canonical onboarding step kinds in contiguous order.**
   The onboarding sequence is contiguous 1..9 with the canonical
   step kinds; the validator rejects any non-contiguous or
   incomplete sequence.
3. **Eight canonical operational surfaces.** Upgrade strategy,
   maintenance windows, backup retention, disaster recovery,
   secret rotation, cost observability, tenant offboarding, and
   incident response are the only operational surfaces.
4. **Five canonical readiness checklist categories.** Data plane,
   identity, governance, operations, cost.
5. **Five canonical readiness states.** `contract_only`,
   `lab_validated`, `pilot_ready`, `enterprise_ready`, `deferred`.
6. **Default and fallback options are explicit.** Every data
   store names both a default and a fallback option.
7. **No false production-ready claim.** The serialized blueprint
   never contains the substring `production_ready`.
8. **Determinism.** `buildDedicatedTenantBlueprint` is byte-equal
   across repeated calls.
9. **Validator is total.** Every required field on every entity
   is checked; missing kinds, missing surfaces, missing checklist
   categories, non-contiguous sequences, and wrong `createdFrom`
   tags all fail validation.
10. **Cross-references consistent.** TEN1, TEN2, TRUST1, TRUST2,
    CLOUD1, CLOUD2 are referenced and the relationship between
    this document and each is named.

---

## R. Status

Code complete. Pending founder review for promotion to
`verified`.

## S. What `verified` requires

- Founder confirms the dedicated-tenant deployment shape reflects
  the intended commercial / operational shape of Tier 2.
- Founder signs off on the dedicated database options (§C), the
  dedicated storage shape (§D), the per-tenant vector and graph
  namespaces (§E), the per-tenant model gateway policy (§F), the
  audit log boundary (§G), the customer SSO posture (§H), the
  tenant admin separation (§I), the onboarding sequence (§J),
  the upgrade strategy (§K), the backup / retention posture (§L),
  the cost / ops considerations (§M), the risks (§N), and the
  non-goals (§O).
- Founder confirms the cross-reference plan (§P) — that TEN1,
  TEN2, TRUST1, TRUST2, CLOUD1, and CLOUD2 are the right peers,
  in the right order.
