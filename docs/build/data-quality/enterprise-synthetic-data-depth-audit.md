# Enterprise Synthetic Data Depth Audit

Generated: 2026-06-17T13:07:26.692Z

## Executive Judgment

The bar for these packs is not "seed data exists." The bar is a synthetic but enterprise-real context substrate: enough systems, dependencies, financials, owners, vendor constraints, incidents, controls, source evidence, and retrieval chunks that Sentinel/Source/Tower answers behave like they are advising a real 50B+ enterprise.

| Pack | Decision | Overall | Rows | Apps/CMDB | Integration edges | Vendors | Ops rows | Corpus | Source docs | Loader |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First Capital Financial | load_ready_after_live_proof | 8.7 | 3148 | 180 | 380 | 82 | 292 | 400 | 62 | registered |
| Meridian Health | load_ready_after_live_proof | 9.3 | 3542 | 149 | 389 | 121 | 360 | 327 | 246 | registered |
| Lakeshore Kyriba Source Pack | hold_and_rebuild_before_load | 2.3 | 34 | 12 | 8 | 6 | 0 | 4 | 45 | not registered |
| Apex Retail | load_ready_after_live_proof | 8.6 | 2991 | 120 | 320 | 102 | 432 | 280 | 85 | registered |
| Northstar Clinical Tech | load_ready_after_live_proof | 9 | 7070 | 260 | 972 | 90 | 524 | 1038 | 210 | registered |
| SkyHarbor Air | augment_before_broad_load | 6.3 | 9428 | 92 | 321 | 156 | 42 | 6480 | 513 | registered |

## Dimension Scores

| Pack | Enterprise Scale | IT Complexity | Financial / Run-Cost Depth | Org / Ownership Depth | Vendor / Contract Depth | Ops / DORA / Incident Depth | Regulatory / Risk Depth | Evidence / Lineage Depth | Retrieval Corpus Depth | No-Fixture Generation Quality | Load Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First Capital Financial | 9 | 10 | 8 | 10 | 7 | 9 | 8 | 8 | 7 | 10 | 10 |
| Meridian Health | 9 | 10 | 10 | 10 | 9 | 10 | 10 | 8 | 7 | 9 | 10 |
| Lakeshore Kyriba Source Pack | 0 | 1 | 0 | 0 | 2 | 0 | 3 | 3 | 0 | 10 | 6 |
| Apex Retail | 9 | 9 | 8 | 10 | 9 | 10 | 5 | 8 | 7 | 10 | 10 |
| Northstar Clinical Tech | 10 | 10 | 4 | 10 | 7 | 10 | 10 | 10 | 10 | 9 | 9 |
| SkyHarbor Air | 10 | 8 | 4 | 0 | 9 | 4 | 1 | 3 | 10 | 10 | 10 |

## First Capital Financial

Target: banking-grade 50B+ regional/super-regional financial institution. Decision: load_ready_after_live_proof.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 90 |
| File types | yaml:2, csv:20, json:4, jsonl:2, md:62 |
| Parseable rows | 3148 |
| Application / CMDB rows | 180 |
| Integration edges | 380 |
| Average integration count on app rows | 50.3 |
| Vendor / contract rows | 82 |
| Financial rows | 291 |
| Org / role rows | 1677 |
| Ops / DORA / incident rows | 292 |
| Regulatory / risk rows | 40 |
| Corpus / pattern rows | 400 |
| Named IT systems detected | mainframe, sap, oracle, workday, servicenow, snowflake, databricks, ach, fedwire, fednow, rtp, sftp, iam, entra, sso, api, batch, edw, crm, salesforce |
| Risk/control terms detected | occ, ffiec, glba, bsa, aml, finra, model risk, mra, sox, pci, retention, audit, control, rto, rpo, regulator |
| Fixture-like files | 0 |

Gaps:

- No major source-file gap detected by the static audit.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- No augmentation required beyond live load/retrieval/insight proof.

Archive candidates / holds:

- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.

## Meridian Health

Target: large integrated healthcare delivery network / plan strategy substrate. Decision: load_ready_after_live_proof.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 184 |
| File types | yaml:3, csv:65, json:7, xlsx:2, pdf:44, jsonl:3, md:60 |
| Parseable rows | 3542 |
| Application / CMDB rows | 149 |
| Integration edges | 389 |
| Average integration count on app rows | 22.9 |
| Vendor / contract rows | 121 |
| Financial rows | 320 |
| Org / role rows | 1729 |
| Ops / DORA / incident rows | 360 |
| Regulatory / risk rows | 231 |
| Corpus / pattern rows | 327 |
| Named IT systems detected | sap, workday, servicenow, databricks, kafka, mulesoft, hl7, fhir, epic, pacs, claims, ach, rtp, sftp, entra, sso, api, batch, crm, azure |
| Risk/control terms detected | aml, model risk, hipaa, phi, hitrust, fda, retention, audit, control, downtime, rto, rpo, baa, regulator |
| Fixture-like files | 4 |

Gaps:

- Fixture-like phrasing detected; rows can be synthetic, but loaded evidence should read like enterprise records, not generated boilerplate.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- Add IT estate spine: CMDB/application rows, integration edges, identity/IAM, network/security, data platforms, ERP, observability, workplace, service management, and branch/site technology.
- Regenerate source docs/chunks in document-native voices: board memo, architecture record, finance workbook excerpt, risk register, vendor renewal brief, audit evidence, and operations review.

Archive candidates / holds:

- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.

## Lakeshore Kyriba Source Pack

Target: large treasury transformation evidence pack for Source generation. Decision: hold_and_rebuild_before_load.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 17 |
| File types | md:5, xlsx:6, csv:4, jsonl:1, json:1 |
| Parseable rows | 34 |
| Application / CMDB rows | 12 |
| Integration edges | 8 |
| Average integration count on app rows | n/a |
| Vendor / contract rows | 6 |
| Financial rows | 0 |
| Org / role rows | 0 |
| Ops / DORA / incident rows | 0 |
| Regulatory / risk rows | 4 |
| Corpus / pattern rows | 4 |
| Named IT systems detected | sap, oracle, servicenow, boomi, claims, ach, kyriba, sftp, iam, entra, sso, api, batch, data lake, azure |
| Risk/control terms detected | aml, qms, audit, control, rpo |
| Fixture-like files | 0 |

Gaps:

- Application / CMDB depth below large-enterprise threshold; add system-of-record, middleware, IAM, data, branch/site, network, and control-plane rows.
- Integration topology is thin for a 50B+ enterprise; add API, batch, event, MFT/SFTP, data replication, and third-party connectivity edges.
- Vendor and contract surface is too small for enterprise concentration-risk analysis.
- Ownership model lacks enough roles/teams for realistic accountability and escalation.
- Ops history is too small to support real DORA, reliability, and risk tradeoff analysis.
- Retrieval corpus has too few chunks/facts to be considered live intelligence substrate.
- No standard tenant-substrate loader registration found; live population needs a governed load path before this pack can be treated as deployed context.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- Add IT estate spine: CMDB/application rows, integration edges, identity/IAM, network/security, data platforms, ERP, observability, workplace, service management, and branch/site technology.
- Add run-cost and value spine: app-level run cost, infra consumption, vendor allocation, project commitments, renewals, cloud cost, labor mix, and depreciation/capex treatment.
- Add operational history: incidents, changes, problems, DORA time series, DR tests, SLA exceptions, audit findings, and remediation backlog.
- Add evidence spine: board packs, architecture memos, service owner notes, control evidence, source-file ledger, chunk/fact corpus, and expected Q&A proof.

Archive candidates / holds:

- live Source events created from this pack before loader registration: ungoverned_source_pack_path. Do not load as canonical tenant substrate until a tenant registry entry, evidence receipt, and retrieval proof exist.
  Examples: datasets/lakeshore-kyriba-synthetic-v1

## Apex Retail

Target: large specialty retail enterprise. Decision: load_ready_after_live_proof.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 141 |
| File types | csv:33, json:19, xlsx:2, pdf:40, jsonl:1, md:45, yaml:1 |
| Parseable rows | 2991 |
| Application / CMDB rows | 120 |
| Integration edges | 320 |
| Average integration count on app rows | n/a |
| Vendor / contract rows | 102 |
| Financial rows | 201 |
| Org / role rows | 1448 |
| Ops / DORA / incident rows | 432 |
| Regulatory / risk rows | 14 |
| Corpus / pattern rows | 280 |
| Named IT systems detected | mainframe, sap, oracle, workday, servicenow, snowflake, databricks, kafka, mulesoft, ach, swift, sftp, entra, sso, api, batch, salesforce, genesys, azure, aws |
| Risk/control terms detected | sox, pci, audit, control, rpo, regulator |
| Fixture-like files | 0 |

Gaps:

- Application / CMDB depth below large-enterprise threshold; add system-of-record, middleware, IAM, data, branch/site, network, and control-plane rows.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- Add IT estate spine: CMDB/application rows, integration edges, identity/IAM, network/security, data platforms, ERP, observability, workplace, service management, and branch/site technology.

Archive candidates / holds:

- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.

## Northstar Clinical Tech

Target: global medtech / regulated manufacturer. Decision: load_ready_after_live_proof.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 230 |
| File types | md:108, yaml:3, csv:33, pdf:67, docx:4, json:6, jsonl:4, xlsx:5 |
| Parseable rows | 7070 |
| Application / CMDB rows | 260 |
| Integration edges | 972 |
| Average integration count on app rows | n/a |
| Vendor / contract rows | 90 |
| Financial rows | 48 |
| Org / role rows | 3405 |
| Ops / DORA / incident rows | 524 |
| Regulatory / risk rows | 120 |
| Corpus / pattern rows | 1038 |
| Named IT systems detected | mainframe, sap, oracle, servicenow, hl7, fhir, epic, claims, entra, api, batch, edw, salesforce, azure, aws, gcp |
| Risk/control terms detected | hipaa, fda, qms, sox, gdpr, audit, control, rpo, regulator |
| Fixture-like files | 0 |

Gaps:

- JSON/JSONL parse errors found; fix before load.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- Add run-cost and value spine: app-level run cost, infra consumption, vendor allocation, project commitments, renewals, cloud cost, labor mix, and depreciation/capex treatment.

Archive candidates / holds:

- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.

## SkyHarbor Air

Target: large airline technology estate. Decision: augment_before_broad_load.

Key measurements:

| Metric | Value |
| --- | --- |
| Files | 130 |
| File types | yaml:6, csv:31, jsonl:7, md:43, json:33, txt:2, pdf:2, docx:1, xlsx:3, html:2 |
| Parseable rows | 9428 |
| Application / CMDB rows | 92 |
| Integration edges | 321 |
| Average integration count on app rows | n/a |
| Vendor / contract rows | 156 |
| Financial rows | 52 |
| Org / role rows | 0 |
| Ops / DORA / incident rows | 42 |
| Regulatory / risk rows | 0 |
| Corpus / pattern rows | 6480 |
| Named IT systems detected | mainframe, oracle, workday, servicenow, snowflake, databricks, mulesoft, claims, ach, entra, sso, api, batch, salesforce, genesys, azure, aws |
| Risk/control terms detected | aml, model risk, fda, retention, audit, control, rpo, baa, regulator |
| Fixture-like files | 0 |

Gaps:

- Application / CMDB depth below large-enterprise threshold; add system-of-record, middleware, IAM, data, branch/site, network, and control-plane rows.
- Ownership model lacks enough roles/teams for realistic accountability and escalation.
- Ops history is too small to support real DORA, reliability, and risk tradeoff analysis.

Required augmentation before this is treated as enterprise-grade loaded intelligence:

- Add IT estate spine: CMDB/application rows, integration edges, identity/IAM, network/security, data platforms, ERP, observability, workplace, service management, and branch/site technology.
- Add run-cost and value spine: app-level run cost, infra consumption, vendor allocation, project commitments, renewals, cloud cost, labor mix, and depreciation/capex treatment.
- Add operational history: incidents, changes, problems, DORA time series, DR tests, SLA exceptions, audit findings, and remediation backlog.
- Add evidence spine: board packs, architecture memos, service owner notes, control evidence, source-file ledger, chunk/fact corpus, and expected Q&A proof.

Archive candidates / holds:

- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.

## Live Data Gate

Do not call any client populated until the live data plane proves each state separately: source artifact generated, parse/preflight passed, product loader accepted, object storage staged, parser extracted cited facts/chunks, rows committed to tenant context tables, embeddings/search refreshed, insights evaluated, and signed-in QA retrieved tenant-specific answers.

Minimum read-only live checks before any additional load or archive action:

- Counts by tenant for enterprise_context_sources, enterprise_context_source_files, enterprise_context_records, enterprise_context_facts, enterprise_context_evidence, enterprise_context_chunks, enterprise_context_quality_issues, context_refresh_events, and context_insights.
- Embedding coverage by tenant: total chunks, embedded chunks, pending/failed chunks, vector/index presence where available.
- Source/Moves provenance: source_events and engagements counts by lifecycle_state, generated artifact counts, evidence/artifact links, orphaned rows, client_key/client_id mismatches, and rows with fixture/demo text.
- Retrieval proof: tenant-scoped QA questions over app risk, integration dependency, vendor renewal, run cost, incidents, regulatory controls, and executive decision posture.

## Archive Policy

Moves can be archived today through the existing reversible soft-archive model on engagements. Source events should not be bulk archived without provenance columns or a separate archive ledger; they can be hidden by lifecycle_state, but the audit trail is thinner than Moves. Candidate criteria: generated in the wrong tenant, no evidence/source artifact linkage, fixture/demo boilerplate, orphaned from the tenant substrate, duplicate event_code, or produced outside the governed generation path.
