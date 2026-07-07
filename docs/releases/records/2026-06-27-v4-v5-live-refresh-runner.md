# 2026-06-27-v4-v5-live-refresh-runner — Governed V4/V5 Refresh Runner Scripts

## Release ID

`2026-06-27-v4-v5-live-refresh-runner`

## Status

`candidate`

## Plain-English Summary

This release adds the missing script entrypoints needed to run the repaired v4/v5 tenant dataset refresh through the approved Azure Container Apps private operator wrapper.

The tenant loader already existed as a file. This change makes it callable as `npm run context:v4:load` and adds a read-only live verifier as `npm run context:v4:verify-live`. That lets the live refresh use the governed VNet runner instead of a one-off shell command.

This PR does not by itself refresh Azure/Postgres, rebuild dossiers, or prove browser answer quality. It enables the controlled live run.

## Layer Impact

- `client-data-lane`: Adds controlled data-plane operation scripts for tenant-scoped v4/v5 refresh and live count verification.
- `client-data-lane`: Does not change app routes, UI, schema, runtime logic, or tenant data by itself.

## Client Applicability

- All clients: No.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings, Meridian Health, SkyHarbor Air.
- Internal only: Operator tooling for synthetic/demo source-data refresh.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `package.json`: adds `context:v4:load` and `context:v4:verify-live`.
- `scripts/context-packs/verify-v4-live-counts.cjs`: adds a read-only live verifier for clients, enterprise context tables, AI Control Tower tables, and chunk embedding status.
- `docs/releases/records/2026-06-27-v4-v5-live-refresh-runner.md`: adds this release record.

## QA / Validation

Local no-write validation passed before this script shim:

```bash
NODE_OPTIONS=--conditions=react-server node scripts/audit/validate-v4-v5-dataset-refresh.mjs
```

Local no-write loader preflight passed for all five v4 packs:

- `apex-retail`: 23 CSV files checked, v4 aliases enabled.
- `first-capital`: 23 CSV files checked, v4 aliases enabled.
- `lakeshore-holdings`: 23 CSV files checked, v4 aliases enabled.
- `meridian-health`: 23 CSV files checked, v4 aliases enabled.
- `skyharbor-air`: 23 CSV files checked, v4 aliases enabled.

Script validation:

```bash
node --check scripts/context-packs/verify-v4-live-counts.cjs
npm run release:check
```

## Rollout Plan

1. Merge this runner shim to main.
2. Build the merged main SHA into a digest-pinned ACR image.
3. Run the read-only live verifier through the ACA private operator to resolve live client IDs and baseline counts.
4. Run the tenant-scoped v4 refresh through the ACA private operator for each tenant:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script context:v4:load \
  --env TENANT_KEY=<tenant-key> \
  --env CLIENT_ID=<live-client-id> \
  --env DATASET_PATH=<dataset-root> \
  --env UPLOADED_BY=codex-v4-v5-refresh
```

5. Re-run `context:v4:verify-live`.
6. Rebuild deterministic read models/dossiers and run browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required before using this script from a production/shared runtime image.
- Shared runtime mutators: This PR does not mutate runtime. The follow-on ACA job mutates tenant data only when explicitly run.
- Approved image digest: Required for `npm run ops:aca-job`; mutable tags are refused by the wrapper.
- ACA runtime invariant: App traffic is not changed by this PR.
- Worker image invariant: Operator job is restored to its idle image after wrapper execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after the refresh/rebuild, not claimed by this runner PR.

## Rollback Plan

Revert this PR to remove the package script entrypoints and live verifier. If a later refresh run writes undesired tenant rows, rerun the previous approved tenant refresh package or restore the affected tenant context rows from the last known-good backup/snapshot.

## Audit Evidence

- `package.json`
- `scripts/context-packs/verify-v4-live-counts.cjs`
- Local preflight outputs under `reports/live-refresh-preflight-20260627/`
- Follow-on ACA operator proof directory from the live run

## Known Gaps

- Azure/Postgres refresh has not been run by this PR.
- L3 dossiers and semantic read models have not been rebuilt by this PR.
- Browser-visible Home/Intelligence/Tower answer proof has not been run by this PR.
- Tenant-key runtime cleanup remains open; this PR preserves current runtime aliases for safety.
