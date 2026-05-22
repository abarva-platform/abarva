# Pilot Private Data Lane Runbook

Date: 2026-05-22
Status: reference runbook for the next pilot lane

## Purpose

This runbook defines how to stand up a new pilot client in AbarVa without
mixing private client data into the shared lab/demo lane. The model separates
the application control plane from each customer's private data lane.

## Default Architecture

| Layer | Recommended ownership | Purpose |
|---|---|---|
| Shared control plane | AbarVa subscription/resource groups | Application runtime, auth integration, deployment pipeline, shared observability, model gateway. |
| Customer private data lane | Separate subscription or dedicated resource group, depending on customer requirement | Private customer data stores, ingestion queues, private endpoints, customer-owned network peering, evidence storage. |
| Tenant isolation in app DB | Per-tenant keys and RLS | Product-level isolation and traceability. |
| Customer evidence boundary | Private storage, private queues, private search, private database | Keeps source documents, embeddings, and derived context out of shared demo fixtures. |

For early pilots, a dedicated resource group can be acceptable if the customer
does not require subscription-level separation. For regulated or large
enterprise pilots, use a separate subscription for the private data lane.

## What Gets Created Per Pilot

| Resource | Per-pilot? | Notes |
|---|---:|---|
| Tenant row and access roster | Yes | Use synthetic/client-safe name unless approved otherwise. |
| Azure Postgres tenant data | Yes | Apply schema first, then tenant seed/copy. |
| Storage container(s) | Yes | At minimum context-drop and processed/evidence containers. |
| Service Bus queues | Yes | Premium namespace or per-lane queues with private endpoint. |
| Event Grid subscription | Yes | Storage blob-created events to ingestion queue. |
| Azure AI Search indexes or tenant partitions | Yes | Use tenant-scoped records; separate service if required by customer. |
| Key Vault secrets | Yes | DB URLs, service endpoints, health token, optional provider keys. |
| Private endpoints/DNS | Yes | Required for customer/private data lane. |
| Managed identity RBAC | Yes | Scope to containers/queues/indexes, not broad accounts/namespaces. |
| Observability tags | Yes | Tenant/lane/resource tags for cost and audit. |

## Naming

Use customer-safe codenames unless legal/commercial approval allows the real
company name.

Recommended pattern:

```text
client display name: <Synthetic Industry Name>
tenant key: <lowercase-hyphenated-safe-name>
resource suffix: <safe-short-code>
```

Do not put real target-company names in:

- repo paths;
- seed files;
- public docs;
- demo fixture names;
- resource names;
- logs intended for screenshots or advisors.

## Setup Sequence

### 1. Intake and Scope

Capture:

- approved safe company name;
- pilot sponsor/personas;
- industry and tech-stack profile;
- top 1-3 economic pains to prove;
- source systems allowed for ingestion;
- security constraints;
- success metric and payment trigger;
- 90-day pilot fee and post-pilot ARR target.

### 2. Provision Private Lane

Create or confirm:

- resource group/subscription;
- VNet and subnets;
- private DNS zones;
- Azure Postgres private path;
- Storage account with public access disabled;
- Key Vault with RBAC and public access disabled;
- Azure AI Search with private endpoint and local auth disabled;
- Service Bus Premium with private endpoint and local auth disabled;
- Container Apps jobs or a VNet-connected runner for migrations/copy/smokes.

### 3. Load Tenant Substrate

Minimum viable substrate:

| Domain | Required for |
|---|---|
| Enterprise profile | Home, Intelligence grounding, dossier context |
| Org/persona roster | role-specific workflows and permissions |
| KPI dictionary | Moves baseline and Tower measures |
| Systems inventory | Intelligence, Moves architecture, Source vendor context |
| Vendor contracts | Source decision queue |
| Program inventory | Moves/Tower traceability |
| Evidence ledger | no-fabrication and audit trail |
| Operating telemetry | business-case baselines and value proof |
| Sourcing artifacts | Source reports and deal packs |
| Compliance posture | regulated-risk gates |

Loading rule: if a field is missing, store the gap explicitly. Do not fill it
with app-tier demo defaults.

### 4. Run Migration and Parity Gates

Run from a VNet-connected environment:

```bash
npm run db:azure:verify
npm run db:azure:verify-data-parity
npm run azure:connectivity:smoke
npm run azure:security:audit
```

Expected:

- schema verifier passes;
- tenant parity passes for required tables;
- connectivity smoke passes Postgres, Blob, Service Bus, Key Vault, Search;
- security audit has zero fail and zero attention for customer-ready lanes.

### 5. Product Smoke

For the tenant, verify:

- sign-in / active tenant identity;
- Home;
- Intelligence;
- Moves;
- Source;
- Tower;
- artifact downloads;
- one agent answer with cited tenant evidence;
- one no-fabrication path where evidence is missing.

### 6. Pilot Value Proof

Before launch, define the 90-day proof:

| Module | Example paid pilot pain | Fast value proof |
|---|---|---|
| Source | Renewal, vendor selection, BAFO, pricing normalization, risk gates | prevent bad award / improve negotiation / expose savings or risk |
| Moves | Costed business case for an AI bet | fund/shape/kill decision with CFO-grade assumptions |
| Intelligence | Which AI bet to pursue | ranked, evidence-cited bet portfolio |
| Tower | Outcome governance | spend-at-risk, value confidence, action queue |

Each pilot should pick one primary paid pain, not the whole platform.

## Monetization Guidance

For a 90-day pilot where founder/operator time is included:

| Component | Suggested structure |
|---|---|
| Pilot platform fee | Monthly fee for 90 days; do not make it zero if the buyer expects executive/operator support. |
| Success trigger | Written success criteria tied to specific economic outcome or decision-quality outcome. |
| Post-pilot conversion | Annual module subscription plus usage/support tier. |
| Founder time | Explicitly included but capped by named workshops/sessions. |
| Out-of-scope work | Data cleanup, custom integrations, legal redlines, full operating-model redesign, and implementation execution. |

The pilot should prove one paid wedge sharply enough to justify post-pilot ARR.

## Cutover Checklist

| Gate | Pass condition |
|---|---|
| Safe naming | No real client name leaks into repo/resource names without approval. |
| Data boundary | Private data stored only in the approved private lane. |
| Security | Audit zero fail; zero attention for customer lane unless explicitly waived. |
| Connectivity | VNet connectivity smoke passes. |
| Ingestion | Event Grid to Service Bus to worker to DB passes. |
| Product | Four-surface smoke passes for the tenant. |
| Artifacts | Generated artifacts show evidence and gaps honestly. |
| Rollback | Previous lane/state can be restored or traffic can be held. |
| Evidence pack | Closeout doc attached to pilot record. |

## Decommission / Retire

After pilot completion:

1. Export customer-owned evidence as agreed.
2. Preserve audit logs per contract.
3. Disable ingestion.
4. Revoke identities and keys.
5. Delete or archive private data lane resources per contract.
6. Retain only anonymized outcome patterns if contract permits it.
