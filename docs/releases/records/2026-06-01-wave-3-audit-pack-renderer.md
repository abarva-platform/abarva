# 2026-06-01-wave-3-audit-pack-renderer - Per-Move Audit Pack Renderer

## Release ID

`2026-06-01-wave-3-audit-pack-renderer`

## Status

`released`

## Plain-English Summary

Adds the first Wave 3 artifact: an on-demand per-Move audit pack. For a real, in-scope Move, the pack assembles the charter, business case, baseline evidence, dissent, gate evidence, contract/governance gaps, realized-vs-projected gap, Function Pack pattern evidence, and peer-source citation evidence into one HTML or PDF export.

## Layer Impact

- `global-control-lane`: shared Move export capability available to all clients through the authenticated API route.
- Export/rendering: new deterministic HTML and PDF renderers under the Moves expert-kernel export layer.
- API: new `GET /api/v1/moves/audit-pack?moveId=...` route with `format=html|pdf`.
- Eval/QA: unit coverage verifies the ten-section contract, deterministic render, and honest unbound state.

## Client Applicability

- All clients: any user can request the audit pack only for a Move visible in their current client scope.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are supported through the same generic path when their Moves bind to curated Function Packs.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/expert-kernel/exports/audit-pack/*`
- `src/app/api/v1/moves/audit-pack/route.ts`
- `src/lib/programs/expert-kernel/exports/audit-pack/__tests__/audit-pack.test.ts`

## QA / Validation

- `npx jest src/lib/programs/expert-kernel/exports/audit-pack/__tests__/audit-pack.test.ts` - passed locally. Jest printed pre-existing duplicate manual mock warnings for markdown/GFM mocks, but the suite passed.
- `npx tsc --noEmit --pretty false` - passed locally.
- `npx eslint src/lib/programs/expert-kernel/exports/audit-pack src/app/api/v1/moves/audit-pack/route.ts` - passed locally.
- `npm run test:behaviors -- --runInBand` - passed locally, 90 tests. Jest printed the same pre-existing duplicate manual mock warnings.
- `npm run release:check -- --base origin/main --head HEAD` - passed locally.
- Wave 0 gates run on PR CI before merge.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. The route is authenticated and tenant-scoped through the existing Move business-case loader; no migration is required.

## Rollback Plan

Use `gh pr revert <PR_NUMBER>` to remove the renderer and route. No database state or migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local test output:
  - focused audit-pack Jest suite: 5 tests passed.
  - behavior suite: 90 tests passed.
  - TypeScript: clean.

## Known Gaps

This PR ships Wave 3 A1 only. Quarterly portfolio board packs, quarterly cron/email, and the dedicated Wave 3 QA evidence packet remain in later Wave 3 PRs.
