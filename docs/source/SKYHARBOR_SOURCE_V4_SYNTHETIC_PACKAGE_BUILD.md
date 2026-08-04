# SkyHarbor Source v4 Synthetic Package Build

**Status:** generator and offline package lane. No database load, Cube runtime change or application
deployment is performed by this lane.

## Purpose

The v4 synthetic package pressure-tests Source with system-of-record-shaped extracts rather than
demo summary tables. It is built from the approved row-depth contract and the question/evidence
contract.

## Generator

```bash
npm run source:v4:synthetic-package:build
```

The generator writes a timestamped ZIP to `/Users/anand/Downloads` and includes:

- `csv/source_v4_package_manifest.json`
- 10 source-system-shaped CSV extracts
- `SOURCE_EXTRACTION_INSTRUCTIONS.md`
- `README.md`

## Acceptance

Validate an unpacked package with:

```bash
npm run source:v4:row-depth:verify -- /path/to/unpacked/csv
npm run source:v4:question-coverage:verify
```

The package is not loadable unless both gates pass and the package is reviewed.

## Current Generator Shape

| Extract                                   |    Rows | Source system                             |
| ----------------------------------------- | ------: | ----------------------------------------- |
| `suppliers/ARIBA_SUPPLIERS.csv`           |      60 | SAP Ariba SLP / Coupa Supplier Management |
| `contracts/ARIBA_CONTRACT_WORKSPACES.csv` |     100 | SAP Ariba Contracts / Icertis             |
| `legal/SHAREPOINT_CONTRACT_EVIDENCE.csv`  |     288 | SharePoint legal repository               |
| `finance/S4_VENDOR_INVOICE_LINES.csv`     | 175,000 | SAP S/4HANA MM/FI/AP/CO                   |
| `usage/ENTRA_SAAS_USAGE_MONTHLY.csv`      |   1,536 | Microsoft Entra / M365 Admin Center       |
| `cloud/AZURE_COST_MONTHLY.csv`            |   3,456 | Azure Cost Management / AWS CUR           |
| `performance/SERVICENOW_SLA_MONTHLY.csv`  |   7,200 | ServiceNow SLA / ITSM                     |
| `workforce/FIELDGLASS_RATE_CARD.csv`      |   2,400 | SAP Fieldglass                            |
| `sourcing/ARIBA_SOURCING_EVENTS.csv`      |     720 | SAP Ariba Strategic Sourcing              |
| `scope/LEANIX_CONTRACT_SCOPE.csv`         |   5,200 | LeanIX / ServiceNow APM                   |

Total structured rows: 195,960.

## Guardrails

- No personal names, emails, phone numbers or employee IDs.
- Every row carries dataset identity, source system, module, source object, extract job, quality
  state, evidence state, scenario thread and deterministic row hash.
- AI tool rows distinguish usage, baseline, finance validation and claimable value; usage alone is
  never claimable value.
- Contract value conflicts are kept disputed unless reviewed.
- Off-contract invoice rows are retained as data-quality observations rather than rejected.
