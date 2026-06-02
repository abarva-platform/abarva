# 2026-06-02-template-schema-preflight — Template Explorer And Schema Preflight

## Release ID

`2026-06-02-template-schema-preflight`

## Status

`candidate`

## Plain-English Summary

Adds the first executable T343/T348 slice: a template schema preflight that compares uploaded CSV headers to the selected context template before the operator loads the file. The upload screen now shows missing required fields and unknown columns as clarification items, and blocks the load button when required template fields are absent. The template catalog is also renamed to a general context template explorer and shows the surfaces unlocked by each dimension.

## Layer Impact

Release lane: `client-data-lane`.

This changes the admin context-layer upload and template explorer surfaces plus pure schema-preflight logic. It does not add database migrations, Azure Blob uploads, durable clarification persistence, or approved commit behavior.

## Client Applicability

- All clients: The admin context-layer template explorer and CSV upload preflight apply wherever the setup/context-layer admin routes are available.
- Specific clients: The Pilot Loader wave will use this for Apex, Meridian, and SkyHarbor rehearsal loads.
- Internal only: AbarVa operators and pilot admins.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/schema-preflight.ts`
- `src/lib/context-ingestion/__tests__/schema-preflight.test.ts`
- `src/components/admin/context-layer/CsvUploadConnector.tsx`
- `src/app/(maestro)/admin/context-layer/templates/page.tsx`
- `src/app/(maestro)/admin/context-layer/templates/__tests__/page-source.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/context-ingestion/__tests__/schema-preflight.test.ts --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/admin/context-layer/templates/__tests__/page-source.test.ts' --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked locally: `npm run secrets:staged` cannot run because the `gitleaks` binary is not installed in this worktree environment; the PR secret-scanning workflow remains the release gate.

## Rollout Plan

Merge to `main`. The upload preflight becomes available on the existing admin context-layer CSV upload page. Durable clarification queue persistence remains a later PL slice.

## Rollback Plan

Revert the PR to remove the preflight module, UI panel, template explorer column, and tests. No data rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Focused Jest coverage for schema matching, missing required fields, unknown columns, normalization, and template explorer source.
- CI release-control and secret-scanning results.

## Known Gaps

This is not the full T348 durable clarification queue. It surfaces clarification needs before CSV load and blocks missing required fields, but it does not yet persist clarification cases or resume paused runs after operator mapping.
