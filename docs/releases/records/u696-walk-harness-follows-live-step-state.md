# u696 — The live walk follows the step state a signed-in user leaves behind

## Release ID

`2026-10-17-moves-walk-harness-follows-live-step-state`

## Status

`candidate`

## Plain-English Summary

The post-deploy step-page walk dropped from 19 to 18 passing pages after a merge that touched no Moves code. Nothing in the product regressed. Two things a signed-in user did in the app between walks made two harness assumptions false:

- **The root-cause order was confirmed.** The walk's reachability check looked for the "Confirm this order" button. After confirmation the ranked list's foot shows "Order confirmed by …" and the button is gone, so the check failed on a correct page.
- **The ROM estimate's inputs became complete.** The estimate step then asks the ROM preview route to price them. That route is a POST, and the walk aborts every POST as a write. The route computes and writes nothing (no estimate, deliverable or capture value), so the abort failed a correct page and left the estimate unpriced in the screenshots.

Two harness changes:
- The reachability target is the ranked list's foot in either state: the confirm button, or the sentence naming who confirmed the order.
- The write guard lets through exactly one compute-only POST: the ROM preview's JSON path, with no query string. The workbook variant (`?format=xlsx`) and every other non-GET request are still aborted and reported as blocked writes.

## Layer Impact

Release lane: `global-control-lane`.

- **Test harness only (Moves live walk):** `tests/e2e/moves-step-pages-live-walk.spec.ts`. No product, data, route or flag change.

## Client Applicability

- **All clients:** none; the walk is a read-only check against the synthetic demo Move.
- **Specific clients:** none.
- **Internal only:** yes (CI evidence).
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `tests/e2e/moves-step-pages-live-walk.spec.ts`:
  - `checkRootCauseWorkReachability` accepts either state of the ranked list's foot;
  - `isReadOnlyPost` and its use in the write guard;
  - a fixture test for the confirmed-order foot;
  - a test pinning which requests the guard lets through.

## QA / Validation

- Fixture tests: pass, 3 / 3 (existing unconfirmed-order case, new confirmed-order case, write-guard allowance).
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass.
- Live walk: NOT RUN locally (needs the signed-in CI secrets); the next post-deploy walk is the proof.

## Rollout Plan

Takes effect on the next post-deploy walk. Expect the root-cause and ROM estimate pages to pass again unless a product defect remains; their UX scores are reported separately.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this PR's content.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's root-cause and ROM estimate rows.

## Rollback Plan

Revert the squash commit.

## Known Gaps

- **The allowance trusts the route's documented contract.** If the ROM preview route ever starts writing, the walk would not catch it; the route states in its header that it writes nothing.
- **UX scorer findings are unchanged.** The walk still reports next-action and figure-source findings on some P2/P3 pages; those are scored, not pass/fail.

## Audit Evidence

- PR URL and CI run; walk 39036531343's proof rows for the two pages.
