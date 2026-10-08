# U-594 — The sponsor stepper and global search name the canonical phases

## Release ID

`2026-10-08-sponsor-and-search-surfaces-name-the-canonical-phases`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

A Strategic Move runs across six phases, and the product has one place that
says what they are called: P0 Originate, P1 Charter, P2 Discover & Diagnose,
P3 Design Future State, P4 Roadmap & Business Case, P5 Mobilize & Handoff.
That module also records, in its own header, that Build, Execute and Verify
are deliberately *not* Strategic Move phase names — downstream execution
tracking is a different surface's job.

Two surfaces outside the engagement route group were still naming phases from
their own hard-coded arrays, and both arrays had drifted away from that source.
Neither surface was obscure: one is the console a sponsor lands on for their
own engagement, and the other is mounted by the layout shared by every
signed-in page in the main chrome.

**Global search.** Each program result line says which stage the program is
in. That name came from a local seven-entry array — Originate, Discovery,
Assess, Build, Deploy, Validate, Operate — indexed by the program's stored
stage number. Only the first entry happened to agree with the canonical model.
Every stage from the second on was labelled as something else entirely: the
Charter stage read "Discovery", the Discover & Diagnose stage read "Assess",
Design read "Build", Roadmap read "Deploy", and Mobilize read "Validate". Two
of those substitutes are exactly the retired execution vocabulary. Because the
array held seven entries, the `?? Phase n` fallback written behind it could
never fire for any stage the product actually serves, so nothing ever surfaced
the drift.

**The sponsor console.** The console opens with a stepper, one cell per phase,
with the engagement's current phase highlighted. It was built from a
five-entry array — Start, Diagnose, Design, Execute, Verify — laid out in a
five-column grid. Two defects followed. Every phase was named as a different
phase, again including two retired execution names. And five cells cannot
describe six phases: a sponsor whose engagement had reached the last phase saw
a stepper with no cell highlighted at all, on the surface whose entire job is
to say how far their engagement has come.

Both surfaces now read the canonical module instead of a local literal, and the
sponsor stepper derives its column count from that module too, so the grid
cannot fall out of step with the number of phases again.

One judgement call is worth stating. The seeded programs include instances at
stage 6, which means the program has been handed to the downstream tracking
surface and is in no Move phase at all. The retired array called that "Operate".
The short-label getter would have rendered a bare "P6" for it. Global search
therefore reads through the canonical stage getter, which is the one that
accounts for the handed-off case and names it "Tower Track Outcomes".

A third surface carrying the same drift was found and deliberately left alone:
the shared program card clamps its phase index to the fourth entry of a
five-entry array, so a last-phase program renders under the *fourth* phase's
name rather than merely losing a cell. It is not shipped here because the
component is unreachable — the only two things that import it are a composite
that nothing imports and a barrel that nothing imports. Fixing an unreachable
component would record coverage for code no reader can see. It is filed in
Known Gaps as a retire-or-mount question instead.

## Layer Impact

Lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

Layer 4 (Products) only. These are presentation reads of a phase integer that
is already stored; no canonical object, adapter, intake tab or schema changes.
No read model, query or write path is touched, and no number changes — only
the name rendered beside it.

## Client Applicability

- All clients: yes — both surfaces are unflagged and render for any signed-in
  viewer whose role reaches them.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. These are unconditional reads; there is no flag to enrol.

## Changes Included

- `src/components/shell/GlobalSearchModal.tsx` — the local seven-entry stage
  array is replaced by the canonical stage getter.
- `src/components/sponsor/SponsorConsole.tsx` — the local five-entry phase
  array is replaced by a roster derived from the canonical phase codes, the
  phase chip reads the canonical code rather than a bare index, and the grid
  derives its column count from that roster.
- `src/components/shell/__tests__/GlobalSearchModal.phase-vocabulary.test.tsx`
  — new; 6 cases.
- `src/components/sponsor/__tests__/SponsorConsole.phase-stepper.test.tsx` —
  new; 10 cases.
- `.github/workflows/ai-surface-control-catalog.yml` — the existing
  directory-sweep step that already exercises the programs, agent, shell and
  atlas component suites also sweeps the sponsor suite, so the new sponsor
  directory is merge-blocking rather than dark. Chosen over a filename list
  for the reason that step's own comment gives.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath <both new suites>`: 2 suites, 16 tests,
  all passing.
- **PASS** — the full directory sweep as the wired CI step runs it
  (`npx jest src/components/programs/__tests__ src/components/agent/__tests__
  src/components/shell/__tests__ src/components/atlas/__tests__
  src/components/sponsor/__tests__ --runInBand`): 25 suites, 243 tests, all
  passing. This covers the sibling suites in the directories touched,
  including the shell vocabulary suite.
- **PASS** — mutation testing, 6 applied, 6 killed, sources restored and the
  baseline re-run green afterwards:
  1. restoring the retired seven-entry array in global search — 5 of 6 cases
     fail (the fixture guard correctly survives, since it asserts the seed and
     not the rendering);
  2. substituting the phase-only short-label getter for the canonical stage
     getter — 4 cases fail, including the handed-off stage-6 case this
     distinction exists for;
  3. restoring the retired five-entry sponsor array — all 10 cases fail;
  4. pinning the sponsor grid back to five columns while leaving all six
     labels in place — exactly 1 case fails. The other 9 **survive**, which is
     the point: a text assertion cannot see the container that lays it out,
     because the sixth cell still renders and merely wraps. The column count
     is asserted directly off `style.gridTemplateColumns` for this reason;
  5. an off-by-one on the sponsor label lookup — 8 cases fail;
  6. truncating the sponsor roster to five entries — 9 cases fail.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` over the changed files: 0 errors. One pre-existing
  `react-hooks/exhaustive-deps` warning on an unrelated memoization in the
  search modal is unchanged by this work and not introduced here.
- **PASS** — `npm run audit:test-ci-coverage:check`: committed census matches
  this run and the coverage shape matches. The delta that proves the wiring is
  `coveredTestFiles` +2 with `uncoveredTestFiles` unchanged at 165; before the
  workflow step was extended the same check read the sponsor directory as
  `+uncovered` and ranked it as the next directory to wire.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in proof. No runtime rollout is performed by this
  change and nothing here is claimed as `live-proven`; see Deployment
  Authority.

## Rollout Plan

Merge to `main` only. No migration, no flag, no environment variable, no image
build and no traffic shift is performed or required by this change. It becomes
visible whenever the shared Product/Lab web runtime is next built and deployed
by the repo-owned main deploy workflow, as part of that build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the
  only path permitted to shift shared web traffic. Not invoked here.
- Shared runtime mutators: none. This change runs no Azure command and does not
  touch the web Container App template, revision weights, scale or secrets.
- Approved image digest: not applicable; no runtime image is updated by this
  release record.
- ACA runtime invariant: unchanged and unasserted — nothing here deploys, so
  this record makes no `live-proven` claim.
- Worker image invariant: not applicable; no worker job image changes.
- Feature/env flag update path: not applicable; no flag or environment
  variable is added, removed or re-enrolled.
- Live signed-in proof required: yes, before either surface is described as
  verified in the running product — the sponsor console at its own route and
  global search from the shared chrome. That walk is a human step and is listed
  in Known Gaps.

## Rollback Plan

Revert the squash commit. The change is presentation-only and additive in
tests, so a revert restores the prior rendering with no data, schema or
migration consequence. If only the workflow extension needed reverting, the
sponsor directory can be dropped from that step's argument list, which would
return the sponsor suite to unwired without affecting the component fix.

## Audit Evidence

- The pull request for branch `moves/e2e-run58` and its CI run, in particular
  the required **AI surface control catalog** job, whose extended
  directory-sweep step now runs both new suites.
- The census diff in `docs/architecture/test-ci-coverage-census.json`:
  `coveredTestFiles` +2, `uncoveredTestFiles` unchanged.
- The mutation results recorded under QA / Validation above, which are the
  evidence that the new cases are not vacuous — especially the fourth, which
  documents nine deliberate survivors.

## Known Gaps

- **The shared program card still carries the drift, and is unreachable.**
  `src/components/shared/entities/ProgramCard.tsx` clamps its phase index into
  a five-entry `Intake/Diagnose/Design/Execute/Verify` array, so a last-phase
  program is rendered under the fourth phase's name and its progress strip
  reads as fully complete one phase early. It is not fixed here because it has
  no reachable host: its only importers are a composite with no importers and a
  barrel with no importers. This is a retire-or-mount product call, not a code
  fix, and it should be answered before the component is either shipped into or
  deleted.
- **No live signed-in proof.** Neither surface has been walked in the running
  product by this change, so neither is `live-proven`. The sponsor console in
  particular is role-gated to the engagement's own sponsor or a maestro, so the
  walk needs a signed-in session in one of those roles.
- Out of scope: the phase vocabulary carried by surfaces inside the engagement
  route group, which a separate change addresses, and the absence of a single
  canonical source for phase *colour*, which remains a design question with no
  owning module.
