# 2026-10-06-moves-documents-list-scoped-to-route — Files & Evidence lists the documents the Move's route builds

## Release ID

`2026-10-06-moves-documents-list-scoped-to-route`

## Status

`candidate`

## Plain-English Summary

A Move's confirmed solution route decides how much design work its Design phase
owes. A Move delivering a data product with no material workflow or role change
builds two documents there; one delivering a bounded process change builds three;
every other route builds all six. The product already knows this: the phase
workspace hands its "Approve & Build" control exactly the narrowed set, and the
Design exit gate reads only the documents in it.

The phase-by-phase document list on the Files & Evidence page did not. It listed
the full six for every Move, and stated its per-phase tally over six. Two
consequences, both visible to a signed-in user:

- The tally understated a finished phase. A Move that had built both documents
  its route declares — everything the route asks for, and enough for the phase's
  exit gate — read "2/6". The phase was complete and the page said it was a third
  done.
- Four rows named documents nothing would ever produce. "Approve & Build" does
  not declare them, so they would have stayed un-generated for the life of the
  Move, with no control on any screen that fills them.

This change derives the list and the tally from the same declaration the build
path uses. One deliberate exception: a route can be corrected after documents
have already been built, and Files & Evidence is where a person goes to find what
exists, so a document outside the route's set is still listed when this Move
actually has something to show for it — a saved file, or a build attempt that
failed. Narrowing hides nothing that exists; it only stops promising what will
never arrive.

No gate, no stored value, and no generation behaviour changes. This is what the
page says about the set.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- **Layer 4 (Products · Moves)** only. One read-only surface — the phase document
  list on Files & Evidence — plus two new library modules it reads. The canonical
  model is untouched: no schema, no write path, no gate evaluator, no deliverable
  registry entry, and no change to which documents a build produces.

## Client Applicability

- All clients: yes — this is unflagged behaviour on a shared read-only surface.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a correction to what an existing list shows,
  not a new capability, and it is inert for any Move that has not recorded a
  route — which is every Move whose Discover phase has not been cleared. For
  those, the list and tally are byte-for-byte what they were.

## Changes Included

- `src/lib/programs/phase-document-display-set.ts` (new) — the pure set decision:
  the route's build set, resolved through `resolvePhaseBuildSet`, plus retained
  off-route documents this Move has output for, in canonical order.
- `src/lib/programs/load-move-confirmed-route.ts` (new) — loads a Move's
  confirmed route for a read-only surface, from the two capture answers and the
  approved Discover evidence the validation cites. Best-effort: every failure
  resolves to null, which callers must read as "not narrowed".
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — loads the route and
  derives the per-phase list and tally from it. The previous
  `.map(find).filter(Boolean)` over the unnarrowed canonical keys is replaced, so
  a key that stops resolving now drops its row through the same resolution that
  refuses the build, instead of being silently dropped here.
- `src/lib/programs/__tests__/phase-document-display-set.test.ts` (new, 17 cases).
- `src/components/strategic-moves/__tests__/phase-documents-panel-route-scope.test.tsx`
  (new, 5 cases) — renders the real server component, so the wiring is pinned and
  not just the pure decision.
- `.github/workflows/ai-surface-control-catalog.yml` — names the new component
  suite in the step that runs that directory's suites by exact path. That step's
  own comment requires it: the directory is not swept, so a new suite beside
  those controls runs only if it is named.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/phase-document-display-set.test.ts` — 17/17.
- **PASS** `npx jest src/components/strategic-moves/__tests__/phase-documents-panel-route-scope.test.tsx` — 5/5.
- **PASS** `npx jest src/lib/programs/__tests__ src/components/strategic-moves/__tests__` —
  162 suites / 1796 tests, including the pre-existing suite that renders this same
  panel (9/9, unchanged).
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over all five changed source files — exit 0.
- **PASS** Mutation testing: 9 deliberate mutations, 8 killed.
  - Ignoring the loaded route in the set decision: 9 cases fail.
  - Dropping the "not already in the build set" guard: fails.
  - Retaining every off-route document regardless of output: 9 cases fail.
  - Ordering retained rows before the build set: fails.
  - The panel passing `null` instead of the route it loaded: 3 cases fail.
  - The panel passing a predicate that is always false: fails.
  - Dropping failed/in-flight attempts from the retention rule: fails.
  - Counting a failed build as generated: fails.
  - **The ninth survived and was a false survivor, so the code changed, not the
    suite.** Removing `previousRunByKey` from the retention rule killed nothing
    because that map is only ever populated alongside `runStateByKey`, so it could
    not add a key the preceding term had not already added. The redundant term is
    removed and the reason recorded where it was.
- **PASS** First run of the new component suite reported it as an untriaged unrun
  file and ranked it first in the census. Naming it in the workflow step returned
  `uncoveredTestFiles` to 164 unchanged while `coveredTestFiles` rose, which is
  the registration proof.
- **NOT RUN** Live signed-in walk. The surface this corrects is the Design phase
  of a Move that has recorded a route, and no Move has recorded one yet — the
  Discover phase it is recorded in is blocked on a pending evidence load and a
  human approval outside this lane. Until then this change is provably inert, and
  it is the reason the behaviour is pinned by a suite that renders the real
  component rather than by a walk.

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no environment variable, no
worker job. It reaches users with the next repo-owned Azure Container Apps deploy
of `main`; nothing in this change requires or triggers one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. No Azure command is part of this change.
- Approved image digest: not applicable; no runtime update is requested here.
- ACA runtime invariant: not asserted by this record. It carries no live claim.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none; the change is unflagged.
- Live signed-in proof required: yes, before any `live-proven` claim — and it
  cannot be produced until a Move has recorded a route. This record claims
  `merged` only.

## Rollback Plan

Revert the squash commit. Nothing persists: the change reads existing rows and
renders, so reverting restores the previous list and tally immediately with no
data to migrate back and no stored value to repair. Reverting also removes the
workflow line naming the new suite, which is correct — the suite goes with it.

## Audit Evidence

- The PR for this branch and its CI run, including the `AI surface control
  catalog` job, which is where the new component suite now runs.
- `docs/architecture/test-ci-coverage-census.json` on this branch: the new
  component suite is covered and `uncoveredTestFiles` is unchanged at 164.
- The two new suites are the behavioural evidence. The pure suite asserts the set
  for each route including the unnarrowed default; the component suite asserts
  what the page renders, with the tally read out of the phase's own section header
  so another phase's identical tally cannot satisfy it.

## Known Gaps

- **The Design phase is the only route-scoped phase today.** The build-set
  declaration narrows that phase and no other, and this change follows it rather
  than extending it; a case pins every other phase as unaffected by the route. If
  a later phase becomes route-scoped, this list follows automatically.
- **Retention is "has output", which is wider than "is generated" on purpose.**
  An off-route document whose last build failed keeps its row and sits in the
  tally's denominator without being counted as generated. That is the honest
  reading — there is a failure to act on — but it means such a Move's tally can
  read lower than the number of documents its route owes.
- **The route load is best-effort and silent.** If the read fails, the surface
  falls back to the full set, which is the pre-existing behaviour and never hides
  a row; it does not tell the reader that it fell back. Acceptable for a
  read-only list, and worth revisiting if this loader is reused somewhere a
  silent widening would mislead.
- **Census attribution.** The regenerated census counts three more test files than
  the copy committed on `main` while this change adds two, so one file in the tree
  was already uncounted before this branch. The same standing drift was recorded
  at two earlier bases. The contribution of this change is two covered test files
  with `uncoveredTestFiles` unchanged.
- **The tally is still a count of documents, not of readiness.** A generated
  document that is poor or unapproved counts the same as a signed one. Out of
  scope here; this change was about counting the right set.
