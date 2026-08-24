# 2026-07-08-lakeshore-enterprise-profile-retirement — Lakeshore Stale Enterprise Profile Retirement

## Release ID

`2026-07-08-lakeshore-enterprise-profile-retirement`

## Status

`released`

## Plain-English Summary

The live Lakeshore Intelligence audit found one remaining stale source packet:
`lakeshore-holdings:enterprise_profile`. That packet still described
Lakeshore as "Lakeshore Industries" and carried the retired 54.2B revenue,
72,000 employee, 89 plant, 1.8B technology-budget profile. This was not a
display-name typo; it was historical/demo enterprise-profile material that
conflicted with the governed Lakeshore Holdings holding-company profile.

The row was retired in Azure Postgres and the Lakeshore slice of Azure AI
Search was rebuilt from active rows only. The permanent retired-fact gate
remains in place as the runtime safety brake.

## Layer Impact

- `client-data-lane`: Retired one Lakeshore enterprise-context chunk and
  removed stale Lakeshore Search documents from `tenant-context-v1`.
- `global-control-lane`: No code behavior changed in this release record. The
  existing retired-fact gate from `2026-07-08-intelligence-retired-lakeshore-fact-gate`
  remains the shared runtime safety brake.

## Client Applicability

- All clients: No data mutation.
- Specific clients: Lakeshore Holdings only.
- Internal only: Operator data-plane job evidence and release record.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Backing row located:
  - table: `public.enterprise_context_chunks`
  - row id: `c780a944-21b2-49a3-ae40-4f947d974b6b`
  - tenant key: `lakeshore-holdings`
  - chunk id: `manifest:lakeshore-holdings:enterprise-profile:lakeshore-holdings-enterprise-profile`
  - source segment: `enterprise_profile`
  - source record: `lakeshore-holdings_enterprise_profile`
  - source doc: `family-1-enterprise-operating-model/F01_enterprise-profile.yaml`
  - source path: `manifest-load://lakeshore-holdings/family-1-enterprise-operating-model%2FF01_enterprise-profile.yaml`
- Data mutation:
  - `lifecycle_state` changed from `active` to `retired`.
  - `chunk_metadata` and `provenance` were annotated with retirement reason,
    retired term, retired timestamp, and run id.
  - No simple rename was performed because the row also contained retired scale
    facts, not just display-name residue.
- Search refresh:
  - First targeted backfill uploaded active rows and deleted non-active rows,
    but failed count verification because old stale Search docs still existed.
  - The second tenant-scoped exact sync purged Lakeshore Search docs and
    reindexed active Lakeshore rows only.

## QA / Validation

| Test | Command / Execution | Environment | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Backing-row probe | `job-abarva-deliv-worker-dcy59mw` | ACA job runtime | Locate exact source row and readiness sidecar state. | Located one active target row; no readiness sidecar row attached to target chunk id or row id. | `PASS` | ACA job logs |
| Data retirement | `job-abarva-deliv-worker-jsi1xmk` | ACA job runtime | Retire only the guarded target row. | Updated one row to `lifecycle_state='retired'`; active `Lakeshore Industries` chunk hits after mutation: `0`. | `PASS` | ACA job logs |
| Initial Search refresh | `job-abarva-deliv-worker-e54d5kv` | ACA job runtime | Delete non-active Search docs and verify active count. | Uploaded `884` active rows and deleted `332` non-active docs, but verification failed because Search still had `2232` Lakeshore docs. | `FAIL_EXPECTED_REMEDIATED` | ACA job logs |
| Tenant-scoped Search exact sync | `job-abarva-deliv-worker-v08zorb` | ACA job runtime | Purge Lakeshore Search docs, upload active rows, verify exact count. | Purged `2232` Lakeshore Search docs; uploaded `884` active rows; deleted `332` non-active docs; verified observed Search count `{ "lakeshore-holdings": 884 }`. | `PASS` | ACA job logs |
| Live 8-question Intelligence audit | `INTEL_AUDIT_BASE_URL=https://app.abarva.ai INTEL_AUDIT_TENANT=lakeshore INTEL_AUDIT_LIMIT=8 node scripts/qa/intelligence-extensive-api-audit.mjs` | Deployed ACA runtime | Retired-fact gate passes all 8 normal sample answers with `0` blocked and `0` failed-unblocked. | `6 pass / 2 watch / 0 fail`, average `9.5/10`; retired-fact gate `8 passed / 0 blocked / 0 failedUnblocked`; retired-fact violations `0`. | `PASS` | `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-24-48-233Z.html` |

## Rollout Plan

Already active in the lab data plane. The mutation was executed as an Azure
Container Apps job using the deployed worker image and the existing managed
identity/runtime environment. No web image rollout was required for the data
retirement. This release record should be merged so the active data-plane
change is auditable.

## Deployment Authority

- Repo-owned deploy workflow: Not used; no web code/image change.
- Shared runtime mutators: No shared web traffic, revision, flag, or env update.
- Approved image digest: Worker job used the current deployed worker/web image
  from `job-abarva-deliv-worker` template.
- ACA runtime invariant: Web runtime observed during validation:
  `ca-abarva-web-lab-eastus--m48181bd4` at 100% traffic on
  `acrabarvalab001.azurecr.io/abarva/web@sha256:9d4fa931daf48ed8c4be974be5868dcefe8ee58c31b9dafcea991ee22aa06086`.
- Worker image invariant: Job executions used the existing ACA job template;
  no persistent job template update was made.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; completed via the Intelligence API audit.

## Rollback Plan

If rollback is required, set the target `enterprise_context_chunks` row back to
`lifecycle_state='active'`, remove or append a rollback note in its retirement
metadata, and rerun the tenant-scoped Azure Search backfill. This is not
recommended unless the governed Lakeshore Holdings replacement profile is proven
missing, because the retired row contains known stale facts.

## Audit Evidence

- Backing-row probe job: `job-abarva-deliv-worker-dcy59mw`.
- Data retirement job: `job-abarva-deliv-worker-jsi1xmk`.
- Initial Search refresh job: `job-abarva-deliv-worker-e54d5kv`.
- Tenant-scoped Search exact sync job: `job-abarva-deliv-worker-v08zorb`.
- Live audit bundle:
  `/Users/anand/Downloads/abarva-intelligence-api-audits/2026-07-08T05-24-48-233Z-lakeshore-holdings-extensive-api-audit/`.
- Live audit report:
  `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-24-48-233Z.html`.
- Live audit summary:
  `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-24-48-233Z_summary.json`.

## Known Gaps

- The retirement fixed the deployed lab data/index path for the identified
  source. Local historical/generated Lakeshore files with retired terms still
  need a separate source-pack governance pass before any future rebuild job uses
  them.
- The two `watch` audit turns were quality wording flags for
  `missing_assertion:evidence`; they were not retired-fact failures.
