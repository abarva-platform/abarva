# Universal Tenant Input Standard v3 2026-07

One flexible template set for every tenant and industry. Industry specificity belongs in rows, values, relationships, and evidence, not in separate template families.

## Client-facing intake model

Clients should not be asked to fill 19 canonical Nexus files as their primary workflow.

Start with `client-intake-workstreams.json`, which defines the smaller client-facing intake model:

- Enterprise Strategy and Operating Model
- Organization, Workforce, and Decision Rights
- Applications, Infrastructure, and Architecture
- Data, Integration, and Analytics
- Vendors, Contracts, and Procurement
- Finance, Spend, and Value
- Programs, Portfolio, and Change
- Risk, Security, Controls, and Compliance
- Operations, KPIs, and Process Evidence
- Interviews, Questionnaires, and Executive Signals

Each workstream tells the client which owner group should provide data, what raw extracts or documents are useful, which source extract templates may help, and which canonical dimensions Nexus will populate downstream.

The 19 CSV/XLSX files in this folder are canonical target templates. They remain important, but they are not the client front door.

Azure landing pattern: `tenant-inputs/{tenant_key}/{intake_id}/raw/`; validated files move to `tenant-inputs/{tenant_key}/{intake_id}/validated/`.

Files must pass `npm run audit:tenant-input-quality` before loading into the data layer.

Client-facing workbook/template outputs must follow `docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md`: Start Here, Review Queue, SME Review Matrix, evidence/lineage, and explicit closed gates before any load or product use.

## Which file a client opens first

`AbarVa_Template_Pack_Index_v3.xlsx` is the front door. It carries `Start Here`, `Intake Workstreams`, `Review Queue`, `Source Extract Map`, `Canonical Mapping`, `SME Review Matrix`, and `Evidence and Gates`. Every other workbook opens on its own `Start Here` sheet naming the workstream, the owner group, the evidence that populates it, and a pointer back to the index; the pack's original per-tab orientation sheet is retained as `Sheet Guide`.

Regenerate the pack with:

```
node scripts/audit/build-universal-template-workbook-quality-bar.mjs
```

The script is idempotent and never edits the `.csv` column contracts. Workbook hashes land in `reports/tenant-template-quality-bar-2026-08-12/template-workbook-inventory.csv`.
