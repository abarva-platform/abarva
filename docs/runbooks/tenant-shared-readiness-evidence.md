# Tenant Shared Readiness Evidence Runbook

## Purpose

Lakeshore and Meridian can be used now as shared-environment rehearsal tenants
to prove loader discipline, context-layer readiness, AI liability controls, and
operator evidence habits. They must not be described as true private data-plane
or SSO completion until a later customer-private subscription dry run proves
those claims.

## Evidence Levels

| Level | Name | What It Can Prove | What It Cannot Prove |
| --- | --- | --- | --- |
| 1 | Product control proof | Responsible AI acknowledgement, approval gates, citations, usage caps, advisory language, and audit artifacts exist in product/control-plane surfaces. | Tenant isolation, private infra, customer subscription ownership, or SSO. |
| 2 | Shared tenant rehearsal | Loader-backed context/corpus setup, tenant-scoped evidence, client id preservation, setup/admin loader flow, and cross-tenant leakage checks in the shared environment. | Dedicated private data plane, customer-owned Azure resources, SSO, or production HIPAA readiness. |
| 3 | Private subscription proof | Dedicated subscription/resource groups, private database/storage/search/key vault, SSO/organization mapping, audit export, rollback, and teardown proof. | Nothing from Level 3 may be claimed before the dry run evidence exists. |

Current Lakeshore and Meridian status is Level 2 shared tenant rehearsal.

Level 3 is deferred until the true private subscription dry run.

## What To Knock Out Now

Use Lakeshore and Meridian to harden evidence that does not require dedicated
customer infrastructure:

- Confirm all new tenant context enters through Admin Data Loader or another
  loader-backed path that writes tenant-scoped ingestion evidence.
- Preserve `clients` and `client_id` lineage in evidence and avoid introducing
  new `tenants` / `tenant_id` runtime contracts.
- Capture Data Loads evidence: scan, schema validation, mapping, preview,
  approval, commit, and rollback notes.
- Validate Responsible AI acknowledgement and annual re-acknowledgement flows.
- Validate AI output controls: citations, confidence/estimate labels, human
  approval for material actions, reason capture, and no silent remediation.
- Verify setup/admin AI suggestions and anomaly triage require named human
  approval before applying changes.
- Run cross-tenant leakage checks against client names, context snippets,
  evidence ids, and generated outputs.
- Capture model/token usage against the current shared-environment cap.
- Keep managed-service evidence: release notes, monitoring checklist, data-plane
  upkeep notes, and quarterly update scope.

## Deferred Until Private Subscription Dry Run

Do not mark the following done from Lakeshore or Meridian shared-environment
work:

- dedicated customer Azure subscription,
- dedicated resource groups for data, security, observability, and database,
- private database/storage/search/key vault proof,
- customer-owned networking, private DNS, or VNet peering,
- SSO or Clerk organization production mapping,
- customer-owned audit export,
- HIPAA/BAA production claim,
- live customer PHI processing,
- teardown proof for customer-owned resources.

## Required Evidence Bundle

Each shared-environment rehearsal should produce or link:

- tenant key and client id used for the run,
- source files or manifests,
- loader run id or ingestion ledger id,
- validation report,
- approval user and reason,
- commit or dry-run result,
- rollback instruction,
- AI acknowledgement evidence,
- AI action approval evidence,
- citation and confidence/estimate evidence,
- usage/cost evidence,
- leakage-check result,
- known gaps and deferred Level 3 claims.

## Operating Rule

If an item needs private infra or SSO to be true, label it `deferred_private_plane`.
If an item can be tested in the shared environment, label it `can_verify_now` or
`partial_shared_rehearsal`. This keeps the backlog honest while still letting
setup/admin loader sessions make real progress.
