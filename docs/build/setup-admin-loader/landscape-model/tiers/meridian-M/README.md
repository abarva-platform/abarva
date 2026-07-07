# Meridian — M tier (~$11.2B integrated health system, 23 hospitals)

> Guideline landscape templates for a **mid-size, Epic-centric integrated
> delivery network**. Anchored to `../../00-MODEL.md` (the Meridian row of the
> tiering table, §6) and to the canonical Meridian brand facts.

**These are illustrative guideline templates with realistic sample rows — replace
them with your own export.** Only the *canonical facts* listed below are
brand-truth for Meridian Health System; every other row (per-hospital duplicate
systems, interface names, host capacities, contract line items) is an
**illustrative placeholder** that demonstrates the expected shape, vocabulary,
and density of an M-tier estate. Do not cite the illustrative rows as fact.

---

## Canonical Meridian facts used (brand-truth)

Sourced from `src/data/meridian.ts` and `src/data/meridian/*` and the tiering
model. Where the canonical anchors in the loader brief differ from older numbers
in `src/data/*` (e.g. an $18M Epic application line vs the ~$28.5M total Epic
vendor relationship), the **brief anchors win** and are used here.

| Fact | Value |
|---|---|
| Revenue | **$11.2B** |
| Hospitals | **23** |
| Staff | ~**42,000** |
| IT budget | **$340M** |
| RCM denial rate | **18.2%** |
| CIO (carrying CIO + CDO; CDO role vacant) | **Marcus Webb** |
| CFO | **Robert Chen** |
| COO | **James Whitfield** |
| EHR / largest vendor | **Epic** — ~**$28.5M/yr** (~9% of spend), renewal ~**2026-01-10**, **90-day exit** |
| Analytics stack | **Epic Cogito** (~$3.4M), **Epic Clarity** (reporting DB), **Epic Caboodle** (EDW) |
| RCM vendor | **Ensemble** (Ensemble Health Partners) |
| Defining shape | Epic-centric and **Epic-hosted**; **23 hospitals operate like 23 different companies** (Webb's words); HL7/FHIR-heavy; HIPAA everywhere |

---

## M-tier shape

- **~200–400 applications.** Big enough that no single owner holds the whole
  picture; small enough that a ServiceNow CMDB + Epic registry + vCenter dump
  cover most of it. (Contrast S tier ~80–150 apps, L tier 1,000–2,500+.)
- **Epic-centric and Epic-hosted.** Epic is the gravitational center of the
  estate — the EHR, the reporting database (**Clarity**), the EDW (**Caboodle**),
  and the analytics layer (**Cogito**) are all Epic, and the core ODB is
  **vendor-hosted by Epic**. Epic is also the single largest vendor relationship
  (~$28.5M, ~9% of spend).
- **Integration is HL7v2 + FHIR.** The connective tissue is **Epic Bridges /
  Interconnect** plus a hospital interface engine (**Mirth Connect** today, with
  legacy **BizTalk** and a **Rhapsody** consolidation target). HL7v2 messaging
  (ADT, ORM, ORU, SIU, DFT) dominates volume; **FHIR** is the new-build standard
  but still a small share of live interfaces.
- **Data & analytics is Epic + legacy.** **Epic Caboodle** (EDW) and **Epic
  Clarity** (reporting DB on SQL Server/Oracle) sit alongside a legacy
  **Oracle/Teradata** warehouse and an **Azure Synapse** platform that is only
  partially landed. BI is **Epic SlicerDicer**, **Tableau**, and **Power BI**,
  feeding clinical, financial, and operational data marts.
- **PACS/VNA imaging is a storage giant.** Diagnostic imaging (**Intelerad
  PACS**, a **VNA**, plus stranded legacy **Merge PACS** at acquired facilities)
  is the largest single storage consumer — petabyte-scale, archived, and growing.
- **Infrastructure is VMware + hyperconverged, on-prem-heavy, partial cloud.**
  **VMware vSphere** on **Dell VxRail / Nutanix** hyperconverged clusters, large
  **Dell / Pure** storage arrays for imaging, **Cisco** core/edge network, **2–3
  datacenters**, and a **limited but growing Azure** footprint (hybrid, ~60/40).
- **HIPAA everywhere; BAAs are critical.** Every system that touches PHI is in
  HIPAA scope, and every vendor that processes PHI must hold an executed
  **Business Associate Agreement (BAA)**. The vendor-contract spine tracks BAA
  status as a first-class column.
- **23-hospital consolidation story.** Per the CIO, the 23 hospitals "operate
  like 23 different companies." Acquired systems (e.g. the Blue Ridge facilities,
  two remaining Cerner hospitals) carry **duplicated stacks** — a second EHR, a
  second PACS, a second payroll/HRIS, a second scheduling system — which the
  templates deliberately show as **consolidation debt**.

---

## Files in this tier

| File | Layer | What it holds |
|---|---|---|
| `L2-applications.template.csv` | L2 Applications | System inventory led by Epic (`vendor_hosted`), Ensemble RCM, ancillary clinical, ERP, plus per-hospital duplicated systems |
| `L3-integration.template.csv` | L3 Integration | HL7v2 / FHIR interfaces via Epic Bridges/Interconnect + Mirth/Rhapsody |
| `L4-data-analytics.template.csv` | L4 Data & Analytics | Clarity, Caboodle, legacy DW, BI tools, marts |
| `L5-infrastructure.template.csv` | L5 Infrastructure | VMware, hyperconverged, imaging storage, network, DCs, cloud |
| `vendor-contracts.template.csv` | Vendor spine | Epic, Ensemble, imaging, etc. with **BAA** status |
| `golden-questions.md` | — | The questions a reconciled M-tier estate should answer |

Columns match the master model (`../../00-MODEL.md` §2 and the per-layer field
catalog). Row counts are M-tier sized (~10–18 sample rows per layer). CSV style
follows `docs/build/setup-admin-loader/templates/kpi-register/` (header row,
quoted fields only where a comma appears, a `source` column on every row marking
provenance — `canonical` for brand-truth, `illustrative` for sample rows).

## Assumptions to verify with the client export

- Interface engine: is it **Mirth Connect**, **Rhapsody**, **Corepoint**, or a
  mix? (Repo shows Mirth + legacy BizTalk; Rhapsody is illustrative.)
- Legacy warehouse: confirm **Oracle vs Teradata vs SQL Server** for the
  pre-Caboodle DW, and how much has moved to **Azure Synapse**.
- PACS/VNA: confirm the **VNA product** and the total imaging storage footprint;
  confirm which acquired facilities still run a second PACS.
- Per-hospital duplicates: confirm which of the 23 hospitals run duplicated EHR /
  HRIS / scheduling / PACS stacks (Blue Ridge + 2 Cerner are illustrative).
- Epic hosting: confirm whether the core ODB is **Epic-hosted (vendor_hosted)**
  vs a private-cloud / on-prem ODB cluster (the model flags this exact conflict).
- ERP/HCM: confirm **Workday** vs **Infor** vs a health-specific ERP, and whether
  legacy **Infor Lawson / ADP** payroll still runs at acquired sites.
