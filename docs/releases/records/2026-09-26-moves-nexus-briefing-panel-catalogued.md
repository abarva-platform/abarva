# 2026-09-26-moves-nexus-briefing-panel-catalogued — A second uncatalogued AI surface, catalogued honestly as one no route reaches

## Release ID

`2026-09-26-moves-nexus-briefing-panel-catalogued`

## Status

`candidate`

## Plain-English Summary

`docs/security/ai-surface-control-catalog.json` answers "which AI disclosure control is proven on
which surface". A previous change made the gap countable: every `catalogClaimCoverage` row now carries
a join, and the rows whose declared code path is in the tree with no `controls[]` entry naming it are
measured as `uncatalogued`. That count was **13**, then **10** after the first surface was catalogued.

This change closes one more, and deliberately only one, because each is a judgement about what a
surface actually guarantees and a batch of them is a diff nobody reads.

The surface taken is the **Moves Nexus current-state briefing panel**
(`src/components/strategic-moves/NexusCurrentStateBriefingPanel.tsx`). It was singled out in the
previous change's Known Gaps as the hardest of the eight, and as a *different kind* of work, for one
reason: both controls its legal row claims are real, running code, and **no module imports the
file**, so no route reaches it. Cataloguing it therefore cannot be an assertion that a user sees
anything. It is an entry with `routeReachable: false` and a reason the gate re-measures against the
tree.

`uncatalogued` goes from **10 rows across 8 surfaces to 8 rows across 7 surfaces**. Both of this
surface's rows leave the state, and they leave it in the same direction, which is worth reporting
per row rather than as a count:

| control kind | new state | what the surface actually does |
|---|---|---|
| `citation` | `covered`, `surfaceId` | Each section resolves every cited id to that citation's label through the briefing's own citation list rather than echoing the raw id, carries the citation's source basis on the chip, and an answer renders the labels it cites. |
| `confidence` | `covered`, `surfaceId` | An answer states the confidence it carries next to the answer text, and renders no confidence line before an answer exists. |

### `covered` here does not mean a user sees it, and the catalog says so in the arithmetic

This is the part that would be dishonest if it were glossed. `covered` means the legal claim is bound
to a catalogued surface whose controls are pinned to evidence tokens in comment-stripped source and
to a behavioural suite the catalog's own CI job runs. It does not mean the control is on a screen.
The audit reports that separately and correctly, because `routeReachable: false` puts both new
controls in the not-on-any-screen bucket instead of the coverage figure:

- surfaces 22 → **23**; declared controls 42 → **44**
- behavioural coverage of reachable controls **35 of 35 (100%)** — unchanged, because neither new
  control is reachable
- not on any screen 7 of 42 → **9 of 44**

A behavioural suite that is green over an unmounted component reads exactly like one green over a
live component, and only the reachability field tells them apart. That sentence is in the suite's own
header, not only here.

### Why wire a CI step for a component nothing mounts

Because "a test the job does not run proves nothing" applies whether or not a route reaches the
component, and because the day something mounts this panel is the day the two controls have to hold.
`src/components/strategic-moves/__tests__` is not swept by any job — its suites are listed by exact
path — so a new suite there runs nowhere unless it is named.

## Layer Impact

Release lane: `internal-admin`. An AbarVa-only audit document, a CI job, and tests. No client-visible
behaviour ships with it.

- **Layer 1–3 (intake, adapters, canonical model):** none.
- **Layer 4 — Products:** none. `NexusCurrentStateBriefingPanel.tsx` is **not modified**; it is
  described. No route, component, tenant read path or rendered output changes. The panel is not
  mounted by this release either — whether to mount it is a product decision this change explicitly
  does not take, and the entry's `unreachableReason` states what mounting it would settle.
- **Governance/control plane:** `controls[]` gains one surface with two controls; two coverage rows
  move from `surfaceJoin: uncatalogued` to `surfaceId` + `covered`; the catalog CI job gains one jest
  step; one behaviours suite and the CI-coverage census are updated.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — an audit document, a CI job and tests
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/security/ai-surface-control-catalog.json` — new `controls[]` entry
  `moves-nexus-current-state-briefing-panel` (`citation`, `confidence`), `routeReachable: false` with
  a re-measured reason; the two `generated-ui|Moves|Nexus current-state briefing panel` rows re-joined
  by `surfaceId`.
- `src/components/strategic-moves/__tests__/NexusCurrentStateBriefingPanel.controls.test.tsx` — new.
  Six cases; each control asserted separately, including the negative that no confidence line renders
  before an answer exists, so the disclosure cannot be a constant.
- `.github/workflows/ai-surface-control-catalog.yml` — runs that suite, by exact path.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — the per-bucket tally, and the two
  `uncatalogued` directions repointed (see below).
- `docs/architecture/test-ci-coverage-census.json` — regenerated by
  `npm run audit:test-ci-coverage:write`.

### Fixing the defect would have retired the guard that proved it

The tally suite used this very row as its live fixture for two negative directions — "goes red when a
deferred row names no join at all" and "goes red when a row claims retired and its code path is in
the tree" — because it was the catalog's example of a real `uncatalogued` row. Cataloguing the surface
makes that row `covered`, so both cases would have been set up on a state that no longer exists.

Neither case was deleted or weakened. They now **reconstruct** the pre-change state in the fixture: a
`decatalogue()` helper removes the new `controls[]` entry and puts the row back to
`deferred` + `surfaceJoin: uncatalogued`, which is what the repository then measures. Repointing them
at whichever row is still uncatalogued today was rejected for a second reason as well as staleness:
once the last of the remaining eight is catalogued, a fixture pinned to a live uncatalogued row
inverts into a case that can only be set up while the repository is still broken.

## QA / Validation

**Re-verified on `origin/main` `7faac8f45` before writing code.** 37 coverage rows: 21 with a
`surfaceId`, 4 `retired`, 2 `ambiguous`, **10 `uncatalogued`** across 8 surfaces. The filed
before-state holds exactly. The unmounted premise was re-derived rather than taken from the earlier
record: the panel's only importer was removed when the old Moves phase shell was sunset, and no
product file imports it on this commit.

**Clean baseline, same scope.** Measured with this change's four edited/added files reverted to
`origin/main` in the same checkout: `npm run test:behaviors` was **143 suites, 1522 of 1522 passing,
0 failing**. After: **143 suites, 1520 of 1520 passing, 0 failing**. So **0 failing before, 0 after**.

The −2 cases are not lost coverage and are recorded rather than smoothed. `catalog-claim-binding` runs
one `it.each` over rows *without* a `surfaceId`; the two rows this change binds leave that set and are
picked up instead by the covered-row assertions and by the surface's own gate checks. All 14 `it(`
blocks in that file are intact — the count is identical to `origin/main`.

**Census drift, measured rather than assumed.** `scripts/quality/test-ci-coverage-census.mjs --check`
reported `testFiles 2502 -> 2503 (+1); coveredTestFiles 2057 -> 2058 (+1)`. With the new suite moved
aside in the same checkout the check reported "committed census matches this run", so the +1/+1 is
this change's one wired suite and nothing inherited.

**The catalog gate, in both directions, per the item's requirement:**

1. With the `controls[]` entry added and the two rows still carrying `surfaceJoin`, the gate fails
   naming each row and the `surfaceId` it must now carry — exactly 2 findings, one per row.
2. Bound correctly, it passes: 23 surfaces (was 22), 44 declared controls (was 42), behavioural
   coverage 35 of 35 reachable (unchanged), not on any screen 9 of 44 (was 7 of 42).
3. With the `title={citationsById.get(id)?.sourceBasis}` evidence token removed from the surface:
   `missing evidence token "citationsById.get(id)?.sourceBasis"`.
4. With the confidence line's evidence token left **only inside a JSX comment** — the precise
   gate-evasion this catalog exists against: `evidence token "Answer · confidence
   {answer.confidence}" appears only in a comment … the control must be code that runs`.
5. With the new workflow step's command replaced by `echo skipped`: both controls fail with
   `behavioral test … is never run by .github/workflows/ai-surface-control-catalog.yml`.
6. With one repo path in `unreachableReason` changed to a file that does not exist: `unreachableReason
   names docs/architecture/… which is not in the tree`. The reason's clauses are re-measured, not
   merely counted for length.
7. **The direction that matters most for an entry like this: it cannot outlive its subject.** With a
   single import of the panel added to the route-reachable
   `src/app/(maestro)/strategic-moves/[moveId]/page.tsx`, the gate fails: `declares routeReachable
   false, but src/components/strategic-moves/NexusCurrentStateBriefingPanel.tsx is reachable from a
   route — the claim is stale`. So the day anything mounts this panel, the entry is forced to be
   rewritten rather than left asserting a `routeReachable: false` that stopped being true. The import
   was removed afterwards; `git status` is clean over that file.

**The behavioural test, proved able to fail.** Four mutations of the surface, each reverted after
measuring; each killed the right cases and only those:

| mutation | result |
|---|---|
| section chip renders the raw id instead of the citation label | 2 of 6 failed — both section-citation cases, which is correct: the second case locates the chip by its label |
| `title={citationsById.get(id)?.sourceBasis}` deleted | 1 of 6 failed — `carries each citation source basis on the rendered chip` |
| the `Answer · confidence {answer.confidence}` line stripped to `Answer` | 2 of 6 failed — both confidence cases |
| an answer's `Cites:` line renders raw ids instead of labels | 1 of 6 failed — `renders the labels an answer cites alongside the answer` |

`src/components/strategic-moves/NexusCurrentStateBriefingPanel.tsx` is byte-identical to
`origin/main` afterwards; `git diff` over it is empty.

**The two reconstructed directions, proved decisive against the gate rather than against the
fixture.** A fixture that reconstructs a state proves nothing unless the state it reconstructs is
still checked, so each was measured by blinding the gate branch it depends on — not by editing the
test:

| gate branch blinded | result |
|---|---|
| `join.state !== measured.state` | 2 of 67 failed, including `goes red when a row claims retired and its code path is in the tree` |
| `!entry.surfaceId && !join` | 1 of 67 failed — `goes red when a deferred row names no join at all` |

`scripts/audit/ai-surface-control-catalog.mjs` is unmodified by this release.

**Suites:**

- `NexusCurrentStateBriefingPanel.controls.test.tsx` — 6 of 6.
- With `catalog-claim-binding.test.ts` — 73 of 73.
- `npm run test:behaviors` — 143 suites, 1520 of 1520, 0 failing.
- `npm run audit:ai-surface-controls` — passes.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — no drift, shape matches.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0
  diagnostics. The exit code is judged, not grepped: a bare `npx tsc --noEmit` exits 134 on the
  operator host with no output at all, which a grep for `error TS` reads as clean.
- `npx eslint` over both changed test files — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: no route, image, flag, environment variable or worker job
changes. The new CI step runs on the next pull request that touches the control catalog's triggers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is part of this release.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unaffected; nothing here alters a Container App template.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. This release changes an audit document, a CI job and tests.
  It renders nothing, reads no tenant data, and the surface it describes is not mounted.

## Rollback Plan

Revert the commit. The catalog returns to 22 surfaces and the two rows to `uncatalogued`; the gate
passes in that state, as it does today. No migration, no data, nothing to unwind.

## Audit Evidence

- The pull request and its CI run.
- `npm run audit:ai-surface-controls` output, before and after.
- The four-mutation table and the two gate-blinding rows above, each reproducible by the named edit.
- `docs/architecture/test-ci-coverage-census.json`, with the moved-aside measurement that attributes
  its delta.

## Known Gaps

- **8 `uncatalogued` rows remain, across 7 surfaces.** Carried by the same item. With the reason each
  was not taken here, re-measured on this commit rather than copied forward:
  - Two are `redirect()` shims of 17 and 13 lines that render nothing (Source artifact-provenance and
    scorecard). Whether a redirect shim counts as retired is a change to the resolver or a correction
    to the legal catalog's declared path — a decision, not a repair.
  - Four have **no control of the claimed kind in code** at all (Source commercial summary
    `confidence`; Setup guidance and readiness drill-down `confidence`; Atlas synthesis API response
    `citation`, where the count is telemetry and the response carries no citation control).
    Cataloguing any of them as covered would assert something the code does not do; each is either a
    build or a correction to the legal row.
  - Two are the Tower command-centre chat opener's `citation` and `confidence`, whose disclosure may
    belong to the already-catalogued shared agent renderer. That is a taxonomy call, not a
    cataloguing one.
- **This panel is still on no screen.** The entry is honest about it and the audit counts it that
  way, but the underlying state is unchanged: a fully-built briefing surface with a live endpoint
  that nothing mounts. Mounting it, or moving its two controls to the shell that renders in its
  place, is product work this release names and does not do.
- **Two suites in `src/components/strategic-moves/__tests__`** are unaffected by this change and the
  directory remains listed by exact path rather than swept; a suite added there in future still runs
  nowhere until it is named in a job.
