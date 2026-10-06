# 2026-09-18-qa-inventory-claims-gate - A Checklist That Names A Surface Nobody Can Open

## Release ID

`2026-09-18-qa-inventory-claims-gate`

## Status

`candidate`

## Plain-English Summary

`src/lib/qa/*.ts` holds the route-ownership maps, smoke inventories and demo
checklists a person uses to decide what to open and verify. **Twenty-four
entries across seven of those files name a component no route can reach.**

A reader following one of them performs a check that cannot be performed, and
nothing tells them: the file reads like an authority. The sharpest case —
`founder-demo-route-checklist.ts` lists `tower/ProgramPressureCards.tsx` as the
component the Tower route renders, with `validationStatus: "ready"` and
`readinessCaveat: "None"`. The Tower route renders
`TowerCommandCenterAvaShell`; nothing imports the pressure cards.

This adds a gate that refuses a **new** such claim, with the existing 24 listed
by name and claiming file so each is visible and has to be resolved
deliberately.

## Layer Impact

Audit tooling and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## How this arrived — and what the item got wrong

Backlog item 28 says "nine Source components unreachable from any route …
**the route-ownership map still claims one of them**".

Verified against `main` first, per the standing rule:

- The nine Source components are unreachable, and are already baselined and
  gated by the route-reachability audit.
- `active-route-ownership-map.ts` — the file the item names — contains **zero**
  component paths, so it cannot be claiming one.
- None of the nine appears in any QA file.
- But running the general check found **24 stale claims in 7 other QA files**,
  none of them the nine, and none of them the file named.

So the item was right that the class exists, wrong about the file, wrong about
the components, and wrong about the count by a factor of twenty-four. The
generalisation is what was worth building.

## What the gate refuses

- A **new** QA entry naming a component in the orphan baseline.
- A stale claim that has been resolved but left in the exception list — the
  list has to shrink honestly rather than drift.
- **Emptying the exception list to silence it.** Doing that surfaces all 24
  rather than passing. Item 28's acceptance says "do not extend the baseline to
  silence the guard"; this is the structural version of that instruction.

## Changes Included

- `scripts/audit/qa-inventory-claims-check.mjs`
- `docs/architecture/qa-inventory-stale-claims.json` — the 24, by file
- `.github/workflows/architecture-boundary.yml` — runs it
- `package.json` — `audit:qa-inventory-claims`
- `docs/architecture/ci-gate-registry.json` — classified `pr-gate`

## QA / Validation

Three mutations, each applied and reverted:

| Mutation | Result |
|---|---|
| A QA inventory starts naming another unreachable component | caught, named the file and component |
| The known list names a claim no longer made | caught, asks for a refresh |
| The exception list is emptied to silence the gate | caught — reports all 24 |

Status: **pass**.

- `npm run audit:qa-inventory-claims`: **exit 0** — `24 name an unreachable
  component (24 known)`. Status: **pass**.
- Every step of the `architecture-boundary` job run locally —
  `audit:architecture-boundaries`, `audit:route-reachability`,
  `audit:ci-gate-registry`, `audit:enterprise-naming`, `audit:agent-substrate`,
  `audit:nexus-navigation`, `audit:qa-inventory-claims`: **all exit 0**.
  Status: **pass**.
- ESLint and `release-check`: see Audit Evidence, captured as exit statuses.
- No TypeScript changed.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required.

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

PR link, the three mutation results, and `qa-inventory-stale-claims.json`.

## Known Gaps

- **The 24 are recorded, not fixed.** Each needs the same determination: which
  component does that route actually render? That is 24 architecture questions,
  not a sweep, and guessing would put a different wrong answer in an
  authoritative file.
- The check matches `src/components/...` path literals. A QA file naming a
  component by symbol rather than path is not covered.
- Reachability comes from the orphan baseline, so a component wrongly baselined
  would produce a false claim here too.
- This does not verify that a QA file names the **right** component — only that
  the one it names can be reached.
