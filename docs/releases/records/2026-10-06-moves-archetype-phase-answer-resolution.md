# 2026-10-06-moves-archetype-phase-answer-resolution — Archetype answers state the severity and the phase they resolved

## Release ID

`2026-10-06-moves-archetype-phase-answer-resolution`

## Status

`candidate`

## Plain-English Summary

Two of the grounded answers a Move can give about its own archetype asserted
something the layer underneath them had not said.

The first answer lists the evidence a Move needs at the Discover phase. The
resolver that produces that list returns a severity for each evidence family,
and for an optional one its own stated rationale is that the family "is not a
hard blocker". The answer flattened the required and the optional families into
a single list introduced by the word "requires". A reader was therefore told
that an optional family was required, and nothing in the sentence let them tell
which families actually block the gate. One archetype declares eleven required
families and an optional twelfth, so the answer sent a reader after a twelfth
piece of evidence that no gate asks for. The answer now states the required
families as required and the optional ones as optional context, in separate
sentences, and says so plainly when nothing is a hard blocker.

The second answer lists the deliverables an archetype declares for the current
phase. It converted the phase number into the archetype's phase key by hand,
mapping phase 1 and phase 2 and sending **every other phase** to the first one.
Phases 0, 3, 4 and 5 were all answered with phase 1's single entry, under the
words "at this phase". Six of the seven archetypes declare entries for the
design, roadmap/business-case and mobilize phases, and that fallback could
reach none of them — for one archetype, five of its seven declared entries were
unreachable and the two it did reach were attributed to four phases that were
not theirs. The phase key is now resolved from the canonical phase map, and a
phase the archetype declares nothing for is reported as having nothing
declared rather than borrowing another phase's entries.

The mapping itself is now derived by inverting the one canonical
phase-number map instead of being written out a second time, so a future phase
is mapped the moment it is declared, with no second place to forget it.

## Layer Impact

- `global-control-lane` — layer 4 (Products · Moves). Two answer strings in a
  pure, deterministic answer builder, plus one new pure helper module. No
  change to layer 1 intake, layer 2 adapters, or layer 3 canonical model; no
  schema, migration, route, or gate-evaluation change. Gate outcomes are
  computed elsewhere and are untouched: this changes only what a reader is
  told about required evidence and declared deliverables.

## Client Applicability

- All clients: yes — the answer builder is not tenant-scoped or flag-gated, and
  the corrected wording applies to every archetype.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a correction to an existing answer, not a
  new capability, so gating it would leave the incorrect wording reachable.

## Changes Included

- `src/lib/programs/archetypes/phase-key.ts` (new) — `phaseKeyForNumber`,
  derived by inverting `PHASE_NUMBER`; returns `null` for a number that names
  no phase.
- `src/lib/programs/archetype-context-bundle.ts` — the Discover-evidence answer
  now partitions the resolver's output by the severity the resolver returned;
  the next-deliverables answer now resolves the phase key instead of falling
  back to the first phase.
- `src/lib/programs/__tests__/archetype-phase-answer-resolution.test.ts` (new)
  — 12 cases.

## QA / Validation

- PASS `npx jest src/lib/programs/__tests__/archetype-phase-answer-resolution.test.ts`
  — 12/12.
- PASS `npx jest src/lib/programs/__tests__` (whole directory, the unit of the
  required sweep) — 128 suites, 1306 tests, 0 failures.
- PASS mutation testing, 4 of 4 killed: restoring the hand-rolled phase ternary
  (4 cases fail); making the new helper fall back to a phase instead of `null`
  (1); listing the optional family among the required ones (2); dropping the
  optional-context sentence (1). Baseline restored green after each.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` on both changed source files — exit 0.
- PASS `npm run audit:test-ci-coverage:write` — the new suite lands in
  `src/lib/programs/__tests__`, which a required job sweeps by directory, so
  covered moves with total and the uncovered count does not change.
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN live signed-in walk. The answers are produced by a pure function
  exercised directly by the suite; the end-to-end walk they inform is blocked
  upstream on evidence that is not this lane's to create (see Known Gaps).

## Rollout Plan

Merge to main, then the repo-owned ACA main deploy workflow in its normal
course. No migration, no flag, no env var, no worker job, no manual runbook
step. Nothing in this change alters a shared runtime template.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift,
  no revision weight change from this branch.
- Approved image digest: not applicable — no runtime image change is requested
  by this record; the change ships with the next ordinary main deploy.
- ACA runtime invariant: unchanged by this record; the next main deploy proves
  it in the normal way.
- Worker image invariant: unchanged; no worker job image or argument changes.
- Feature/env flag update path: none required.
- Live signed-in proof required: no. Nothing user-visible changes until the next
  ordinary deploy, and this record does not claim `live-proven`.

## Rollback Plan

Revert the squash commit. The change is three files, two of them additive, with
no schema, migration, flag, or stored state involved, so a revert restores the
previous answer wording exactly and needs no data repair. The new helper module
has one importer; reverting removes both together.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation results quoted under QA / Validation.
- `docs/architecture/test-ci-coverage-census.json` — covered and total move
  together, uncovered unchanged.

## Known Gaps

- The archetype's per-phase `gateRequirements` field is read by nothing. Four
  of the keys the demo archetype declares there appear in exactly one
  non-test file, their own declaration: nothing evaluates them, and the gate a
  Move actually passes is the route-based rule set in `governance.ts`. Wiring
  that field is an engine change that would make gates stricter, so it is
  deliberately NOT part of this record; it is reported so no one reads a
  declared requirement there as an enforced one.
- `resolveArchetypeRequirements` skips a `requiredEvidence` entry whose family
  is absent from the archetype's own `evidenceFamilies` list, silently. No
  archetype trips this today (checked: 7 archetypes, 0 dropped entries), so no
  guard is added here, but the drop is unobserved if one ever does.
- The Discover-evidence answer is still hardcoded to the Discover phase, which
  matches the question it answers; it is not phase-parameterised.
- The end-to-end walk remains blocked upstream on discovery evidence being
  loaded and human-approved, which is not this lane's to create.
