# U-593 — Engagement surfaces name the canonical six phases

## Release ID

`2026-10-08-engagement-surfaces-name-the-canonical-six-phases`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

A Strategic Move runs across six phases, P0 through P5. The phase model module
declares itself the source of truth for their names, states that six is the
total, and says in as many words that Build, Execute and Verify are *not* Move
phases — Tower owns downstream execution.

Five surfaces did not use it. Each had declared its own literal array of five
names — `['Start', 'Diagnose', 'Design', 'Execute', 'Verify']` — from an
earlier five-phase model. The consequence is not a cosmetic mismatch. Indexing
a six-phase integer into a five-entry array is wrong in two different ways at
once:

- **Every phase from P1 to P4 was named as a different phase.** A Move at P2
  Discover & Diagnose was labelled "Design"; at P3 Design Future State it was
  labelled "Execute"; at P4 Roadmap & Business Case it was labelled "Verify".
  P1 Charter was labelled "Diagnose".
- **P5 fell off the end entirely**, and each surface failed differently.
  The deliverables list rendered `PHASE 5 · ` with a dangling separator and no
  name. The topics list rendered a bare `P5 `. The turns page built its phase
  filter by mapping the array, so there was no way to filter to P5 at all. The
  console's phase indicator is a five-column grid, so a Move at P5 highlighted
  no current phase: the user stood at the last phase of the Move and the
  indicator showed nothing as current.

The fifth surface is not a screen. The engagement system prompt interpolates
the phase name into the `CURRENT ENGAGEMENT CONTEXT` block the model reads, and
it does so in the Phase 0 assembler — which also serves the `default:` arm of
the phase switch, and therefore serves P5. So at the final phase of a Move the
model was told, literally, `Current phase: 5 (undefined)`.

This change adds one ordered roster derived from the canonical model and routes
all five surfaces through it. The roster is built from the declared total and
the declared getters, so it cannot drift from the source of truth the way five
hand-maintained arrays did.

Two judgement calls worth stating. The chip helper returns a `P{n}` stand-in
rather than an empty string for a phase outside the canonical range, because a
blank is indistinguishable from a rendering failure and leaves a dangling
separator on screen. And the roster is a new module rather than new exports on
the phase-label module: the surfaces needed an *ordered* structure, which is
exactly what the keyed records could not give them, and deriving it in one place
keeps the source of truth single.

## Layer Impact

Release lane: `global-control-lane` — shared labelling behaviour, identical for
every client and not feature-gated.

- **Layer 4 (Products)** — presentation only, plus one model-prompt input. No
  product owns the phase model; every surface here is a projection of it.
- **Layer 3 (Canonical model)** — unchanged. No schema change, no migration, no
  write path touched. Phases are still stored as integers 0..5.

## Client Applicability

- All clients: yes — phase names are tenant-independent.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gating a corrected label would preserve the wrong label
  behind the flag.

## Changes Included

- `src/lib/programs/phase-roster.ts` — new. An ordered roster of the six
  phases derived from `TOTAL_PHASES`, `PHASE_CODES` and the canonical label
  getters, plus a chip helper and a prose/prompt name helper, each with a
  non-empty fallback past the canonical range.
- `src/lib/programs/__tests__/phase-roster.test.ts` — new, 14 cases.
- `src/lib/agent/__tests__/engagement-prompt-phase-name.test.ts` — new, 5
  cases, asserting the assembled prompt's own `- Current phase:` line.
- `src/components/engagement/__tests__/EngagementConsole.phase-indicator.test.tsx`
  — new, 6 cases. Renders the console and asserts six phase cells, their
  canonical names, the absence of the retired names, and the grid's six
  tracks.
- `src/components/engagement/EngagementConsole.tsx` — the phase-indicator grid
  takes its columns and its labels from the roster, and the phase-transition
  ceremony names the phase the user just entered from it.
- `src/app/(maestro)/engagements/[engagementId]/deliverables/page.tsx`,
  `.../turns/page.tsx`, `.../topics/page.tsx` — phase chips and the turns phase
  filter take their names from the roster; the three local arrays are gone.
- `src/lib/agent/prompts/engagement.ts` — the prompt's phase name comes from
  the roster.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new runtime dependency, no change to any write path, no new flag.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/phase-roster.test.ts` —
  14/14. This directory is the directory-wired invocation of the required
  **AI surface control catalog** check, so the file is merge-blocking without a
  workflow edit.
- **PASS** — `npx jest src/lib/agent/__tests__/engagement-prompt-phase-name.test.ts`
  — 5/5. `src/lib/agent/__tests__` is likewise directory-wired into that
  required check.
- **PASS** — `npx jest src/lib/programs/__tests__` (the whole directory, as CI
  runs it) — 171 suites / 2202 tests, no regression.
- **PASS** — `npx jest src/lib/agent/__tests__` (likewise) — 35 suites / 605
  tests, no regression.
- **PASS** — `npx jest src/__tests__/integration/engagement
  src/__tests__/behaviors/engagement-create-active-client-scoping.test.ts` —
  2 suites / 7 tests. These are the other consumers of the changed prompt
  module.
- **PASS** — `npx jest src/components/engagement` (the whole directory, as CI
  runs it) — 2 suites / 12 tests.
- **PASS** — mutation sweep, **12 mutations, 11 killed, 1 diagnosed as
  behaviour-neutral**. On the derivation: the roster length taken from a
  literal instead of the declared total; the chip falling back to an empty
  string; the chip skipping its upper-casing; the prose helper falling through
  to `undefined`; the roster taking the full label where the short one is
  meant; the absent-phase chip returning blank; and the prompt reverting to the
  retired five-entry literal. On the rendered indicator: reverting it to the
  retired local array; slicing the roster to five at the call site; dropping
  the name from a cell; and pinning the grid back to five columns.
  - That last one **survived the first sweep and was a real gap, not a false
    survivor**: six cells inside a five-column grid still render all six
    names — the sixth wraps onto a second row — so text assertions could not
    see it. A case asserting the grid's track count now kills it.
  - The one survivor left standing is hardcoding the grid to a literal `6`
    instead of deriving it. That renders identically today and changes no
    behaviour, so it is a false survivor by construction; what it would cost is
    future drift, and the roster's own suite already pins the length to the
    declared total.
  - Baseline restored and re-run green after every mutation.
- **PASS** — `npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on all eight changed files, exit 0, no warnings.
- **PASS** — census regenerated honestly. Regenerated in a clean detached
  worktree of the base commit, the census reads `2844 / 2679 / 2678` — byte
  for byte what the committed file on main reads, so main carries no inherited
  drift at this base. This branch reads `2847 / 2682 / 2681` with
  `uncoveredTestFiles` unchanged at `165` — base + 3 on each counter, one per
  new suite, which is what proves all three are merge-blocking rather than
  merely present. Measuring base regen inside the branch's own worktree instead
  gives a misleading `2845`, because stashing leaves the branch's committed
  test files in place; the clean worktree is the reading to trust.
- **NOT RUN** — live signed-in walk. This record does not claim `live-proven`.

## Rollout Plan

Merge to main. The change is read-side and becomes active with the next
repo-owned ACA main deploy. No migration, no flag, no env var, no worker job,
no traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: not applicable at merge; the main deploy workflow pins
  the digest it builds.
- ACA runtime invariant: unchanged by this PR.
- Worker image invariant: unchanged — no worker job touched.
- Feature/env flag update path: none required.
- Live signed-in proof required: **yes**, before this is called `live-proven`.
  The phase indicator and the chips are observable on the engagement console
  and its deliverables, turns and topics pages at any phase; the prompt line is
  observable in a trace of a conversation turn at P5. The indicator is also
  render-pinned in CI, so the live walk confirms that half rather than being
  the only proof of it.

## Rollback Plan

Revert the PR. The change is additive and presentational: the new module's only
callers are the five surfaces changed here, and reverting restores each local
array. No migration to unwind, no written data to reconcile, no flag to flip.

## Audit Evidence

- PR URL and its CI run, including the required **AI surface control catalog**
  check, which runs both new suites through its directory-wired steps.
- The mutation sweep summary in this record's QA section.
- Base-versus-branch census readings above, reproducible by regenerating the
  census on a clean checkout of the same base commit.
- The canonical declaration this change defers to: the phase model module's
  `TOTAL_PHASES`, its label records, and its stated doctrine that Build,
  Execute and Verify are not Move phases.

## Known Gaps

- **Closed during this change, recorded because it shaped the work.** The
  console's phase indicator started with no render test, because
  `src/components/engagement/__tests__` did not exist on main. That directory
  landed with its CI wiring mid-change, so the render test is included here
  and the gap is closed rather than carried.
- **The three server-component pages are pinned only by typecheck.** They are
  async server components with no test host, the same gap already recorded for
  the adjacent queries in that route group.
- **Four more surfaces outside this route group still carry the retired
  five-entry vocabulary** — a sponsor console, a shared program card (which
  uses a sixth spelling, "Intake"), a Moves home component that re-declares the
  phase codes locally, and a global search label list with a seven-entry
  vocabulary of its own. Each is a different host with a different audience and
  is not on the engagement console path this change covers. Measured, listed,
  deliberately not swept here.
- Not `live-proven`. See QA and Deployment Authority.
