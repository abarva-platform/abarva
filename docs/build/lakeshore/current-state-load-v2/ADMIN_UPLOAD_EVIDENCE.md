# Lakeshore Current-State Load v2 · Admin Upload Evidence

Date: 2026-06-08  
Tenant: Lakeshore Holdings  
Client id: `49fc8aee-3d39-48c5-82ac-1313c31470c7`  
Operator surface: `https://app.abarva.ai/admin/context-layer/uploads`

## Scope

This receipt covers the first governed Admin bulk upload for the Lakeshore
current-state v2 synthetic package. The goal was to create richer CXO-answerable
substrate for leadership, IT, supply chain, ERP, HCM, treasury, private/hybrid
cloud, data/analytics, vendors/contracts, KPIs, initiatives, risks, controls,
business capabilities, and company scale.

## Package Artifacts

Generated locally:

- Canonical package: `lakeshore-current-state-admin-load-v2.zip`
- Production-compatible package:
  `lakeshore-current-state-admin-load-v2-production-compatible.zip`
- Canonical manifest: `manifest.json`
- Production-compatible manifest: `manifest.production.json`
- Structured source files: 13
- Structured source rows: 179

The canonical package keeps the deeper intended template dimensions. The first
production upload used the production-compatible ZIP because the currently
deployed Admin template registry did not yet accept three deeper template IDs:
`infrastructure-estate`, `data-platform-lineage`, and
`business-capability-map`.

## Guarded Validation

Initial canonical ZIP validation was blocked before staging:

- Mode: `validate_only`
- Result: blocked
- Error: `bulk_manifest_unknown_template:infrastructure-estate`
- Interpretation: production correctly rejected an unsupported manifest
  template before Blob staging or context writes.

Production-compatible ZIP validation then passed:

- Mode: `validate_only`
- Job id: `bulk-79dc9bf1b7492788`
- Files matched: 13
- Sensitive-data gate: passed for all files
- Blob writes: skipped by validate-only mode
- Tenant context writes: skipped by validate-only mode

## Runtime Config Repair

The first process attempt was blocked before staging:

- Error: `Missing object storage account. Set DATA_PLANE_OBJECT_STORE_ACCOUNT,
  AZURE_STORAGE_ACCOUNT_NAME, or AZURE_STORAGE_CONNECTION_STRING.`

Live Azure Container App config was repaired with non-secret object storage
settings:

- Container App: `ca-abarva-web-lab-eastus`
- Active revision after repair: `ca-abarva-web-lab-eastus--0000053`
- Traffic: 100%
- `DATA_PLANE_OBJECT_STORE_ACCOUNT=stabarvaprivatedplab001`
- `DATA_PLANE_OBJECT_STORE_CONTAINER=context-drops`
- Managed identity already had `Storage Blob Data Contributor` on the
  `context-drops` container.

No connection string or storage account key was added or printed.

## Governed Admin Processing Result

Production-compatible ZIP process run:

- Mode: `stage_and_process`
- Result: accepted
- Job id: `bulk-0af5b2dc5f80801f`
- Load name: `lakeshore-current-state-v2-production-compatible`
- Status: `committed`
- Files processed: 13
- Rows parsed: 179
- Chunks queued/committed: 179
- Blob bucket reported by loader: `context-uploads`
- Persisted status path:
  `lakeshore-holdings/_jobs/bulk-0af5b2dc5f80801f.json`
- Workflow summary: `Structured files were staged and processed through the
  governed loader.`

Workflow steps all completed:

- Package received
- Operator attestation verified
- Sensitive-data scan completed
- Azure Blob staging completed
- Immediate loader processing completed
- Tenant context commit completed

## Blob Evidence

The persisted job status lists one staged Blob object per source file. Examples:

- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/4aa24c286c55/data/lakeshore-enterprise-profile.json`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/9ac26e3ec36b/data/lakeshore-org-roles.csv`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/de14d251cb53/data/lakeshore-infrastructure-estate.csv`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/28dadcb35ba7/data/lakeshore-data-platform-lineage.csv`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/0dfce09d9c27/data/lakeshore-application-portfolio.csv`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/f6f4bbbcc587/data/lakeshore-vendor-contracts.csv`
- `lakeshore-holdings/lakeshore-current-state-v2-production-compatible/1b330a11804e/data/lakeshore-financial-kpi-workbook.csv`

## Admin UI Visibility

After the committed run, the live Admin source-file table showed the new
Lakeshore files. New v2 rows included:

| Source document | Chunks |
| --- | ---: |
| `data/lakeshore-financial-kpi-workbook.csv` | 50 |
| `data/lakeshore-application-portfolio.csv` | 20 |
| `data/lakeshore-org-roles.csv` | 20 |
| `data/lakeshore-infrastructure-estate.csv` | 16 |
| `data/lakeshore-data-platform-lineage.csv` | 12 |
| `data/lakeshore-vendor-contracts.csv` | 12 |
| `data/lakeshore-erp-landscape.csv` | 10 |
| `data/lakeshore-integration-topology.csv` | 10 |
| `data/lakeshore-business-capability-map.csv` | 9 |
| `data/lakeshore-initiative-portfolio.csv` | 8 |
| `data/lakeshore-risks-controls.csv` | 6 |
| `data/lakeshore-segment-pnl.csv` | 5 |
| `data/lakeshore-enterprise-profile.json` | 1 |

## Notification / Admin Communication

This branch adds best-effort Admin notification emission after successful
non-validation bulk uploads using the existing broker event
`intelligence.context_refreshed`. The route test covers:

- no notification in `validate_only`
- notification emitted on successful `stage_and_enqueue`
- notification failure does not roll back the load

Important timing note: the live upload above ran before this branch was merged
and deployed, so the live production response did not yet include
`adminNotification`. Future successful bulk loads on this branch will emit the
Admin communication automatically after deployment.

## Current Truth Boundary

Completed:

- Local synthetic package generated
- ZIP has root manifest and 13 structured files
- Admin `validate_only` gate passed
- Azure runtime object-storage config repaired without secrets
- Admin `stage_and_process` accepted the upload
- Blob staging completed
- Tenant-context chunks committed
- Admin UI shows the new source documents and chunk counts

Still separate / not claimed:

- Embeddings/search refresh was not run in this step.
- The current `embed:pending-chunks` runner uses OpenAI embeddings. Because the
  current production architecture rule is Anthropic-only for LLM quality, this
  receipt does not run an OpenAI embedding job without explicit approval or an
  approved Azure-native embedding path.
- The governed bulk CSV path commits retrievable context chunks; it does not by
  itself populate every structured domain table such as `applications`,
  `vendor_contracts`, `ai_initiatives`, or `enterprise_context_facts`.
- Sentinel/Nexus answer-quality QA is a follow-on gate after retrieval/indexing
  is intentionally refreshed.
