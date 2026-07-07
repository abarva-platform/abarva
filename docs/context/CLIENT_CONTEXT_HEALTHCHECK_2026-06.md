# Client Context Health Check - June 2026

Generated: 2026-06-13T23:15:49.656Z

Mode: read-only. This report did not mutate source rows, facts, chunks, search documents, artifacts, or promotion status.

## Executive Summary

| Client             | Overall | client_id                            | Records | Facts by lifecycle | Search docs | Retrieval | Module readiness                                                       |
| ------------------ | ------- | ------------------------------------ | ------- | ------------------ | ----------- | --------- | ---------------------------------------------------------------------- |
| SkyHarbor Air      | PASS    | 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301 | 3106    | active: 23911      | 6341        | 15/15     | READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS     |
| Lakeshore Holdings | PASS    | 49fc8aee-3d39-48c5-82ac-1313c31470c7 | 179     | active: 2949       | 1542        | 15/15     | PRELIMINARY_ONLY, PRELIMINARY_ONLY, PRELIMINARY_ONLY, PRELIMINARY_ONLY |
| Apex Retail        | PASS    | c7578e7a-545a-4b75-860e-465358f5e00b | 1029    | active: 11410      | 7526        | 15/15     | READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS     |
| Meridian Health    | PASS    | 6e419b6e-950d-4d34-a4fc-06c3e451a6c4 | 3503    | active: 38640      | 3506        | 15/15     | READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS, READY_WITH_GAPS     |

## Azure / Job Evidence

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| subscriptionId | 701a8554-a166-46e9-bf13-743bc50e3b20                                    |
| jobName        | job-abarva-private-operator-eus                                         |
| executionName  | job-abarva-private-operator-eus-e0cem32                                 |
| imageTag       | moves-p0-gate-20260613-4b993b914                                        |
| imageDigest    | sha256:fa963ce6b6c919cd42e762d713a1ebf09ea15db803757422e7af49d839b167b3 |
| searchService  | srch-abarva-context-lab-eastus                                          |
| searchIndex    | tenant-context-v1                                                       |
| blobAccount    | stabarvaprivatedplab001                                                 |
| blobContainer  | context-drops                                                           |

## SkyHarbor Air

### Identity And Tenant Mapping

| Field                | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| canonical tenant key | skyharbor-air                                               |
| client_id            | 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301                        |
| tenant_key           | skyharbor-air                                               |
| client_key           | skyharbor-air                                               |
| legal/client name    | SkyHarbor Air                                               |
| active workspace key |                                                             |
| aliases              | skyharbor, skyharbor-air, skyharbor air, skyharbor airlines |
| key mismatch risk    | none observed                                               |

### Pipeline State

| Stage                | Count / proof | Evidence                                                                                                                                                               |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source files         | 15            | present                                                                                                                                                                |
| Azure Blob staged    | 80            | listed                                                                                                                                                                 |
| Sources              | 3             | present                                                                                                                                                                |
| Records              | 3106          | configuration_item: 680; cmdb_application: 660; integration: 500; incidents_ops_telemetry: 400; org_role: 272; kpi_metric: 168; contract: 122; business_capability: 80 |
| Facts                | 23911         | active: 23911                                                                                                                                                          |
| Chunks               | 6341          | active: 6341                                                                                                                                                           |
| Search indexed       | 6341          | tenant-context-v1                                                                                                                                                      |
| Retrieval dimensions | 15/15         | all returned                                                                                                                                                           |
| Promotion evaluated  | 9497          | agent_ready: 6202; remain_not_reviewed: 3295                                                                                                                           |
| Context bundle proof | 4             | modules with usable bundle candidates                                                                                                                                  |

### DB Counts

| Table                           | Exists | Count | Top grouping                                                                                                                                                           |
| ------------------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise_context_sources      | pass   | 3     |                                                                                                                                                                        |
| enterprise_context_source_files | pass   | 15    |                                                                                                                                                                        |
| enterprise_context_records      | pass   | 3106  | configuration_item: 680; cmdb_application: 660; integration: 500; incidents_ops_telemetry: 400; org_role: 272; kpi_metric: 168; contract: 122; business_capability: 80 |
| enterprise_context_facts        | pass   | 23911 | active: 23911                                                                                                                                                          |
| enterprise_context_chunks       | pass   | 6341  | active: 6341                                                                                                                                                           |
| governed_object_readiness       | pass   | 9497  | agent_ready: 6202; not_reviewed: 3294; committed_not_indexed: 1                                                                                                        |
| agent_context_traces            | pass   | 1008  |                                                                                                                                                                        |
| data_inventory_records          | pass   | 0     |                                                                                                                                                                        |

Facts by lifecycle:

| Lifecycle | Count |
| --------- | ----- |
| active    | 23911 |

Promotion/readiness:

| Metric                              | Counts                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted readiness status          | agent_ready: 6202; not_reviewed: 3294; committed_not_indexed: 1                                                                                                                                                                 |
| Calculated promotion recommendation | agent_ready: 6202; remain_not_reviewed: 3295                                                                                                                                                                                    |
| Top failure reasons                 | not retrievable (retrievability=committed_not_indexed): 3295; not cite-render-verified end-to-end: 3295; missing source_basis: 3294; missing confidence_level: 3294; missing provenance: 3294; no valid applicable_agents: 3294 |

### Blob Proof

| Container                             | Listed | Matching source blobs | Staged-not-processed | Error |
| ------------------------------------- | ------ | --------------------- | -------------------- | ----- |
| stabarvaprivatedplab001/context-drops | 295    | 80                    | 80                   |       |

| Blob sample                                                                                                                             | Size  | Last modified            |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------ |
| context-drops/moves/skyharbor/2e1b0258-971f-4472-ba61-802672a6bab6/approvals/p1/Phase_Gate_Decision_P0_to_P1.html                       | 2667  | 2026-06-11T15:04:06.000Z |
| context-drops/moves/skyharbor/2e1b0258-971f-4472-ba61-802672a6bab6/generated/p1/program_charter/v1/SkyHarbor_Air_Program_Charter.docx   | 21936 | 2026-06-11T17:11:18.000Z |
| context-drops/moves/skyharbor/358233e6-723d-492d-9e6b-6d8541b91207/generated/p1/program_charter/v1/SkyHarbor_Air_Program_Charter.docx   | 21607 | 2026-06-10T21:24:12.000Z |
| context-drops/moves/skyharbor/358233e6-723d-492d-9e6b-6d8541b91207/generated/p2/discovery_report/v1/SkyHarbor_Air_Discovery_Report.docx | 21937 | 2026-06-11T02:18:25.000Z |
| context-drops/moves/skyharbor/358233e6-723d-492d-9e6b-6d8541b91207/generated/p2/discovery_report/v2/SkyHarbor_Air_Discovery_Report.docx | 22241 | 2026-06-11T02:26:19.000Z |
| context-drops/moves/skyharbor/7416481a-9b31-4b16-b7ce-4ec6ae4a82db/approvals/p1/Phase_Gate_Decision_P0_to_P1.html                       | 2476  | 2026-06-13T11:46:34.000Z |
| context-drops/moves/skyharbor/7416481a-9b31-4b16-b7ce-4ec6ae4a82db/generated/p1/program_charter/v1/SkyHarbor_Air_Program_Charter.docx   | 22308 | 2026-06-13T11:52:45.000Z |
| context-drops/moves/skyharbor/7416481a-9b31-4b16-b7ce-4ec6ae4a82db/uploads/uploaded_evidence/image.png                                  | 67937 | 2026-06-13T11:52:09.000Z |
| context-drops/moves/skyharbor/a62af2d4-eaba-4512-b344-2cc4fbb415a7/uploads/uploaded_evidence/03_Baseline_Workshop_Notes.md              | 220   | 2026-06-11T02:05:01.000Z |
| context-drops/moves/skyharbor/b7be7ad4-f666-4ebc-82e5-b8b0f94c575c/approvals/p1/Phase_Gate_Decision_P0_to_P1.html                       | 2469  | 2026-06-11T13:17:11.000Z |

### Idempotency And Duplication

| Check                      | Result |
| -------------------------- | ------ |
| duplicateActiveFacts       | 0 rows |
| orphanFacts                | 0      |
| supersededFactsStillActive | 0      |
| duplicateActiveChunks      | 0 rows |
| duplicateSourceFiles       | 0 rows |

### Azure AI Search Proof

| Index             | Docs | Filter                                                                                                                                                                                                                                                                                                                          | Field presence                                                                                                        | Error |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| tenant-context-v1 | 6341 | (tenant_key eq 'skyharbor-air' or tenant_key eq 'skyharbor' or tenant_key eq 'skyharbor air' or tenant_key eq 'skyharbor airlines' or client_key eq 'skyharbor-air' or client_key eq 'skyharbor' or client_key eq 'skyharbor air' or client_key eq 'skyharbor airlines' or client_id eq '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') | {"tenant_key":true,"client_id":true,"client_key":true,"sourceCitation":true,"lifecycle_state":true,"confidence":true} |       |

| Doc id                                                                                                               | Tenant        | Segment            | Citation                                                                        | Title/content             |
| -------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------ | ------------------------------------------------------------------------------- | ------------------------- |
| c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDI2OmMw | skyharbor-air | enterprise_profile | skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv | business-capabilities.csv |
| c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDM3OmMw | skyharbor-air | enterprise_profile | skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv | business-capabilities.csv |
| c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDQ3OmMw | skyharbor-air | enterprise_profile | skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv | business-capabilities.csv |
| c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDY3OmMw | skyharbor-air | enterprise_profile | skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv | business-capabilities.csv |
| c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDc5OmMw | skyharbor-air | enterprise_profile | skyharbor-air/skyharbor-air-synthetic-v2/90b9d12ef3eb/business-capabilities.csv | business-capabilities.csv |

### Retrieval Proof

| Dimension                | Count | Tenant isolation | Citations | Source/conf | Current only | Top returned docs / error                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ----- | ---------------- | --------- | ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise profile       | 382   | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6ZW50ZXJwcmlzZS1wcm9maWxlLWNzdi1yb3cxOmMw enterprise-profile.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDQ1OmMw business-capabilities.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjplbnRlcnByaXNlX3Byb2ZpbGU6YnVzaW5lc3MtY2FwYWJpbGl0aWVzLWNzdi1jYXAtMDQ3OmMw business-capabilities.csv         |
| leadership/org           | 2838  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLUctMDA1LTA4 AIR-G-005-08; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLUctMDA1LTE0 AIR-G-005-14; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLUctMDA1LTA0 AIR-G-005-04                                                                                                                                                                                                 |
| applications/systems     | 3650  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6ZXJwLWxhbmRzY2FwZS1jc3YtZXJwLTA0NjpjMA erp-landscape.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6ZXJwLWxhbmRzY2FwZS1jc3YtZXJwLTAxNDpjMA erp-landscape.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6ZXJwLWxhbmRzY2FwZS1jc3YtZXJwLTA0NTpjMA erp-landscape.csv                                                                            |
| infrastructure/cloud     | 4450  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppbmZyYXN0cnVjdHVyZTppbmZyYXN0cnVjdHVyZS1lc3RhdGUtY3N2LWF6dXJlLTA1MjY6YzA infrastructure-estate.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppbmZyYXN0cnVjdHVyZTppbmZyYXN0cnVjdHVyZS1lc3RhdGUtY3N2LWF6dXJlLTA1Mzg6YzA infrastructure-estate.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppbmZyYXN0cnVjdHVyZTppbmZyYXN0cnVjdHVyZS1lc3RhdGUtY3N2LWF6dXJlLTA1MzA6YzA infrastructure-estate.csv |
| integrations             | 3366  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6aW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2LWludC0wNDMxOmMw integration-topology.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6aW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2LWludC0wMzQ1OmMw integration-topology.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6aW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2LWludC0wMzk1OmMw integration-topology.csv                         |
| vendor contracts         | 3539  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOnZlbmRvci1jb250cmFjdHMtY3N2LXZlbi0wMDcyOmMw vendor-contracts.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOnZlbmRvci1jb250cmFjdHMtY3N2LXZlbi0wMDkxOmMw vendor-contracts.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOnZlbmRvci1jb250cmFjdHMtY3N2LXZlbi0wMDEzOmMw vendor-contracts.csv                                                 |
| IT financials            | 3231  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOml0LWZpbmFuY2lhbHMtY3N2LWZpbi0wMTAyOmMw it-financials.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOml0LWZpbmFuY2lhbHMtY3N2LWZpbi0wMTY1OmMw it-financials.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9maW5hbmNpYWxzOml0LWZpbmFuY2lhbHMtY3N2LWZpbi0wMDkxOmMw it-financials.csv                                                                      |
| KPIs/value               | 3521  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLU4tMDA0LTE0 AIR-N-004-14; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLU4tMDA0LTA5 AIR-N-004-09; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLU4tMDA5LTA5 AIR-N-009-09                                                                                                                                                                                                 |
| DORA/engineering metrics | 2917  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjpwcm9ncmFtX2ludmVudG9yeTpkb3JhLWJhc2VsaW5lLWNzdi10ZWFtLTAxODpjMA dora-baseline.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjpwcm9ncmFtX2ludmVudG9yeTpkb3JhLWJhc2VsaW5lLWNzdi10ZWFtLTAyNTpjMA dora-baseline.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjpwcm9ncmFtX2ludmVudG9yeTpkb3JhLWJhc2VsaW5lLWNzdi10ZWFtLTAyOTpjMA dora-baseline.csv                                                    |
| incidents/ITSM           | 3279  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDAzOTpjMA sla-register.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDAzMjpjMA sla-register.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDA1NzpjMA sla-register.csv                                                                               |
| SLAs                     | 719   | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDAzNzpjMA sla-register.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDAxMzpjMA sla-register.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6c2xhLXJlZ2lzdGVyLWNzdi1zbGEtMDAxOTpjMA sla-register.csv                                                                               |
| initiatives/moves        | 3890  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAxODpjMA ai-tooling.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAyMjpjMA ai-tooling.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAyNzpjMA ai-tooling.csv                                                                                                 |
| risks/controls           | 2822  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLVAtMDA1LTEy AIR-P-005-12; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLVAtMDA1LTA3 AIR-P-005-07; c2t5aGFyYm9yLWFpcjpTSEEtQUlSLVBBVFRFUk4tQ0hVTkstQUlSLVAtMDEwLTA3 AIR-P-010-07                                                                                                                                                                                                 |
| artifacts/evidence       | 3195  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpTSEEtQ0hVTkstMDQ0NQ SHA-INDUSTRY-PATTERNS; c2t5aGFyYm9yLWFpcjpTSEEtQ0hVTkstMDQ1NQ SHA-INDUSTRY-PATTERNS; c2t5aGFyYm9yLWFpcjpTSEEtQ0hVTkstMDQyNQ SHA-INDUSTRY-PATTERNS                                                                                                                                                                                                                                                    |
| AI/data/use cases        | 3652  | pass             | pass      | pass        | pass         | c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAyMjpjMA ai-tooling.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAyNzpjMA ai-tooling.csv; c2t5aGFyYm9yLWFpcjpjdHg6c2t5aGFyYm9yLWFpcjppdF9sYW5kc2NhcGU6YWktdG9vbGluZy1jc3YtYWl0LTAxMjpjMA ai-tooling.csv                                                                                                 |

### Context Bundle Trace Proof

| Module       | Decision | Usable | Blocked | Agent-ready | Citations | Context hash     | Leakage | Unsupported claims flagged |
| ------------ | -------- | ------ | ------- | ----------- | --------- | ---------------- | ------- | -------------------------- |
| Intelligence | pass     | 3      | 0       | 3           | 1         | b3656b46f05f6fd8 | pass    | fail                       |
| Moves        | pass     | 3      | 0       | 3           | 3         | 5736d012905861d4 | pass    | fail                       |
| Source       | pass     | 3      | 0       | 3           | 1         | a12775c2e770ee1d | pass    | fail                       |
| Tower        | pass     | 3      | 0       | 3           | 3         | beccfb1a888d3162 | pass    | fail                       |

### Module Readiness

| Module       | Status          | Why                                                                                                                        |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Intelligence | READY_WITH_GAPS | Intelligence did not exercise the unsupported-claim response validator because this probe stopped before model generation. |
| Moves        | READY_WITH_GAPS | Moves did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |
| Source       | READY_WITH_GAPS | Source did not exercise the unsupported-claim response validator because this probe stopped before model generation.       |
| Tower        | READY_WITH_GAPS | Tower did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |

### Artifact / File Cabinet Readiness

| Table                  | Exists | Count | Grouping                   |
| ---------------------- | ------ | ----- | -------------------------- |
| move_artifacts         | pass   | 14    | current: 11; superseded: 3 |
| source_artifacts       | pass   | 345   | current: 345               |
| deliverables_v2        | pass   | 0     |                            |
| program_evidence_items | pass   | 12    |                            |
| program_attachments    | pass   | 0     |                            |

### Defects And Remediation

Defects found:

- None observed by this read-only probe.

Prioritized remediation backlog:

1. Use module-specific retrieval gaps to load or index the missing context dimensions before pilot claims.

## Lakeshore Holdings

### Identity And Tenant Mapping

| Field                | Value                                             |
| -------------------- | ------------------------------------------------- |
| canonical tenant key | lakeshore-holdings                                |
| client_id            | 49fc8aee-3d39-48c5-82ac-1313c31470c7              |
| tenant_key           | lakeshore-holdings                                |
| client_key           | lakeshore-holdings                                |
| legal/client name    | Lakeshore Holdings Composite Seed                 |
| active workspace key | lakeshore-holdings                                |
| aliases              | lakeshore, lakeshore-holdings, lakeshore holdings |
| key mismatch risk    | none observed                                     |

### Pipeline State

| Stage                | Count / proof | Evidence                                                                                                                                          |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source files         | 13            | present                                                                                                                                           |
| Azure Blob staged    | 80            | listed                                                                                                                                            |
| Sources              | 13            | present                                                                                                                                           |
| Records              | 179           | kpi_metric: 50; cmdb_application: 30; org_role: 20; configuration_item: 12; contract: 12; data_asset: 12; integration: 10; business_capability: 9 |
| Facts                | 2949          | active: 2949                                                                                                                                      |
| Chunks               | 1542          | active: 1542                                                                                                                                      |
| Search indexed       | 1542          | tenant-context-v1                                                                                                                                 |
| Retrieval dimensions | 15/15         | all returned                                                                                                                                      |
| Promotion evaluated  | 1542          | agent_ready: 1542                                                                                                                                 |
| Context bundle proof | 0             | modules with usable bundle candidates                                                                                                             |

### DB Counts

| Table                           | Exists | Count | Top grouping                                                                                                                                      |
| ------------------------------- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise_context_sources      | pass   | 13    |                                                                                                                                                   |
| enterprise_context_source_files | pass   | 13    |                                                                                                                                                   |
| enterprise_context_records      | pass   | 179   | kpi_metric: 50; cmdb_application: 30; org_role: 20; configuration_item: 12; contract: 12; data_asset: 12; integration: 10; business_capability: 9 |
| enterprise_context_facts        | pass   | 2949  | active: 2949                                                                                                                                      |
| enterprise_context_chunks       | pass   | 1542  | active: 1542                                                                                                                                      |
| governed_object_readiness       | pass   | 1542  | agent_ready: 1542                                                                                                                                 |
| agent_context_traces            | pass   | 0     |                                                                                                                                                   |
| data_inventory_records          | pass   | 0     |                                                                                                                                                   |

Facts by lifecycle:

| Lifecycle | Count |
| --------- | ----- |
| active    | 2949  |

Promotion/readiness:

| Metric                              | Counts            |
| ----------------------------------- | ----------------- |
| Persisted readiness status          | agent_ready: 1542 |
| Calculated promotion recommendation | agent_ready: 1542 |
| Top failure reasons                 |                   |

### Blob Proof

| Container                             | Listed | Matching source blobs | Staged-not-processed | Error |
| ------------------------------------- | ------ | --------------------- | -------------------- | ----- |
| stabarvaprivatedplab001/context-drops | 113    | 80                    | 80                   |       |

| Blob sample                                                                                                                                 | Size  | Last modified            |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------ |
| context-uploads/lakeshore-holdings/\_jobs/bulk-0af5b2dc5f80801f-structured-promotion.json                                                   | 4288  | 2026-06-08T15:30:47.000Z |
| context-uploads/lakeshore-holdings/\_jobs/bulk-0af5b2dc5f80801f.json                                                                        | 8524  | 2026-06-08T13:38:03.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/0dfce09d9c27/data/lakeshore-application-portfolio.csv   | 7375  | 2026-06-08T13:38:01.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/1b330a11804e/data/lakeshore-financial-kpi-workbook.csv  | 17951 | 2026-06-08T13:38:02.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/28dadcb35ba7/data/lakeshore-data-platform-lineage.csv   | 5318  | 2026-06-08T13:38:00.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/4aa24c286c55/data/lakeshore-enterprise-profile.json     | 1250  | 2026-06-08T13:38:00.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/50344431f7e0/data/lakeshore-business-capability-map.csv | 3432  | 2026-06-08T13:38:03.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/5bd1a76cccce/data/lakeshore-risks-controls.csv          | 2532  | 2026-06-08T13:38:02.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/7e1c92041ddc/data/lakeshore-integration-topology.csv    | 3660  | 2026-06-08T13:38:01.000Z |
| context-uploads/lakeshore-holdings/lakeshore-current-state-v2-production-compatible/9ac26e3ec36b/data/lakeshore-org-roles.csv               | 7169  | 2026-06-08T13:38:00.000Z |

### Idempotency And Duplication

| Check                      | Result |
| -------------------------- | ------ |
| duplicateActiveFacts       | 0 rows |
| orphanFacts                | 0      |
| supersededFactsStillActive | 0      |
| duplicateActiveChunks      | 0 rows |
| duplicateSourceFiles       | 0 rows |

### Azure AI Search Proof

| Index             | Docs | Filter                                                                                                                                                                                                                                                                  | Field presence                                                                                                        | Error |
| ----------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| tenant-context-v1 | 1542 | (tenant_key eq 'lakeshore-holdings' or tenant_key eq 'lakeshore' or tenant_key eq 'lakeshore holdings' or client_key eq 'lakeshore-holdings' or client_key eq 'lakeshore' or client_key eq 'lakeshore holdings' or client_id eq '49fc8aee-3d39-48c5-82ac-1313c31470c7') | {"tenant_key":true,"client_id":true,"client_key":true,"sourceCitation":true,"lifecycle_state":true,"confidence":true} |       |

| Doc id                                                                                                                         | Tenant             | Segment      | Citation                                                | Title/content             |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------ | ------------------------------------------------------- | ------------------------- |
| bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTE1       | lakeshore-holdings | it_landscape | csv-upload://lakeshore/ai-tool-footprint.csv#row=15     | ai-tool-footprint.csv     |
| bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTQy       | lakeshore-holdings | it_landscape | csv-upload://lakeshore/ai-tool-footprint.csv#row=42     | ai-tool-footprint.csv     |
| bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTU        | lakeshore-holdings | it_landscape | csv-upload://lakeshore/ai-tool-footprint.csv#row=5      | ai-tool-footprint.csv     |
| bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTc        | lakeshore-holdings | it_landscape | csv-upload://lakeshore/ai-tool-footprint.csv#row=7      | ai-tool-footprint.csv     |
| bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YXBwbGljYXRpb24tcG9ydGZvbGlvLWNzdjo0NTM3OGExMjdkMWM6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0xMQ | lakeshore-holdings | it_landscape | csv-upload://lakeshore/application-portfolio.csv#row=11 | application-portfolio.csv |

### Retrieval Proof

| Dimension                | Count | Tenant isolation | Citations | Source/conf | Current only | Top returned docs / error                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ----- | ---------------- | --------- | ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise profile       | 225   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6ZW50ZXJwcmlzZS1wcm9maWxlLWNzdjo3YTNlMTdhOTI2NzQ6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0y enterprise-profile.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6ZW50ZXJwcmlzZS1wcm9maWxlLWNzdjo3YTNlMTdhOTI2NzQ6MjAyNjA2MDRUMTQ1MDQ0OnJvdy01 enterprise-profile.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6ZW50ZXJwcmlzZS1wcm9maWxlLWNzdjo3YTNlMTdhOTI2NzQ6MjAyNjA2MDRUMTQ1MDQ0OnJvdy02 enterprise-profile.csv                                                                                                                                                                               |
| leadership/org           | 614   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YW5udWFsLXF1YXJ0ZXJseS1yZXBvcnRzLWNzdjpjMGY1YzJiZmRhZmM6MjAyNjA2MDRUMTQ1MDQ0OnJvdy03 annual-quarterly-reports.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YW5udWFsLXF1YXJ0ZXJseS1yZXBvcnRzLWNzdjpjMGY1YzJiZmRhZmM6MjAyNjA2MDRUMTQ1MDQ0OnJvdy05 annual-quarterly-reports.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YW5udWFsLXF1YXJ0ZXJseS1yZXBvcnRzLWNzdjpjMGY1YzJiZmRhZmM6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0y annual-quarterly-reports.csv                                                                                                                                     |
| applications/systems     | 477   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZXJwLWxhbmRzY2FwZS1jc3Y6YjMyNDA5OWYwMjQ3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMTA data/lakeshore-erp-landscape.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZXJwLWxhbmRzY2FwZS1jc3Y6YjMyNDA5OWYwMjQ3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMg data/lakeshore-erp-landscape.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZXJwLWxhbmRzY2FwZS1jc3Y6YjMyNDA5OWYwMjQ3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMTE data/lakeshore-erp-landscape.csv                                                                 |
| infrastructure/cloud     | 546   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW5mcmFzdHJ1Y3R1cmUtZXN0YXRlLWNzdjpkZTE0ZDI1MWNiNTM6MjAyNjA2MDhUMTMzNzU3OnJvdy0xMg data/lakeshore-infrastructure-estate.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW5mcmFzdHJ1Y3R1cmUtZXN0YXRlLWNzdjpkZTE0ZDI1MWNiNTM6MjAyNjA2MDhUMTMzNzU3OnJvdy0xMw data/lakeshore-infrastructure-estate.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW5mcmFzdHJ1Y3R1cmUtZXN0YXRlLWNzdjpkZTE0ZDI1MWNiNTM6MjAyNjA2MDhUMTMzNzU3OnJvdy0xNA data/lakeshore-infrastructure-estate.csv       |
| integrations             | 179   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2OjdlMWM5MjA0MWRkYzoyMDI2MDYwOFQxMzM3NTc6cm93LTI data/lakeshore-integration-topology.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2OjdlMWM5MjA0MWRkYzoyMDI2MDYwOFQxMzM3NTc6cm93LTg data/lakeshore-integration-topology.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtaW50ZWdyYXRpb24tdG9wb2xvZ3ktY3N2OjdlMWM5MjA0MWRkYzoyMDI2MDYwOFQxMzM3NTc6cm93LTQ data/lakeshore-integration-topology.csv                   |
| vendor contracts         | 563   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtdmVuZG9yLWNvbnRyYWN0cy1jc3Y6ZjZmNGJiYmNjNTg3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMTA data/lakeshore-vendor-contracts.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtdmVuZG9yLWNvbnRyYWN0cy1jc3Y6ZjZmNGJiYmNjNTg3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMTE data/lakeshore-vendor-contracts.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtdmVuZG9yLWNvbnRyYWN0cy1jc3Y6ZjZmNGJiYmNjNTg3OjIwMjYwNjA4VDEzMzc1Nzpyb3ctMw data/lakeshore-vendor-contracts.csv                                            |
| IT financials            | 412   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtYXBwbGljYXRpb24tcG9ydGZvbGlvLWNzdjowZGZjZTA5ZDljMjc6MjAyNjA2MDhUMTMzNzU3OnJvdy03 data/lakeshore-application-portfolio.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctNQ data/lakeshore-financial-kpi-workbook.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctNDk data/lakeshore-financial-kpi-workbook.csv      |
| KPIs/value               | 379   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctNTE data/lakeshore-financial-kpi-workbook.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctMTE data/lakeshore-financial-kpi-workbook.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctMjI data/lakeshore-financial-kpi-workbook.csv |
| DORA/engineering metrics | 370   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0xMQ incidents-change-history.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0yOQ incidents-change-history.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy00Mw incidents-change-history.csv                                                                                                                               |
| incidents/ITSM           | 417   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0xMQ incidents-change-history.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy0yOQ incidents-change-history.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5jaWRlbnRzLWNoYW5nZS1oaXN0b3J5LWNzdjpjNmQ3MjI1YWVmNDI6MjAyNjA2MDRUMTQ1MDQ0OnJvdy00Mw incidents-change-history.csv                                                                                                                               |
| SLAs                     | 339   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZmluYW5jaWFsLWtwaS13b3JrYm9vay1jc3Y6MWIzMzBhMTE4MDRlOjIwMjYwNjA4VDEzMzc1Nzpyb3ctNDY data/lakeshore-financial-kpi-workbook.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6c3RyYXRlZ3ktbWVtby1jc3Y6NGQ0ZTFlZDUzYmVlOjIwMjYwNjA0VDE0NTA0NDpyb3ctMjM strategy-memo.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6c3RyYXRlZ3ktbWVtby1jc3Y6NGQ0ZTFlZDUzYmVlOjIwMjYwNjA0VDE0NTA0NDpyb3ctMjQ strategy-memo.csv                                                                                                                                         |
| initiatives/moves        | 475   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTE5 ai-tool-footprint.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTM0 ai-tool-footprint.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6YWktdG9vbC1mb290cHJpbnQtY3N2OjFjZjY5YjA5MWUzYToyMDI2MDYwNFQxNDUwNDQ6cm93LTMx ai-tool-footprint.csv                                                                                                                                                                                  |
| risks/controls           | 151   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtcmlza3MtY29udHJvbHMtY3N2OjViZDFhNzZjY2NjZToyMDI2MDYwOFQxMzM3NTc6cm93LTc data/lakeshore-risks-controls.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtcmlza3MtY29udHJvbHMtY3N2OjViZDFhNzZjY2NjZToyMDI2MDYwOFQxMzM3NTc6cm93LTI data/lakeshore-risks-controls.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtcmlza3MtY29udHJvbHMtY3N2OjViZDFhNzZjY2NjZToyMDI2MDYwOFQxMzM3NTc6cm93LTQ data/lakeshore-risks-controls.csv                                                             |
| artifacts/evidence       | 160   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5pdGlhdGl2ZS1wb3J0Zm9saW8tY3N2OmZjNmU4OTI5MWM2ZjoyMDI2MDYwNFQxNDUwNDQ6cm93LTc initiative-portfolio.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6c3RyYXRlZ3ktbWVtby1jc3Y6NGQ0ZTFlZDUzYmVlOjIwMjYwNjA0VDE0NTA0NDpyb3ctMjA strategy-memo.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmU6aW5pdGlhdGl2ZS1wb3J0Zm9saW8tY3N2OmZjNmU4OTI5MWM2ZjoyMDI2MDYwNFQxNDUwNDQ6cm93LTM initiative-portfolio.csv                                                                                                                                                                               |
| AI/data/use cases        | 693   | pass             | pass      | pass        | pass         | bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZGF0YS1wbGF0Zm9ybS1saW5lYWdlLWNzdjoyOGRhZGNiMzViYTc6MjAyNjA2MDhUMTMzNzU3OnJvdy0xMQ data/lakeshore-data-platform-lineage.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZGF0YS1wbGF0Zm9ybS1saW5lYWdlLWNzdjoyOGRhZGNiMzViYTc6MjAyNjA2MDhUMTMzNzU3OnJvdy0xMA data/lakeshore-data-platform-lineage.csv; bGFrZXNob3JlLWhvbGRpbmdzOmNzdjpsYWtlc2hvcmUtaG9sZGluZ3M6ZGF0YS1sYWtlc2hvcmUtZGF0YS1wbGF0Zm9ybS1saW5lYWdlLWNzdjoyOGRhZGNiMzViYTc6MjAyNjA2MDhUMTMzNzU3OnJvdy03 data/lakeshore-data-platform-lineage.csv         |

### Context Bundle Trace Proof

| Module       | Decision | Usable | Blocked | Agent-ready | Citations | Context hash     | Leakage | Unsupported claims flagged |
| ------------ | -------- | ------ | ------- | ----------- | --------- | ---------------- | ------- | -------------------------- |
| Intelligence | block    | 0      | 3       | 0           | 0         | 4f53cda18c2baa0c | pass    | pass                       |
| Moves        | block    | 0      | 3       | 0           | 0         | 4f53cda18c2baa0c | pass    | pass                       |
| Source       | block    | 0      | 3       | 0           | 0         | 4f53cda18c2baa0c | pass    | pass                       |
| Tower        | block    | 0      | 3       | 0           | 0         | 4f53cda18c2baa0c | pass    | pass                       |

### Module Readiness

| Module       | Status           | Why                                                                                               |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| Intelligence | PRELIMINARY_ONLY | Intelligence context bundle had no usable candidates.; Intelligence emitted no citation locators. |
| Moves        | PRELIMINARY_ONLY | Moves context bundle had no usable candidates.; Moves emitted no citation locators.               |
| Source       | PRELIMINARY_ONLY | Source context bundle had no usable candidates.; Source emitted no citation locators.             |
| Tower        | PRELIMINARY_ONLY | Tower context bundle had no usable candidates.; Tower emitted no citation locators.               |

### Artifact / File Cabinet Readiness

| Table                  | Exists | Count | Grouping |
| ---------------------- | ------ | ----- | -------- |
| move_artifacts         | pass   | 0     |          |
| source_artifacts       | pass   | 0     |          |
| deliverables_v2        | pass   | 0     |          |
| program_evidence_items | pass   | 0     |          |
| program_attachments    | pass   | 0     |          |

### Defects And Remediation

Defects found:

- None observed by this read-only probe.

Prioritized remediation backlog:

1. Use module-specific retrieval gaps to load or index the missing context dimensions before pilot claims.

## Apex Retail

### Identity And Tenant Mapping

| Field                | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| canonical tenant key | apex-retail                                                   |
| client_id            | c7578e7a-545a-4b75-860e-465358f5e00b                          |
| tenant_key           | apexretail                                                    |
| client_key           | apexretail                                                    |
| legal/client name    | Apex Retail Group                                             |
| active workspace key | apex-retail                                                   |
| aliases              | apexretail, apex-retail, apex, apex retail, apex retail group |
| key mismatch risk    | none observed                                                 |

### Pipeline State

| Stage                | Count / proof | Evidence                                                                                                                                                                                  |
| -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source files         | 57            | present                                                                                                                                                                                   |
| Azure Blob staged    | 0             | listed                                                                                                                                                                                    |
| Sources              | 11            | present                                                                                                                                                                                   |
| Records              | 1029          | ci_relationships_dependencies: 220; incidents: 180; spend_baseline: 144; changes: 90; cmdb_applications_services: 82; org_decision_rights: 40; problems: 36; data_domains_stewardship: 32 |
| Facts                | 11410         | active: 11410                                                                                                                                                                             |
| Chunks               | 7526          | active: 7526                                                                                                                                                                              |
| Search indexed       | 7526          | tenant-context-v1                                                                                                                                                                         |
| Retrieval dimensions | 15/15         | all returned                                                                                                                                                                              |
| Promotion evaluated  | 6498          | agent_ready: 6497; remain_not_reviewed: 1                                                                                                                                                 |
| Context bundle proof | 4             | modules with usable bundle candidates                                                                                                                                                     |

### DB Counts

| Table                           | Exists | Count | Top grouping                                                                                                                                                                              |
| ------------------------------- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise_context_sources      | pass   | 11    |                                                                                                                                                                                           |
| enterprise_context_source_files | pass   | 57    |                                                                                                                                                                                           |
| enterprise_context_records      | pass   | 1029  | ci_relationships_dependencies: 220; incidents: 180; spend_baseline: 144; changes: 90; cmdb_applications_services: 82; org_decision_rights: 40; problems: 36; data_domains_stewardship: 32 |
| enterprise_context_facts        | pass   | 11410 | active: 11410                                                                                                                                                                             |
| enterprise_context_chunks       | pass   | 7526  | active: 7526                                                                                                                                                                              |
| governed_object_readiness       | pass   | 6498  | agent_ready: 6497; not_reviewed: 1                                                                                                                                                        |
| agent_context_traces            | pass   | 1043  |                                                                                                                                                                                           |
| data_inventory_records          | pass   | 0     |                                                                                                                                                                                           |

Facts by lifecycle:

| Lifecycle | Count |
| --------- | ----- |
| active    | 11410 |

Promotion/readiness:

| Metric                              | Counts                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted readiness status          | agent_ready: 6497; not_reviewed: 1                                                                                                                                                                            |
| Calculated promotion recommendation | agent_ready: 6497; remain_not_reviewed: 1                                                                                                                                                                     |
| Top failure reasons                 | missing source_basis: 1; missing confidence_level: 1; missing provenance: 1; not retrievable (retrievability=committed_not_indexed): 1; not cite-render-verified end-to-end: 1; no valid applicable_agents: 1 |

### Blob Proof

| Container                             | Listed | Matching source blobs | Staged-not-processed | Error |
| ------------------------------------- | ------ | --------------------- | -------------------- | ----- |
| stabarvaprivatedplab001/context-drops | 888    | 0                     | not calculated       |       |

### Idempotency And Duplication

| Check                      | Result |
| -------------------------- | ------ |
| duplicateActiveFacts       | 0 rows |
| orphanFacts                | 0      |
| supersededFactsStillActive | 0      |
| duplicateActiveChunks      | 0 rows |
| duplicateSourceFiles       | 0 rows |

### Azure AI Search Proof

| Index             | Docs | Filter                                                                                                                                                                                                                                                                                                                                                                  | Field presence                                                                                                        | Error |
| ----------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| tenant-context-v1 | 7526 | (tenant_key eq 'apex-retail' or tenant_key eq 'apexretail' or tenant_key eq 'apex' or tenant_key eq 'apex retail' or tenant_key eq 'apex retail group' or client_key eq 'apex-retail' or client_key eq 'apexretail' or client_key eq 'apex' or client_key eq 'apex retail' or client_key eq 'apex retail group' or client_id eq 'c7578e7a-545a-4b75-860e-465358f5e00b') | {"tenant_key":true,"client_id":true,"client_key":true,"sourceCitation":true,"lifecycle_state":true,"confidence":true} |       |

| Doc id                                                                 | Tenant      | Segment | Citation                            | Title/content  |
| ---------------------------------------------------------------------- | ----------- | ------- | ----------------------------------- | -------------- |
| YXBleC1yZXRhaWw6YXBleHJldGFpbDpjaGFuZ2VzOkNIRzAwNDgwMDc6c3VtbWFyeTp2MQ | apex-retail | changes | /app/data/apexretail/11-changes.csv | 11-changes.csv |
| YXBleC1yZXRhaWw6YXBleHJldGFpbDpjaGFuZ2VzOkNIRzAwNDgwMjk6c3VtbWFyeTp2MQ | apex-retail | changes | /app/data/apexretail/11-changes.csv | 11-changes.csv |
| YXBleC1yZXRhaWw6YXBleHJldGFpbDpjaGFuZ2VzOkNIRzAwNDgwNDE6c3VtbWFyeTp2MQ | apex-retail | changes | /app/data/apexretail/11-changes.csv | 11-changes.csv |
| YXBleC1yZXRhaWw6YXBleHJldGFpbDpjaGFuZ2VzOkNIRzAwNDgwNDM6c3VtbWFyeTp2MQ | apex-retail | changes | /app/data/apexretail/11-changes.csv | 11-changes.csv |
| YXBleC1yZXRhaWw6YXBleHJldGFpbDpjaGFuZ2VzOkNIRzAwNDgwNDc6c3VtbWFyeTp2MQ | apex-retail | changes | /app/data/apexretail/11-changes.csv | 11-changes.csv |

### Retrieval Proof

| Dimension                | Count | Tenant isolation | Citations | Source/conf | Current only | Top returned docs / error                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----- | ---------------- | --------- | ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise profile       | 5660  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1BUEVYUkVUQUlMLTAzMDpzdW1tYXJ5OnYx 02-facilities-business-units.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1BUEVYUkVUQUlMLTAyNDpzdW1tYXJ5OnYx 02-facilities-business-units.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1BUEVYUkVUQUlMLTAxMTpzdW1tYXJ5OnYx 02-facilities-business-units.csv   |
| leadership/org           | 201   | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wMjc leadership-bench.json; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wOTg leadership-bench.json; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wMTQ leadership-bench.json                                                                                                                                                                                                                                       |
| applications/systems     | 898   | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wMDE application-portfolio.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wODU application-portfolio.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0xNjU application-portfolio.csv                                                                                                                                                                                                                           |
| infrastructure/cloud     | 2409  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1DTE9VRC1BWlVSRS1QUk9EOnN1bW1hcnk6djE 03-cmdb-applications-services.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1DTE9VRC1BV1MtUFJPRDpzdW1tYXJ5OnYx 03-cmdb-applications-services.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDp2ZW5kb3JzX2NvbnRyYWN0X2ludmVudG9yeTpDT04tQVpVUkUtMjAyNjpzdW1tYXJ5OnYx 05-vendors-contract-inventory.csv |
| integrations             | 700   | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0xNjY integration-topology.json; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wODc integration-topology.json; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0yNTA integration-topology.json                                                                                                                                                                                                                           |
| vendor contracts         | 7157  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1OQ1ItMjAyNzpzdW1tYXJ5OnYx 06-renewal-calendar.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1BRE9CRS0yMDI3OnN1bW1hcnk6djE 06-renewal-calendar.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1SRUxFWC0yMDI3OnN1bW1hcnk6djE 06-renewal-calendar.csv                                                                                    |
| IT financials            | 5673  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpzcGVuZF9iYXNlbGluZTpTUEVORC0yMDI2LTA0LU5DUjpzdW1tYXJ5OnYx 07-spend-baseline.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpzcGVuZF9iYXNlbGluZTpTUEVORC0yMDI2LTEyLU5DUjpzdW1tYXJ5OnYx 07-spend-baseline.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpzcGVuZF9iYXNlbGluZTpTUEVORC0yMDI2LTAxLUJMVUVZT05ERVI6c3VtbWFyeTp2MQ 07-spend-baseline.csv                                                                          |
| KPIs/value               | 3130  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0yNDQ expected-watchlist-entries.json; YXBleC1yZXRhaWw6aXRfZmluYW5jaWFsczppdF9maW5hbmNpYWxzOnN5czphcGV4OmFkb2JlLXRhcmdldDpjaHVuazow renewal_calendar.csv; YXBleC1yZXRhaWw6aXRfbGFuZHNjYXBlOml0X2xhbmRzY2FwZTpzeXM6YXBleDphZG9iZS10YXJnZXQ6Y2h1bms6MA systems_inventory.csv                                                                                                                      |
| DORA/engineering metrics | 5754  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wMDU time-classification-output.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0xMDA dora-baseline-consolidated.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wODk time-classification-output.csv                                                                                                                                                                                                            |
| incidents/ITSM           | 5547  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpwcm9ibGVtczpQUkIwMDAxODE1OnN1bW1hcnk6djE 10-problems.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpwcm9ibGVtczpQUkIwMDAxODMyOnN1bW1hcnk6djE 10-problems.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpwcm9ibGVtczpQUkIwMDAxODAwOnN1bW1hcnk6djE 10-problems.csv                                                                                                                                                         |
| SLAs                     | 5574  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpzbGFzOlNMQS0wMDc6c3VtbWFyeTp2MQ 12-slas.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpzbGFzOlNMQS0wMTk6c3VtbWFyeTp2MQ 12-slas.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpzbGFzOlNMQS0wMTU6c3VtbWFyeTp2MQ 12-slas.csv                                                                                                                                                                                                |
| initiatives/moves        | 5857  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wODU application-portfolio.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0xNjU application-portfolio.csv; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0wMDE application-portfolio.csv                                                                                                                                                                                                                           |
| risks/controls           | 6103  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy0wMDU6c3VtbWFyeTp2MQ 15-risk-compliance-register.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy0wMDk6c3VtbWFyeTp2MQ 15-risk-compliance-register.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy0wMTE6c3VtbWFyeTp2MQ 15-risk-compliance-register.csv                                                |
| artifacts/evidence       | 7069  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0yMzg sap-erp-future-decision-charter.pdf; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0yMzI salesforce-commerce-cloud-msa-with-einstein-rider.pdf; YXBleC1yZXRhaWw6QVBYLVAxOC1DSFVOSy0yNDA punchh-loyalty-replacement-charter.pdf                                                                                                                                                                        |
| AI/data/use cases        | 6983  | pass             | pass      | pass        | pass         | YXBleC1yZXRhaWw6YXBleHJldGFpbDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1EQVRBLTAyNDpzdW1tYXJ5OnYx 03-cmdb-applications-services.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS0wMjQ6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv; YXBleC1yZXRhaWw6YXBleHJldGFpbDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS0wMDQ6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv                                        |

### Context Bundle Trace Proof

| Module       | Decision | Usable | Blocked | Agent-ready | Citations | Context hash     | Leakage | Unsupported claims flagged |
| ------------ | -------- | ------ | ------- | ----------- | --------- | ---------------- | ------- | -------------------------- |
| Intelligence | pass     | 3      | 0       | 3           | 1         | 1d894c1fbee7683b | pass    | fail                       |
| Moves        | pass     | 3      | 0       | 3           | 3         | 741a4170d8c0b9ea | pass    | fail                       |
| Source       | pass     | 3      | 0       | 3           | 1         | 8bac6908dac4aa18 | pass    | fail                       |
| Tower        | pass     | 3      | 0       | 3           | 1         | 9d5cd00667366b3b | pass    | fail                       |

### Module Readiness

| Module       | Status          | Why                                                                                                                        |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Intelligence | READY_WITH_GAPS | Intelligence did not exercise the unsupported-claim response validator because this probe stopped before model generation. |
| Moves        | READY_WITH_GAPS | Moves did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |
| Source       | READY_WITH_GAPS | Source did not exercise the unsupported-claim response validator because this probe stopped before model generation.       |
| Tower        | READY_WITH_GAPS | Tower did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |

### Artifact / File Cabinet Readiness

| Table                  | Exists | Count | Grouping |
| ---------------------- | ------ | ----- | -------- |
| move_artifacts         | pass   | 0     |          |
| source_artifacts       | pass   | 0     |          |
| deliverables_v2        | pass   | 0     |          |
| program_evidence_items | pass   | 0     |          |
| program_attachments    | pass   | 0     |          |

### Defects And Remediation

Defects found:

- None observed by this read-only probe.

Prioritized remediation backlog:

1. Use module-specific retrieval gaps to load or index the missing context dimensions before pilot claims.
2. Verify original files are staged in Blob under a tenant-identifiable prefix.

## Meridian Health

### Identity And Tenant Mapping

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| canonical tenant key | meridian-health                                                                             |
| client_id            | 6e419b6e-950d-4d34-a4fc-06c3e451a6c4                                                        |
| tenant_key           | meridian-health                                                                             |
| client_key           | meridian-health                                                                             |
| legal/client name    | Meridian Health System                                                                      |
| active workspace key | meridian-health                                                                             |
| aliases              | meridian, meridian-health, meridian health, meridian health system, heliara, heliara health |
| key mismatch risk    | none observed                                                                               |

### Pipeline State

| Stage                | Count / proof | Evidence                                                                                                                                                                                                        |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source files         | 15            | present                                                                                                                                                                                                         |
| Azure Blob staged    | 0             | listed                                                                                                                                                                                                          |
| Sources              | 13            | present                                                                                                                                                                                                         |
| Records              | 3503          | ci_relationships_dependencies: 820; spend_baseline: 360; facilities_business_units: 329; incidents: 320; cmdb_applications_services: 240; org_decision_rights: 224; changes: 220; risk_compliance_register: 210 |
| Facts                | 38640         | active: 38640                                                                                                                                                                                                   |
| Chunks               | 3506          | active: 3506                                                                                                                                                                                                    |
| Search indexed       | 3506          | tenant-context-v1                                                                                                                                                                                               |
| Retrieval dimensions | 15/15         | all returned                                                                                                                                                                                                    |
| Promotion evaluated  | 3548          | agent_ready: 3506; remain_not_reviewed: 42                                                                                                                                                                      |
| Context bundle proof | 4             | modules with usable bundle candidates                                                                                                                                                                           |

### DB Counts

| Table                           | Exists | Count | Top grouping                                                                                                                                                                                                    |
| ------------------------------- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise_context_sources      | pass   | 13    |                                                                                                                                                                                                                 |
| enterprise_context_source_files | pass   | 15    |                                                                                                                                                                                                                 |
| enterprise_context_records      | pass   | 3503  | ci_relationships_dependencies: 820; spend_baseline: 360; facilities_business_units: 329; incidents: 320; cmdb_applications_services: 240; org_decision_rights: 224; changes: 220; risk_compliance_register: 210 |
| enterprise_context_facts        | pass   | 38640 | active: 38640                                                                                                                                                                                                   |
| enterprise_context_chunks       | pass   | 3506  | active: 3506                                                                                                                                                                                                    |
| governed_object_readiness       | pass   | 3548  | agent_ready: 3506; not_reviewed: 42                                                                                                                                                                             |
| agent_context_traces            | pass   | 1193  |                                                                                                                                                                                                                 |
| data_inventory_records          | pass   | 0     |                                                                                                                                                                                                                 |

Facts by lifecycle:

| Lifecycle | Count |
| --------- | ----- |
| active    | 38640 |

Promotion/readiness:

| Metric                              | Counts                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted readiness status          | agent_ready: 3506; not_reviewed: 42                                                                                                                                                                                 |
| Calculated promotion recommendation | agent_ready: 3506; remain_not_reviewed: 42                                                                                                                                                                          |
| Top failure reasons                 | missing source_basis: 42; missing confidence_level: 42; missing provenance: 42; not retrievable (retrievability=committed_not_indexed): 42; not cite-render-verified end-to-end: 42; no valid applicable_agents: 42 |

### Blob Proof

| Container                             | Listed | Matching source blobs | Staged-not-processed | Error |
| ------------------------------------- | ------ | --------------------- | -------------------- | ----- |
| stabarvaprivatedplab001/context-drops | 888    | 0                     | not calculated       |       |

### Idempotency And Duplication

| Check                      | Result |
| -------------------------- | ------ |
| duplicateActiveFacts       | 0 rows |
| orphanFacts                | 0      |
| supersededFactsStillActive | 0      |
| duplicateActiveChunks      | 0 rows |
| duplicateSourceFiles       | 0 rows |

### Azure AI Search Proof

| Index             | Docs | Filter                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Field presence                                                                                                        | Error |
| ----------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| tenant-context-v1 | 3506 | (tenant_key eq 'meridian-health' or tenant_key eq 'meridian' or tenant_key eq 'meridian health' or tenant_key eq 'meridian health system' or tenant_key eq 'heliara' or tenant_key eq 'heliara health' or client_key eq 'meridian-health' or client_key eq 'meridian' or client_key eq 'meridian health' or client_key eq 'meridian health system' or client_key eq 'heliara' or client_key eq 'heliara health' or client_id eq '6e419b6e-950d-4d34-a4fc-06c3e451a6c4') | {"tenant_key":true,"client_id":true,"client_key":true,"sourceCitation":true,"lifecycle_state":true,"confidence":true} |       |

| Doc id                                                                               | Tenant          | Segment | Citation                                                                                          | Title/content  |
| ------------------------------------------------------------------------------------ | --------------- | ------- | ------------------------------------------------------------------------------------------------- | -------------- |
| bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDAxOTpzdW1tYXJ5OnYx | meridian-health | changes | /private/tmp/nexus-meridian-vnext/docs/enterprise-context/generated/meridian-vnext/11-changes.csv | 11-changes.csv |
| bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDAzNDpzdW1tYXJ5OnYx | meridian-health | changes | /private/tmp/nexus-meridian-vnext/docs/enterprise-context/generated/meridian-vnext/11-changes.csv | 11-changes.csv |
| bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDAzNTpzdW1tYXJ5OnYx | meridian-health | changes | /private/tmp/nexus-meridian-vnext/docs/enterprise-context/generated/meridian-vnext/11-changes.csv | 11-changes.csv |
| bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDA1MjpzdW1tYXJ5OnYx | meridian-health | changes | /private/tmp/nexus-meridian-vnext/docs/enterprise-context/generated/meridian-vnext/11-changes.csv | 11-changes.csv |
| bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDA1NTpzdW1tYXJ5OnYx | meridian-health | changes | /private/tmp/nexus-meridian-vnext/docs/enterprise-context/generated/meridian-vnext/11-changes.csv | 11-changes.csv |

### Retrieval Proof

| Dimension                | Count | Tenant isolation | Citations | Source/conf | Current only | Top returned docs / error                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----- | ---------------- | --------- | ----------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enterprise profile       | 3503  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1PUFMtMDEzOnN1bW1hcnk6djE 02-facilities-business-units.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1PUFMtMDA1OnN1bW1hcnk6djE 02-facilities-business-units.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpmYWNpbGl0aWVzX2J1c2luZXNzX3VuaXRzOkZBQy1PUFMtMDAyOnN1bW1hcnk6djE 02-facilities-business-units.csv                               |
| leadership/org           | 996   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpvcmdfZGVjaXNpb25fcmlnaHRzOkdST1VQLUNEQU8tMDItMjpzdW1tYXJ5OnYx 01-org-decision-rights.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpvcmdfZGVjaXNpb25fcmlnaHRzOkdST1VQLUNEQU8tMDItNDpzdW1tYXJ5OnYx 01-org-decision-rights.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpvcmdfZGVjaXNpb25fcmlnaHRzOkdST1VQLUNEQU8tMTItNDpzdW1tYXJ5OnYx 01-org-decision-rights.csv                                                          |
| applications/systems     | 877   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1FUlAtT1JBQ0xFOnN1bW1hcnk6djE 03-cmdb-applications-services.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDp2ZW5kb3JzX2NvbnRyYWN0X2ludmVudG9yeTpDT04tRVBJQy1DT1JFLTIwMjc6c3VtbWFyeTp2MQ 05-vendors-contract-inventory.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDp2ZW5kb3JzX2NvbnRyYWN0X2ludmVudG9yeTpDT04tT1JBQ0xFLUVSUC0yMDI4OnN1bW1hcnk6djE 05-vendors-contract-inventory.csv |
| infrastructure/cloud     | 2608  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1BV1MtTEFORElORy1aT05FOnN1bW1hcnk6djE 03-cmdb-applications-services.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDp2ZW5kb3JzX2NvbnRyYWN0X2ludmVudG9yeTpDT04tQVdTLUVBLTIwMjc6c3VtbWFyeTp2MQ 05-vendors-contract-inventory.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS1NSC0wNjg6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv            |
| integrations             | 1215  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpwcm9ibGVtczpQUkItTUgtMDAwNzpzdW1tYXJ5OnYx 10-problems.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1BUEktRkhJUi1HQVRFV0FZOnN1bW1hcnk6djE 03-cmdb-applications-services.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpwcm9ibGVtczpQUkItTUgtMDAzMTpzdW1tYXJ5OnYx 10-problems.csv                                                                                                  |
| vendor contracts         | 3506  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1NSC0wMDk6c3VtbWFyeTp2MQ 06-renewal-calendar.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1NSC0wMjg6c3VtbWFyeTp2MQ 06-renewal-calendar.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyZW5ld2FsX2NhbGVuZGFyOlJFTi1NSC0wMDg6c3VtbWFyeTp2MQ 06-renewal-calendar.csv                                                                                                 |
| IT financials            | 2010  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzcGVuZF9iYXNlbGluZTpTUEVORC1NSC0wMjE0OnN1bW1hcnk6djE 07-spend-baseline.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzcGVuZF9iYXNlbGluZTpTUEVORC1NSC0wMjg0OnN1bW1hcnk6djE 07-spend-baseline.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzcGVuZF9iYXNlbGluZTpTUEVORC1NSC0wMDU0OnN1bW1hcnk6djE 07-spend-baseline.csv                                                                                                    |
| KPIs/value               | 721   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMDgwOnN1bW1hcnk6djE 12-slas.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMTA4OnN1bW1hcnk6djE 12-slas.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMDI0OnN1bW1hcnk6djE 12-slas.csv                                                                                                                                                                                  |
| DORA/engineering metrics | 221   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDAwOTpzdW1tYXJ5OnYx 11-changes.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDE4MzpzdW1tYXJ5OnYx 11-changes.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjaGFuZ2VzOkNIRy1NSC0wMDE4NjpzdW1tYXJ5OnYx 11-changes.csv                                                                                                                                                          |
| incidents/ITSM           | 1673  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpjbWRiX2FwcGxpY2F0aW9uc19zZXJ2aWNlczpDSS1JVFNNLVNFUlZJQ0VOT1c6c3VtbWFyeTp2MQ 03-cmdb-applications-services.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpwcm9ibGVtczpQUkItTUgtMDEzNzpzdW1tYXJ5OnYx 10-problems.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpwcm9ibGVtczpQUkItTUgtMDAxMTpzdW1tYXJ5OnYx 10-problems.csv                                                                                                   |
| SLAs                     | 1552  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMDUzOnN1bW1hcnk6djE 12-slas.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMDYxOnN1bW1hcnk6djE 12-slas.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpzbGFzOlNMQS1NSC0wMDg5OnN1bW1hcnk6djE 12-slas.csv                                                                                                                                                                                  |
| initiatives/moves        | 634   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDppbml0aWF0aXZlX3BvcnRmb2xpbzpJTklULU1ILTA1MDpzdW1tYXJ5OnYx 13-initiative-portfolio.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDppbml0aWF0aXZlX3BvcnRmb2xpbzpJTklULU1ILTA5NTpzdW1tYXJ5OnYx 13-initiative-portfolio.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDppbml0aWF0aXZlX3BvcnRmb2xpbzpJTklULU1ILTA2ODpzdW1tYXJ5OnYx 13-initiative-portfolio.csv                                                                   |
| risks/controls           | 894   | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy1NSC0wMTYxOnN1bW1hcnk6djE 15-risk-compliance-register.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy1NSC0wMDI2OnN1bW1hcnk6djE 15-risk-compliance-register.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpyaXNrX2NvbXBsaWFuY2VfcmVnaXN0ZXI6UklTSy1NSC0wMDM2OnN1bW1hcnk6djE 15-risk-compliance-register.csv                                  |
| artifacts/evidence       | 3506  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDppbmNpZGVudHM6SU5DLU1ILTAwMTQ3OnN1bW1hcnk6djE 09-incidents.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpvcmdfZGVjaXNpb25fcmlnaHRzOkdST1VQLVNPVVJDRTpzdW1tYXJ5OnYx 01-org-decision-rights.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDppbmNpZGVudHM6SU5DLU1ILTAwMTg5OnN1bW1hcnk6djE 09-incidents.csv                                                                                                                    |
| AI/data/use cases        | 2187  | pass             | pass      | pass        | pass         | bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS1NSC0wMTc6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS1NSC0wMjY6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv; bWVyaWRpYW4taGVhbHRoOm1lcmlkaWFuLWhlYWx0aDpkYXRhX2RvbWFpbnNfc3Rld2FyZHNoaXA6REFUQS1NSC0wMzg6c3VtbWFyeTp2MQ 14-data-domains-stewardship.csv                                     |

### Context Bundle Trace Proof

| Module       | Decision | Usable | Blocked | Agent-ready | Citations | Context hash     | Leakage | Unsupported claims flagged |
| ------------ | -------- | ------ | ------- | ----------- | --------- | ---------------- | ------- | -------------------------- |
| Intelligence | pass     | 3      | 0       | 3           | 1         | 6f9aa85d83148e37 | pass    | fail                       |
| Moves        | pass     | 3      | 0       | 3           | 1         | 43a400f0978a01ba | pass    | fail                       |
| Source       | pass     | 3      | 0       | 3           | 1         | 28eb7547a41d15b2 | pass    | fail                       |
| Tower        | pass     | 3      | 0       | 3           | 1         | af18b3cd8d7696ab | pass    | fail                       |

### Module Readiness

| Module       | Status          | Why                                                                                                                        |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Intelligence | READY_WITH_GAPS | Intelligence did not exercise the unsupported-claim response validator because this probe stopped before model generation. |
| Moves        | READY_WITH_GAPS | Moves did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |
| Source       | READY_WITH_GAPS | Source did not exercise the unsupported-claim response validator because this probe stopped before model generation.       |
| Tower        | READY_WITH_GAPS | Tower did not exercise the unsupported-claim response validator because this probe stopped before model generation.        |

### Artifact / File Cabinet Readiness

| Table                  | Exists | Count | Grouping |
| ---------------------- | ------ | ----- | -------- |
| move_artifacts         | pass   | 0     |          |
| source_artifacts       | pass   | 0     |          |
| deliverables_v2        | pass   | 0     |          |
| program_evidence_items | pass   | 0     |          |
| program_attachments    | pass   | 0     |          |

### Defects And Remediation

Defects found:

- None observed by this read-only probe.

Prioritized remediation backlog:

1. Use module-specific retrieval gaps to load or index the missing context dimensions before pilot claims.
2. Verify original files are staged in Blob under a tenant-identifiable prefix.
