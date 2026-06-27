# AbarVa promoted repaired v4/v5 dataset candidate

Generated: 2026-06-27T17:46:43

This package is a reviewable repaired copy of the five canonical v4 tenant packs. It does not mutate the repo or Azure.

Repairs applied:
- canonical profile budget/AI spend alignment for Lakeshore, Meridian, SkyHarbor
- F21 data product lineage aligned to F09 data estate IDs/names for First/Lakeshore/Meridian
- SkyHarbor SHA-APP/APP application id reconciliation across F06/F17/F20
- SkyHarbor integration endpoints reconciled to F05 inventory and labels refreshed
- F19 team aliases normalized where they blocked joins
- F12 CapEx/OpEx classification columns added where absent; SkyHarbor run/change derived from spend_type

Review before load:
- CapEx/OpEx additions are deterministic synthetic classifications, not client-provided actuals.
- Named owner person remains intentionally absent; role/team ownership is present.
- This package still needs a validation run before semantic2/L3 refresh.
