# U-578 — A declared archetype reaches the QUEUED phase build's job payload

## Release ID

`2026-10-07-queued-phase-build-declared-archetype`

## Status

`candidate`

## Plain-English Summary

A Move can record which use-case archetype it is. That declaration selects the evidence framework
its discovery plan prescribes and the exhibits, tables and governance note its board-grade
deliverables carry.

When a user approves a phase and asks for its documents, the request does not generate them inline.
The route persists a job and a background worker rebuilds the generation request **from that job
payload alone**, because the web replica that enqueued it may be gone by then. So whatever archetype
the payload carries is the archetype the documents are composed against.

The payload carried whatever archetype the client posted, and what the client posts is the Move's
coarse legacy classification column. Measured against the shipped catalogs, **none of the five
values that column accepts names an archetype in either the archetype-pack catalog or the
discovery-blueprint catalog** — all five resolve nothing. The route already resolved the Move's real
declaration a few lines earlier, for a different consumer; it simply never reached the job.

The visible consequence is that every queued phase build prescribed the default evidence framework
rather than the one the Move's declared archetype defines, and composed its deliverables without
that archetype's exhibits and tables. The failure was silent: the documents rendered perfectly and
said nothing about a declaration having been dropped.

This change makes the payload's archetype a question of which candidate *names a known archetype*,
rather than which one the client happened to send.

## Layer Impact

Release lane: `global-control-lane` — shared enqueue logic in the phase-build route, applying to
every client with no feature gate.

- **Layer 3 — Canonical model:** unchanged. No schema, no migration, no new stored column. The fix
  is which already-stored value is written into a per-run job payload.
- **Layer 4 — Products (Moves):** a queued phase build now composes against the archetype the Move
  declared. For a Move that declares nothing, and for any caller that already posts a real archetype
  id, behaviour is byte-for-byte unchanged.

## Client Applicability

- All clients: yes — shared control-lane enqueue logic.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a no-op for any Move whose declaration names no archetype, and a
  no-op for any request that already names one, which is why it ships unflagged.

## Changes Included

- `src/lib/programs/deliverables/orchestrated/phase-build-use-case-archetype.ts` — new. The
  queued-path decision and its reasoning.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the resolved archetype is written into the
  job payload and onto the run row, in place of the posted value.
- `src/lib/programs/deliverables/orchestrated/__tests__/phase-build-use-case-archetype.test.ts` —
  new, 23 cases.
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — three pass-through pins on
  the payload end.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

The naming oracle (`namesCatalogArchetype`) is **reused** from the in-process rule rather than
restated. It is the same question — does this token name an entry in one of the two catalogs the
resolved value is looked up in — and two derivations of "whose archetype is this" would drift apart.
The rule nonetheless needs its own module because its *candidates* differ: the in-process builder
chooses between a Move's two declaration-bearing fields, whereas this route chooses between a
client-posted value and a server-resolved declaration, and the posted value must keep winning when
it already names an archetype.

Note the sibling rule in `archetypes/declared-archetype-precedence.ts` is deliberately not the
oracle here: it asks whether a token names an entry in the Move archetype *registry*, a condition
this consumer never requires.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/deliverables/orchestrated/__tests__` and the route suite
  (both swept by directory-wired steps of required checks): new module suite 23 tests; route suite
  32 tests (29 → 32).
- **PASS** — `npx jest src/lib/programs/deliverables src/lib/deliverables/orchestrator
  src/app/api/v1/deliverables src/lib/programs/discovery`: 79 suites / 1085 tests.
- **PASS** — `npm run test:behaviors`: 202 suites / 2102 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint src/lib/programs/deliverables/orchestrated/
  src/app/api/v1/deliverables/generate-phase/`, exit 0.
- **PASS** — census regenerated: `testFiles` 2817 → 2818, `coveredTestFiles` 2653 → 2654,
  `uncoveredTestFiles` flat at 164. The +1 covered with uncovered unchanged is the proof the new
  suite is reached by a CI runner rather than added dark.
- **PASS** — mutation testing, **7 mutations, 7 killed**:
  1. payload reverts to the posted label (the original defect) — killed by a route pin.
  2. run row reverts to the posted label (both sites) — killed by a route pin.
  3. declaration wins unconditionally — killed, 2 cases.
  4. accept the declaration without the naming check — killed.
  5. return the fallback instead of the inference seed when nothing names an archetype — killed,
     3 cases.
  6. drop input trimming — killed.
  7. never substitute the declaration — killed, 13 cases.
- **PASS** — the premise is asserted, not assumed: the suite reads the legacy label set off the
  `ArchetypeKey` union as an exhaustive `Record`, so adding a label without deciding whether it
  names an archetype breaks compilation rather than silently widening what may be posted
  unchallenged. The pack-only and blueprint-only archetype sets are derived from the catalogs and
  their non-emptiness asserted, because the two catalogs overlap in exactly one id — a suite
  exercising only that id would pass with either catalog arm of the reused oracle removed.
- **NOT RUN** — live signed-in walk. This change alters no UI control and no stored schema; proving
  it end-to-end requires a Move with a declared archetype, which is a data-lane precondition not yet
  met (see Known Gaps).

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no env var. The worker image is unchanged — the
worker already reads `payload.useCaseArchetype`; only the value written into that field changes.
Behaviour becomes active for the next phase build enqueued after deploy; nothing is cached across
the change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged by this release.
- Shared runtime mutators: none. This release contains no Azure command, no workflow edit and no
  change to any digest-pinned image reference.
- No shared Product/Lab traffic is shifted by this change.

## Rollback Plan

Revert the squash commit. The change is confined to one new module, one route's choice of value, and
test files; there is no migration to unwind and no stored schema to reverse. Runs already queued
carry their archetype in their own payload and are unaffected either way — a revert changes only
what subsequent enqueues write.

## Audit Evidence

- The new module states the measurement it rests on and why the oracle is reused rather than
  restated.
- The route comment at the decision point records that the worker rebuilds from the payload alone,
  which is why the declaration has to reach the payload.
- Mutation results above, with each mutation named and its killing cases counted.
- Census delta recorded above as the proof the new suite is CI-reached.

## Known Gaps

- **The adaptive-depth resolution still reads the posted archetype.** `resolveAdaptiveDepth` in the
  same route is deliberately left on the posted value. Feeding it the declaration would change
  section depth and word budgets for every Move, which is a separate behavioural change deserving
  its own measurement rather than a silent rider on this one.
- **Nothing surfaces a discarded declaration.** This module reports an `unusedDeclaration`, and the
  in-process rule reports an `unknownDeclaration`, and no product surface renders either. A person
  still cannot learn from the UI that their Move's declaration did not decide a build.
- **Data-lane preconditions are unchanged.** No Move for the demo tenant has had an archetype
  declared, and the declaration and evidence-load jobs have not been run, so this fix cannot be
  observed end-to-end yet. Those steps are the data lane's and a human approval's, not this lane's.
- This record depends on the in-process precedence rule that introduces `namesCatalogArchetype`
  landing first; it is queued ahead of this change.
