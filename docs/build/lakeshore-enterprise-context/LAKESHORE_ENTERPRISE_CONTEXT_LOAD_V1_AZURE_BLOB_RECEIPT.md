# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Azure Blob Receipt

**State: AZURE-STAGED — VERIFIED.** Original bytes of every pack file are stored in Azure Blob
with retrievable, deterministic evidence paths.

## Storage target

| Field           | Value                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Storage account | `stabarvaprivatedplab001`                                                                         |
| Endpoint        | `https://stabarvaprivatedplab001.blob.core.windows.net`                                           |
| Container       | `context-drops`                                                                                   |
| Prefix          | `lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/`                                        |
| Auth            | AAD / managed identity `id-abarva-scale-runtime-lab-eastus` (Storage Blob Data Contributor)       |
| Network         | private endpoint + firewall (deny public); written from inside `cae-abarva-scale-lab-eastus` VNet |

## Upload result (live)

| Metric            | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| Blobs uploaded    | **133 / 133**                                                                        |
| Failed            | **0**                                                                                |
| Total bytes       | **1,935,745** (~1.85 MiB)                                                            |
| Blob path pattern | `context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/<source/...>` |

## Example evidence paths

```
context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/source/05_treasury_kyriba/kyriba_rollout_plan.xlsx
context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/source/05_treasury_kyriba/kyriba_connectivity_architecture.svg
context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/source/09_servicenow_support_workload/servicenow_incidents.csv
context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/source/10_vendors_contracts_source/ams_contract.pdf
context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/source/06_it_systems_architecture/current_state_architecture.svg
```

Each blob's logical key equals its `source/...` path inside the pack manifest; the manifest's
`sha256` per file allows integrity verification against the stored bytes. The original ZIP
(`LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1.zip`) and `manifest.json` are retained in this folder
and in git for full reproducibility.

## How produced

The Setup-Admin-equivalent loader (`scripts/lakeshore/azure-context-loader.cjs`) ran inside the
VNet Container App, fetched each file from the public branch, and called
`@azure/storage-blob` `BlockBlobClient.upload()` per file. Raw run evidence:
`azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json` (`load_run_steps.blob`).
