# 2026-09-18-control-catalog-route-reachability - A Control Has To Be On A Screen

## Release ID

`2026-09-18-control-catalog-route-reachability`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog proved two things about every control it declares:
the code exists (evidence tokens), and — since the previous change — a behavioral
test exercises it in CI. Neither of those proves a route mounts the file.

Three of the eighteen cataloged surfaces are components **no route imports**.
Between them they carry **8 of the 37 declared controls**. One of the three had a
behavioral test running in CI on every PR, rendering the component in isolation
and asserting its disclosures — for a component no signed-in user can open.

This change makes the catalog ask the third question. It walks the import graph
from the app's route entry points, and a surface no route reaches must say so,
with a reason naming what would put it on a screen. Those controls are then
excluded from the coverage count instead of inflating it.

Honest numbers: **21 of 37 covered, 8 of 37 on no screen at all.**

## Layer Impact

Audit tooling only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/audit/lib/route-reachability.mjs`: the import-graph walk, lifted out of
  the Source orphan audit so both audits answer "can a user reach this?" the same
  way. One behavior change while lifting it: a bare side-effect import
  (`import "@/lib/agent/tools/program/advancePhase";`) is now followed. The
  previous patterns required a `from`, so a registered agent tool read as
  unreachable while a route imported it precisely to register it.
- `scripts/audit/source-canvas-reachability.mjs`: uses the shared walk. Output is
  byte-identical before and after, including the nine pre-existing new orphans it
  already reports.
- `scripts/audit/ai-surface-control-catalog.mjs`: fails on an undeclared
  unreachable surface, on a stale `routeReachable: false` claim for a file that is
  reachable, and on a reason too thin to act on. Reports unreachable controls on
  their own line.
- `docs/security/ai-surface-control-catalog.json`: the three unreachable surfaces
  declared, each with what would fix it.

## The three surfaces

**Tower Atlas program pressure brief** (`src/components/tower/ProgramPressureCards.tsx`)
— 5 controls, the largest single entry in the catalog. The Tower route renders
`TowerCommandCenterAvaShell`; nothing imports `ProgramPressureCards`. Two QA
inventories still name it as the component that route renders, one of them with
`validationStatus: "ready"` and no caveat. Its integration test reads the file as
**source text** and asserts on strings rather than rendering it, so it passes on a
component nothing mounts.

**Source admin event approval queue** (`AdminSourceEventApprovalQueue.tsx`)
— 2 controls. Already recorded in `docs/architecture/source-canvas-orphans.json`.
Its behavioral test has been running in this catalog's CI job since earlier today.

**Source estimate assumption disclosure** (`EstimateAssumptionDisclosure.tsx`)
— 1 control. Already in the same orphan baseline; its only importer is its own
test. Every Source estimate a user sees today renders without it.

None of the three is fixed here — mounting or retiring each is a product decision,
not an audit one. What changes is that the catalog now states it instead of
counting them as controls the product has.

## QA / Validation

Four mutations, each applied and reverted:

| Mutation | Result |
|---|---|
| An unreachable surface stops declaring it | caught |
| A reachable surface claims to be unreachable | caught |
| An unreachable surface with a one-word reason | caught |
| The agent route drops the side-effect import that registers its tool | caught |

All four fail the checker with a message naming the surface. Status: **pass**.

Restored: checker **exit 0** — `18 surfaces, 37 declared controls, 631 route entry
points`, `21 of 37` covered, `8 of 37` on no screen. Status: **pass**.

`source-canvas-reachability.mjs` output **byte-identical** before and after the
refactor, verified by diff. Status: **pass**. (It exits 1 both times: nine new
Source orphans predate this change and are untouched by it.)

`npx eslint` on the changed and new scripts: **exit 0**. `release-check`: **exit 0**
— captured as exit statuses, not read off a pipe. No TypeScript changed.

Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required; it rides the next ACA
main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the checker's three summary lines, the four mutation results, and the
before/after diff of the Source reachability output.

## Known Gaps

- The three unreachable surfaces are declared, not fixed. Each needs a decision:
  mount it, or retire the entry and catalog whatever replaced it.
- `routeReachable: false` is an escape hatch. It is visible, counted, and requires
  a reason, but a future surface could use it to stay uncounted indefinitely.
  Nothing here expires those declarations.
- The walk is static. A component mounted only through a runtime registry keyed by
  string, or by a dynamic import built from a variable, would read as unreachable.
  None of the eighteen surfaces is mounted that way today.
- Reachable from a route is not the same as rendered on a screen: a component
  imported behind a permanently false condition would still count as reachable.
