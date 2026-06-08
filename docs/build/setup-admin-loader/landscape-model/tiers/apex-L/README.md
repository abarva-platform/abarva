# Apex — L-tier landscape templates (~$80B+ global omnichannel retailer)

> Guideline templates for the **largest species of estate** in the landscape
> model (`../../00-MODEL.md`, §6, Apex row). These are **illustrative templates
> with realistic sample rows**, not a loaded inventory. At this scale the real
> source is a **discovery export** (ServiceNow CMDB + multi-cloud inventory +
> Flexera + Apptio), not hand entry — see `../../discovery-adapters/` for the
> native-export mappings these CSVs are meant to receive.

## Decision (2026-06-08): Apex is the $80B archetype

Per founder direction, **Apex is the ~$80B+ global omnichannel archetype** for
the L-tier — this package's framing is the intended one. The reconciliation
follow-up is to align `src/data/apexretail/*` (which still carries the older
~$12.4B / ~800-store US figures) up to the $80B global shape so Apex is the $80B
brand consistently everywhere, or to split the $80B archetype into its own named
brand if Apex should stay $12.4B.

## Honesty bar — what is canonical vs illustrative

The repo's `src/data/apexretail/*` currently still describes a **~$12.4B,
~800-store US retailer**. This L-tier package models **"Apex at $80B L-tier
scale"**: it reuses the *real* anchors the repo establishes and **extrapolates**
the rest to the L-tier shape the model calls for. Every row's `source` column
says which it is.

**Canonical (from `src/data/apexretail/*` — used verbatim):**

| Fact | Value | Repo source |
|---|---|---|
| Company / HQ | Apex Retail Group, Columbus OH | `index.ts` |
| Revenue (real) | $12.4B | `financials.ts`, `index.ts` |
| Stores (real) | ~800 (shadow-IT note cites 1,240) | `index.ts`, `vendors.ts` |
| CEO / CFO / COO | Robert Vance / Margaret Chen / David Okonjo | `org-structure.ts` |
| CMO / CDO / CIO | Jennifer Park / Lynne Stratham / Carlos Rivera | `org-structure.ts` |
| CISO / CSCO / CMerchO | Sarah Whitfield / Michael Tanaka / Angela Foster | `org-structure.ts` |
| IT VPs | Raj Patel (Infra & Cloud), James Wright (Data Eng), Priya Iyer (Digital), Linda Mwangi (EA), Nathan Kohl (Procurement), Kevin Harrison (CyberOps) | `org-structure.ts` |
| ERP | SAP ECC 6.0 EHP8, 8,400 customizations, EoS 2027 | `technology_inventory.ts` |
| E-commerce | Salesforce Commerce Cloud (SFCC B2C) | `technology_inventory.ts` |
| OMS | IBM Sterling OMS 10.0 (EoL, extended) | `technology_inventory.ts` |
| WMS | Manhattan WMS (2021) | `technology_inventory.ts` |
| Demand planning | o9 Solutions (40% implemented) | `technology_inventory.ts` |
| CDP / Loyalty | Twilio Segment / Punchh (PAX) | `technology_inventory.ts` |
| Data | Snowflake (40% migrated), Databricks, Tableau/Power BI/Looker | `technology.ts`, `technology_inventory.ts` |
| POS | NCR Counterpoint 9.0 (~28k licensed, ~18k daily) | `technology_inventory.ts` |
| Merchandising | Oracle RMS (legacy) | `technology.ts` |
| Primary cloud | GCP (+ strong Salesforce partnership) | `technology.ts` |
| DCs (real) | 5 named DCs (Columbus, Dallas, Reno, Atlanta, Chicago) | `supply_chain.ts` |
| Shadow IT | $38M, 847 SaaS subs, 23 duplicate tools | `vendors.ts` |

**Illustrative (extrapolated to L-tier — flagged `illustrative` in `source`):**
the $80B+ scale, international banners/regions, the 1,000–2,500+ app count,
multi-cloud breadth (AWS + Azure + GCP), 10s of DCs, store-edge hyperconverged
fabric, EDI supplier mesh size, Teradata/Hadoop lakehouse footprint, and **all
dollar amounts not present in the repo**. Sample dollar figures are order-of-
magnitude placeholders for a company this size — they are **not** presented as
truth and must be replaced by the real discovery/finance export.

## L-tier shape (what a real $80B+ omnichannel global retailer looks like)

- **Applications: 1,000–2,500+.** Spans SaaS, custom cloud microservices, COTS
  packaged, and mainframe-legacy, across multiple deployment models. Payment
  systems carry **PCI** scope; finance carries **SOX**; customer/loyalty carry
  **GDPR/CCPA**.
- **ERP** = SAP S/4HANA (finance + supply chain) — at L-tier the migration off
  ECC is assumed complete or in flight (canonical Apex is still on ECC 6.0).
- **Merchandising / planning** = Blue Yonder (JDA) + o9 demand planning.
- **WMS** = Manhattan (Active WM); **OMS** = Sterling / custom.
- **POS** = store systems (NCR / Toshiba) across thousands of stores at the
  **edge**.
- **E-commerce** = custom cloud microservices + CDN (plus SFCC heritage).
- **HR** = Workday (SaaS); **CRM / marketing** = Salesforce + Adobe.
- **Data** = Teradata EDW + Hadoop lake + Databricks lakehouse + Kafka real-time
  + **hundreds of marts**.
- **BI** = Tableau + Power BI + MicroStrategy + legacy Cognos / SSRS.
- **Infra** = 10s of DCs + store edge (hyperconverged Nutanix / Dell), VMware +
  Kubernetes / OpenShift, SAN sprawl (Dell EMC / Pure / NetApp), SD-WAN, and
  **multi-cloud (AWS + Azure + GCP)**.
- **Vendors: 1,000–3,000+.**

## Files in this package

| File | Layer | What it loads |
|---|---|---|
| `L2-applications.template.csv` | L2 Applications | ~26 sample apps spanning SaaS/custom/COTS/mainframe, multiple deployment models, PCI/SOX/GDPR scope |
| `L3-integration.template.csv` | L3 Integration | EDI (X12) supplier mesh, API gateway, Kafka event streams, MuleSoft, batch |
| `L4-data-analytics.template.csv` | L4 Data & Analytics | Teradata DW, Hadoop lake, Databricks lakehouse, Kafka, marts, cubes, Tableau/PBI/MicroStrategy/Cognos |
| `L5-infrastructure.template.csv` | L5 Infrastructure | multi-cloud accounts (AWS/Azure/GCP), DCs + store edge, VMware + OpenShift/K8s, SAN, SD-WAN |
| `vendor-contracts.template.csv` | Vendor spine | SAP, Blue Yonder, Manhattan, Workday, Salesforce, the 3 clouds, Teradata, Databricks, etc. |
| `golden-questions.md` | — | 8–10 L-tier questions that prove the load is usable |

**Row counts are samples.** Each CSV is an **excerpt** of a far larger estate
(real = thousands of apps, hundreds of interfaces, 1,000–3,000+ vendors). The
sample rows show the *range of shapes* the loader must absorb; they are not the
target inventory. The real load arrives as discovery exports through the
landing zone and is reconciled per `../../00-MODEL.md` §4.

## How to use

1. **Don't hand-type the estate.** Export from ServiceNow CMDB (apps → L2),
   cloud inventory / Azure Resource Graph / AWS Config (→ L5), the BI catalog
   (→ L4), the interface-engine / EDI partner map (→ L3), and the contract
   registry (→ vendor spine). Drop each in the landing zone.
2. Use these CSVs as the **column contract** the mapper targets, and as a
   worked example of how an L-tier estate decomposes across the five layers.
3. Replace every `illustrative` row and every placeholder dollar amount with the
   real export. Keep per-artifact provenance (`source`) so reconciliation can
   tell owners apart.
