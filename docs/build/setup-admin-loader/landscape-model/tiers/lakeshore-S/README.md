# Lakeshore Holdings — S-tier landscape templates (~$3B holdco)

Guideline templates for the **small enterprise (S)** species of estate defined in
the master model (`../../00-MODEL.md`, §6 tiering table — the **Lakeshore** row).
They show what a layered, owner-sourced, reconciled landscape looks like at the
~$3B mark so an Admin loading a real Lakeshore-shaped estate has a worked,
realistic starting point per layer.

> **These are illustrative guideline templates with realistic sample rows —
> replace them with your own export.** Canonical Lakeshore facts (Meera Rao as
> Global CIO; Daniel Whitaker as Holdco CFO; Kyriba as the treasury platform;
> the operating companies **Northline Supply Chain** and **Forge & Field**, plus
> **Brightmark Marketing Services**) are used **where they fit**. Everything else
> — every app name, host, contract value, renewal date, user count, dollar
> amount — is **plausible-but-illustrative**, not a fact about Lakeshore. Do not
> cite a sample row as a real number. The `source` column on every row says where
> a real value would come from (e.g. `cmdb_export`, `vcenter`, `contract_registry`);
> in these templates it marks the row as a guideline sample.

---

## The S-tier shape (what "small" looks like)

A ~$3B diversified holding company is **not** a scaled-down version of a single
large enterprise. Its defining trait is **M&A debt**: it grew by acquiring
operating companies (opcos) that were **never consolidated onto a common stack**.
The result is the same business capability — finance, ERP, BI, identity —
**duplicated across opcos**, each opco carrying the stack it was acquired with.

| Dimension | S-tier (Lakeshore) reality |
|---|---|
| Applications | ~**80–150** apps total, but spread thin across the holdco + opcos |
| Datacenters | **1–2 owned/colo DCs** + a **single emerging cloud** (one Azure subscription) |
| Compute / virt | **VMware vSphere on Dell** servers — the workhorse; minimal hyperconverged |
| Storage | **NetApp** SAN/NAS; modest object/backup |
| Integration | **file / SFTP batch and point-to-point** dominate; **some Boomi** at the holdco; little to no event streaming |
| Treasury | **Kyriba** — the one genuinely modern, holdco-led platform (multi-currency / FX, 50 countries) |
| Data & analytics | **SQL Server** data warehouse(s), **early Snowflake** pilot at the holdco, **Excel-heavy** marts and BI, some Power BI |
| Identity | Mixed — holdco **Entra ID**, but opcos still on their own AD forests / Okta tenants |
| Vendors | ~**100–300** vendor/contract relationships, fragmented per opco |
| Likely source | **hand-built XLSX + a few system exports** — no full discovery tooling at this size |

---

## The M&A-fragmentation story (why the same capability appears 3–4 times)

This is the single most important thing the S-tier templates are built to make
**visible**. Look down the `capability` and `opco` columns of
`L2-applications.template.csv` and you will see the *same capability owned by
different systems in different opcos*:

| Capability | Holdco | Northline Supply Chain | Brightmark Marketing | Forge & Field (DTC) |
|---|---|---|---|---|
| **ERP — Finance** | SAP S/4HANA (holdco GL/consolidation) | Microsoft Dynamics 365 F&O | Sage Intacct | NetSuite |
| **Data warehouse / BI** | Snowflake (early) + Power BI | SQL Server DW + Excel marts | Power BI + Excel | SQL Server + Looker (DTC) |
| **Identity** | Entra ID | on-prem AD forest | Okta tenant | Entra ID (separate tenant) |
| **HR / payroll** | Workday (holdco) | ADP (legacy) | BambooHR | Gusto |

Four finance ERPs. Three+ identity providers. BI scattered across SQL Server,
Power BI, Looker and Excel. **None of it consolidated.** That duplication is the
M&A debt — and it is exactly what the loaded landscape lets Sentinel/Nexus reason
over ("which opcos run their own ERP and could consolidate?"). The one place the
holdco *did* standardize is **treasury (Kyriba)** — which is why it stands out as
the modern exception and the proof that consolidation is possible.

---

## Files in this tier

One README + one CSV per layer + the vendor-contract spine + golden questions.
Headers are the canonical fields from the master model; rows are sized to S-tier
breadth (~8–15 rows each, not the hundreds a real export would carry).

| File | Layer | What it shows at S-tier |
|---|---|---|
| `L2-applications.template.csv` | L2 Applications | ~14 apps; the **same capability duplicated per opco** (M&A debt made visible) |
| `L3-integration.template.csv` | L3 Integration | mostly `file_batch` / `db_link`, **some Boomi `rest_api`**; the fragility of point-to-point at this size |
| `L4-data-analytics.template.csv` | L4 Data & Analytics | SQL Server DW, early Snowflake, Power BI, **Excel marts** as first-class (and risky) assets |
| `L5-infrastructure.template.csv` | L5 Infrastructure | **VMware vSphere on Dell**, **NetApp** SAN, 1–2 DCs, one Azure subscription, mixed identity |
| `vendor-contracts.template.csv` | vendor spine | ~15 contracts incl. **Kyriba**, SAP, Azure EA, the SI partner; fragmented per-opco renewals |
| `golden-questions.md` | — | 8–10 questions an S-tier estate should answer once loaded |

### Column reference (per the master model)

- **L2** `app_name,vendor,product,capability,deployment_model,architecture,hosting_ref,lifecycle,compliance_scope,annual_tco_usd,users,criticality_tier,business_owner,it_owner,opco,source`
- **L3** `interface_name,source_app,target_app,pattern,middleware,direction,frequency,data_volume,criticality,source`
- **L4** `asset_name,class,engine,host_ref,owner,refresh,data_domains,criticality,source` — `class ∈ {oltp,warehouse,mart,bi,etl}`
- **L5** `asset_name,class,make_model,location,capacity,virtualization,cloud_account,owner,source` — `class ∈ {compute,virtualization,storage,network,datacenter,cloud_account,identity}`
- **vendor** `vendor,product,contract_type,annual_spend_usd,renewal_date,support_tier,owner,notes,source`

Controlled vocabularies (deployment_model, architecture, lifecycle, pattern,
etc.) are the ones in the master model §2; the field catalog (`01-FIELD-CATALOG.md`,
authored alongside) is authoritative when present.

### Cross-layer keys (so the rows reconcile)

The rows are wired together the way the master model expects (§4):
- L2 `hosting_ref` → an L5 `asset_name` (e.g. `vsphere-clu-chi-01`, `azure-sub-lakeshore-prod`).
- L3 `source_app` / `target_app` → L2 `app_name`.
- L4 `host_ref` → an L5 `asset_name`.
- Everything with a vendor → a row in `vendor-contracts.template.csv`.

So "SAP S/4HANA → runs on `vsphere-clu-chi-01` → in DC `dc-chicago-primary` →
under contract `SAP S/4HANA`" is traceable end-to-end, the way a reconciled
landscape should be.

---

## Honesty notes for a reviewer

- **Canonical anchors used:** Meera Rao (Global CIO, Chicago), Daniel Whitaker
  (Holdco CFO), Kyriba (treasury), opcos Northline Supply Chain / Forge & Field /
  Brightmark Marketing Services. These come from the Lakeshore tenant-setup plan
  and synthetic-data spec (see "Canonical sources" below).
- **Brightmark** appears in the canonical corpus as the third opco; the master
  model's tiering row names only Northline + Forge & Field as examples. Both are
  consistent — the corpus is the fuller list. A reviewer who wants strictly the
  two named in the model can drop the Brightmark rows.
- **Everything numeric is illustrative.** No sample TCO, spend, user count, or
  renewal date is a real Lakeshore figure. They are internally consistent
  (revenue mix, opco sizing, IT-spend ratio) but must be replaced by a real
  export before any decision is made on them.
- **Opco CFOs:** the task notes each opco has its own CFO; names beyond Daniel
  Whitaker (holdco) are illustrative placeholders in the owner columns and should
  be replaced with real names.

## Canonical sources

- `docs/build/LAKESHORE_HOLDINGS_TENANT_SETUP_PLAN_2026-06-03.md` — holdco + 3
  opcos (Northline / Brightmark / Forge & Field), Kyriba, Global CIO structure.
- `docs/build/LAKESHORE_SYNTHETIC_DATA_GENERATION_SPEC_2026-06-03.md` — opco
  sizing, IT/CMDB volume, stack realism, Global CIO + 3 opco CIOs + Surekha.
- `../../00-MODEL.md` — the layered model + the S-tier (Lakeshore) tiering row.
