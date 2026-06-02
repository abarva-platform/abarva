# 2026-06-02-ai-surface-control-catalog-expansion — AI Surface Control Catalog Expansion

## Release ID

`2026-06-02-ai-surface-control-catalog-expansion`

## Status

`candidate`

## Plain-English Summary

Expands the CI-enforced AI surface control catalog from seven to nine audited surfaces and strengthens two existing entries. The catalog now checks Source admin event approvals, Source estimate assumption disclosures, richer Programs deliverable approval gates, and Tower Atlas executive brief accountability controls.

## Layer Impact

- `global-control-lane`: Strengthens governance validation for shared AI output and consequential-action surfaces. No runtime behavior changes are introduced.

## Client Applicability

- All clients: The CI guard applies to all shared surfaces and future pull requests.
- Specific clients: None.
- Internal only: Release tracking and audit evidence are internal-admin artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/security/ai-surface-control-catalog.json` adds Source admin approval and Source estimate disclosure entries.
- `docs/security/ai-surface-control-catalog.json` adds human approval and risk-caveat checks to existing Programs deliverable and Tower Atlas brief entries.

## QA / Validation

- PASS: `npm run audit:ai-surface-controls`

## Rollout Plan

Merge to `main`. The existing GitHub AI surface control catalog workflow will enforce the expanded catalog on future pull requests.

## Rollback Plan

Revert this release commit to restore the previous catalog scope. No database, migration, or runtime rollback is required.

## Audit Evidence

- Local command output: `npm run audit:ai-surface-controls` passed with 9 surfaces.
- Catalog evidence tokens point to concrete source files in `src/components/source/`, `src/components/deliverables/`, and `src/components/tower/`.

## Known Gaps

The catalog still validates direct file-token evidence only. It does not yet model inherited controls through wrapper components such as pages that embed `AgentDock`.
