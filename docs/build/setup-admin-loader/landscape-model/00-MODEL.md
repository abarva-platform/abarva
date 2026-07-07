# The Enterprise Technology Landscape Model

> The Admin Loader's canonical target for "what is this company's technology
> estate." It is **layered**, **owner-partitioned**, **multi-artifact**, and
> **reconciled** — designed to absorb whatever each function already documents,
> in whatever format, and stitch it into one coherent landscape.

Status: design (candidate). Supersedes the thin starter dimensions
(`applications_systems`, `data_analytics_stack`, `vendors_contracts`) with a
full estate model. See `01-FIELD-CATALOG.md` for per-layer fields and
controlled vocabularies; `tiers/` for guideline templates; `discovery-adapters/`
for native-export mappings.

---

## 1. Three premises

1. **The estate is layered, not flat.** A real landscape is applications *on*
   integration *on* data *on* infrastructure, with vendor, security, and
   operations as cross-cutting spines. "Name, vendor, cost, renewal" is one
   attribute slice of one layer.

2. **No single owner holds the whole picture — and none of them holds it in our
   format.** The VP of Applications, the VP of Infrastructure, the CDAO, the
   Enterprise Architect, Procurement, and the CISO each own a slice and each
   keep their own artifacts: a ServiceNow CMDB export, a vCenter dump, a BI
   catalog, an interface-engine config, a contract registry, a controls matrix.
   The loader's job is to **accept all of them, in any format, arriving at any
   time**, map each to the right layer, and reconcile.

3. **Complexity scales by orders of magnitude with the company.** A $3B holdco,
   an $11.2B health system, and an $80B retailer are different *species* of
   estate (§6). The same model must express ~120 apps and ~2,200 apps without
   either feeling wrong, so depth is **tiered**, not mandatory.

---

## 2. The layered model (entities)

Each layer is a set of **entities** (rows you can load), each with a stable
**natural key** (for reconciliation, §4) and a rich attribute set (§
`01-FIELD-CATALOG.md`). Layers reference each other by key.

```
┌─────────────────────────────────────────────────────────────────────┐
│  L1  BUSINESS / CAPABILITY      capabilities, functions, value streams│  anchor
├─────────────────────────────────────────────────────────────────────┤
│  L2  APPLICATIONS               systems by function (ERP/EHR/WMS/POS…) │
│       deployment · architecture · hosting · lifecycle · compliance     │
├─────────────────────────────────────────────────────────────────────┤
│  L3  INTEGRATION                interfaces, middleware, patterns       │
│       HL7/FHIR · EDI · API · events/Kafka · batch/SFTP                  │
├─────────────────────────────────────────────────────────────────────┤
│  L4  DATA & ANALYTICS           OLTP · DW · lake/lakehouse · marts ·   │
│       cubes · BI · ETL/ELT · ML/AI platform · semantic layer           │
├─────────────────────────────────────────────────────────────────────┤
│  L5  INFRASTRUCTURE             compute · virtualization · storage ·   │
│       network · datacenters · cloud accounts · identity                 │
└─────────────────────────────────────────────────────────────────────┘
   ║ spines (cut across every layer) ║
   • VENDORS & CONTRACTS   master, MSA/SOW, renewal, spend, support, BAA
   • SECURITY & CONTROLS   controls, compliance scope, posture, DR/downtime
   • OPERATIONS            ownership, SLAs, observability, incidents, run cost
```

**L1 Business / Capability** — the anchor everything hangs off. Capabilities
(e.g. "Merchandising," "Revenue Cycle," "Treasury"), business functions, value
streams. Lets us answer "which systems serve denial management?" not just "list
systems."

**L2 Applications** — the system inventory, but each app carries:
- **deployment model**: `on_prem` · `private_cloud` · `public_cloud` ·
  `saas` · `vendor_hosted` (e.g. Epic-hosted, Workday)
- **architecture**: `mainframe` · `client_server` · `custom_x86` ·
  `cots_packaged` · `microservices` · `serverless`
- **hosting location**: datacenter / cloud region / account ref → L5
- **lifecycle disposition**: `invest` · `sustain` · `tolerate` · `retire` ·
  `legacy_eol`
- **compliance scope**: HIPAA · PCI · SOX · GDPR · none
- TCO (not just license), user count, business criticality (Tier 0/1/2/3),
  business + IT owner, capability served (→ L1)

**L3 Integration** — the connective tissue. Each interface: source→target (→ L2
keys), **pattern** (`hl7v2` · `fhir` · `edi_x12` · `rest_api` · `soap` ·
`event_stream` · `file_batch` · `db_link`), middleware/engine (MuleSoft, Boomi,
Informatica, **Epic Bridges/Interconnect**, Rhapsody, Mirth, Corepoint),
direction, frequency, data volume, criticality.

**L4 Data & Analytics** — explicitly *not* one field. Distinct entity classes:
- **stores**: OLTP/ODS, **data warehouse** (Teradata · Netezza · SQL Server ·
  Oracle Exadata · Snowflake · Synapse · Redshift · BigQuery), **lake/lakehouse**
  (Hadoop/HDFS · Databricks/Delta · S3/ADLS)
- **movement**: ETL/ELT (Informatica · DataStage · Talend · dbt · ADF · Glue)
- **serving**: **cubes** (SSAS/OLAP), **data marts**, semantic/metrics layer
- **consumption**: **BI** (Tableau · Power BI · Cognos · MicroStrategy · SSRS ·
  **Epic Clarity/Caboodle**), ML/AI platform (SageMaker, Azure ML, Vertex)
- each with engine/host (→ L5), owner, refresh, criticality, data domains

**L5 Infrastructure** — the layer we were missing entirely. Entity classes:
- **compute**: x86 rack/blade, **hyperconverged** (Dell VxRail · Nutanix ·
  Cisco HyperFlex), mainframe, appliance
- **virtualization**: VMware vSphere · Hyper-V · KVM · **Kubernetes/OpenShift**
- **storage**: SAN/NAS (Dell EMC PowerStore/Isilon · NetApp · Pure), object,
  backup
- **network**: core/edge (Cisco · Arista · Juniper), LB/ADC (F5), SD-WAN,
  firewall
- **datacenters**: owned / colo (location, power, footprint)
- **cloud accounts**: subscription/account/project per cloud (multi-cloud),
  landing zones, regions
- **identity**: AD / Entra ID / Okta / Ping

**Spines** cross every layer and are where the thin starter dimensions actually
belonged: a vendor/contract spine (master, MSA/SOW, renewal, spend, support
tier, **BAA** for health), a security/controls spine (controls, compliance,
posture, DR/downtime readiness), and an operations spine (ownership, SLA,
observability, incident history, run cost).

---

## 3. Multi-owner, multi-artifact assembly

The estate is contributed by **many owners**, each with **their own artifacts**,
**in their own format**, **over time**. The loader treats every contribution as
a *partial, owner-scoped, provenance-stamped* slice of the landscape.

| Owner | Owns layers | Typical artifacts (any format) |
|---|---|---|
| **VP / Director, Applications** | L2, parts of L3 | ServiceNow CMDB (CI) export, app portfolio XLSX, SAP/Oracle system list, APM/Apptio export |
| **VP / Director, Infrastructure** | L5, parts of L3 | **vCenter export**, Azure Resource Graph / AWS Config dump, network diagrams (Visio/PDF), Dell/Nutanix inventory, DC asset list |
| **CDAO / VP Data & Analytics** | L4 | BI/report catalog, **Epic Clarity/Caboodle data dictionary**, warehouse schema, dbt manifest, data-lake inventory, Confluence pages |
| **Enterprise / Integration Architect** | L3, L1 | interface-engine config (Rhapsody/Mirth), API catalog (Apigee/Mulesoft), EDI partner map, capability model |
| **Procurement / Vendor Mgmt** | vendor spine | contract registry, spend report, renewal calendar, MSA/SOW index |
| **CISO / Security** | security spine | controls matrix, compliance scope, **BAA register**, DR/downtime plan, pen-test summary |

Design consequences:

1. **Any format, multiple files, asynchronous.** A landscape is assembled from
   N artifacts that need not arrive together. The loader's **landing zone**
   (already built) is the multi-owner inbox: each owner drops their export
   (browser or Azure Storage), and each is understood independently.
2. **Provenance is per-artifact.** Every committed entity records which artifact,
   which owner, which row/cell it came from (Gate 0 + the truth standard). When
   two owners disagree, we can see *who said what*.
3. **The mapper expects export shapes, not our form.** Nobody re-types 2,000
   apps. The mapper + Steward read a 1,200-row ServiceNow CI export or a vCenter
   dump and propose the mapping to L2/L5 — asking only where genuinely
   ambiguous (`discovery-adapters/` pre-seed these mappings).

---

## 4. Entity identity & reconciliation (the hard part)

Multiple artifacts describe the **same real-world thing** from different angles.
"Epic" is an L2 application, a `vendor_hosted` deployment pointing at an L5
hosting fact, *and* a vendor-spine contract. Teradata is an L4 warehouse engine
*and* an L5 compute+storage footprint. Reconciliation is what turns N artifacts
into one landscape rather than N disconnected lists.

**Natural keys per layer** (used to match across sources):
- L2 application: normalized `vendor + product` (+ environment) — e.g.
  `epic|ehr`, `sap|s4hana`
- L5 host/cluster: hostname / cluster name / cloud resource id
- L4 store: engine + instance name
- vendor: normalized legal/trade name

**Match → merge → link:**
1. **Match** incoming rows to existing entities by natural key (exact, then
   fuzzy with a confidence score; below threshold → Steward asks).
2. **Merge** attributes, keeping per-attribute provenance; conflicts become
   Steward `conflict` findings ("Apps says Epic is `vendor_hosted`; Infra lists
   an on-prem Epic ODB cluster — which is current?").
3. **Link** across layers: app→hosting (L2→L5), interface→endpoints (L3→L2),
   report→warehouse→host (L4→L5), everything→vendor/contract (→ spine).

This is a lightweight CMDB/EA metamodel — not to replace ServiceNow, but to give
Sentinel/Nexus a **reconciled, cited** estate to reason over.

---

## 5. How this maps onto the loader we built

The Wave 1–2 loader already has the right *shape* for this; the model deepens
the target and adds reconciliation:

- **Canonical dimensions** (code: `LoaderDimension` + field catalog) get deepened
  and gain the **infrastructure** layer + the L1 capability anchor + the data
  sub-classes. (`04-WIRING.md` / task: wire deepened dimensions.)
- **Intelligent mapper** already maps arbitrary uploads → dimensions; it now
  targets the richer field catalog and the discovery-adapter hints.
- **Steward** already does open-ended validation; it gains the **reconciliation**
  job: cross-artifact match/merge/conflict findings and identity questions.
- **Landing zone** already exists; it *is* the multi-owner, async inbox.
- **Gate 0 + governed commit** already preserve originals and cite sources —
  exactly the per-artifact provenance reconciliation needs.

Nothing about the architecture changes. The model makes the *target* worthy of
the real estate, and adds the reconciliation pass on top of validation.

---

## 6. Tiering — the same model, three species of estate

Depth is guideline, not mandate. Templates ship in three tiers anchored to the
real brands (full per-layer CSVs in `tiers/`).

| Dimension | **Lakeshore — S (~$3B)** | **Meridian — M (~$11.2B, 23 hosp.)** | **Apex — L (~$80B+ retail)** |
|---|---|---|---|
| Applications | ~80–150 | ~200–400 | **1,000–2,500+** |
| Defining shape | **M&A debt** — opcos (Northline, Forge & Field) never consolidated; per-opco stacks | **Epic-centric, hosted** — Cogito/Clarity/Caboodle; Ensemble RCM (18.2% denial); 23 hospitals ≈ 23 stacks | **Omnichannel + global** — SAP S/4, Blue Yonder, Manhattan WMS, Workday, store-edge POS |
| Integration | file/SFTP, point-to-point, some Boomi; **Kyriba** treasury | **HL7v2 + FHIR**, Epic Bridges, Rhapsody/Mirth | **EDI** supplier mesh, API gateway, MuleSoft, Kafka event mesh |
| Data & analytics | SQL Server / early Snowflake; Excel-heavy | Epic Caboodle + legacy Oracle/Teradata; PACS/VNA imaging | Teradata + Hadoop + Databricks lakehouse + 100s of marts; Tableau/PBI/MicroStrategy |
| Infrastructure | VMware on Dell, NetApp, 1–2 DCs, single cloud | VMware + hyperconverged, huge imaging storage, HIPAA everywhere | 10s of DCs + store edge, VMware+K8s, SAN sprawl, SD-WAN, **multi-cloud** |
| Vendors | ~100–300 | ~300–600 | **1,000–3,000+** |
| Likely source | hand-built XLSX + a few exports | ServiceNow + Epic registry + vCenter | full discovery: ServiceNow + multi-cloud inventory + Flexera + Apptio |

The tier sets *expected* breadth and which discovery adapters matter — it never
forces a small estate to fill a large one's fields, nor caps a large one.

---

## 7. Why this matters downstream

A reconciled, cited landscape is the substrate the Move deliverables stand on
(the consulting story arc): current-state → gaps → target/north-star → roadmap.
You cannot write a credible "current state architecture" or estimate a migration
roadmap from "name, vendor, cost." You can from a layered, owner-sourced,
reconciled estate — which is exactly what this model loads.
