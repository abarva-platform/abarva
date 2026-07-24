# Tower Data Path Fix Proof

## Status

`DRY_RUN_PROVEN_DATA_PATH_FIXED`

This branch fixes the operator/projection path so Tower reads the active tenant input registry by default and no longer points demo dry-run/write scripts at stale tenant roots or candidate supplemental roots.

No Azure/Postgres mutation was performed.

## What Changed

- `src/scripts/tower/project-tower-mart.ts`
  - `--v3-dir` is now optional.
  - If omitted, the projector resolves the active packet from `datasets/tenant-inputs/tenant-input-registry.json`.
  - The resolved active path is tagged as `active-current`.
- `package.json`
  - Meridian, Airline Demo, and FS Demo Tower mart scripts now point to `datasets/tenant-inputs/active/<tenant>/current`.
  - Candidate/supplemental paths are no longer operator defaults.
- `scripts/tower/fact-lineage-report.mjs`
  - Restores the mandated Tower lineage command.
  - Projects every active tenant from the active registry and emits CSV/JSON lineage.
- `docs/templates/tower/client-intake/AbarVa_Tower_Client_Data_Intake_v1.xlsx`
  - Adds the pilot intake workbook with independently loadable source-owner tabs.

## Source-Of-Truth Finding

Authoritative active tenant inputs are declared in `datasets/tenant-inputs/tenant-input-registry.json`.

Current active roots:

| Tenant | Active input root |
| --- | --- |
| `apex-retail` | `datasets/tenant-inputs/active/apex-retail/current` |
| `first-capital-financial` | `datasets/tenant-inputs/active/first-capital-financial/current` |
| `lakeshore-holdings` | `datasets/tenant-inputs/active/lakeshore-holdings/current` |
| `lakeshore-industries` | `datasets/tenant-inputs/active/lakeshore-industries/current` |
| `meridian-health` | `datasets/tenant-inputs/active/meridian-health/current` |
| `skyharbor-air` | `datasets/tenant-inputs/active/skyharbor-air/current` |

## Dry-Run Results

| Tenant | Source standard | V3 facts | Merged facts | Mart AI portfolio rows | Blocking gaps |
| --- | --- | ---: | ---: | ---: | ---: |
| `apex-retail` | `active-current` | 36 | 36 | 7 | 1 |
| `first-capital-financial` | `active-current` | 37 | 37 | 7 | 1 |
| `lakeshore-holdings` | `active-current` | 37 | 37 | 7 | 1 |
| `lakeshore-industries` | `active-current` | 37 | 37 | 7 | 1 |
| `meridian-health` | `active-current` | 308 | 293 | 255 | 0 |
| `skyharbor-air` | `active-current` | 34 | 34 | 6 | 1 |

## Metric Proof

| Tenant | FY26 IT budget | AI-tagged spend | Promised value | Finance validated | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| `meridian-health` | 650000000 | 53700000 | 35500000 | 3800000 | Active source has budget/value coverage |
| `skyharbor-air` | 0 | 45100000 | 80200000 | 5650000 | Blocking enterprise budget gap |
| `first-capital-financial` | 0 | 37800000 | 50800000 | 1750000 | Blocking enterprise budget gap |

The non-Meridian zeros are now explicit source gaps, not fabricated replacements from supplemental or candidate paths.

## aVa Boundary

The visible Tower Command Center reads `cio_tower.mart_*` through `loadTowerMartCommandView()`.

The Tower/aVa chat path still uses the older `measure_results` and V7 fallback path. It should be re-grounded on the same mart/canonical context before pilot signed-in proof.

## Outputs

- `reports/tower-data-fix/fact-lineage/tower-lineage-summary.csv`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.csv`
- `reports/tower-data-fix/fact-lineage/tower-gap-lineage.csv`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.json`
- `reports/tower-data-fix/workbook-previews/`
- `docs/templates/tower/client-intake/AbarVa_Tower_Client_Data_Intake_v1.xlsx`

## Next Safe Step

Run the governed ACA Tower mart write job for `meridian-health` only, then verify signed-in Tower browser proof. Do not promote other tenants as pilot-complete until their active enterprise budget envelope source is loaded or their incomplete budget state is explicitly accepted.
