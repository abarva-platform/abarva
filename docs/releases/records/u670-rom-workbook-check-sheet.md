# u670 — A Check sheet in the P3 estimate workbook

## Release ID

`2026-10-17-moves-rom-workbook-check`

## Status

`candidate`

## Plain-English Summary

The P3 estimate (ROM) workbook writes every figure as a live formula, but nothing in the file showed a finance reviewer that those formulas reproduce the estimate the product approved. The workbook now ends with a **Check** sheet. For each figure it shows:
- the engine's value;
- a formula pointing at the workbook's own cell for that figure;
- the difference.

It covers every release's and the foundation's hours, weeks, low, plan and high, the totals, and, when the estimate carries an AI-assisted scenario, its hours, weeks, tool cost and plan. A total absolute difference reads 0 when the workbook matches the engine. If a reviewer changes an input, the differences move off 0, so the sheet also shows what an edit changed against the approved estimate.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_rom_engine_v1` flag.

- **Layer 4, products (ROM workbook, and the downloads built on it: the estimate workbook and the deck workbook):** one added sheet. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the Moves estimate engine is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_rom_engine_v1` (existing).

## Changes Included

- `src/lib/pricing/moves-workflow/rom-workbook.ts`: the Check sheet, and `layout.check`.
- `src/lib/pricing/moves-workflow/__tests__/rom-workbook.test.ts`:
  - the tab order;
  - one check per figure, with the differences summing to 0;
  - an edited input moves the sum off 0;
  - the scenario rows are checked.
- `src/app/api/v1/programs/[programId]/rom/preview/__tests__/route.test.ts`: the tab order.

## QA / Validation

- The ROM workbook suite re-evaluates every formula in the file from its formula text, including the Check sheet's, and compares each with its cached value. Every one agrees.
- Pricing, orchestrator, ROM route, deck route and mobilization-plan suites: 1,952 / 1,952 after the tab-order update. `npm run typecheck` clean.

## Rollout Plan

Merge after u657–u663 (this PR stacks on them), then ship in the next repo-owned ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: download an approved estimate's workbook and confirm Check totals 0.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Totals for weeks are not checked.** The Releases sheet holds no total-weeks cell. Every block's weeks are checked.

## Audit Evidence

- PR URL and CI run.
