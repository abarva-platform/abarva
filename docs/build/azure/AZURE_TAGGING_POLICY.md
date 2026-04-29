# Azure Tagging Policy (Authoritative)

This policy is the baseline tagging contract for the lab subscription and future production promotion paths.

## Required Tags
Every deployable Azure resource must include:
- `environment`
- `costCenter`
- `dataClassification`
- `owner`
- `project`

## Allowed Values

### `environment`
- `lab`
- `dev`
- `test`
- `stage`
- `prod`

### `costCenter`
- `abarva-lab`
- `abarva-platform`
- `abarva-security`
- `abarva-observability`

### `dataClassification`
- `synthetic`
- `internal`
- `confidential`

### `owner`
- Must be a valid team alias or individual owner alias.
- Format: lowercase alphanumeric + `-` only.
- Examples: `platform-team`, `founder-office`.

### `project`
- Required fixed value: `abarva`

## Enforcement Model
- Enforcement target: Azure Policy assignments at subscription scope.
- Deployments that omit required tags should be denied.
- Nonconforming existing resources should be flagged for remediation.

## Lab Baseline
Current lab subscription policy value expectations:
- `environment=lab`
- `dataClassification=synthetic`
- `project=abarva`

## Notes
- Tag keys are case-sensitive by policy convention in this repo.
- Exceptions require explicit approval and a documented expiration date.
