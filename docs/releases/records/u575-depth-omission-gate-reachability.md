# 2026-10-07-u575-depth-omission-gate-reachability — a phase stays exitable after depth removes documents

## Release ID

`2026-10-07-u575-depth-omission-gate-reachability`

## Status

`candidate`

## Plain-English Summary

A phase of a Move exits through a gate. Several of those exit criteria are
**hard** and can be satisfied *only* by a generated document of a particular
type — there is no text answer a user can give instead. So a phase is exitable
only if that phase actually builds a document its own gate recognises.

An existing guard pins that join. It reads the **declared** build set — the list
of documents a phase is configured to produce for a given solution route — and
proves each hard criterion has a document in it. Its own header names the
hazard it was written against as a *future* one: a configured artifact pack that
omitted, say, the readiness-and-change plan would silently make Plan
un-exitable.

**An omission mechanism is already present, and sits outside that guard.** The
phase-generation route resolves an adaptive-depth decision and then filters the
documents it enqueues: anything resolved `not_applicable` or
`merge_into_parent` is dropped before the queue, by design, so a small-scope
Move is not forced to produce an eight-document pack. The set that actually
reaches the queue is therefore strictly smaller than the set the existing guard
proves. Neither that guard nor its sibling document-satisfiability guard
mentions depth anywhere — both were satisfiable-by-construction against a set
the product no longer builds verbatim.

The failure that gap allows is the worst shape this product has. Capture
completes, every answer is saved, the build reports **success** with the omitted
documents listed as deliberate decisions — and the gate still refuses, with no
control on screen that could produce the missing document, because the route
decided not to build it. Design and Plan enqueue their documents as a
*sequential* chain, so one missing document also holds every later document in
that phase behind it.

**Measured result: the join holds today on every combination, and nothing
asserted it.** This change adds the assertion. The two declarations that have to
agree live in different files — `adaptive-depth.ts` decides what is applicable,
`governance.ts` decides what the gate accepts — neither references the other,
and both are actively edited for unrelated reasons (tuning a depth signal;
tightening a gate criterion). Neither edit looks like it touches the other.

Coverage of the sweep, measured rather than asserted: **34 of 34** pinned
criterion/route pairs are genuinely exercised — zero were skipped as
out-of-scope, so no case is silently vacuous.

## Layer Impact

**Release lane: `global-control-lane`.** Phase-gate reachability is shared
control-plane behaviour for every client. It is not feature-gated, not
client-scoped, and not a demo or internal-admin path.

- **Layer 3 — canonical model (read path only).** No schema, no migration, no
  write path. The change is a test suite; it adds no runtime module and changes
  no runtime behaviour.
- **Layer 4 — products (Moves).** Protects the Design, Plan and Mobilize phase
  exits against a depth decision that removes a gate-required document.

No product surface, API response, prompt or stored value changes.

## Client Applicability

All clients, equally and immediately — but as a **guard**, not a behaviour
change. No client-visible behaviour differs before and after this change,
because the invariant it asserts already holds on every combination swept. No
tenant enrolment, no feature flag, no per-client data.

## Changes Included

One new test suite. No runtime file is touched.

**`src/lib/programs/__tests__/phase-gate-depth-omission-reachability.test.ts`**
(new) — resolves the post-depth enqueue set exactly the way the generation route
resolves it (both id spellings offered to the resolver, the filter applied on
the registry key, which is what the route filters its specs by), then pins
three joins across every route shape the build path distinguishes crossed with
every complexity tier:

- **J1 — the post-depth set is never empty.** An empty set is the route's
  `422 no_applicable_deliverables`, which is a dead end for the phase rather
  than a smaller build.
- **J2 — every hard, document-only exit criterion still has a document in the
  post-depth set that it accepts**, including the route-specific documents the
  Design criterion requires *all* of.
- **J3 — a `merge_into_parent` decision never names a parent the same filter
  omits.** An absorbed brief whose parent is also gone has no home at all.

Two self-guards keep the sweep honest: the tier sweep asserts all three
complexity tiers are actually reached from the swept signal profiles (profiles
that all landed on one tier would make a three-tier name cover a single-tier
test), and every pinned criterion is re-asserted to still be declared `hard`
for its phase, so a criterion downgraded elsewhere cannot leave a literal here
quietly passing.

The criterion/alias table is written out as literals rather than imported from
the sibling suite, for the reason the sibling states: an expectation read off
the module under test cannot see a drift in it.

The sweep is driven through **declared signals**, which `resolveAdaptiveDepth`
accepts as a sanctioned input, rather than through a hand-built applicability
map. A hand-built decision could state a combination no real input produces; a
signal profile cannot.

**`docs/architecture/test-ci-coverage-census.json`** — regenerated.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/__tests__/phase-gate-depth-omission-reachability.test.ts` | **PASS** — 194 tests |
| `npx jest src/lib/programs/` (whole directory) | **PASS** — 336 suites / 4,977 tests |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint` (new suite) | **PASS** — exit 0 |
| `npm run release:check -- --base origin/main --head HEAD` | **PASS** |
| Vacuity measurement — criterion/route pairs genuinely in scope | **34 of 34**, zero skipped |
| Mutation battery against `shouldGenerateArtifact` | **4 of 5 killed** (see below) |
| Signed-in walk of the live product | **NOT RUN** — requires a human session; outside this lane |

**Mutation battery.** Each mutation was applied to the production filter and the
pattern count asserted as exactly 1 before the run, so a mutation that silently
edited nothing cannot read as a survivor.

| Mutation | Result |
|---|---|
| The architecture document is always omitted | **killed** — 9 failures |
| The readiness-and-change plan is always omitted | **killed** — 12 failures |
| Every document is omitted | **killed** — 132 failures |
| The charter is always omitted | **killed** — 12 failures |
| `merge_into_parent` no longer omits | **survived — diagnosed, not owed** |

The survivor is a **relaxation**: it causes *more* documents to be built, never
fewer. A guard whose claim is "every gate-required document survives the filter"
cannot fail when the filter keeps more, and should not. Asserting against it
would mean asserting the omission happens, which is this suite's premise, not
its subject — the merge behaviour itself is a different guard's concern. Left as
an honest row rather than greened with a case that changes the suite's claim.

**Honest middle measurement.** On the unmodified base the suite passes 194/194,
so it is green on main as well as against the mutations — it is a guard on an
invariant that currently holds, not a fix for a live break. Stated plainly
because a passing new suite can otherwise read as a repair.

**Census.** Measured against the base's own drift before attributing any delta
to this branch. At first push `origin/main`'s committed census was itself **+1
stale** (committed 2811, actual 2812 — regenerated on the base with this
branch's file removed). The base then moved mid-run and was merged in; over the
merged base the committed figure is 2814, and this branch adds exactly one test
file: **2815 / 2651**. `uncoveredTestFiles` is **flat at 164** at both
measurements, which is the proof the new suite is CI-covered rather than dark —
a dark suite would raise that number.

## Rollout Plan

Squash merge to `main` via the standard pull-request lane. No deploy step is
required or implied: the change is a test file plus a regenerated report, so it
alters no image, no runtime template, no flag and no environment variable.
Nothing needs to reach a Container App for this change to take effect, and
nothing about the running product changes when it merges.

## Deployment Authority

None exercised and none required. No Azure command, no registry build, no
traffic shift, no revision update, no flag or environment change. Only the
repo-owned main deploy workflow may shift shared web traffic, and this change
does not ask it to. No shared runtime is touched.

No tenant data was read, written, loaded or approved. No Move was declared or
advanced. No production database was mutated.

## Rollback Plan

Revert the merge commit. The new file is a test suite with no importers in
runtime code, so removing it cannot affect the running product — it can only
stop asserting the invariant. The census regeneration reverts with it and can be
regenerated at any time with `npm run audit:test-ci-coverage:write`.

No data migration, no backfill, no flag to unset, no revision to roll back.

## Audit Evidence

- Vacuity measurement: 34 of 34 criterion/route pairs in scope, zero skipped.
- Mutation battery: 4 of 5 killed, the survivor diagnosed as a relaxation.
- Base census drift measured independently of this branch's delta.
- Both pre-existing guards confirmed to contain **zero** references to depth,
  adaptive applicability or complexity tier — the gap this suite closes.

## Known Gaps

1. **The section word-budget reconciliation is pinned only against the
   unfiltered structure.** The same adaptive-depth pass also removes *sections*
   from a document's structure before its per-section word budget is reconciled
   with the document's word floor. Measured this run across every generatable
   document type, three tiers and four story-beat states: **zero** breaks — the
   reconciliation raises the surviving caps proportionally and stays inside the
   blocking ceiling in every case. The two existing budget guards nonetheless
   contain zero depth references, exactly like the gate guards did. Recorded as
   the next increment rather than folded in here: it is a different module's
   invariant (prompt-builder and the budget plan, not the gate), and one claim
   per change keeps the mutation evidence legible.

2. **Two of the section filter's three rules cannot fire.** The filter tests for
   sections keyed `physical_architecture` and `agent_orchestration`; measured
   across every generatable document, **no** structure declares a section under
   either key — both exist only as *exhibit* keys, which a separate and correct
   exhibit filter handles. The arms are therefore dead rather than wrong, and
   nothing leaks as a result. Not changed here because deleting them is cleanup
   with no behavioural claim to prove, and because a future structure could
   legitimately add such a section.

3. **An options-shaped section is suppressed structurally in one document of
   two eligible.** At the lowest complexity tier the filter drops the
   architecture document's options section. A second document declares an
   optional options-and-recommendation section that is not dropped. Measured as
   **not** a forced contradiction: the section is optional and the plan
   sanitizer never forces an unplanned section to appear, so the model may
   simply omit it. Whether the two should behave alike is an editorial call on
   what a small-scope business case must still state, not a defect.

4. **This suite runs in the non-required unit-suites workflow.** The required
   contexts on `main` (re-verified this run: still 19) do not include a job that
   sweeps `src/lib/programs/__tests__` by directory, so this guard will not by
   itself block a merge. It is stated plainly rather than claimed as a required
   gate. The required gates this change does lean on are ESLint, the repo-wide
   typecheck, the release-record check, and the behaviour-coverage floor that
   runs the dark-directory census test.

5. **No signed-in walk.** Not applicable to a test-only change, and outside this
   lane's authority in any case.
