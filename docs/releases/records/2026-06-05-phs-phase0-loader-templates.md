# 2026-06-05-phs-phase0-loader-templates — PHS Phase 0 Loader Templates

## Release ID

`2026-06-05-phs-phase0-loader-templates`

## Status

`candidate`

## Plain-English Summary

Adds the first governed loader contract for the Meridian / PHS demo. The new
templates define the six file shapes that Phase 0 must provide before the demo
can show later-stage strategy, architecture, business case, or approvals:
evidence register, uploaded artifacts, workload inventory, rate card, gate
criteria, and approval records.

## Layer Impact

`client-data-lane`: Defines client-scoped data-load templates and validation
rules. The change does not load tenant data and does not write to the database.

`global-control-lane`: Adds shared validation code that future Setup/Admin
loader UI and API slices can use before accepting a PHS pack.

## Client Applicability

- All clients: The pattern is reusable for future command-center demos.
- Specific clients: The template set is PHS / Meridian focused.
- Internal only: Yes, until runtime loader wiring and QA are complete.
- Public/demo only: Demo-preparation contract only.
- Feature flag: None.

## Changes Included

- Added `src/lib/context-ingestion/phs-phase0-templates.ts`.
- Added `src/lib/context-ingestion/__tests__/phs-phase0-templates.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-phase0-templates.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-phase0-templates.ts src/lib/context-ingestion/__tests__/phs-phase0-templates.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main as a contract-only slice. Follow-on PRs can wire these templates
into `/admin/context-layer/uploads` and the CSV upload API.

## Rollback Plan

Revert the PR. No production data or schema changes are involved.

## Audit Evidence

- Template source: `src/lib/context-ingestion/phs-phase0-templates.ts`.
- Unit test: `src/lib/context-ingestion/__tests__/phs-phase0-templates.test.ts`.

## Known Gaps

The templates are not yet surfaced in the Admin UI and are not yet wired into
the CSV upload API. This PR only defines and tests the contract.
