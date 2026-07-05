# 2026-07-05-home-dimension-tabs-v7 — Home Context Explorer dimension tabs made data-true

## Release ID

`2026-07-05-home-dimension-tabs-v7`

## Status

`candidate`

## Plain-English Summary

On the Home Context Explorer, when a user picks a context area (e.g. Business
Functions, Applications & Systems) the detail panel has four tabs: Summary,
Data, Gaps, Questions. Three of them were misleading:

1. **Summary was identical for every dimension.** It read from a hardcoded copy
   table keyed by the older V6 dimension names. The live surface is served from
   the V7 pack, whose dimension labels differ, so 22 of 24 dimensions fell
   through to generic default text that never described the specific area.
2. **Data and Gaps numbers were computed from only the first ~12 preview rows**
   but displayed against the full loaded row count — so the "evidence gaps"
   figure was a sample artifact (the same number recurred across unrelated
   dimensions), and the table showed 8 rows without saying it was a preview.
3. **The Questions tab was a non-interactive duplicate** of a list already shown
   on the Summary tab.

This change makes the Summary describe the actual loaded slice (record count,
source files, readable field names, example entities) whenever there is no
curated copy; computes evidence-gap posture over the **full** dimension in SQL;
labels the Data preview honestly ("first X of Y rows"); stops the currency
formatter from rendering non-money numeric columns as dollars; and makes the
Questions tab click-to-ask against aVa.

## Layer Impact

- `global-control-lane`: shared Home surface behavior for all tenants. This is a
  read-model/presentation change in `HomeSurface.tsx` and the V7 read adapter
  `v7-context-browser.ts`. No schema, RLS, or write-path changes.

## Client Applicability

State exactly who receives the change.

- All clients: Yes — every tenant whose Home reads the V7 context pack (falls
  back safely to V6 dataset packs).
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None (not flag-gated; behavior is strictly more accurate).

## Changes Included

- `src/lib/home/v7-context-browser.ts`: adds a full-dimension evidence-gap
  aggregate (`jsonb_each_text`) and uses it for `dataThinCells` / `knownGaps`,
  falling back to the preview sample only when the aggregate returns nothing.
- `src/components/home/HomeSurface.tsx`: data-derived Summary spec when no
  curated dimension spec matches; honest "first X of Y rows" preview caption;
  tightened currency heuristic; interactive Questions tab.
- `src/components/home/__tests__/HomeSurface.test.tsx`: new coverage for the
  V7 data-derived summary and the click-to-ask Questions tab.

## QA / Validation

- `npx jest src/components/home/__tests__/HomeSurface.test.tsx src/lib/home/__tests__/v7-context-browser.test.ts` → 7 + 1 passing (all suites green).
- `npx eslint` on all three changed files → clean.
- `npx tsc --noEmit -p tsconfig.json` → 0 errors.
- Live signed-in QA on `https://app.abarva.ai/home` after ACA deploy (per
  Deployment Authority below).

## Rollout Plan

Merge to `main`, then Azure Container Apps image build/deploy to
`ca-abarva-web-lab-eastus` from the exact merge SHA per
`docs/runbooks/azure-container-apps-deploy.md`, then move 100% ingress to the
new healthy revision.

## Deployment Authority

- Repo-owned deploy workflow: ACA deploy runbook (manual `az acr build` + `az containerapp update`).
- Shared runtime mutators: none (no worker/job/migration changes).
- Approved image digest: recorded at deploy time from `az containerapp show`.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% only after `healthState` is healthy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — verify Home dimension tabs on `app.abarva.ai` with an approved user.

## Rollback Plan

ACA traffic operation: move 100% ingress back to the prior healthy revision via
`az containerapp ingress traffic set`. No migrations to reverse.

## Audit Evidence

- PR URL (to be added on open).
- CI checks: jest + eslint + tsc results above.
- Deployment: `az containerapp show` revision/image/traffic JSON at deploy time.
- Live smoke: `curl -sI https://app.abarva.ai/home` + signed-in browser check.

## Known Gaps

- The evidence-gap definition still counts any blank/`needs evidence` cell as a
  gap; a per-dimension required-field contract (so optional blanks are not
  counted) is a separate follow-up.
- Curated per-dimension narrative copy still exists only for `Enterprise
  Profile` and `Vendors & Contracts`; all other dimensions now use the
  data-derived summary rather than curated prose.
