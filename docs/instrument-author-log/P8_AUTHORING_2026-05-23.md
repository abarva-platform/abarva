# P8 Instrument Authoring Log

Date: 2026-05-23 11:06 CDT

## Runtime Path

Content was authored directly through the P4 Azure Postgres schema from a short-lived manual Container Apps job in `cae-abarva-scale-lab-eastus`, using the runtime identity `id-abarva-scale-runtime-lab-eastus` and the `azure-postgres-control-database-url` Key Vault secret.

No application schema or runtime code was changed. The temporary authoring job `job-p8-author` was deleted after logs were captured.

## Published Instruments

All 12 required instruments were inserted/upserted as global `instrument_templates` at `status='published'`, with version, review, and audit rows:

| # | Slug | Name | Format | Depth |
|---|---|---|---|---|
| 1 | `application-portfolio-inventory` | Application portfolio inventory | `csv` | 10 |
| 2 | `repo-telemetry-spec` | Repo telemetry spec | `json` | 10 |
| 3 | `dora-baseline-kit` | DORA baseline kit | `sql` | 10 |
| 4 | `devex-space-survey` | DevEx + SPACE survey | `interactive_form` | 10 |
| 5 | `engineer-time-allocation-diary` | Engineer time-allocation diary | `docx` | 10 |
| 6 | `tool-footprint-scan-spec` | Tool footprint scan spec | `json` | 10 |
| 7 | `ai-tool-utilization-funnel` | AI tool utilization | `csv` | 10 |
| 8 | `contract-review-checklist` | Contract review checklist | `md` | 10 |
| 9 | `workflow-value-stream-workshop-kit` | Workflow / value-stream workshop kit | `docx` | 10 |
| 10 | `manager-interview-guide` | Manager interview guide | `md` | 9 |
| 11 | `cxo-interview-guides` | CXO interview guides | `docx` | 9 |
| 12 | `industry-benchmark-pack` | Industry benchmark pack | `json` | 10 |

Each instrument includes the Rubric I fields: sample-size math, bias controls, privacy/consent block, capture validation rules, triangulation plan, calibration questions, 15-step data-cleaning checklist, edge-case guide, missing-data sensitivity, and refresh cadence.

Special coverage included:
- Engineer time-allocation diary: explicit privacy/consent block and anonymization-at-source instructions.
- DORA baseline kit: GitHub, GitLab, Bitbucket, and CI extraction SQL templates.
- CXO interview guides: CTO, CFO, HEng, HPeople, and CISO sub-guides.
- Tool footprint scan spec: Flexera, Snow, and ServiceNow SAM integration coverage.

## Per-Move Assignment

All 12 instruments were assigned to:
- Client: Apex Retail (`c7578e7a-545a-4b75-860e-465358f5e00b`)
- Move: `Store Associate Productivity` (`637530a8-6302-424b-91d2-7adef902c87d`)

Live counts:
- `published_count=12`
- `assigned_count=12`
- `min_depth=9`
- `max_depth=10`

## Render / Download Smoke

The authoring job rendered every instrument in every P4 download format:
- Formats: `csv`, `md`, `json`, `docx`, `sql`, `interactive_form`
- Total renders: `72`

Three-format smoke examples:
- `application-portfolio-inventory-v1.csv`: 170 bytes
- `dora-baseline-kit-v1.sql`: 818 bytes
- `engineer-time-allocation-diary-v1.docx`: 9241 bytes

DOCX render samples across the three smoke instruments were 9087-9241 bytes. Interactive schema samples were 1443-1662 bytes.
