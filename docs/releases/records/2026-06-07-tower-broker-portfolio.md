# 2026-06-07-tower-broker-portfolio — Tower Broker Portfolio Cards

## Release ID

`2026-06-07-tower-broker-portfolio`

## Status

`candidate`

## Plain-English Summary

The authenticated Tower portfolio no longer uses the temporary Apex contact-center fixture or the `TOWER_APEX_FIXTURE_ENABLED` switch. Tower now attempts to assemble Move portfolio cards from persisted tenant context through `AgentContextBroker` and current Move outcome-ledger rows. If those governed inputs are not present, the existing empty state remains visible.

## Layer Impact

- `global-control-lane`: Shared authenticated Tower behavior changes for all tenants. The route still fails soft, but portfolio cards now require governed broker context and outcome-ledger evidence instead of synthetic Apex data.
- No schema, migration, or client-private data-plane write changes.

## Client Applicability

- All clients: Receive the safer Tower render path after deployment.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None. The old `TOWER_APEX_FIXTURE_ENABLED` Tower render-path gate is removed.

## Changes Included

- `src/lib/tower/move-portfolio-broker.ts`: new broker-backed portfolio card reader.
- `src/app/(maestro)/tower/page.tsx`: routes Move portfolio cards through the broker reader and removes Apex fixture imports.
- `src/__tests__/integration/tower/tower-invariants.test.ts`: guardrails for broker-backed cards and no fixture gate.
- Removed stale `/tower/activity`, `/tower/outcomes`, `/tower/projects`, `/tower/staff-aug`, `/tower/tech-stack`, `/tower/volumetrics`, and `/tower/preview` redirect-shell pages that the Tower invariant suite and decision record already classify as deleted surface.
- `docs/pilot/TOWER-REDIRECT-SHELL-DECISIONS.md`: updates the Tower fixture decision note.

## QA / Validation

- Blocked before dependency install: `npx jest "src/__tests__/integration/tower/tower-invariants.test.ts" --runInBand` could not load the repo Jest config because local `node_modules` was absent.
- Blocked before dependency install: `npx eslint "src/lib/tower/move-portfolio-broker.ts" "src/app/(maestro)/tower/page.tsx" "src/__tests__/integration/tower/tower-invariants.test.ts"` could not load the repo ESLint config because local `node_modules` was absent.
- Failed then fixed: `npm run release:check` initially failed because this release record did not state explicit pass/fail/blocked status.
- Pass after dependency install: `npx jest "src/__tests__/integration/tower/tower-invariants.test.ts" --runInBand` (23 tests passed; Jest emitted existing duplicate manual mock warnings for markdown mocks).
- Pass after dependency install: `npx eslint "src/lib/tower/move-portfolio-broker.ts" "src/app/(maestro)/tower/page.tsx" "src/__tests__/integration/tower/tower-invariants.test.ts"`.
- Pass after dependency install: `npm run release:check`.

## Rollout Plan

Merge to `main` and deploy through the normal authenticated app release path. No manual data migration is required; tenants without persisted broker context and Move outcome-ledger rows continue to see the Tower portfolio empty state.

## Rollback Plan

Revert the PR. This restores the previous route behavior. No database rollback is required because the change is read-only and does not alter persisted data.

## Audit Evidence

- PR diff for the files listed above.
- Local test output for the focused Tower invariant test and release check.
- Git commit on branch `cursor/tower-broker-portfolio-630b`.

## Known Gaps

Source-to-Move handoff risk remains empty for broker-built cards until a persisted handoff reader is available. The card still shows outcome-ledger value status and broker-derived Move identity.
