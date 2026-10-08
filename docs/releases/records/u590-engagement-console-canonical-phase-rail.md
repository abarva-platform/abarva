# u590 — The engagement console states the canonical phase model

## Release ID

`2026-10-08-engagement-console-canonical-phase-rail`

## Status

`candidate`

## Plain-English Summary

The engagement console has a strip across the top that names which phase a Move is in and
draws a rail of every phase with a marker where a gate has been signed off. It was telling
two untruths.

First, it used a phase model of its own. It drew **five** phases under its own labels —
`Start`, `Diagnose`, `Design`, `Execute`, `Verify` — while the product's declared source of
truth for phase labels (`src/lib/programs/phase-labels.ts`) says a Move runs across **six**
phases, `P0 Originate` through `P5 Mobilize & Handoff`, and says in as many words that
Build / Execute / Verify are *not* Move phases because downstream execution tracking is
owned elsewhere. So the strip named two phases the model excludes, renamed three it does
define, and had no column at all for the final phase: a Move sitting in the last phase ran
off the end of both the label and the colour list and rendered the bare fallback
`Phase 5`. This surface is one the product chrome lights the Moves navigation tab for, so
the phase vocabulary a reader saw there contradicted the vocabulary every other Move
surface uses.

Second, it recognised only one of the shapes in which a signed-off gate is recorded. It
asked each stored gate entry for a `phase` field and an `approved` status, while the only
control that actually appends to that record on the Moves path appends the **bare phase
number**. A number has no fields, so the sign-off the product itself records matched
nothing and the rail drew that gate as though it had never been approved — while a sibling
reader of the very same record, used for the terminal hand-off, does accept the bare number.
Two readers, one record, opposite answers.

Both now come from one place. The rail is as long as the canonical phase model and takes its
labels from the declared source of truth, and it asks about gate sign-off through the shared
predicate added in u589, so the phase spellings and approving statuses are stated once for
every reader rather than restated per surface.

What this deliberately does **not** claim: a bare phase number carries no date. Such a
record now reports the gate as approved with no date, so the rail can say so without
inventing when — and the date-derived text (baseline lock, next gate) stays absent rather
than guessing. The stored array is also not written at all for the middle phases by any
reachable control; recovering those sign-offs needs the phase snapshot records, which this
host does not load. See Known Gaps.

## Layer Impact

Release lane: **`global-control-lane`** — shared application behaviour for all clients, not
feature-gated.

- **Layer 4 (Products)** only. A projection reads its phase vocabulary and gate-approval
  vocabulary from the canonical modules instead of restating narrower copies inline.
- No change to the canonical model, to any adapter, to any stored record, or to any write
  path. No query added or changed: the strip already received both inputs it now derives from.

## Client Applicability

- All clients: yes — the console renders for any tenant that reaches it. The correction is
  presentational and carries no tenant-specific behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The surface is not flag-gated, so this lands unconditionally.

## Changes Included

- `src/lib/programs/engagement-phase-rail.ts` — new. Derives the rail: one marker per
  canonical phase carrying the canonical label, whether the record names that gate as
  approved, and the recorded date when there is one; plus the baseline-lock and next-gate
  dates the strip displays.
- `src/lib/programs/approved-gate-phases.ts` — adds `findGatesPassedEntryForPhase`, which
  returns the matched record rather than only a yes/no, and reduces the existing
  `gatesPassedContainsPhase` to that function asked for a boolean. One definition of the
  vocabulary, not a second: the predicate's behaviour is unchanged, pinned by an
  equivalence test over ten record shapes and six phases.
- `src/components/engagement/EngagementMetaStrip.tsx` — consumes the rail. Drops its local
  five-label phase list; keeps one colour per canonical phase. An approved gate with no
  recorded date now renders as `gate approved` instead of rendering nothing.
- `src/lib/programs/__tests__/engagement-phase-rail.test.ts` — new, 13 cases.
- `src/lib/programs/__tests__/approved-gate-phases.test.ts` — 5 cases added for the lookup.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/engagement-phase-rail.test.ts
  src/lib/programs/__tests__/approved-gate-phases.test.ts
  src/lib/programs/__tests__/moves-generate-gate-record-wiring.test.ts` → 3 suites,
  37 tests passed.
- **PASS** — mutation testing, **9 of 9 mutations killed**, baseline green before and after
  each. Shortening the rail to five phases (5 failed); replacing the canonical labels with a
  generic one (2); reporting every gate unapproved (4); dropping recorded dates (3);
  dropping the phase-2 baseline fallback (1); treating an undated gate as dated (10); letting
  a blank date through as an empty string (1); dropping the bare-phase-number arm of the
  shared lookup (4); inverting the shared predicate (15). Each mutator asserted its pattern
  matched exactly once and the file changed, so no mutation was a no-op.
- **PASS** — wiring pinned by the type-checker, verified rather than assumed: deleting the
  strip's call to the rail produces 8 `tsc` errors at the three render sites, so the fix
  cannot silently go dead while the unit tests stay green.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` over all five changed source files, exit 0.
- **PASS** — `npm run audit:lib-orphans` → `No change against the baseline`; the new module
  is reached by the product entry-point walk, not test-only. Checked because a module
  validated behind an unreached host is a fix nobody sees.
- **PASS** — census regenerated and measured at both ends. Committed on main
  2839/2674/2673; **base regenerated on a clean checkout of the same commit
  2841/2676/2675** — main's committed census is already two files behind, inherited here and
  not caused by this change; with this change **2842/2677/2676**, i.e. `+1` on each of
  `testFiles`, `coveredTestFiles` and `pullRequestCoveredTestFiles` with
  `uncoveredTestFiles` held at **165** across all three readings. The
  `pullRequestCoveredTestFiles` increment is what proves the new suite is merge-blocking
  rather than merely present.
- **PASS** — `npm run audit:tenancy-fence-coverage:write` produced no change, as expected:
  no tenant-scoped read was added.
- **NOT RUN** — signed-in walk of the console for an affected tenant. Requires a signed-in
  session and is outside this lane; see Deployment Authority.
- **NOT RUN** — a browser render assertion of the strip. There is no merge-blocking test
  home for this component: no `__tests__` directory exists beside it, and the component test
  directories that do exist are wired only to a job that is not a required check, so a render
  test placed there could not fail a merge. The derivation was therefore placed in a
  directory whose coverage is proven by the census delta above, and the wiring pinned by
  `tsc`.

## Rollout Plan

Merge to `main` via squash. The change is in the web application layer and becomes active
with the next repo-owned Azure Container Apps image build and deploy of `main`; it needs no
migration, no flag, no environment variable, and no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change. No Azure command was run and none is required.
- Approved image digest: not applicable at merge time; the deploy workflow pins the digest it
  builds from the merge commit.
- ACA runtime invariant: unchanged by this release; the standing invariant (template image,
  100%-traffic revision image and worker job images all matching the approved digest) is
  proven by the deploy workflow, not here.
- Worker image invariant: unaffected — no worker job code changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: **yes, and not performed here.** This record may be read as
  `merged` and, once deployed, `deployed`. It may **not** be read as `live-proven` until a
  signed-in session confirms the console's rail renders the six canonical phases and marks a
  gate the product itself signed off. That walk is a human step.

## Rollback Plan

Revert the squash commit. The change is read-path only and additive — a new module plus a
new function beside an unchanged one — so a revert restores the prior rendering immediately
with no data migration, no backfill, and no stored record to undo. Nothing written while this
is live depends on it.

## Audit Evidence

- The pull request and its CI run for this branch.
- The mutation results and census readings quoted under QA / Validation, each reproducible by
  the commands given there.
- `docs/architecture/test-ci-coverage-census.json` as regenerated in this change.
- `src/lib/programs/phase-labels.ts` and
  `docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md` as the authority for the phase
  model this surface now states.

## Known Gaps

- **A gate approved in the middle phases can still render unmarked, and this change does not
  fix that.** The stored gate array is not appended to for those phases by any reachable
  control; the authoritative record for them is the phase snapshot set, which this host does
  not load. Correcting the rail's recognition of record *shapes* was necessary but is not
  sufficient, and the remaining half needs a read this surface does not currently perform.
  Stated plainly so the narrower claim is not mistaken for the whole one.
- **An undated approval yields no date anywhere.** The baseline-lock and next-gate dates stay
  absent when the only record of a sign-off is a bare phase number, because there is no date
  to show. This is deliberate: the alternative is inventing one.
- **The sixth phase colour reuses the fifth.** The rail needed a colour per canonical phase
  and there is no canonical phase-colour source to draw one from. A distinct colour is a
  design decision, not a correctness one, and is left open.
- **The same gate-record blindness remains on two other readers of this page**: the activity
  timeline on the console page, and the summary tile's own gate counting. Both were measured
  and left unchanged in this release to keep it to one surface and one claim.
- Two other surfaces named as candidates for this work were measured and are **not** owed:
  one reads its gate state from phase position rather than the record and is already correct,
  and another is a module already registered as having no importers, so fixing it would have
  been invisible.
