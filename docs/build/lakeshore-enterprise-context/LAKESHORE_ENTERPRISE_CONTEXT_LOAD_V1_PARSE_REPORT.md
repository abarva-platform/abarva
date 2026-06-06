# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Parse Report

- Parsed at: 2026-06-06T16:16:05.479Z
- Parser: `src/lib/ingestion/document-upload-parser.ts::parseIngestionDocument (+csv/jsonl/text chunkers)`
- Files: **127** · Parsed OK: **127** · Failed: **0**
- Extracted characters: **614,782**
- Estimated total chunks: **3,333**

## By file type

| type  | files | ok  | extracted chars | est. chunks |
| ----- | ----- | --- | --------------- | ----------- |
| csv   | 8     | 8   | 205,218         | 1,816       |
| docx  | 24    | 24  | 9,083           | 24          |
| jsonl | 1     | 1   | 199,104         | 1,200       |
| md    | 5     | 5   | 6,828           | 11          |
| pdf   | 17    | 17  | 11,514          | 20          |
| svg   | 2     | 2   | 6,848           | 9           |
| xlsx  | 70    | 70  | 176,187         | 253         |

## By context domain

| context_domain               | files | ok  | est. chunks |
| ---------------------------- | ----- | --- | ----------- |
| ai_use_cases_moves           | 10    | 10  | 25          |
| data_analytics_reporting     | 10    | 10  | 121         |
| enterprise_profile           | 9     | 9   | 23          |
| finance_performance          | 11    | 11  | 28          |
| it_systems_architecture      | 12    | 12  | 33          |
| manifest                     | 4     | 4   | 21          |
| operations_business_process  | 9     | 9   | 10          |
| org_decision_rights          | 8     | 8   | 21          |
| risk_controls_responsible_ai | 11    | 11  | 74          |
| servicenow_support_workload  | 10    | 10  | 2,825       |
| strategy_initiatives         | 9     | 9   | 43          |
| treasury_kyriba              | 13    | 13  | 79          |
| vendors_contracts_source     | 11    | 11  | 30          |

## Failures

None — every file parsed successfully through the loader parser path.

## Sample parsed methods

| file                         | method          | chars | chunks |
| ---------------------------- | --------------- | ----- | ------ |
| `pack_overview.md`           | markdown-text   | 2,049 | 3      |
| `load_control_plan.md`       | markdown-text   | 1,680 | 3      |
| `glossary_and_taxonomy.md`   | markdown-text   | 1,581 | 2      |
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
