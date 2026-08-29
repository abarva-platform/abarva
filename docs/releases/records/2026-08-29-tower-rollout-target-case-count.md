# Tower — read the rollout's adoption target and supported-case count

## Release ID

`2026-08-29-tower-rollout-target-case-count`

## Status

`candidate`

## Plain-English Summary

The Tools table showed three things as absent that were sitting on the row all along.

Each tool rollout is written with an adoption target (`adoption_target_pct`), the seats it was
sized for (`rollout_target_users`), and the number of business cases it supports
(`linked_business_case_count`). The panel read none of them.

Instead it:

- hardcoded the count of loaded targets to zero, which made the "below their own target" headline
  unreachable — the panel could only ever report that targets were not loaded, whatever the data
  held;
- printed a fixed `vs Not loaded` after every adoption reading, denying a target that exists;
- counted supported cases by matching vendor and system **name strings** across other rows, which
  is not a relationship. It also returned zero for every row, so the column rendered `Not loaded`
  on all thirteen.

All three now read the asserted fields. The headline derives both of its branches. The bar draws
the target where it actually falls, so the gap is the thing you read, and turns from amber to teal
when a rollout clears its own target. The table sorts by shortfall against target — worst first —
rather than by raw adoption, which is the question the column asks.

## Layer Impact

Lane: `global-control-lane`. Layers 3 (serving reader) and 4 (product projection).

`adoptionTargetPct` and `linkedBusinessCaseCount` are new on `TowerMartAiPortfolioItem` and
`TowerAiView`, mapped in `readTowerCommandCenter.mapAiItem` from payload fields the Layer 4 loader
already writes. No loader, migration, or data change — the values were already in the projection.
No product owns these fields; the panel is a projection of Layer 3, as before.

## Client Applicability

**All clients.** Every tenant whose Tower projection carries tool rollouts receives this change on
the next `main` deploy. It is not flagged and not tenant-scoped. Tenants with no tool rollouts see no difference:
the panel's empty state is unchanged. Verified against the healthcare demo tenant, which carries
thirteen rollouts.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — map `adoption_target_pct` and
  `linked_business_case_count`.
- `src/lib/tower/current-layer-view-model.ts`, `src/lib/tower/command-center/types.ts`,
  `src/lib/tower/command-center/view-model.ts` — carry both fields to the view.
- `src/components/tower/command-center/views/ToolsTablePanel.tsx` — derive the headline, draw the
  target marker, sort by shortfall, drop the vendor-name join.
- `src/lib/tower/command-center/__fixtures__/design-fixture.ts` — assert targets on six of eight
  rollouts, none on two.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 18/18, including four new guards |
| Tower suites | PASS against baseline — 506 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Guard mutation test | PASS — reintroducing `const loadedTargets = 0` and a literal `Not loaded` target label fails 2 guards; restored, 18/18 |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

The design fixture now asserts targets on six of eight rollouts and none on two, so it exercises
both headline branches. It previously could not: the branch was unreachable in code, so no fixture
could have reached it.

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no
env change, no data build. Nothing to sequence.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned as usual. No ad-hoc
`az` command, no shared-traffic mutation from this branch, no ACR build outside the workflow.

## Rollback Plan

Revert the commit. The two fields are additive and nothing outside this panel reads them, so the
revert restores the prior render exactly. No data or migration to unwind.

## Known Gaps

- **Not yet live-proven.** The headline will change from "13 tool rollouts have usage; adoption
  targets are not loaded" to a below-target count once deployed. The exact count is unknown until
  then, because the panel has never read these values.
- The `Users` column still shows active users only. Licensed seats reach the reader as the
  denominator of the adoption rate but are not surfaced as their own number.
- `fundingStatus` still resolves `funding_status ?? finance_status ?? review_state`, which on a
  tool rollout is the rollout stage. Unchanged here and still worth reading carefully at any new
  call site.

## Audit Evidence

Found by reading the deployed page at revision `ca-abarva-web-lab-eastus--m4a97e6af`: thirteen
rollout rows each reading `58% vs Not loaded` with a `Not loaded` case count, against a loader that
writes both values on every one of those rows (`scripts/tower/load-healthcare-demo-layer4-products.mjs`
lines 834-837, 865).
