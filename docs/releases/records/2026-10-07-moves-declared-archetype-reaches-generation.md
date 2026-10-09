# 2026-10-07-moves-declared-archetype-reaches-generation — A declared archetype reaches the generation path

## Release ID

`2026-10-07-moves-declared-archetype-reaches-generation`

## Status

`candidate`

## Plain-English Summary

When a phase's documents are approved and built, the build is supposed to grade the
Move's evidence against the framework a human DECLARED for that Move. It was not.

The build endpoint is handed one archetype by the screen, and the only archetype the
screen has to give is the Move's coarse program archetype — a five-value legacy field.
None of those five values names a discovery framework. So framework selection fell
through to keyword guessing on a single coarse word, for every Move built this way, and
the Move's own declaration contributed nothing at all. Worse, nothing downstream could
even report that a declaration had been dropped, because none was ever passed in to be
dropped: the "a declaration was supplied and discarded" signal stayed empty, so the
selection presented itself as a clean default.

The consequence is not a crash. Documents still generated. They were graded against,
and written against, a framework nobody chose — and the uploaded evidence was filed into
that other framework's families.

This change makes the endpoint resolve what was actually declared for the Move,
server-side, and hand it to the context builder alongside the archetype the request
carried. The declaration rule is not a new one: it is the same shared rule the evidence
upload, solution-pattern and risk-assessment endpoints already apply. This path was the
one resolving nothing. The archetype the request carries is unchanged and still travels
as before, so a Move that declares nothing behaves exactly as it did.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior on a path every client's
Moves use, not feature-gated and not client-scoped.

- **Layer 4 — Products (Moves).** The phase build endpoint now resolves the Move's
  declared identity rather than trusting only what the client sent. Identity is declared,
  never inferred.
- **Layer 3 — Canonical model (read-only).** One additional read of the Move's own row to
  recover its declaration. No writes, no schema change, no new dataset.

No other layer changes. No migration.

## Client Applicability

- All clients: yes — behavior change for any Move that declares an archetype naming a
  known framework. A Move that declares nothing, or declares something that names no
  known framework, is unchanged.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a correctness fix on an existing path and is
  deliberately not flagged; the no-declaration case is provably unchanged.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts` — resolves the Move's declared
  archetype with the shared precedence rule and passes it to the context builder.
  Best-effort: a failed row read yields `null`, which is exactly the previous behavior,
  and never fails the build.
- `src/lib/programs/move-context-extract.ts` — accepts `declaredArchetypeId` and passes it
  to framework resolution at both call sites (the reported framework, and the per-row
  evidence-to-family mapping).
- `src/lib/programs/__tests__/move-generation-declared-archetype.test.ts` — new suite
  (46 cases).
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — three cases
  pinning the endpoint's pass-through, plus the mock for the new row read.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs src/lib/deliverables` — 467 suites, 6507 tests.
- **PASS** `npx jest src/lib/programs/__tests__ src/app/api/v1/deliverables` — 154 suites,
  1790 tests.
- **PASS** `npx jest <the three directly affected suites>` — 82 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  exit 0.
- **PASS** `npx eslint` over the four changed/added source files — exit 0.
- **PASS** census regenerated: test files 2815 → 2816, covered 2651 → 2652, uncovered flat
  at 164. The new suite is CI-covered, not dark. These figures were re-measured after
  `main` advanced mid-change: a sibling landed a test file and both census versions then
  read 2815/2651, so the merge was clean while the committed count was wrong for the
  combined tree. Regenerating after the merge is what produced 2816/2652.
- **PASS** mutation testing, 5 of 5 killed:
  1. per-row call site loses the declaration → 1 failure;
  2. reported-framework call site loses the declaration → 23 failures;
  3. endpoint drops the pass-through → 3 failures;
  4. endpoint sends the request's archetype in place of the declaration → 2 failures;
  5. best-effort guard removed → 1 failure.
- **PASS** the suite measures the defect's precondition rather than assuming it: the five
  legacy archetype values are asserted to name no framework and no archetype pack, and
  each is asserted to resolve on a non-declared basis with an empty discarded-declaration
  signal. A self-guard asserts the framework catalog has at least two declarable entries
  and that at least one differs from what inference picks, so the table is not vacuous.
- **NOT RUN** live signed-in walk. This release does not claim `live-proven`.
- **NOT RUN** end-to-end generation against a real worker. See Known Gaps 1.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and deploys the
image; no separate step. No migration, no flag, no env var, no worker image change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that
  may shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned here.
- ACA runtime invariant: to be proven after deploy (template image, 100%-traffic revision
  image, and worker job images all matching the approved digest). Not claimed by this
  record.
- Worker image invariant: unchanged — no worker contract field was added.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, before any `live-proven` claim.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned workflow. There is no data
migration and no persisted contract change, so revert is complete and immediate: the
endpoint returns to passing no declaration, and framework selection returns to inference.
Nothing written while this was live needs repair — the declaration is read at build time
and not stored by this change.

## Audit Evidence

- PR URL and its CI run (to be linked on open).
- `npm run release:check -- --base origin/main --head HEAD` run locally before open.
- The mutation results above are reproducible from the five described edits.
- The measured precondition (five legacy values naming no framework and no archetype pack)
  is asserted in the new suite, so it is re-checked on every CI run rather than resting on
  this record.

## Known Gaps

1. **The archetype pack is still unresolved on this path, and that is the larger half.**
   Measured this run: all five legacy archetype values resolve `archetypeId: null`,
   `origin: "unresolved"`, no pack — while the declared id resolves a real built-in pack.
   The pack is selected inside the worker from the run payload's archetype field, so
   closing it means adding a declaration field to the persisted job payload and the
   orchestrator request, then reading it at two sites in the brief registry. That crosses
   the worker contract and cannot be proven from the web side alone, so it is deliberately
   left out of this change rather than shipped unproven. This record's fix covers the
   context-builder half only: framework selection and evidence-to-family mapping.
2. The document-brief registry holds no entry for this module at all (zero entries), so
   brief lookup on this path misses regardless of the archetype. Not a regression and not
   touched here; recorded because it bounds how much the archetype currently decides.
3. The declared value is still not validated against the known-framework set before use.
   An unknown declaration is carried as an inference seed and discarded, which is the
   resolver's own documented rule and is pinned here — but no surface yet TELLS a person
   their declaration was discarded. The signal now exists end to end; nothing renders it.
