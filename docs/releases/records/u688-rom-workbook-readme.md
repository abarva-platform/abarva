# u688 — The ROM workbook opens on a README

## Release ID

`2026-10-17-moves-rom-workbook-readme`

## Status

`candidate`

## Plain-English Summary

The P3 delivery estimate downloads as a live-formula ROM workbook. Unlike the P4 financial model, the P5 mobilization plan and the synthetic golden P3 estimate, it opened straight onto formulas, with no page that says how to read it. The same workbook also forms the front of the investment deck's companion workbook.

It now opens on a README that says:

- what the workbook is;
- what each sheet holds, naming every sheet the file contains, including the AI-assisted scenario sheet only when there is one;
- the units: paid hours, and money in whole cents;
- what happens when an input changes, and that the Check sheet then shows the distance from the approved engine figures;
- the rate status, matching the Assumptions sheet: "planning rates, not approved" whenever any role is priced on the starter bands;
- what the estimate covers: the listed components, and nothing else (for example, no run cost after go-live, internal time or licences);
- when present, that the AI-assisted scenario is a comparison and not the funding basis.

No figure or formula changes. The rate status logic is shared with the Assumptions sheet, so the two cannot disagree.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves ROM workbook download, investment deck companion workbook):** one text sheet. No data, route or flag change.

## Client Applicability

- **All clients:** wherever the ROM workbook is offered.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/pricing/moves-workflow/rom-workbook.ts`: the README sheet, first in order. The `planningRates` value is shared with the Assumptions sheet.
- `src/lib/pricing/moves-workflow/__tests__/rom-workbook.test.ts`:
  - sheet order;
  - README rows;
  - every sheet named;
  - the rate line agrees with Assumptions;
  - the scenario lines appear only with a scenario.
- `src/app/api/v1/programs/[programId]/rom/preview/__tests__/route.test.ts`: sheet order.

## QA / Validation

- ROM workbook and ROM route suites: pass, 37 / 37.
- Mutation testing: 5 / 5 killed:
  - rate line inverted;
  - scenario line always present;
  - scenario sheet unnamed;
  - Check sheet unnamed;
  - README not added.
- Orchestrator, pricing, programs and programs API suites: pass, 621 suites, 10143 tests. One transient failure in a first run did not recur.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The live walk's investment companion workbook shows the README when the demo Move has an approved estimate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: a ROM workbook download from P3 Step 4.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **No separate Sources sheet.** The Assumptions sheet already records a source for every program factor, and Pod & Rates records one for every rate. A second list would repeat them.

## Audit Evidence

- PR URL and CI run.
