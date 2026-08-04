# Synthetic Airline Source v4 Package Manifest Contract

**Status:** required control artifact for Source v4 generation and offline acceptance.

The row-depth verifier is intentionally manifest-driven. Regex detection is only diagnostic. The
manifest declares the authoritative dataset identity, file list, domains, grains, keys, references,
expected coverage and story-thread thresholds.

## Required Manifest File

Every Source v4 package must include:

```text
source_v4_package_manifest.json
```

The verifier uses this file by default:

```bash
node scripts/source/verify-skyharbor-v4-row-depth.mjs /path/to/generated/csvs
```

Use `--manifest=/path/to/source_v4_package_manifest.json` only when validating an unpacked package
whose manifest lives outside the CSV directory.

## Dataset Identity

The manifest must declare exactly one dataset identity, and every CSV row must match it:

```json
{
  "dataset_id": "skyharbor-source-v4-202608",
  "dataset_version": "v4",
  "tenant_key": "skyharbor_global",
  "as_of_date": "2027-06-30",
  "period_window": {
    "start": "2025-07-01",
    "end": "2027-06-30",
    "expected_months": 24
  }
}
```

## File Declarations

Every CSV must be declared. Every declared CSV must exist.

```json
{
  "files": [
    {
      "file": "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
      "domain_contract": "contract_header",
      "grain": "contract_family",
      "primary_key": ["contract_id"],
      "expected_rows": 100,
      "allow_duplicate_source_record_id": false
    },
    {
      "file": "finance/S4_VENDOR_INVOICE_LINES.csv",
      "domain_contract": "financial_line",
      "grain": "invoice_line",
      "primary_key": ["invoice_id", "invoice_line"],
      "expected_rows_min": 40000,
      "expected_rows_max": 60000
    },
    {
      "file": "usage/ENTRA_SAAS_USAGE_MONTHLY.csv",
      "domain_contract": "saas_usage",
      "grain": "tool_sku_function_month",
      "primary_key": ["tool_id", "sku_id", "function_ref", "period_start"],
      "time_series": true,
      "expected_months": 24,
      "require_complete_months": true
    }
  ]
}
```

Supported `domain_contract` values:

```text
supplier_master
contract_header
legal_evidence
financial_line
saas_usage
cloud_consumption
service_performance
workforce_rate_card
sourcing_event
scope_mapping
```

## Referential Integrity

Declare cross-file links explicitly:

```json
{
  "references": [
    {
      "file": "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
      "column": "vendor_id",
      "ref_file": "suppliers/ARIBA_SUPPLIERS.csv",
      "ref_column": "vendor_id",
      "allow_blank": false
    },
    {
      "file": "finance/S4_VENDOR_INVOICE_LINES.csv",
      "column": "contract_id",
      "ref_file": "contracts/ARIBA_CONTRACT_WORKSPACES.csv",
      "ref_column": "contract_id",
      "allow_blank": true
    }
  ]
}
```

Expected v4 reference classes:

- contract vendor resolves to supplier master
- invoice supplier resolves to supplier master
- contract-linked invoice resolves to contract family
- SOW/change order resolves to contract family or parent legal instrument
- scope relationship resolves to contract and app/platform/service
- clause extraction resolves to file/page/span and contract
- sourcing response resolves to event and supplier
- evaluation score resolves to response
- BAFO resolves to event round
- opportunity resolves to supporting facts

## Portfolio Expectations

Use these values for the full v4 package:

```json
{
  "portfolio_expectations": {
    "material_vendors": 60,
    "contract_families": 100,
    "contract_tiers": {
      "tier_1": 25,
      "tier_2_min": 35,
      "tier_2_max": 40,
      "tier_3_min": 35,
      "tier_3_max": 40
    },
    "legal_instruments_min": 275,
    "legal_instruments_max": 350,
    "explicit_contract_scope_min": 2000,
    "explicit_contract_scope_max": 3000,
    "inferred_contract_scope_min": 2000,
    "inferred_contract_scope_max": 4000,
    "structured_records_min": 180000,
    "structured_records_max": 250000
  }
}
```

For a canary slice, override these expectations explicitly and mark:

```json
{
  "package_mode": "canary"
}
```

The canary should still include all seven story structures, but with smaller row thresholds.

## Story Coverage

The full package must include all seven planted story threads. The manifest may tighten these
minimums, but it must not silently remove a required thread.

```json
{
  "story_threads": {
    "saas_rationalization": {
      "minimum_records": 1000,
      "required_domains": ["contract_header", "saas_usage", "financial_line"]
    },
    "managed_service_value_leakage": {
      "minimum_records": 1000,
      "required_domains": [
        "contract_header",
        "workforce_rate_card",
        "financial_line",
        "service_performance"
      ]
    },
    "cloud_commitment_exposure": {
      "minimum_records": 500,
      "required_domains": [
        "contract_header",
        "cloud_consumption",
        "financial_line"
      ]
    },
    "app_retirement_contract_conflict": {
      "minimum_records": 250,
      "required_domains": ["contract_header", "scope_mapping"]
    },
    "ai_value_proof_gap": {
      "minimum_records": 500,
      "required_domains": [
        "saas_usage",
        "service_performance",
        "financial_line"
      ]
    },
    "supplier_bafo_normalization": {
      "minimum_records": 500,
      "required_domains": ["sourcing_event", "supplier_master"]
    },
    "evidence_conflict_resolution": {
      "minimum_records": 100,
      "required_domains": ["legal_evidence", "contract_header"]
    }
  }
}
```

## Row Hash Rule

`row_hash` must be:

```text
sha256(join(header=value, "\n") for every normalized header in CSV order except row_hash)
```

The verifier recomputes this hash for every row.

## PII Rule

The manifest cannot authorize PII. The verifier rejects:

- email values
- phone values
- employee-id-looking values
- person-name, owner-name, approver-name, requester-name, user-name, worker-name fields

Allowed role/reference fields include:

```text
role_ref
role_title
worker_ref
team_ref
function_ref
portfolio_ref
business_owner_role
technical_owner_role
```

## Acceptance Position

The manifest, row-depth verifier and future reconciliation output must travel together in the v4
proof bundle. A package that passes row-level checks but fails reference integrity, story coverage or
question evidence coverage is not loadable.
