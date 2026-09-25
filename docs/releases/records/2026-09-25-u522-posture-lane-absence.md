# 2026-09-25-u522-posture-lane-absence — Posture tiles distinguish a never-loaded lane from a loaded, empty one

## Release ID

`2026-09-25-u522-posture-lane-absence`

## Status

`candidate`

## Plain-English Summary

The Source workspace Evidence page carries a "Contract-depth posture" panel with three tiles —
Spend rows, Performance rows, Document page text. Each tile summed its lane across the loaded
evidence-coverage rows and printed the total. When nothing had been loaded to look in, the sum of
an empty set is zero, so the tile printed `0` — and a reader could not tell that from a lane that
was read and genuinely holds no rows. The tiles now print a dash when no coverage row was loaded at
all, and keep printing `0` when the lane was read and is empty.

That rule is not a new one invented here. It is written twice in the repository already and this
change makes a third surface obey it: `Contract360Surfaces.laneCount` carries
`/** A count that was never loaded is a dash, not a zero. */` and returns null per contract, and
`evidenceArchetypeRows` in this same component states
`/** Null means the lane was never loaded for this group; 0 means loaded and empty. */` and renders
its "No evidence loaded" group through the shared `countOrDash`. The posture panel dropped the
distinction and kept the digit. No new vocabulary was introduced — the same `countOrDash` and the
same em dash.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behavior for all clients, not feature-gated.

- **Layer 4 — Products (Source).** A rendering change on one mounted panel of the Source workspace
  Evidence page. No read path, query, projection or contract changed.
- **Layers 1–3 — unaffected.** No intake, adapter or canonical-model change. The component reads the
  same `portfolio.impact.evidenceCoverage` rows it read before, and sums them the same way whenever
  there is anything to sum.

## Client Applicability

- All clients: yes — the panel is tenant-agnostic and renders for whichever tenant the workspace is
  serving.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
  - new module-private `postureLaneTotal(coverage, field)` returning `number | null`
  - the three posture tiles now render `countOrDash(postureLaneTotal(...))`
  - `EvidencePage` exported so the panel can be driven directly by a test
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.posture-absence.test.tsx`
  — new behavioural suite, 16 cases
- `.github/workflows/unit-suites.yml` — a step that runs the new suite on every pull request
- `docs/architecture/test-ci-coverage-census.json` — refreshed to record it

No migration, no route, no script, no runtime configuration.

## QA / Validation

**The filed mechanism was checked first and is unreachable; it is not what this change fixes.**
The backlog item described a nullable lane field defeated by `?? 0` inside the sum. Two independent
reads say it cannot happen:

- `src/lib/source/data-model/types.ts:447`, `:450`, `:462` declare `spend_rows`,
  `performance_rows` and `document_page_text_rows` as `readonly number` — not optional, not
  nullable.
- The only non-test producer of `portfolio.impact.evidenceCoverage`,
  `loadDirectSourceWorkspaceImpactRows`, emits `COALESCE(spend.spend_rows, 0)::bigint`,
  `COALESCE(performance.performance_rows, 0)::bigint` and
  `COALESCE(depth.document_page_text_rows, 0)::bigint`.

So a loaded lane always arrives as a number and the `?? 0` inside each reduce is dead code. That
half of the item is closed in code rather than changed, and the `?? 0` is retained because the
lanes arrive from pg as `bigint` strings and `numberFromDb` is typed `number | null`.

**The reachable absence is the absence of a coverage ROW, not a null field on one.** The impact read
yields an empty `evidenceCoverage` array when it returns nothing or throws, while the contract
register is filled by a separate read — so the register can hold contracts with nothing loaded to
look in. That is the case the new suite drives.

- **Red first, per tile, in both directions.** Before the fix: **7 failed / 6 passed of 13**. The 6
  that passed are the guardrails an over-broad fix would break — the loaded-and-genuinely-zero case
  and the loaded-with-rows case for each tile. After the fix: **0 failed / 13 passed**, and 3
  further cases were then added pinning the sibling half, for **16 passed**.
- **Mutation-checked per tile, not panel-wide.** A panel-wide assertion is met by whichever sibling
  tile happens to move, so each tile was reverted to the filed expression in turn. Each mutation
  fails **exactly 3** cases and the named failures are that tile's two absence assertions plus the
  three-tile roll-up — verified by reading the failure names, not the count: reverting the
  Performance tile fails `Performance rows › does not render 0 when no coverage row was loaded at
  all`, `Performance rows › renders the absence in the vocabulary the matrix already uses`, and
  `renders every posture lane tile as a dash, not a zero, when nothing was loaded`. No sibling
  absorbed it.
- **Clean baseline over the same scope**, measured in a separate worktree at `origin/main`
  `8d45a663c` rather than by stashing: `npx jest "source/preview/workspace/__tests__"` —
  **0 failing / 311 passing across 36 suites before**, **0 failing / 327 passing across 37 suites
  after**. The delta is this change's own suite.
- **Typecheck**: `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc
  --noEmit --pretty false` — **exit 0**, judged by exit code, with the build-info removed first.
- **ESLint** on both changed files — exit 0. **Prettier** clean on the new test file and on every
  line this change added; the pre-existing Prettier warning on `WorkspaceExecutiveShell.tsx` is
  present unchanged on `origin/main` and was deliberately not repaired here, because reformatting a
  7,000-line file would bury a 20-line change.

**Census of the other readers of these lane fields, so the next reader inherits the search.** Every
non-test site coercing an evidence-coverage lane through `numberFromDb` was classified; exactly one
had the defect and it is the one fixed:

| site | verdict |
|---|---|
| `WorkspaceExecutiveShell.tsx` posture tiles | **the defect — fixed here** |
| `impactLoadRunScore` `:174`–`:179` | out of scope — a ranking key for choosing a load run, never rendered |
| contract-finder `evidenceScore` `:3078`–`:3081` | out of scope — a sort key, never rendered |
| Evidence lanes table `:5677`/`:5681`, `:5691`/`:5695` | **clean, and now pinned** — the table carries a Status column beside the count and `.some()` over an empty array already returns `missing` |
| `evidenceArchetypeRows` `:5867`–`:5871` | already correct — its "No evidence loaded" group is null and renders a dash; this is the in-file precedent reused |
| `vendorEvidenceRows` `:6854`–`:6857` | out of scope — the map is keyed by vendor and a vendor with no coverage row never produces an entry, so no zero-for-absent row exists |
| `contract360Ledes.evidenceLede:193`–`:197` | out of scope — returns null for absent coverage and for zero loaded lanes; already fails closed |

**The sibling half reports clean and the record says so rather than manufacturing a change.** Three
cases were added that pass on unfixed code by design, locking the Status column's behaviour the
audit above relied on. Note the two panels answer different questions and both answers are honest:
the table's word is about the lane ("no rows"), true whether or not anything was read; the panel's
digit is a count, and for a lane nothing was read for there is no count to give.

**The suite is wired in the same change that adds it.** Jest enumerates this directory's suites by
exact path in `unit-suites.yml`, so a new file is invisible to CI until a step names it — and an
unwired suite is precisely the shape this backlog exists against: green locally, green forever, and
run by nothing that could stop a merge. The census confirmed it before and after: the new file first
reported as `uncoveredTestFiles +1`, and after wiring as `coveredTestFiles +1` with the directory's
`untriagedUnrunTestFiles` at 0. It is a step of its own rather than an extra path in the T-550 list
above it, because that list is a historical draw and appending to it would make an old measurement
look larger than it was. `npm run audit:test-ci-coverage:check` — exit 0, `census drift: committed
census matches this run`.

Closure is provable entirely in jest against the mounted component. No database, no signed-in
session, no live walk.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and shifts traffic. No
migration, no flag, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. This change adds no ad-hoc Azure command.
- Approved image digest: assigned by the deploy workflow; recorded against the merge SHA.
- ACA runtime invariant: to be proven after deploy — Container App template image digest equals the
  100%-traffic revision digest, revision Healthy.
- Worker image invariant: unaffected; no worker code changed.
- Feature/env flag update path: none.
- Live signed-in proof required: **not for closure.** The acceptance is explicit that closure is
  provable in jest and that a later confirmation by a reader on the deployed surface is a separate
  follow-on.

## Rollback Plan

Revert the PR. The change is a pure rendering change in one component with no persisted state, no
schema and no flag, so a revert restores the prior behaviour immediately on the next deploy. No
migration rollback applies.

## Audit Evidence

- The PR and its CI run.
- The new suite, which is the executable form of the claim:
  `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.posture-absence.test.tsx`.
- The before/after and per-tile mutation numbers recorded under QA above, each reproducible from a
  clean checkout with the commands quoted there.
- The deploy run at or after the merge SHA, and the digest comparison.

## Known Gaps

- **The filed half is closed by proof, not by code.** The nullable-field mechanism the item
  described is unreachable and no code was written for it. If the producer ever stops COALESCing a
  lane, the retained `?? 0` would silently restore the original defect inside a non-empty coverage
  set. Nothing currently guards that direction, and it would need a producer-side assertion rather
  than a component test.
- **Per-lane absence cannot be expressed today.** The producer folds "lane never loaded" and "lane
  loaded and empty" into the same `0` at the row level and reports both as missing in
  `blocker_if_missing`. So absence is all-or-nothing at the panel: either a coverage row exists and
  every lane on it is a number, or no row exists and every lane is unknown. A per-lane load state
  would be a data-plane change and is not decided here.
- ACA digest invariant: owed until the deploy run completes.
- A reader's confirmation on the deployed surface: owed, and deliberately outside this acceptance.
