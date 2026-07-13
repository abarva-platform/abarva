# Home Content Accuracy Audit

Generated: `2026-07-13T21:32:25.757Z`

This is a deterministic artifact audit of Home content by active tenant, dimension, and tab. It does not call Claude, write production tenant data, promote candidates, or update Active Tenant Access.

Result: **397 pass / 0 watch / 0 fail**

## Tenant Rollup

| Tenant | Source rows | Source files | Candidate records | Source-rich/candidate-thin |
|---|---:|---:|---:|---|
| Airline Demo | 31,213 | 283 | 53 | yes |
| Lakeshore Holdings | 8,721 | 211 | 0 | yes |
| Healthcare Demo | 11,226 | 271 | 0 | yes |
| Financial Services Demo | 14,576 | 229 | 0 | yes |
| Retail Demo | 10,388 | 186 | 0 | yes |

## Dimension Rollup

### Airline Demo

| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |
|---|---:|---:|---:|---:|---:|---|
| Business Functions | 73 | 2 | 53 | 0 | 73 | answerable_with_caveats |
| Applications & Systems | 956 | 1 | 53 | 0 | 3,644 | answerable_with_caveats |
| Vendors & Contracts | 320 | 1 | 53 | 0 | 1,280 | answerable_with_caveats |
| Data Assets | 2,236 | 1 | 53 | 0 | 8,880 | answerable_with_caveats |
| Integrations | 2,236 | 1 | 53 | 0 | 8,880 | answerable_with_caveats |
| Programs & Initiatives | 663 | 2 | 53 | 0 | 1,415 | answerable_with_caveats |
| Risks & Controls | 1,877 | 2 | 53 | 0 | 3,868 | answerable_with_caveats |
| Metrics / KPIs | 797 | 2 | 53 | 0 | 1,899 | answerable_with_caveats |
| Evidence Sources | 489 | 1 | 53 | 0 | 1,029 | answerable_with_caveats |
| Relationships | 0 | 0 | 0 | 0 | 0 | not_available_yet |

### Lakeshore Holdings

| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |
|---|---:|---:|---:|---:|---:|---|
| Business Functions | 28 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Applications & Systems | 141 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Vendors & Contracts | 90 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Data Assets | 305 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Integrations | 305 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Programs & Initiatives | 252 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Risks & Controls | 205 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Metrics / KPIs | 178 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Evidence Sources | 90 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Relationships | 0 | 0 | 0 | 0 | 0 | not_available_yet |

### Healthcare Demo

| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |
|---|---:|---:|---:|---:|---:|---|
| Business Functions | 39 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Applications & Systems | 162 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Vendors & Contracts | 95 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Data Assets | 360 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Integrations | 360 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Programs & Initiatives | 306 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Risks & Controls | 499 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Metrics / KPIs | 294 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Evidence Sources | 190 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Relationships | 0 | 0 | 0 | 0 | 0 | not_available_yet |

### Financial Services Demo

| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |
|---|---:|---:|---:|---:|---:|---|
| Business Functions | 43 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Applications & Systems | 272 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Vendors & Contracts | 120 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Data Assets | 460 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Integrations | 460 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Programs & Initiatives | 581 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Risks & Controls | 829 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Metrics / KPIs | 565 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Evidence Sources | 294 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Relationships | 0 | 0 | 0 | 0 | 0 | not_available_yet |

### Retail Demo

| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |
|---|---:|---:|---:|---:|---:|---|
| Business Functions | 38 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Applications & Systems | 182 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Vendors & Contracts | 100 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Data Assets | 385 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Integrations | 385 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Programs & Initiatives | 314 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Risks & Controls | 530 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Metrics / KPIs | 314 | 2 | 0 | 0 | 0 | answerable_from_loaded_context |
| Evidence Sources | 206 | 1 | 0 | 0 | 0 | answerable_from_loaded_context |
| Relationships | 0 | 0 | 0 | 0 | 0 | not_available_yet |

## Findings By Tab

### PASS

| Tenant | Dimension | Tab | Check | Detail |
|---|---|---|---|---|
| Airline Demo | Enterprise profile | enterprise-profile | required object: tenant_profile | 1 canonical tenant_profile record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: location | 6 canonical location record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: business_segment | 6 canonical business_segment record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: business_model_component | 1 canonical business_model_component record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: leadership_role | 5 canonical leadership_role record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: strategic_priority | 5 canonical strategic_priority record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: mission_statement | 1 canonical mission_statement record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required object: vision_statement | 1 canonical vision_statement record(s) present. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: industry | industry is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: headquarters | headquarters is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: revenueUsd | revenueUsd is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: employeeCount | employeeCount is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: businessModel | businessModel is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | required field: sourceAsOfDate | sourceAsOfDate is present with non-placeholder value. |
| Airline Demo | Enterprise profile | enterprise-profile | placeholder rejection | No placeholder profile values passed into canonical records. |
| Airline Demo | Enterprise profile | enterprise-profile | evidence lineage | Every enterprise profile canonical record carries evidence lineage. |
| Airline Demo | Data quality | data-quality | source estate exists | 31213 structured source rows across 283 file(s). |
| Airline Demo | Data quality | data-quality | source-rich/candidate-thin caveat | Home artifacts explicitly preserve the source-rich/candidate-thin caveat. |
| Airline Demo | Data quality | data-quality | non-destructive guardrails | Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false. |
| Airline Demo | Business Functions | summary | summary tab completeness | 73 loaded, 73 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Business Functions | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Airline Demo | Business Functions | gaps | gaps tab does not false-green | 2 gap pattern(s) visible. |
| Airline Demo | Business Functions | sources | sources tab lineage | 2 source file(s), 53 evidence item(s). |
| Airline Demo | Business Functions | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Applications & Systems | summary | summary tab completeness | 956 loaded, 956 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Applications & Systems | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Airline Demo | Applications & Systems | gaps | gaps tab does not false-green | 4 gap pattern(s) visible. |
| Airline Demo | Applications & Systems | sources | sources tab lineage | 1 source file(s), 53 evidence item(s). |
| Airline Demo | Applications & Systems | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Vendors & Contracts | summary | summary tab completeness | 320 loaded, 320 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Vendors & Contracts | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Airline Demo | Vendors & Contracts | gaps | gaps tab does not false-green | 4 gap pattern(s) visible. |
| Airline Demo | Vendors & Contracts | sources | sources tab lineage | 1 source file(s), 53 evidence item(s). |
| Airline Demo | Vendors & Contracts | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Data Assets | summary | summary tab completeness | 2,236 loaded, 2,236 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Data Assets | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Airline Demo | Data Assets | gaps | gaps tab does not false-green | 4 gap pattern(s) visible. |
| Airline Demo | Data Assets | sources | sources tab lineage | 1 source file(s), 53 evidence item(s). |
| Airline Demo | Data Assets | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Integrations | summary | summary tab completeness | 2,236 loaded, 2,236 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Integrations | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Airline Demo | Integrations | gaps | gaps tab does not false-green | 4 gap pattern(s) visible. |
| Airline Demo | Integrations | sources | sources tab lineage | 1 source file(s), 53 evidence item(s). |
| Airline Demo | Integrations | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Programs & Initiatives | summary | summary tab completeness | 663 loaded, 663 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Programs & Initiatives | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Airline Demo | Programs & Initiatives | gaps | gaps tab does not false-green | 5 gap pattern(s) visible. |
| Airline Demo | Programs & Initiatives | sources | sources tab lineage | 2 source file(s), 53 evidence item(s). |
| Airline Demo | Programs & Initiatives | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Risks & Controls | summary | summary tab completeness | 1,877 loaded, 1,877 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Risks & Controls | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Airline Demo | Risks & Controls | gaps | gaps tab does not false-green | 5 gap pattern(s) visible. |
| Airline Demo | Risks & Controls | sources | sources tab lineage | 2 source file(s), 53 evidence item(s). |
| Airline Demo | Risks & Controls | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Metrics / KPIs | summary | summary tab completeness | 797 loaded, 797 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Metrics / KPIs | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Airline Demo | Metrics / KPIs | gaps | gaps tab does not false-green | 5 gap pattern(s) visible. |
| Airline Demo | Metrics / KPIs | sources | sources tab lineage | 2 source file(s), 53 evidence item(s). |
| Airline Demo | Metrics / KPIs | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Evidence Sources | summary | summary tab completeness | 489 loaded, 489 mapped, answerability=answerable_with_caveats. |
| Airline Demo | Evidence Sources | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Airline Demo | Evidence Sources | gaps | gaps tab does not false-green | 4 gap pattern(s) visible. |
| Airline Demo | Evidence Sources | sources | sources tab lineage | 1 source file(s), 53 evidence item(s). |
| Airline Demo | Evidence Sources | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | Relationships | summary | summary tab completeness | 0 loaded, 0 mapped, answerability=not_available_yet. |
| Airline Demo | Relationships | data | data tab representative rows | No loaded rows; data tab can render empty state honestly. |
| Airline Demo | Relationships | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Airline Demo | Relationships | sources | sources tab lineage | 0 source file(s), 0 evidence item(s). |
| Airline Demo | Relationships | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Airline Demo | All dimensions | summary | dimension-specific rollups | 9 loaded dimensions have 8 distinct count signature(s). |
| Airline Demo | Business Functions | summary | source-backed area projected | Business Functions projects 73 loaded row(s) from 2 source file(s). |
| Airline Demo | Applications & Systems | summary | source-backed area projected | Applications & Systems projects 956 loaded row(s) from 1 source file(s). |
| Airline Demo | Vendors & Contracts | summary | source-backed area projected | Vendors & Contracts projects 320 loaded row(s) from 1 source file(s). |
| Airline Demo | Data Assets | summary | source-backed area projected | Data Assets projects 2,236 loaded row(s) from 1 source file(s). |
| Airline Demo | Integrations | summary | source-backed area projected | Integrations projects 2,236 loaded row(s) from 1 source file(s). |
| Airline Demo | Programs & Initiatives | summary | source-backed area projected | Programs & Initiatives projects 663 loaded row(s) from 2 source file(s). |
| Airline Demo | Risks & Controls | summary | source-backed area projected | Risks & Controls projects 1,877 loaded row(s) from 2 source file(s). |
| Airline Demo | Metrics / KPIs | summary | source-backed area projected | Metrics / KPIs projects 797 loaded row(s) from 2 source file(s). |
| Airline Demo | Evidence Sources | summary | source-backed area projected | Evidence Sources projects 489 loaded row(s) from 1 source file(s). |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: tenant_profile | 1 canonical tenant_profile record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: location | 4 canonical location record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: business_segment | 6 canonical business_segment record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: business_model_component | 1 canonical business_model_component record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: leadership_role | 5 canonical leadership_role record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: strategic_priority | 5 canonical strategic_priority record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: mission_statement | 1 canonical mission_statement record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required object: vision_statement | 1 canonical vision_statement record(s) present. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: industry | industry is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: headquarters | headquarters is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: revenueUsd | revenueUsd is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: employeeCount | employeeCount is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: businessModel | businessModel is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | required field: sourceAsOfDate | sourceAsOfDate is present with non-placeholder value. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | placeholder rejection | No placeholder profile values passed into canonical records. |
| Lakeshore Holdings | Enterprise profile | enterprise-profile | evidence lineage | Every enterprise profile canonical record carries evidence lineage. |
| Lakeshore Holdings | Data quality | data-quality | source estate exists | 8721 structured source rows across 211 file(s). |
| Lakeshore Holdings | Data quality | data-quality | source-rich/candidate-thin caveat | Home artifacts explicitly preserve the source-rich/candidate-thin caveat. |
| Lakeshore Holdings | Data quality | data-quality | non-destructive guardrails | Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false. |
| Lakeshore Holdings | Business Functions | summary | summary tab completeness | 28 loaded, 28 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Business Functions | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Business Functions | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Business Functions | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Business Functions | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Applications & Systems | summary | summary tab completeness | 141 loaded, 141 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Applications & Systems | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Applications & Systems | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Applications & Systems | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Applications & Systems | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Vendors & Contracts | summary | summary tab completeness | 90 loaded, 90 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Vendors & Contracts | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Vendors & Contracts | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Vendors & Contracts | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Vendors & Contracts | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Data Assets | summary | summary tab completeness | 305 loaded, 305 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Data Assets | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Data Assets | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Data Assets | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Data Assets | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Integrations | summary | summary tab completeness | 305 loaded, 305 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Integrations | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Integrations | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Integrations | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Integrations | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Programs & Initiatives | summary | summary tab completeness | 252 loaded, 252 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Programs & Initiatives | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Programs & Initiatives | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Programs & Initiatives | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Programs & Initiatives | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Risks & Controls | summary | summary tab completeness | 205 loaded, 205 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Risks & Controls | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Risks & Controls | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Risks & Controls | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Risks & Controls | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Metrics / KPIs | summary | summary tab completeness | 178 loaded, 178 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Metrics / KPIs | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Metrics / KPIs | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Metrics / KPIs | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Metrics / KPIs | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Evidence Sources | summary | summary tab completeness | 90 loaded, 90 mapped, answerability=answerable_from_loaded_context. |
| Lakeshore Holdings | Evidence Sources | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Lakeshore Holdings | Evidence Sources | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Evidence Sources | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Evidence Sources | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | Relationships | summary | summary tab completeness | 0 loaded, 0 mapped, answerability=not_available_yet. |
| Lakeshore Holdings | Relationships | data | data tab representative rows | No loaded rows; data tab can render empty state honestly. |
| Lakeshore Holdings | Relationships | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Lakeshore Holdings | Relationships | sources | sources tab lineage | 0 source file(s), 0 evidence item(s). |
| Lakeshore Holdings | Relationships | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Lakeshore Holdings | All dimensions | summary | dimension-specific rollups | 9 loaded dimensions have 7 distinct count signature(s). |
| Lakeshore Holdings | Business Functions | summary | source-backed area projected | Business Functions projects 28 loaded row(s) from 2 source file(s). |
| Lakeshore Holdings | Applications & Systems | summary | source-backed area projected | Applications & Systems projects 141 loaded row(s) from 1 source file(s). |
| Lakeshore Holdings | Vendors & Contracts | summary | source-backed area projected | Vendors & Contracts projects 90 loaded row(s) from 1 source file(s). |
| Lakeshore Holdings | Data Assets | summary | source-backed area projected | Data Assets projects 305 loaded row(s) from 1 source file(s). |
| Lakeshore Holdings | Integrations | summary | source-backed area projected | Integrations projects 305 loaded row(s) from 1 source file(s). |
| Lakeshore Holdings | Programs & Initiatives | summary | source-backed area projected | Programs & Initiatives projects 252 loaded row(s) from 2 source file(s). |
| Lakeshore Holdings | Risks & Controls | summary | source-backed area projected | Risks & Controls projects 205 loaded row(s) from 2 source file(s). |
| Lakeshore Holdings | Metrics / KPIs | summary | source-backed area projected | Metrics / KPIs projects 178 loaded row(s) from 2 source file(s). |
| Lakeshore Holdings | Evidence Sources | summary | source-backed area projected | Evidence Sources projects 90 loaded row(s) from 1 source file(s). |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: tenant_profile | 1 canonical tenant_profile record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: location | 5 canonical location record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: business_segment | 6 canonical business_segment record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: business_model_component | 1 canonical business_model_component record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: leadership_role | 5 canonical leadership_role record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: strategic_priority | 7 canonical strategic_priority record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: mission_statement | 1 canonical mission_statement record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required object: vision_statement | 1 canonical vision_statement record(s) present. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: industry | industry is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: headquarters | headquarters is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: revenueUsd | revenueUsd is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: employeeCount | employeeCount is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: businessModel | businessModel is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | required field: sourceAsOfDate | sourceAsOfDate is present with non-placeholder value. |
| Healthcare Demo | Enterprise profile | enterprise-profile | placeholder rejection | No placeholder profile values passed into canonical records. |
| Healthcare Demo | Enterprise profile | enterprise-profile | evidence lineage | Every enterprise profile canonical record carries evidence lineage. |
| Healthcare Demo | Data quality | data-quality | source estate exists | 11226 structured source rows across 271 file(s). |
| Healthcare Demo | Data quality | data-quality | source-rich/candidate-thin caveat | Home artifacts explicitly preserve the source-rich/candidate-thin caveat. |
| Healthcare Demo | Data quality | data-quality | non-destructive guardrails | Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false. |
| Healthcare Demo | Business Functions | summary | summary tab completeness | 39 loaded, 39 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Business Functions | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Healthcare Demo | Business Functions | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Business Functions | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Healthcare Demo | Business Functions | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Applications & Systems | summary | summary tab completeness | 162 loaded, 162 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Applications & Systems | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Healthcare Demo | Applications & Systems | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Applications & Systems | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Healthcare Demo | Applications & Systems | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Vendors & Contracts | summary | summary tab completeness | 95 loaded, 95 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Vendors & Contracts | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Healthcare Demo | Vendors & Contracts | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Vendors & Contracts | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Healthcare Demo | Vendors & Contracts | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Data Assets | summary | summary tab completeness | 360 loaded, 360 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Data Assets | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Healthcare Demo | Data Assets | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Data Assets | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Healthcare Demo | Data Assets | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Integrations | summary | summary tab completeness | 360 loaded, 360 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Integrations | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Healthcare Demo | Integrations | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Integrations | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Healthcare Demo | Integrations | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Programs & Initiatives | summary | summary tab completeness | 306 loaded, 306 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Programs & Initiatives | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Healthcare Demo | Programs & Initiatives | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Programs & Initiatives | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Healthcare Demo | Programs & Initiatives | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Risks & Controls | summary | summary tab completeness | 499 loaded, 499 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Risks & Controls | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Healthcare Demo | Risks & Controls | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Risks & Controls | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Healthcare Demo | Risks & Controls | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Metrics / KPIs | summary | summary tab completeness | 294 loaded, 294 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Metrics / KPIs | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Healthcare Demo | Metrics / KPIs | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Metrics / KPIs | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Healthcare Demo | Metrics / KPIs | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Evidence Sources | summary | summary tab completeness | 190 loaded, 190 mapped, answerability=answerable_from_loaded_context. |
| Healthcare Demo | Evidence Sources | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Healthcare Demo | Evidence Sources | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Evidence Sources | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Healthcare Demo | Evidence Sources | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | Relationships | summary | summary tab completeness | 0 loaded, 0 mapped, answerability=not_available_yet. |
| Healthcare Demo | Relationships | data | data tab representative rows | No loaded rows; data tab can render empty state honestly. |
| Healthcare Demo | Relationships | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Healthcare Demo | Relationships | sources | sources tab lineage | 0 source file(s), 0 evidence item(s). |
| Healthcare Demo | Relationships | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Healthcare Demo | All dimensions | summary | dimension-specific rollups | 9 loaded dimensions have 8 distinct count signature(s). |
| Healthcare Demo | Business Functions | summary | source-backed area projected | Business Functions projects 39 loaded row(s) from 2 source file(s). |
| Healthcare Demo | Applications & Systems | summary | source-backed area projected | Applications & Systems projects 162 loaded row(s) from 1 source file(s). |
| Healthcare Demo | Vendors & Contracts | summary | source-backed area projected | Vendors & Contracts projects 95 loaded row(s) from 1 source file(s). |
| Healthcare Demo | Data Assets | summary | source-backed area projected | Data Assets projects 360 loaded row(s) from 1 source file(s). |
| Healthcare Demo | Integrations | summary | source-backed area projected | Integrations projects 360 loaded row(s) from 1 source file(s). |
| Healthcare Demo | Programs & Initiatives | summary | source-backed area projected | Programs & Initiatives projects 306 loaded row(s) from 2 source file(s). |
| Healthcare Demo | Risks & Controls | summary | source-backed area projected | Risks & Controls projects 499 loaded row(s) from 2 source file(s). |
| Healthcare Demo | Metrics / KPIs | summary | source-backed area projected | Metrics / KPIs projects 294 loaded row(s) from 2 source file(s). |
| Healthcare Demo | Evidence Sources | summary | source-backed area projected | Evidence Sources projects 190 loaded row(s) from 1 source file(s). |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: tenant_profile | 1 canonical tenant_profile record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: location | 6 canonical location record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: business_segment | 7 canonical business_segment record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: business_model_component | 1 canonical business_model_component record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: leadership_role | 5 canonical leadership_role record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: strategic_priority | 5 canonical strategic_priority record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: mission_statement | 1 canonical mission_statement record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required object: vision_statement | 1 canonical vision_statement record(s) present. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: industry | industry is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: headquarters | headquarters is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: revenueUsd | revenueUsd is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: employeeCount | employeeCount is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: businessModel | businessModel is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | required field: sourceAsOfDate | sourceAsOfDate is present with non-placeholder value. |
| Financial Services Demo | Enterprise profile | enterprise-profile | placeholder rejection | No placeholder profile values passed into canonical records. |
| Financial Services Demo | Enterprise profile | enterprise-profile | evidence lineage | Every enterprise profile canonical record carries evidence lineage. |
| Financial Services Demo | Data quality | data-quality | source estate exists | 14576 structured source rows across 229 file(s). |
| Financial Services Demo | Data quality | data-quality | source-rich/candidate-thin caveat | Home artifacts explicitly preserve the source-rich/candidate-thin caveat. |
| Financial Services Demo | Data quality | data-quality | non-destructive guardrails | Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false. |
| Financial Services Demo | Business Functions | summary | summary tab completeness | 43 loaded, 43 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Business Functions | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Financial Services Demo | Business Functions | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Business Functions | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Financial Services Demo | Business Functions | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Applications & Systems | summary | summary tab completeness | 272 loaded, 272 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Applications & Systems | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Financial Services Demo | Applications & Systems | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Applications & Systems | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Financial Services Demo | Applications & Systems | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Vendors & Contracts | summary | summary tab completeness | 120 loaded, 120 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Vendors & Contracts | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Financial Services Demo | Vendors & Contracts | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Vendors & Contracts | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Financial Services Demo | Vendors & Contracts | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Data Assets | summary | summary tab completeness | 460 loaded, 460 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Data Assets | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Financial Services Demo | Data Assets | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Data Assets | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Financial Services Demo | Data Assets | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Integrations | summary | summary tab completeness | 460 loaded, 460 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Integrations | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Financial Services Demo | Integrations | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Integrations | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Financial Services Demo | Integrations | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Programs & Initiatives | summary | summary tab completeness | 581 loaded, 581 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Programs & Initiatives | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Financial Services Demo | Programs & Initiatives | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Programs & Initiatives | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Financial Services Demo | Programs & Initiatives | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Risks & Controls | summary | summary tab completeness | 829 loaded, 829 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Risks & Controls | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Financial Services Demo | Risks & Controls | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Risks & Controls | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Financial Services Demo | Risks & Controls | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Metrics / KPIs | summary | summary tab completeness | 565 loaded, 565 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Metrics / KPIs | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Financial Services Demo | Metrics / KPIs | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Metrics / KPIs | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Financial Services Demo | Metrics / KPIs | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Evidence Sources | summary | summary tab completeness | 294 loaded, 294 mapped, answerability=answerable_from_loaded_context. |
| Financial Services Demo | Evidence Sources | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Financial Services Demo | Evidence Sources | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Evidence Sources | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Financial Services Demo | Evidence Sources | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | Relationships | summary | summary tab completeness | 0 loaded, 0 mapped, answerability=not_available_yet. |
| Financial Services Demo | Relationships | data | data tab representative rows | No loaded rows; data tab can render empty state honestly. |
| Financial Services Demo | Relationships | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Financial Services Demo | Relationships | sources | sources tab lineage | 0 source file(s), 0 evidence item(s). |
| Financial Services Demo | Relationships | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Financial Services Demo | All dimensions | summary | dimension-specific rollups | 9 loaded dimensions have 8 distinct count signature(s). |
| Financial Services Demo | Business Functions | summary | source-backed area projected | Business Functions projects 43 loaded row(s) from 2 source file(s). |
| Financial Services Demo | Applications & Systems | summary | source-backed area projected | Applications & Systems projects 272 loaded row(s) from 1 source file(s). |
| Financial Services Demo | Vendors & Contracts | summary | source-backed area projected | Vendors & Contracts projects 120 loaded row(s) from 1 source file(s). |
| Financial Services Demo | Data Assets | summary | source-backed area projected | Data Assets projects 460 loaded row(s) from 1 source file(s). |
| Financial Services Demo | Integrations | summary | source-backed area projected | Integrations projects 460 loaded row(s) from 1 source file(s). |
| Financial Services Demo | Programs & Initiatives | summary | source-backed area projected | Programs & Initiatives projects 581 loaded row(s) from 2 source file(s). |
| Financial Services Demo | Risks & Controls | summary | source-backed area projected | Risks & Controls projects 829 loaded row(s) from 2 source file(s). |
| Financial Services Demo | Metrics / KPIs | summary | source-backed area projected | Metrics / KPIs projects 565 loaded row(s) from 2 source file(s). |
| Financial Services Demo | Evidence Sources | summary | source-backed area projected | Evidence Sources projects 294 loaded row(s) from 1 source file(s). |
| Retail Demo | Enterprise profile | enterprise-profile | required object: tenant_profile | 1 canonical tenant_profile record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: location | 5 canonical location record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: business_segment | 7 canonical business_segment record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: business_model_component | 1 canonical business_model_component record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: leadership_role | 5 canonical leadership_role record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: strategic_priority | 5 canonical strategic_priority record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: mission_statement | 1 canonical mission_statement record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required object: vision_statement | 1 canonical vision_statement record(s) present. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: industry | industry is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: headquarters | headquarters is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: revenueUsd | revenueUsd is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: employeeCount | employeeCount is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: businessModel | businessModel is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | required field: sourceAsOfDate | sourceAsOfDate is present with non-placeholder value. |
| Retail Demo | Enterprise profile | enterprise-profile | placeholder rejection | No placeholder profile values passed into canonical records. |
| Retail Demo | Enterprise profile | enterprise-profile | evidence lineage | Every enterprise profile canonical record carries evidence lineage. |
| Retail Demo | Data quality | data-quality | source estate exists | 10388 structured source rows across 186 file(s). |
| Retail Demo | Data quality | data-quality | source-rich/candidate-thin caveat | Home artifacts explicitly preserve the source-rich/candidate-thin caveat. |
| Retail Demo | Data quality | data-quality | non-destructive guardrails | Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false. |
| Retail Demo | Business Functions | summary | summary tab completeness | 38 loaded, 38 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Business Functions | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Retail Demo | Business Functions | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Business Functions | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Retail Demo | Business Functions | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Applications & Systems | summary | summary tab completeness | 182 loaded, 182 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Applications & Systems | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Retail Demo | Applications & Systems | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Applications & Systems | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Retail Demo | Applications & Systems | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Vendors & Contracts | summary | summary tab completeness | 100 loaded, 100 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Vendors & Contracts | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Retail Demo | Vendors & Contracts | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Vendors & Contracts | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Retail Demo | Vendors & Contracts | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Data Assets | summary | summary tab completeness | 385 loaded, 385 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Data Assets | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Retail Demo | Data Assets | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Data Assets | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Retail Demo | Data Assets | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Integrations | summary | summary tab completeness | 385 loaded, 385 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Integrations | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Retail Demo | Integrations | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Integrations | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Retail Demo | Integrations | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Programs & Initiatives | summary | summary tab completeness | 314 loaded, 314 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Programs & Initiatives | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Retail Demo | Programs & Initiatives | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Programs & Initiatives | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Retail Demo | Programs & Initiatives | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Risks & Controls | summary | summary tab completeness | 530 loaded, 530 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Risks & Controls | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Retail Demo | Risks & Controls | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Risks & Controls | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Retail Demo | Risks & Controls | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Metrics / KPIs | summary | summary tab completeness | 314 loaded, 314 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Metrics / KPIs | data | data tab representative rows | 5 representative example(s) available without placeholder language. |
| Retail Demo | Metrics / KPIs | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Metrics / KPIs | sources | sources tab lineage | 2 source file(s), 0 evidence item(s). |
| Retail Demo | Metrics / KPIs | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Evidence Sources | summary | summary tab completeness | 206 loaded, 206 mapped, answerability=answerable_from_loaded_context. |
| Retail Demo | Evidence Sources | data | data tab representative rows | 3 representative example(s) available without placeholder language. |
| Retail Demo | Evidence Sources | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Evidence Sources | sources | sources tab lineage | 1 source file(s), 0 evidence item(s). |
| Retail Demo | Evidence Sources | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | Relationships | summary | summary tab completeness | 0 loaded, 0 mapped, answerability=not_available_yet. |
| Retail Demo | Relationships | data | data tab representative rows | No loaded rows; data tab can render empty state honestly. |
| Retail Demo | Relationships | gaps | gaps tab does not false-green | No repeated gap pattern, but next data actions are visible. |
| Retail Demo | Relationships | sources | sources tab lineage | 0 source file(s), 0 evidence item(s). |
| Retail Demo | Relationships | relationships | relationships tab honesty | Relationship count is 0 and text says: Relationship depth is limited or not projected for this area. |
| Retail Demo | All dimensions | summary | dimension-specific rollups | 9 loaded dimensions have 7 distinct count signature(s). |
| Retail Demo | Business Functions | summary | source-backed area projected | Business Functions projects 38 loaded row(s) from 2 source file(s). |
| Retail Demo | Applications & Systems | summary | source-backed area projected | Applications & Systems projects 182 loaded row(s) from 1 source file(s). |
| Retail Demo | Vendors & Contracts | summary | source-backed area projected | Vendors & Contracts projects 100 loaded row(s) from 1 source file(s). |
| Retail Demo | Data Assets | summary | source-backed area projected | Data Assets projects 385 loaded row(s) from 1 source file(s). |
| Retail Demo | Integrations | summary | source-backed area projected | Integrations projects 385 loaded row(s) from 1 source file(s). |
| Retail Demo | Programs & Initiatives | summary | source-backed area projected | Programs & Initiatives projects 314 loaded row(s) from 2 source file(s). |
| Retail Demo | Risks & Controls | summary | source-backed area projected | Risks & Controls projects 530 loaded row(s) from 2 source file(s). |
| Retail Demo | Metrics / KPIs | summary | source-backed area projected | Metrics / KPIs projects 314 loaded row(s) from 2 source file(s). |
| Retail Demo | Evidence Sources | summary | source-backed area projected | Evidence Sources projects 206 loaded row(s) from 1 source file(s). |
| All active tenants | Active tenant set | live-crawl | all active tenants represented | All expected active tenants are present in Home snapshot artifacts. |
| All active tenants | Active tenant set | live-crawl | Northstar retired/excluded | Northstar is not present as an active Home snapshot tenant. |

## Guardrails

- deterministicArtifactAudit: true
- callsClaude: false
- productionTenantDataWritten: false
- activeTenantAccessLayerUpdated: false
- candidatePromoted: false
- moduleRuntimeConsumptionChanged: false
