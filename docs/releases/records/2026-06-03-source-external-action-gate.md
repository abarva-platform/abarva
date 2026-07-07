# 2026-06-03-source-external-action-gate - Source External Action Gate

## Release ID

`2026-06-03-source-external-action-gate`

## Status

`candidate`

## Plain-English Summary

Source serve-notice work items now require a human approval rationale and
evidence references before the product will persist the action. AbarVa still
does not send external legal notice or vendor email from this surface; this
change makes the preparatory work item auditable and fail-closed.

## Layer Impact

- `global-control-lane`: shared Source control-plane behavior now enforces a
  human gate for the current external-action work-item surface.
- `client-data-lane`: no schema or migration change. Existing work-item
  metadata stores the approval evidence for the caller's active client only.

## Client Applicability

- All clients: yes, for Source Renewal Cockpit serve-notice work items.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/external-action-gate.ts`
- `src/app/api/v1/source/work-items/route.ts`
- `src/components/source/RenewalCockpitActionBar.tsx`
- `src/__tests__/integration/source/source-external-action-gate.test.ts`
- `scripts/ai-liability/verify-source-external-action-gate.mjs`
- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/build/SOURCE_EXTERNAL_ACTION_GATE_2026-06-03.md`

## QA / Validation

- Pass: `npx jest src/__tests__/integration/source/source-external-action-gate.test.ts --runInBand` (8 tests).
- Pass: `npx eslint src/lib/source/external-action-gate.ts src/app/api/v1/source/work-items/route.ts src/components/source/RenewalCockpitActionBar.tsx src/__tests__/integration/source/source-external-action-gate.test.ts`.
- Pass: `node scripts/ai-liability/verify-source-external-action-gate.mjs` (38 checks).
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Blocked unrelated: `npx tsc --noEmit --pretty false` still fails on the
  existing repo-wide missing `@axe-core/playwright` type dependency in
  `tests/accessibility/public-axe.spec.ts`; this slice's TypeScript issue was
  fixed and the rerun only reports that dependency gap.

## Rollout Plan

Merge to `main`. The route and cockpit UI become active on the next Vercel
deployment. No migration or manual data backfill is required.

## Rollback Plan

Revert the PR. Existing work items with approval metadata remain readable
because the metadata map is already supported by the data-plane adapter.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2901.
- CI run: pending.
- Local QA output: pending.
- Control statement: AbarVa still does not send external legal notice or vendor email from this surface.
- Build note:
  `docs/build/SOURCE_EXTERNAL_ACTION_GATE_2026-06-03.md`.

## Known Gaps

This closes the current `serve_notice` external-action work-item path. Future
RFP-send, contract-draft-commit, or vendor-notification runtime actions must
reuse this gate before shipping.
