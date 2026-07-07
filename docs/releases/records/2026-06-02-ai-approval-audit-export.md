# 2026-06-02-ai-approval-audit-export — AI Approval Audit Export Contract

## Release ID

`2026-06-02-ai-approval-audit-export`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic export contract for AI-assisted approval audit records. The exporter converts a human decision evidence packet into client-reviewable JSON and spreadsheet-safe CSV rows with decision owner, approver, evidence IDs, missing inputs, assumptions, override disposition, attestation text, and the AI decision-support watermark.

## Layer Impact

- `global-control-lane`: Extends the shared AI liability control spine with a reusable export contract. This is pure library code and does not change route behavior or tenant data.

## Client Applicability

- All clients: The export contract is available for all shared AI approval surfaces once wired into UI/API routes.
- Specific clients: None.
- Internal only: Release evidence and tests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/ai-liability/approval-audit-export.ts` adds JSON and CSV renderers for approval audit records.
- `src/lib/ai-liability/__tests__/approval-audit-export.test.ts` verifies export shape, evidence flattening, decision-support fields, and spreadsheet formula protection.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/ai-liability/__tests__/human-decision-controls.test.ts src/lib/ai-liability/__tests__/approval-audit-export.test.ts --runInBand`

## Rollout Plan

Merge to `main`. Follow-on route/UI slices can call the pure exporter to produce client-facing approval audit downloads.

## Rollback Plan

Revert this PR. No data migration or runtime rollback is required.

## Audit Evidence

- Local focused Jest output passed 8 tests across the human decision controls and approval audit export suites.
- Exported records include the shared human decision controls version, watermark, attestation, missing-data banner, approver, decision owner, and evidence references.

## Known Gaps

The exporter is not yet wired to a download route or admin UI. Existing Jest configuration emits duplicate manual mock warnings unrelated to this change.
