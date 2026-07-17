# 2026-07-17 Meridian V3 Reload Templates — Budget, Program, AI Spend, and Benefits Realization

## Release ID

`2026-07-17-meridian-v3-reload-templates`

## Status

`candidate`

## Plain-English Summary

This release prepares the Meridian synthetic source/template packet for a cleaner V3 reload. It preserves existing source rows, adds a reconciled FY26 $650M technology budget model, ties approved programs to finance rows, keeps Member Service AI Assist as an unfunded candidate opportunity, adds an AI benefits realization usage ledger, and leaves behind a reusable template pack for the next tenant.

## Layer Impact

- Release lane: `client-data-lane`.
- Source template layer: Meridian tenant-input CSVs are extended with budget, program, AI spend, benefits realization, interview, evidence, relationship, system, and vendor rows.
- Data-quality/control layer: New audit scripts prove budget totals, program-to-budget ties, AI funding boundaries, evidence resolution, and interview gap-fill hygiene before any reload.
- Documentation/template layer: A reusable Standard 2026-07 V3 reload template pack documents required fields, allowed values, instructions, and blank CSVs for future tenants.

## Client Applicability

- All clients: The reusable reload template pack and audit pattern are intended for future tenant loads.
- Specific clients: Meridian Health synthetic demo source/template files are updated.
- Internal only: The generation and audit scripts are internal operator tooling.
- Public/demo only: No public route changes.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/`
- `datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/`
- `scripts/tenant-v3/finalize-meridian-v3-reload-templates.mjs`
- `scripts/tenant-v3/audit-meridian-v3-reload-readiness.mjs`
- Package scripts for generation and audit entry points.

## QA / Validation

- Pass: `npm run generate:meridian-v3-reload-templates`
- Pass: `npm run audit:meridian-v3-reload-readiness`
- Pass: `npm run audit:tenant-v3-data -- --tenant meridian-health`
- Pass: `npm run audit:meridian-executive-interviews`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

This release does not deploy runtime code and does not load Azure/Postgres. After review, the files can be merged as source/template artifacts. A separate approved ACA data-build job must be used before any source packet becomes an active tenant candidate or active module runtime input.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no ACA deployment is part of this release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this is source/template preparation only. A future data-load/runtime PR must perform signed-in proof.

## Rollback Plan

Revert the source/template files, scripts, and package script entries. Because this release performs no Azure/Postgres load, no production data rollback is required.

## Audit Evidence

- `reports/meridian-v3-real-repo-integration/reload-readiness-audit.json`
- `reports/meridian-v3-real-repo-integration/reload-readiness-audit.md`
- `reports/meridian-v3-real-repo-integration/reload-summary.json`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/README.md`

## Known Gaps

No Azure/Postgres reload has been run. No candidate was created. No active tenant access pointer was updated. No Tower/Home/Intelligence runtime behavior changed in this release.
