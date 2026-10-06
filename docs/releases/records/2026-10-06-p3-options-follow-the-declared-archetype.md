# 2026-10-06-p3-options-follow-the-declared-archetype — Design-phase options follow the declared archetype

## Release ID

`2026-10-06-p3-options-follow-the-declared-archetype`

## Status

`candidate`

## Plain-English Summary

At the Design phase a Move asks the user to pick one of four solution options. Those four are
chosen from a small set of option families — a service-workflow family, a legal-intake family, a
finance family, an operations family — and the family was picked by scanning the Move's own
evidence for vocabulary.

Two things were wrong with that.

First, there was no option family for a Move whose subject is a governed data foundation: owning
data, certifying metric and entity definitions, lineage, quality rules, platform readiness. A Move
of that kind was handed whichever existing family its prose happened to score, and because its
evidence legitimately discusses clinical and claims data, it scored the service-workflow family.
It was offered four options designed for a contact-centre Move — a different kind of work
altogether — and the Design deliverable would then be built on whichever of those four was chosen.

Second, the code already had a way for a Move to declare what kind of work it is and skip the
guessing. That way could not be used. It read the Move's `program_archetype` column, and that
column is limited by a database constraint to five coarse values, none of which is a declared
archetype identity. So the declaration arm was unreachable from the product: every Move, declared
or not, fell through to the vocabulary scan.

This change adds the missing option family, and gives the declaration a route that actually
carries it — the archetype the Move has already resolved to, which is computed on every Design
render and already passed to this code for other reasons. A Move that declares the governed
data-foundation archetype is now offered four data-foundation options, laddered from naming data
owners and quality rules, through certifying a semantic layer on the current platform, to a
governed platform with an entity identity spine — with leading with the AI/LLM automation layer
offered last, as the recognisable overreach it is.

A Move that declares nothing is unaffected: the vocabulary scan still answers for it, unchanged.

## Layer Impact

Release lane: `global-control-lane` — shared Design-phase behaviour for all clients, not gated by a
flag, reachable only through an explicit archetype declaration.

- **Layer 4 — Products (Moves).** Design-phase (P3) option assembly only. The set of options
  offered for a Move that declares the governed data-foundation archetype changes; no other Move's
  options change.
- No change to layers 1–3. No schema change, no read-model change, no adapter change. Nothing is
  written; option assembly is a pure read-time projection.

## Client Applicability

- All clients: yes — but only reachable for a Move that declares the governed data-foundation
  archetype. No currently-declared Move exists, so the behaviour change is latent until a
  declaration lands.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The new behaviour is reachable only through an explicit archetype
  declaration, which is itself the gate; a Move that declares nothing takes the identical path it
  took before.

## Changes Included

- `src/lib/programs/phase-templates/p3-option-assembler.ts`
  - New `governed_data_foundation` use-case pattern and its four option blueprints.
  - `P3OptionReadinessInput.archetypeId` — the resolved archetype id, read from the
    `ReadinessReport` the Design surface already passes.
  - `inferUseCasePattern` resolves a declared identity from the resolved archetype id first, then
    the coarse column, then the vocabulary scan. Comment records why the coarse column alone could
    never reach the declaration.
  - `ARCHETYPE_USE_CASE_PATTERNS` gains the governed data-foundation key.
- `src/lib/programs/phase-templates/__tests__/p3-options-declared-archetype.test.ts` — new, 10
  cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No host change was needed: the Design surface already passes the whole readiness report to this
assembler, and the field this change reads is a field that report already carried.

## QA / Validation

- **PASS** `npx jest src/lib/programs/phase-templates/__tests__` — 12 suites, 105 tests. The new
  suite is swept by the directory step in `.github/workflows/ai-surface-control-catalog.yml`
  (required check *AI surface control catalog*), not by a per-file list, so it is wired on arrival.
  Registration proof: census `coveredTestFiles` +1 with `uncoveredTestFiles` unchanged at 164.
  One case reads the declared identity from the registry rather than writing it out, so renaming
  the registry id without adding the new spelling to the pattern map fails here instead of
  silently returning the Move to the contact-centre options.
- **PASS** Mutation testing, 7 mutations, 7 killed: removing the declared key; dropping the
  resolved-id arm; removing the new blueprint dispatch; renaming an option label; deleting an
  option from the ladder; flattening an option's time-to-proof score; reversing the precedence of
  the two declaration arms.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on both changed files — 0 problems.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — see PR.
- **NOT RUN** Live signed-in walk. No runtime rollout accompanies this record, and the behaviour it
  changes is not yet reachable by any declared Move, so there is nothing a walk could observe. A
  walk is owed once a Move carries the declaration.

## Rollout Plan

Merge to `main` via squash. The change becomes live with the next repo-owned ACA main deploy; this
record does not authorise a deploy of its own and shifts no traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this record.
- Shared runtime mutators: none. No `az` command is part of this change.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unchanged; to be proven by whichever deploy carries this commit.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable — no flag is added or changed.
- Live signed-in proof required: not for this record (nothing observable yet); required for the
  change that declares the archetype on a Move.

## Rollback Plan

Revert the single squash commit. The change is additive and read-time: no migration, no backfill,
no written state, no flag to unset. Reverting restores the vocabulary scan for every Move,
including a declared one.

## Audit Evidence

- PR URL and its CI run, including the required *AI surface control catalog* check that executes
  the new suite.
- The census diff in this PR: `testFiles` 2743 → 2744 and `coveredTestFiles` 2743 → 2744 with
  `uncoveredTestFiles` unchanged at 164 — the +1 is this change's one test file, and the equal
  covered delta is its registration. Measured after rebasing onto the base that regenerated the
  census; an earlier draft of this record described a two-file staleness that base has since
  removed.

## Known Gaps

- The declaration still has to reach the Move. Until a Move carries the governed data-foundation
  archetype, this change alters nothing a user sees.
- The design-inputs pack still records the coarse column in its own `assumptions`
  (`Archetype: <coarse value>`) and still derives its building-block list from that column's text.
  That text feeds the vocabulary scan, so widening it was deliberately kept out of this change;
  it is a separate correction.
- The precedence of the two declaration arms is pinned by a test but is not observable from the
  product today, because no storable value of the coarse column is a declared identity. The test
  exists for a direct caller and for the day the column widens.
- The host's own pass-through line (`readiness: currentStateReadiness` on the Design surface) is
  pinned only by the `ReadinessReport` type the new suite imports, not by a mounted-host test.
