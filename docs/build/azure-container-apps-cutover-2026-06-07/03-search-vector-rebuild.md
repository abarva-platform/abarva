# Azure Container Apps Cutover - Search / Vector Rebuild Checkpoint

Date: 2026-06-07
Status: BLOCKED - operator cannot start Container Apps job
Job: `job-a24-search-canon-eus`

## Written checkpoint

Azure Search/vector rebuild is allowed after this checkpoint because the index
is rebuilt from Azure Postgres source rows and prior evidence shows the job can
verify per-tenant document counts.

## Guardrails

- Do not print secrets.
- Do not use Supabase as the rebuild source.
- Use Azure Container Apps job/runtime only.
- Record job execution name, result, source row count, expected counts,
  observed counts, and mismatches.

## Planned operation

Start `job-a24-search-canon-eus`, which:

1. Deletes `tenant-context-v1` if present.
2. Recreates Azure Search index contracts.
3. Reads `enterprise_context_chunks` from Key Vault-backed Azure Postgres
   `DATABASE_URL` inside Azure Container Apps.
4. Uploads canonical tenant documents.
5. Verifies per-tenant Azure Search document counts.

## Execution record

| Field           | Value                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Execution       | Fresh 2026-06-07 rerun blocked                                                                                 |
| Status          | BLOCKED: operator identity lacks `Microsoft.App/jobs/start/action` on `job-a24-search-canon-eus`               |
| Source rows     | Prior evidence from `job-a24-search-canon-eus-ac5kk3z`: 21,967                                                 |
| Expected counts | Prior evidence: Apex 6,497; First Capital 400; Lakeshore 6,576; Meridian 4,376; Northstar 878; SkyHarbor 3,240 |
| Observed counts | Prior evidence matched expected counts                                                                         |
| Mismatches      | Prior evidence: `[]`                                                                                           |

## Current operator attempt

`az containerapp job start --resource-group rg-abarva-controlplane-lab-eastus
--name job-a24-search-canon-eus` failed with `AuthorizationFailed` because the
operator identity does not have `Microsoft.App/jobs/start/action`.

The existing successful rebuild from execution `job-a24-search-canon-eus-ac5kk3z`
remains useful prior evidence, but the requested fresh rebuild could not be run
from this operator shell.
