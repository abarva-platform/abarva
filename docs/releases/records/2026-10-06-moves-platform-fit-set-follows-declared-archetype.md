# 2026-10-06-moves-platform-fit-set-follows-declared-archetype — A Move's platform-fit options follow its declared archetype

## Release ID

`2026-10-06-moves-platform-fit-set-follows-declared-archetype`

## Status

`candidate`

## Plain-English Summary

The Design phase asks a named owner one classification question: where does the capability this
Move builds actually run? Five options answer it, and the owner picks one and writes a rationale.
That record goes into the Move's charter as an explicit human judgement, and everything downstream
reads it as one.

The five options were the same for every Move. They were written for one kind of work — a
capability sitting beside an existing system of record — and one of them names that system
outright. A Move that declares it is building something else was asked the same question with the
wrong five answers, and the picker only accepts a recognised option: so the owner either chose a
label that misdescribes the Move, or recorded nothing and left the classification unanswered.
Neither outcome is visible afterwards. A misdescribing label looks exactly like a considered
judgement.

The option set is now resolved from the Move's DECLARED archetype. A Move that declares nothing, or
declares something with no configured set, is served and validated exactly as before. The product
already made this repair for the Design phase's A/B/C/D solution options, which follow a declared
archetype rather than a guess at the Move's prose; the platform-fit picker was the surface that
join had not reached.

One configured set is added, for the data-foundation archetype, so that archetype's owners are
asked where the governed data capability lives rather than where a different kind of capability
lives. It keeps the shipped set's five-way shape and its three routing dispositions deliberately
unchanged: this is a retargeting of the same taxonomy, not a new one.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behavior for every client, gated by an existing
tenant feature flag. No client-scoped schema, seed, ingestion, retrieval, or private data-plane
change, so this is not `client-data-lane`.

- **Layer 4 (Products — Moves).** The Design-phase platform-fit entry point and its API. Which
  options a Move is offered, and which it may record, now depend on its declared archetype.
- **Layer 3 (Canonical model) — read only.** The declared archetype is read through the existing
  resolver, the same one the discovery blueprint and evidence-readiness paths already use. Nothing
  about how identity is declared changed, and nothing writes an archetype here.

No change to gate evaluation, phase advancement, deliverable generation, evidence handling, or any
metric. The classification has no governance consequence today and did not gain one here.

## Client Applicability

- All clients: no. The surface is behind an existing tenant-gated flag.
- Specific clients: whichever tenants the existing flag already enrols; this change adds no
  enrolment and removes none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_solution_pattern_gate_v1` (pre-existing, unchanged). Flag off ⇒ the entry
  point does not render and both API verbs return 404, exactly as before.

## Changes Included

- `src/lib/programs/solution-pattern-catalog.ts` (new) — the option sets, the declared-archetype
  catalog, the resolver, the read-validation union, and the scoped write check.
- `src/lib/programs/solution-pattern.ts` — imports and re-exports the type and the shipped set so
  every existing consumer is unchanged; read validation widened to the catalog union.
- `src/app/api/v1/programs/[programId]/solution-pattern/route.ts` — GET returns the resolved set;
  POST validates against it.
- `src/components/strategic-moves/solutioning/SolutioningPanel.tsx` — renders the set the route
  serves, with the shipped set as the initial value and the fallback.
- `src/lib/programs/__tests__/solution-pattern-catalog.test.ts` (new, 16 cases).
- `src/app/api/v1/programs/[programId]/solution-pattern/__tests__/route.test.ts` (new, 6 cases).
- `src/components/strategic-moves/solutioning/__tests__/SolutioningPanel.test.tsx` — 2 cases added.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__ solution-pattern/__tests__/route
  src/components/strategic-moves/solutioning --runInBand` — 120 suites, 1186 tests. This spans the
  whole `src/lib/programs/__tests__` directory the required catalog job sweeps, not only the new
  suites.
- **PASS** `npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on both new modules, all three suites, and both changed directories —
  exit 0, no findings.
- **PASS** Mutation battery: 10 mutations, 10 killed. Resolver ignores the catalog; resolver matches
  loosely instead of exactly; write validation widens to the whole catalog; read validation narrows
  to the shipped set; the panel renders the module constant instead of the served set; the panel
  drops its empty-set guard; GET drops the declaration; POST drops the declaration; a configured
  option carries an unrecognised routing disposition; a catalog key typo that matches no archetype.
  Each anchor was asserted to appear exactly once before mutating, and the tree was verified
  identical to the index afterwards.
- **PASS** Census regenerated on the current base. Delta is +4 test files / +4 covered /
  +1 directory. Exactly +2 of those are this change's two new suites; the other +2 are inherited
  drift — the census committed on main understates the tree by 2. Measured, not assumed: with this
  change's two suites moved out of the tree, regenerating still moves the committed numbers by +2.
  Uncovered test files are unchanged in both measurements, so nothing new is dark.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — see the PR run.
- **NOT RUN** Live signed-in walk of the Design-phase entry point. The surface reads and writes the
  private data plane and cannot be rendered signed-in from a dev box; it needs an authorized
  in-product check.

## Rollout Plan

Squash merge to `main`. No migration, no new flag, no environment variable, no worker job, no
traffic change. The code reaches the shared runtime through the repo-owned ACA main deploy workflow
on the next build, like any other merge to `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing here deploys.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template
  change, no registry action.
- Approved image digest: n/a for this change; the next main deploy builds and pins it as usual.
- ACA runtime invariant: unchanged by this change; it is proven by the deploy workflow, not here.
- Worker image invariant: unchanged. No worker job is touched.
- Feature/env flag update path: none. The flag already exists and its enrolment is untouched.
- Live signed-in proof required: yes, before this is called live-proven for any client — an
  authorized in-product check that the Design-phase entry point offers the declared archetype's
  options and refuses one from another set.

## Rollback Plan

Revert the merge commit. Nothing persists that a revert cannot undo:

- No migration and no schema change.
- A classification recorded while this is live stays readable after a revert **only if** it came
  from the shipped set. A classification recorded from a configured set would stop being readable,
  because the pre-change read validation recognises the shipped five only — the charter row
  survives the revert untouched, but the reader returns null for it and the picker shows the
  question as unanswered. The field is a human judgement with a rationale and no governance
  consequence, so the loss is a re-answer, not a data-integrity event. Re-applying the change makes
  the stored value readable again.

That asymmetry is why read validation here spans every set the catalog knows while write validation
is scoped to the Move's own — a recorded judgement should not vanish because a Move's declaration
changed afterwards. Both directions are pinned by tests.

## Audit Evidence

- The PR and its CI run.
- The two new suites and the two added panel cases: they assert the served set, the exact-match
  resolution against four near-miss spellings that any keyword rule would match, both directions of
  the scoped write check, and the never-orphan read.
- The mutation battery above, which is what distinguishes these tests from ones that would pass on
  the fallback.

## Known Gaps

- **The configured set's vocabulary needs a product call.** The five labels and descriptions added
  for the data-foundation archetype are a retargeting of the shipped taxonomy by this change's
  author, not a set taken from source material. The shipped set came from a named model; this one
  mirrors its shape and its three routing dispositions, which is defensible, but the words a named
  owner classifies with are a product decision. Flagged for review; changing them later is a
  one-file edit with no data migration, since nothing is recorded against them yet.
- **Still no governance consequence.** The classification remains context only — it routes nothing
  and gates nothing. That was already true and is unchanged; the pre-existing record for the flag
  names it as a known gap too.
- **Every other archetype keeps the shipped set.** Only one configured set is added. Any other
  archetype whose owners would be asked the wrong five is still asked them; adding a set is now a
  catalog entry plus the hygiene assertions, with no code change.
- **No live signed-in proof.** See QA above.
