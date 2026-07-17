# Tower Runtime Readiness

Tower runtime currently reads Postgres/runtime data through `loadCioTowerCxoView` and `listTowerBudgetRollupsForClient`. It does not read `datasets/tenant-inputs/meridian-health/approved-content/tower/` or `derived/module-context/tower-dashboard-view.json` directly.

## Why Repo Artifacts Are Not Visible Yet

The Meridian V3 files are source and derived artifacts only. They are not loaded into Azure/Postgres, not indexed, not promoted to Active Tenant Access, and not live-proven in Tower.

## Required Future Sequence

1. Governed ACA data-build job for candidate load.
2. Candidate preview proof.
3. Human review and promotion gate.
4. Active Tenant Access update.
5. Signed-in Tower proof.

## Current Decision

Do not claim Tower runtime reflects #4909/#4915/#4917 artifacts yet.
