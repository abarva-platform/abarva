# Pilot Private Data Plane Full-Scope Backlog

Date: 2026-06-01

This note keeps the full pilot private data-plane scope visible while T341-T343
ship the first foundation slice. T341-T343 create the governed Setup Data Load
Center surface and template explorer. The rows below are the next required
mini-wave before live client files should be treated as production-ready.

| Row | Theme | Required outcome |
| --- | --- | --- |
| T353 | Azure provisioning runbook | Define Blob Storage, Service Bus, Postgres/data-plane, Key Vault, identities, networking, and environment promotion steps. Authority candidate: `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-REHEARSAL-RUNBOOK-2026-06-01.md`. |
| T354 | SSO and SCIM role mapping | Map Entra/Clerk orgs to admin, uploader, reviewer, and approver roles with seeded test users. Authority candidate: `src/lib/admin/pilot-private-data-plane-runbook.ts`. |
| T355 | Private-data runbook | Document end-to-end rehearsal from sign-in to data load, quarantine, clarification, approval, commit, rollback, and audit export. Authority candidate: `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-REHEARSAL-RUNBOOK-2026-06-01.md`. |
| T356 | Processing service decision | Lock the execution services for parsing and enrichment: Functions or Container Apps jobs, Service Bus, Document Intelligence, AI Search, and retry semantics. Authority candidate: `src/lib/admin/pilot-private-data-plane-runbook.ts`. |
| T357 | Durable ingestion schema | Add tables for upload runs, file manifests, quarantine cases, clarifications, approvals, load commits, and audit export. Authority candidate: `supabase/migrations/20260601090000_pilot_ingestion_load_ledger.sql` and `src/lib/admin/pilot-ingestion-ledger.ts`. |
| T358 | Idempotency and dedupe | Prevent duplicate facts, duplicate approvals, and repeated expensive parsing on same-file re-upload. Authority candidate: `supabase/migrations/20260601090000_pilot_ingestion_load_ledger.sql` and `buildPilotIngestionIdempotencyKey`. |
| T359 | Template versioning and mapping profiles | Persist template version, mapping profile, and validation rule version for every load. Authority candidate: `pilot_ingestion_template_versions` and `pilot_ingestion_mapping_profiles`. |
| T360 | Rollback and unload | Make every committed load batch reversible without manual data cleanup. Authority candidate: `pilot_ingestion_load_commit_items`, `pilot_ingestion_rollback_requests`, and `planPilotIngestionRollback`. |
| T361 | Malware scanning | Scan files before parsing or storage promotion; PHI/PII detection is not enough for enterprise upload flows. Authority candidate: `src/lib/admin/pilot-data-plane-security-policy.ts` and `evaluatePilotMalwareGate`. |
| T362 | Encryption and key policy | Decide CMK/BYOK posture, Key Vault ownership, storage encryption, secret rotation, and customer visibility. Authority candidate: `validatePilotEncryptionPosture`. |
| T363 | Retention and deletion policy | Define raw-file, quarantine, intermediate, failed-load, committed-load, and pilot-offboarding retention. Authority candidate: `PILOT_RETENTION_POLICIES`. |
| T364 | Audit export | Let client admins export upload, load, quarantine, clarification, approval, and rollback history. Authority candidate: `buildPilotAuditExportManifest` and `pilot_ingestion_audit_exports`. |
| T365 | Observability and cost limits | Alert on queue failures, parse failures, retry storms, long-running jobs, and Azure spend guardrail breaches. Authority candidate: `PILOT_ALERT_RULES` in `src/lib/admin/pilot-observability-isolation-smoke.ts`. |
| T366 | Tenant isolation test pack | Prove one client cannot see, upload, approve, commit, or export another client data-plane record. Authority candidate: `buildPilotIsolationProbes` and `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-OBSERVABILITY-ISOLATION-SMOKE-2026-06-01.md`. |
| T367 | Legal and data-use policy pack | Align consent copy with DPA, BAA, prohibited-data, retention, and customer offboarding policy. Authority candidate: `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`. |
| T368 | End-to-end pilot smoke | Browser/API/data-plane smoke from SSO to committed load and Source/Moves/Tower/Intelligence output visibility. Authority candidate: `PILOT_SMOKE_STEPS` and `getPilotSmokeStepsForClient`. |

Execution rule: do not mark the pilot private data-plane robust until these rows
have PRs, tests, release records, and production evidence.
