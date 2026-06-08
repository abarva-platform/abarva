# Adapter: Epic System / Module & Interface Registry (health tenants)

> **Owner:** Applications / Integration Architect (health systems). **Primary
> targets:** L2 (Epic modules), L3 (Bridges / Interconnect interfaces, HL7/FHIR),
> L4 (Clarity / Caboodle / Cogito). **Mode:** create (Epic estate). **Natural
> key:** module name (L2) / interface name (L3) / `engine+instance` (L4).
> Relevant tier: **Meridian (M)** and any Epic-centric health estate (model §6).

Epic is not one application — it is a **suite of modules** on a shared platform,
with its own integration layer (**Bridges / Interconnect**) and its own analytics
stack (**Cogito → Clarity / Caboodle**). For a health system, "Epic" therefore
populates L2, L3, **and** L4 at once. This adapter reads Epic's own registries to
decompose the suite correctly, rather than landing a single "Epic" row.

---

## 1. What the export looks like

Epic estates document themselves in a few characteristic places; the adapter
recognizes each:

- **Module / application list** — from the org's Epic governance docs or an Epic
  build inventory: the licensed/installed modules by name (Epic uses both formal
  names and nicknames — see §2). Often a spreadsheet maintained by the Epic team.
- **Interface inventory** — from **Bridges** (classic interfaces) and
  **Interconnect** (web services / FHIR). Columns like interface name,
  inbound/outbound, message type (HL7 ADT/ORM/ORU/SIU/DFT/MDM…), connected
  system, status. Also the **Interface Engine** report if Epic fronts a Rhapsody/
  Cloverleaf engine (overlaps `interface-engine.md`).
- **Cogito / reporting catalog** — Clarity (relational, batch) and Caboodle
  (dimensional warehouse) data dictionaries / report inventories; sometimes a
  Reporting Workbench / SlicerDicer inventory.

Signature: Epic module **nicknames** (Hyperspace, Willow, Beaker, Cupid, ASAP,
Stork, OpTime, EpicCare, MyChart, Cogito, Clarity, Caboodle) and Bridges/
Interconnect/HL7-message-type vocabulary are unmistakable Epic signals.

---

## 2. Epic module → L2 mapping (nickname normalization)

Epic modules carry **nicknames**; the adapter normalizes nickname → canonical
module + the clinical/business capability (→ L1) it serves.

| Epic nickname | Module (canonical) | Capability (→ L1) |
|---|---|---|
| Hyperspace / Hyperdrive | Epic client / platform | (platform) |
| EpicCare Inpatient / ClinDoc | Inpatient clinical | Clinical documentation |
| EpicCare Ambulatory | Ambulatory EHR | Ambulatory care |
| ASAP | Emergency Department | Emergency care |
| Willow | Pharmacy | Medication management |
| Beaker | Lab (CP/AP) | Laboratory |
| Cupid | Cardiology | Cardiology |
| Radiant | Radiology | Imaging / Radiology |
| OpTime / Anesthesia | Surgery / OR | Perioperative |
| Stork | Obstetrics | Women's health |
| Resolute (PB/HB) | Billing — Professional / Hospital | Revenue cycle |
| Tapestry | Managed care / payer | Payer / value-based care |
| MyChart | Patient portal | Patient engagement |
| Welcome / Cadence | Scheduling / front desk | Access / scheduling |
| Cogito | Analytics platform | (→ L4) |
| Clarity | Reporting database (relational) | (→ L4) |
| Caboodle | Enterprise data warehouse | (→ L4) |

Each L2 Epic module row: `l2.vendor = Epic Systems`, `l2.product = <module>`,
`l2.deployment_model = vendor_hosted` *if Epic-hosted* else `private_cloud`/
`on_prem` (Meridian-type "Epic-centric, hosted" → `vendor_hosted`; verify, §5),
`l2.architecture = cots_packaged`, `l2.compliance_scope = HIPAA`,
`l2.capability_served → L1`.

---

## 3. Column-mapping tables

### 3a. Modules → L2

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| Module / nickname | `l2.product` | L2 | `lookup{}` nickname→module (§2); → natural key |
| (implicit) | `l2.vendor = "Epic Systems"` | L2/spine | `derive()` constant |
| Status (live/build/planned) | `l2.lifecycle_disposition` / `operational_status` | L2 | `lookup{live→operational, …}` |
| Go-live date | `l2.go_live_date` | L2 | date parse |
| Environment (PRD/TST/POC) | `l2.environment` | L2 | `lookup{}` |
| (derive) | `l2.compliance_scope = HIPAA` | spine | `derive()` constant for clinical modules |
| (derive) | `l2.capability_served` | L1 link | `lookup{}` (§2) |

### 3b. Bridges / Interconnect interfaces → L3

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| Interface / channel name | `l3.interface_name` | L3 | `norm()` → **natural key** |
| Direction (in/out/bidir) | `l3.direction` | L3 | `lookup{inbound, outbound, bidirectional}` |
| Message type (ADT/ORM/ORU/SIU/DFT/MDM/VXU) | `l3.message_type` + `l3.pattern=hl7v2` | L3 | `1:1`; HL7v2 trigger events |
| FHIR resource / API (if Interconnect) | `l3.pattern = fhir` (or `rest_api`) | L3 | `derive()` |
| Connected/foreign system | `l3.target_ref` (or `source_ref`) → L2 | L3 link | `norm()` → match L2 app |
| Epic endpoint (always Epic side) | `l3.source_ref`/`target_ref` = `epic\|ehr` | L3 link | `derive()` |
| Status | `l3.status` | L3 | `lookup{active, inactive, retired}` |
| Engine (Bridges / Interconnect / Rhapsody) | `l3.middleware` | L3 | `1:1` |
| Volume / frequency | `l3.frequency` / `l3.data_volume` | L3 | `1:1` if present |

### 3c. Cogito / Clarity / Caboodle → L4

| Source | Canonical field | Layer | Transform |
|---|---|---|---|
| Clarity (database) | L4 store `{engine: SQL Server, role: reporting_db}` | L4 | `derive()`; → `engine+instance` key |
| Caboodle (database) | L4 store `{engine: SQL Server, role: data_warehouse}` | L4 | `derive()` |
| Cogito (platform) | L4 BI/semantic platform | L4 | `derive()` |
| Reporting Workbench / SlicerDicer | L4 consumption (BI) | L4 | `1:1` |
| ETL (Clarity ETL / Caboodle ETL) | L4 movement | L4 | `derive()` |
| Report / data-dictionary entries | `l4.data_domains` on the store | L4 | aggregate → domains |

Clarity/Caboodle run on SQL Server → also produce an **L5 host** link
(`engine+instance`) that merges with the ServiceNow `cmdb_ci_database` row and the
vCenter VM hosting it.

---

## 4. Natural keys (reconciliation, model §4)

- **L2 Epic module:** `epic|<module>` (e.g. `epic|resolute_pb`, `epic|willow`).
  The suite shares vendor `Epic Systems`; the product token is the module. Note:
  a single coarse `epic|ehr` key may also exist from a ServiceNow business-app CI
  ("Epic") — the adapter must **decompose** that into modules and link the coarse
  CI as the parent suite (raise a §5 reconciliation note).
- **L3 interface:** `norm(interface name)`; secondary key
  `source→target + message_type` to merge with the interface-engine adapter when
  Epic fronts Rhapsody/Mirth.
- **L4 store:** `sqlserver|clarity`, `sqlserver|caboodle` (`engine+instance`),
  merging with ServiceNow DB CIs and vCenter hosts.
- **Vendor:** `Epic Systems` (single vendor spine entry for the whole suite +
  BAA in the security spine for a health tenant).

---

## 5. Review-required ambiguities (what the Steward asks)

1. **Hosted vs on-prem.** "Epic-hosted" (Epic's data center) vs self-hosted vs
   private-cloud is a critical L2/L5 attribute and a known §4 conflict (Apps may
   say `vendor_hosted` while Infra lists on-prem Epic ODB/Cogito clusters in
   vCenter/CMDB). **Default: ask**, and reconcile against vCenter (`vcenter.md`
   sample shows Epic ODB nodes on-prem).
2. **Coarse "Epic" CI vs decomposed modules.** When ServiceNow has a single
   "Epic" app CI and this adapter loads 15 modules, flag the parent/child
   reconciliation so the estate isn't double-counted.
3. **Nickname coverage.** Epic ships many modules and orgs use local nicknames;
   unknown nickname → review ("module `Phoenix` — which Epic module / capability?").
4. **Module vs feature.** Some "modules" are features of another (e.g. Storyboard,
   SmartTools) — don't load every feature as an L2 app; ask on granularity.
5. **Interface engine boundary.** If Epic fronts Rhapsody/Mirth, the *same*
   interface appears in both this registry and the interface-engine export →
   merge on `source→target+message_type`, don't duplicate.
6. **Clarity vs Caboodle role.** Both are SQL Server; Clarity = relational
   reporting DB, Caboodle = dimensional DW. Confirm role so L4 store typing is
   right (drives current-state analytics narrative downstream).
7. **23-stack multiplicity (Meridian).** A 23-hospital system may run one
   consolidated Epic instance or per-hospital builds; confirm whether modules/
   interfaces are enterprise-wide or per-facility to avoid 23× duplication.

---

## 6. Illustrative sample

**Source (Epic module + interface inventory, abbreviated):**

| Name | Type | Status | Detail |
|---|---|---|---|
| Resolute Hospital Billing | Module | Live | Revenue cycle |
| Beaker | Module | Live | Lab |
| LAB_ORU_OUT_QUEST | Interface (Bridges) | Active | ORU outbound to Quest |
| Caboodle | Reporting | Live | SQL Server EDW |

**Mapped:**

- "Resolute Hospital Billing" → **L2** `{ product:"Resolute HB",
  natural_key:"epic|resolute_hb", vendor:"Epic Systems", architecture:cots_packaged,
  compliance_scope:HIPAA, capability:"Revenue cycle", deployment:vendor_hosted
  (review §5.1) }`.
- "Beaker" → **L2** `epic|beaker`, capability Laboratory.
- "LAB_ORU_OUT_QUEST" → **L3** `{ interface_name:"LAB_ORU_OUT_QUEST",
  pattern:hl7v2, message_type:ORU, direction:outbound, source_ref:epic|ehr,
  target_ref:quest (external lab), middleware:Bridges,
  natural_key:"lab_oru_out_quest" }`. Merges with the Rhapsody channel of the same
  feed if the interface-engine export also lists it.
- "Caboodle" → **L4 store** `{ engine:"SQL Server", instance:"Caboodle",
  role:data_warehouse, natural_key:"sqlserver|caboodle" }` + **L5 host** link →
  merges with ServiceNow DB CI and vCenter host.

---

## 7. Reviewer sanity-check notes

A reviewer with real Epic experience should verify:

- The **nickname→module map** (§2) against the customer's licensed footprint and
  local naming — orgs rename, and Epic's module set evolves; the table is the
  common core, not exhaustive.
- The **hosting model** (Epic-hosted vs on-prem vs private cloud) — this is the
  single most consequential and most-disputed attribute, and the §4 conflict with
  Infra's vCenter/CMDB Epic clusters must be reconciled, not auto-resolved.
- **Clarity vs Caboodle vs Cogito** role assignment (reporting DB vs dimensional
  DW vs analytics platform) — easy to conflate, and it drives the L4 narrative.
- HL7 **message-type vocabulary** (ADT/ORM/ORU/SIU/DFT/MDM/VXU…) and FHIR vs HL7v2
  routing for Bridges vs Interconnect.
- For multi-hospital systems, whether the registry is **enterprise-consolidated or
  per-facility**, to set the right multiplicity.
