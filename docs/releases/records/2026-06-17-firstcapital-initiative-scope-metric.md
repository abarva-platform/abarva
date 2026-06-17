# 2026-06-17-firstcapital-initiative-scope-metric — Initiative Scope Metric Polish

## Release ID

`2026-06-17-firstcapital-initiative-scope-metric`

## Status

`candidate`

## Plain-English Summary

This release removes the remaining generic First Capital value-realization label from the AI Control Tower initiative detail panel. The selected initiative now shows the same outcome-oriented metric label used in the Initiatives table, so executives see a meaningful metric such as adoption, avoided work, quality guardrail, service time, or validation evidence instead of a template placeholder.

## Layer Impact

- `global-control-lane`: Updates AI Control Tower presentation logic only.
- `client-data-lane`: No data, loader, schema, migration, or persistence behavior changes.

## Client Applicability

- All clients: AI Control Tower initiative detail scope labels use the derived outcome metric where applicable.
- Specific clients: First Capital benefits immediately for the Republic Bank demo path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx`
- `src/components/tower/__tests__/AiControlTowerPage.test.tsx`

## QA / Validation

- `npx jest src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand` — pass.
- `npx eslint src/components/tower/AiControlTowerPage.tsx src/components/tower/__tests__/AiControlTowerPage.test.tsx` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main`; Azure Container Apps main deploy will make the UI change active. No migration or loader run is required.

## Rollback Plan

Revert the merge commit or redeploy the prior ACA revision. No data rollback is required.

## Audit Evidence

- Production smoke after PR #3628 showed the generic `firstcapital value realization` label could still appear in the selected initiative detail panel.

## Known Gaps

- This does not load additional spend, KPI evidence, decision-log, stakeholder-note, or relationship data.
