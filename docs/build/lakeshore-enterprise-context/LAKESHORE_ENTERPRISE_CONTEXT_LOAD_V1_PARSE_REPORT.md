# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Parse Report

- Parsed at: 2026-06-06T16:44:26.827Z
- Parser: `src/lib/ingestion/document-upload-parser.ts::parseIngestionDocument (+csv/jsonl/text chunkers)`
- Files: **133** · Parsed OK: **133** · Failed: **0**
- Extracted characters: **711,705**
- Estimated total chunks: **3,456**

## By file type

| type  | files | ok  | extracted chars | est. chunks |
| ----- | ----- | --- | --------------- | ----------- |
| csv   | 8     | 8   | 205,257         | 1,816       |
| docx  | 24    | 24  | 12,567          | 28          |
| jsonl | 1     | 1   | 199,163         | 1,200       |
| md    | 5     | 5   | 6,616           | 10          |
| pdf   | 17    | 17  | 14,203          | 24          |
| svg   | 7     | 7   | 90,591          | 117         |
| xlsx  | 71    | 71  | 183,308         | 261         |

## By context domain

| context_domain               | files | ok  | est. chunks |
| ---------------------------- | ----- | --- | ----------- |
| ai_use_cases_moves           | 11    | 11  | 40          |
| data_analytics_reporting     | 11    | 11  | 136         |
| enterprise_profile           | 9     | 9   | 23          |
| finance_performance          | 11    | 11  | 28          |
| it_systems_architecture      | 14    | 14  | 89          |
| manifest                     | 4     | 4   | 20          |
| operations_business_process  | 9     | 9   | 10          |
| org_decision_rights          | 8     | 8   | 21          |
| risk_controls_responsible_ai | 12    | 12  | 87          |
| servicenow_support_workload  | 10    | 10  | 2,825       |
| strategy_initiatives         | 9     | 9   | 48          |
| treasury_kyriba              | 14    | 14  | 99          |
| vendors_contracts_source     | 11    | 11  | 30          |

## Failures

None — every file parsed successfully through the loader parser path.

## Sample parsed methods

| file                         | method          | chars | chunks |
| ---------------------------- | --------------- | ----- | ------ |
| `pack_overview.md`           | markdown-text   | 2,044 | 3      |
| `load_control_plan.md`       | markdown-text   | 1,475 | 2      |
| `glossary_and_taxonomy.md`   | markdown-text   | 1,580 | 2      |
| `context_domain_index.csv`   | csv-row-chunker | 1,288 | 13     |
| `corporate_overview.pdf`     | pdf-parse       | 2,028 | 3      |
| `business_units.xlsx`        | exceljs-xlsx    | 1,544 | 2      |
| `geographic_footprint.xlsx`  | exceljs-xlsx    | 1,795 | 3      |
| `revenue_cost_baseline.xlsx` | exceljs-xlsx    | 1,230 | 2      |
| `leadership_priorities.pdf`  | pdf-parse       | 761   | 1      |
| `operating_model.docx`       | docx-mammoth    | 608   | 1      |
| `transformation_themes.md`   | markdown-text   | 687   | 1      |
| `enterprise_fact_sheet.csv`  | csv-row-chunker | 359   | 8      |
| `segment_pnl_summary.xlsx`   | exceljs-xlsx    | 1,091 | 2      |
| `executive_org_chart.xlsx`   | exceljs-xlsx    | 1,862 | 3      |
