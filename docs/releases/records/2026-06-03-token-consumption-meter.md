# 2026-06-03-token-consumption-meter — Token Consumption Meter Metadata

## Release ID

`2026-06-03-token-consumption-meter`

## Status

`candidate`

## Plain-English Summary

Improves AbarVa's tenant usage meter by preserving model-provider token and
cost metadata in AI egress audit rows, then reading that metadata in the
Customer Admin usage panel. This makes the existing in-app meter more truthful
for model calls that return usage metadata.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: AI egress audit, Customer Admin read model, and pilot
  consumption-meter readiness.
- Runtime impact: no database schema change and no live pricing/cap enforcement
  change. The generic model wrapper now preserves adapter metadata in the
  completion audit row.

## Client Applicability

- All clients: future Customer Admin usage summaries benefit when provider
  calls emit usage metadata.
- Specific clients: none.
- Internal only: meter contract and admin read-model behavior.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/integrations/ai-egress/call-model.ts`
- `src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`
- `src/lib/admin/customer-admin-read-model.ts`
- `src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts`
- `docs/build/TOKEN_CONSUMPTION_METER_2026-06-03.md`

## QA / Validation

- Pass: `npx jest src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts --runInBand`
- Blocked locally: `npx tsc --noEmit --pretty false` could not complete because
  the local shared `node_modules` tree is missing declared dependency
  `@axe-core/playwright`, causing `tests/accessibility/public-axe.spec.ts` to
  fail module resolution before this slice's touched files are typechecked.
- Pass: `git diff --check`
- Pass after QA wording fix: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The change takes effect for code paths using the generic
`callModel` wrapper and adapters that return usage metadata. Customer Admin
usage summaries will show metered values when audit rows contain token/cost
metadata.

## Rollback Plan

Revert this commit. No migration rollback is required. The meter would return
to prior behavior where completion audit rows do not preserve adapter usage
metadata.

## Audit Evidence

- This release record.
- `docs/build/TOKEN_CONSUMPTION_METER_2026-06-03.md`
- Focused Jest output.
- Typecheck output.
- Release gate output.
- Pull request diff and CI checks.

## Known Gaps

- Streaming/preflight-only paths still need completion usage writeback after
  final provider metadata arrives.
- No tenant cap, overage, or alert policy is enforced by this slice.
- No weekly client-facing usage export is added by this slice.
- T033 remains `In progress` until all live provider paths are metered and caps
  are enforced.
