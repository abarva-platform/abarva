# 2026-09-28-c574-tower-dock-catalog-entry — the Tower aVa dock, catalogued as an uncovered AI surface

## Release ID

`2026-09-28-c574-tower-dock-catalog-entry`

## Status

`candidate`

## Plain-English Summary

The Tower page's aVa dock answers questions with AI-written prose and tables. A
test added under C-416 showed, by running it, that those answers reach the reader
with none of the five safeguards the AI-surface control catalog tracks: no
AI-assisted label, no evidence basis, no confidence, no statement that a person
must approve, and no missing-data caveat.

The catalog had no entry for this dock at all, so its gate counted none of that.
It reported every reachable control as covered — "35 of 35 (100%)" — while a
reachable AI answer carried no controls.

This change adds the missing entry and declares all five controls as **not
covered**, each with the reason C-416 measured. The gate now reports
"35 of 40 (87.5%)" and names the five dock controls in its roster of controls with
no behavioral test. That lower figure is the accurate one. Nothing in the product
changed. Whether the dock should turn its review chrome on, or pass its citations
through, is an open owner decision and is not taken here.

## Layer Impact

Release lane: **`global-control-lane`** — shared catalog and CI bookkeeping, not
gated to any client or flag.

- **Products** — Tower. Catalog and tests only; no product file changed.
- **Canonical model / Client intake / Source adapters** — not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — control catalog and CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/security/ai-surface-control-catalog.json`
  - New `controls[]` entry `tower-command-center-ava-dock` on
    `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`
    (route-reachable). Five controls — `ai-label`, `citation`, `confidence`,
    `human-approval-gate`, `risk-caveat` — each `behavioralTest.status: "none"`
    with a reason citing the C-416 measurement and its mutation evidence.
    `knownSuites` is the 14 test files the audit derives from the tree.
    The evidence tokens locate the code that decides each control's state on this
    surface (the `variant="focused"` mount, the answer packet builder, the
    opener's partial clause), and each reason says in words that they are not a
    rendered control.
  - The two `generated-ui|Tower|aVa Command Center chat opener` claim rows
    (citation, confidence) now resolve to exactly this surface, so the gate
    requires their `surfaceId`. Both stay `deferred`, with reasons naming the
    measured absence and the decision they wait on.
- `src/__tests__/behaviors/c574-tower-dock-catalog-entry.test.ts` — new. Four
  cases: the entry is on the shell and route-reachable; it claims no coverage;
  the live audit passes and names all five as uncovered on a screen; and a
  counterfactual catalog without the entry reports exactly five fewer declared,
  reachable and uncovered controls.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — the pinned per-bucket
  split of claim rows moves 21/14/2 → 21/12/4 because the two rows above re-joined.
  Updated with the reason in the case's own comment; `coveredWithSurfaceId` is
  unmoved.

## QA / Validation

- **Audit, before and after.** `npm run audit:ai-surface-controls` on base
  `8eb691121f`: 23 surfaces, 44 declared, 35 of 35 reachable covered, 5 of 44
  uncovered. On this branch: 24 surfaces, 49 declared, 35 of 40 reachable covered,
  10 of 49 uncovered. Uncovered rose by exactly the five controls declared.
- **Failing test first.** The new suite on the base catalog: 4 failed of 4. With
  the entry: 4 passed.
- **Mutations of the entry, each confirmed by `git diff --numstat` to change the
  catalog first:** declared `routeReachable: false` → 3 failed, 1 passed; one
  control removed → 4 failed; a re-joined claim row flipped to `covered` → 3
  failed, 1 passed. Catalog restored after each.
- **Same scope, clean baseline from a separate worktree at `8eb691121f`:** every
  suite that reads the catalog (32), 32 passed / 455 tests. On this branch the
  same 32 plus the new suite, 33 passed / 457 tests. The two-row drop inside the
  existing suites is `catalog-claim-binding`'s per-row "declares the join state"
  case, which iterates rows without a `surfaceId`; the two re-joined rows left
  that set and are now checked by the gate's `surfaceId` join instead.
- `tsc --noEmit` exit 0. ESLint clean on both test files.
- **Coverage floor:** the new suite imports no `src` module; it runs the audit
  script as a child process and reads JSON, so it adds no instrumented code to the
  `Behavior coverage floor` denominator.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as for
any merge; the runtime is unaffected in behaviour because no product file changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none added.
- Approved image digest: whatever the merge deploy produces; no runtime change.
- ACA runtime invariant: verified after merge as for any merge.
- Worker image invariant: as above.
- Feature/env flag update path: none.
- Live signed-in proof required: no — no product surface changed.

## Rollback Plan

Revert the squash commit. The entry disappears, the two claim rows return to
`uncatalogued`, and the pinned split returns to 21/14/2. No data or runtime state
is involved.

## Audit Evidence

- The pull request and its `AI surface control catalog` and behavior check runs.
- `docs/security/control-measurements/c416-tower-shell-brief-controls.md` — the
  measurement each reason cites.

## Known Gaps

- **The owner decision is not taken.** Turning the dock's review chrome on (the
  `variant` prop) and forwarding the answer packet's citations and caveats are
  visible changes to the Tower design and are out of scope here.
- **The two catalog entries overlap.** `tower-atlas-program-pressure-brief` still
  declares the same five controls on an unmounted component. Whether that entry
  retires in favour of this one is part of the same open decision (C-416).
