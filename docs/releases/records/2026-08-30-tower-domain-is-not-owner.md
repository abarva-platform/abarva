# Tower — a domain is not a sponsor

## Release ID

`2026-08-30-tower-domain-is-not-owner`

## Status

`candidate`

## Plain-English Summary

"Where the money goes → By domain" renders a table headed **DOMAIN**. Every value in it was a
person's role: *Chief Data and AI Officer*, *CMIO*, *VP Enterprise Platforms*, *CISO*,
*VP Controller*. Those are sponsors, not domains.

The view model mapped `functionLabel` — the field the panel groups by — from `ownerRole`. Meanwhile
the Layer 4 loader writes a real `domain_name` onto the same display payload for every business
case. The field existed the whole time and was never read.

The consequence is a duplicated view rather than a wrong number: "By domain" grouped the portfolio
the same way "Decisions → By owner" already does, so a reader asking *which parts of the business
this money sits in* got an answer to *who answers for it* — a question already on screen elsewhere.
The headline "Chief Data and AI Officer holds 33% of the Tower-reviewed budget" was true, and was
not a domain statement.

The column now reads `domain_name`. There is deliberately **no fallback to the owner**: the panel
already renders "Domain not loaded" when a row carries no domain, and substituting the sponsor is
exactly what produced this.

## Layer Impact

Lane: `global-control-lane`. Layer 3 (serving reader) and the Tower product surface.

`domainName` is new on `TowerMartProgramLane`, read from `display.domain_name` in the program-lane
mapper. `functionLabel` on `TowerProgramLaneView` now sources from it. That field has exactly one
consumer, `BudgetDomainPanel` — the identically-named `functionLabel` used throughout
`src/lib/programs/expert-kernel` is an unrelated Function Pack label and is untouched.

Worth noting: the expert-kernel's version of the name holds values like *Revenue cycle* and
*Payer & claims operations*. The Tower field was always meant to hold a domain; it was wired to the
owner.

## Client Applicability

**All clients.** Every tenant reading Where the money goes → By domain. Not flagged, not
tenant-scoped. A tenant whose program rows carry no `domain_name` will see "Domain not loaded"
rather than a sponsor list — which is the correct reading of that state.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — map `domain_name` in the program-lane mapper.
- `src/lib/tower/current-layer-view-model.ts` — `domainName` on the mart lane type.
- `src/lib/tower/command-center/view-model.ts` — `functionLabel` sources from it, with no owner
  fallback.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — three guards, one of which pins the
  loader still writing `domain_name`.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 36/36, three new guards |
| Tower suites | PASS against baseline — 524 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. One additive field and one mapping; no value recalculated.

## Known Gaps

- **Not yet live-proven.** The DOMAIN column should list domains after deploy. If it lists
  "Domain not loaded" instead, `domain_name` is not reaching the program-lane display payload for
  this tenant and the loader is the next place to look — not the panel.
- **The RUN · CHANGE · TRANSFORM column on the same table renders empty for every row**, with no
  label saying why. Run and change are not loaded — the sibling sub-tab states this plainly
  ("The run/change budget shape is not fully loaded") — but this table leaves the column silently
  blank. Not addressed here; it needs the same honest-absence treatment.
- The row count reads "1 rows" for single-row domains.
- More broadly: the whole "Where the money goes" tab can answer very little. Run/change and
  capex/opex are absent from the projection, so the tab's own panels correctly report that they
  cannot split the budget. That is a data-coverage gap, not a rendering defect, and no code change
  fixes it.

## Audit Evidence

Found by reading the deployed page at revision serving `main` on 2026-08-30: a table headed DOMAIN
whose twelve values were all sponsor roles, matching the grouping already shown on Decisions → By
owner. The loader writes `domain_name` at
`scripts/tower/load-healthcare-demo-layer4-products.mjs:525`, inside the display payload passed to
`addProjectionRow` for `commandRows`.
