# u613 — P3 architecture approval preconditions name their own cause

## Release ID

`2026-10-08-p3-architecture-approval-preconditions-name-their-cause`

## Status

`candidate`

## Plain-English Summary

Before either approval path can check that a P3 architecture document was built
on the current basis, it needs two separate facts: the Move's approved solution
option, and the Move's current P3 Context Extract. Both paths read them and then
refused over the whole set with one sentence.

What the reader saw. "The current approved option or P3 context snapshot is
unavailable." — on one path with nothing further, on the other followed by
"Rebuild the architecture chain before approval." Both screens render that
sentence directly, so it is the whole of what the reader is told.

The sentence covers facts with different remedies, and the one remedy it offered
is ruled out by the commonest of them:

- **No approved solution option.** This is the reading with a real in-app
  control: approve a solution option. It is also reachable by an ordinary
  action — regenerating the options document returns it to draft, and the
  approved-option read requires a signed-off one — so a Move that had an
  approved option arrives back in this state without anything going wrong.
  Rebuilding the architecture documents cannot create an approved option. The
  build route already names this fact precisely; both approval paths did not.
- **No current Context Extract, or one whose currency could not be
  established.** Four distinct readings, including the one that must not
  prescribe a rebuild at all, because a rebuild re-reads the same unreadable
  basis and lands on the same refusal.
- **No tenant scope.** Neither read was issued, so nothing was compared. Not a
  report that the document is stale, and no rebuild clears it.

The fix is one shared classifier both paths call. Each refusal now states the
fact that was established and the action that can change it, and withholds a
rebuild instruction from the three causes a rebuild re-encounters unchanged.

Nothing is relaxed or tightened. Each path keeps its own refusal condition: one
requires only that an extract exist and leaves its currency to the comparison
that follows, the other also requires a current extract. The same inputs refuse,
with the same HTTP status and the same refusal code. Only what the refusal
claims, and what it prescribes, is new.

## Layer Impact

- `global-control-lane`: shared app behavior. Two product API routes and one new
  plain module under `src/lib/programs/`, plus one exported helper on an
  existing sibling module so the cause clauses are declared once. No schema, no
  data-plane, no tenant scoping, and no change to any authorization decision.
- No canonical-model, adapter, or intake change. No product projection reads
  anything new.

## Client Applicability

- All clients: yes. Both routes serve every client and the sentences are not
  flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/p3-architecture-lineage-precondition.ts` — new. Classifies
  the shared precondition into seven named conditions, each with the sentence a
  reader gets and a signal saying whether a rebuild can satisfy it. Takes each
  caller's own staleness condition as an argument so neither refusal set moves.
  Delegates the four context-extract readings to the existing classifier that
  already separates them for the queue worker, rather than restating them.
- `src/lib/programs/move-context-freshness-refusal.ts` — exports the clause that
  names which approved-evidence read could not be made, so the interactive paths
  state the same cause in their own register instead of declaring a second copy.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`
  — the P3 architecture precondition refusal carries the classifier's sentence.
  The two reads are now skipped when no tenant scope resolved, which is what the
  separate tenant-scope refusal above them already implied.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts`
  — the same, with its own staleness condition preserved.
- Test suites: 22 cases for the module, three on the sign-off route, two on the
  client-approval route.

No workflow, generated artifact or census file is touched by this change.

## QA / Validation

- `npx jest src/lib/programs/__tests__/move-context-freshness-refusal.test.ts` —
  **PASS**, 42 of 42 — 22 new for this module, 20 pre-existing for the sibling
  classifier.
- `npx jest --runTestsByPath '…/sign-off/__tests__/route.test.ts'` — **PASS**,
  28 of 28 (24 pre-existing).
- `npx jest --runTestsByPath '…/client-approval/__tests__/route.test.ts'` —
  **PASS**, 20 of 20 (18 pre-existing).
- `npx jest src/lib/programs/__tests__` — **PASS**, 179 suites, 2,343 of 2,343.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` over all seven changed files — **PASS**, exit 0.
- `npm run audit:tenancy-fence-coverage` — **PASS**, no new gap.
- `npm run audit:test-ci-coverage` — this change adds no test file, so no count
  moves. The audit reports `+1/+1` against the committed file; that drift is the
  base's and is proved below, not regenerated here.
- Prettier — the sibling classifier and its suite, and the sign-off route, are
  **not** prettier-clean on the base. Verified in place, at the base commit,
  that every reformatting prettier wants in them sits in pre-existing lines.
  Three reformattings prettier wanted inside this change's own added hunks were
  applied by hand, so the diff carries no unrelated churn and every added hunk
  is clean.
- **Where the module's cases live, and why.** They are a second `describe` in
  the sibling classifier's existing suite under `src/lib/programs/__tests__`,
  a directory swept by the required AI surface control catalog, so a merge can
  fail on them. Co-located deliberately: the two classifiers answer the same
  question about the same extract and one delegates to the other, and adding no
  test file keeps this branch free of the committed-census collision that has
  stalled four of the last six releases while two PRs are in flight.
- **Which test coverage was absent before.** The sign-off route suite had no
  case for any P3 architecture deliverable at all — it mocked neither the
  approved-option read nor the extract read, so the whole block was unexercised.
  The client-approval suite had one case, named for stale lineage, which in fact
  resolves both reads successfully and refuses at the comparison below them; it
  pinned only the refusal code, so it stays green either way.
- **Mutation testing: 11 applied, 10 killed.** Each mutation asserted its own
  application before the run, and each run named the failing cases.
  Reverting each route to the collapsed sentence (2 failures each); each route
  passing the other's staleness condition (1 each, which is what pins that
  neither refusal set moved); reading the extract before the approved option
  (6); the absent-option refusal claiming a rebuild can clear it (2); the
  unevaluable-basis refusal prescribing a refresh and rebuild (4); dropping the
  empty-fingerprint normalization (1); collapsing the three cause clauses to one
  constant (1); and the unresolved-tenant-scope refusal claiming a rebuild can
  clear it (2).
- **One mutation survived, diagnosed as behaviour-neutral.** Removing the
  `default:` label from the condition switch changes nothing: all six conditions
  the delegated classifier can return are listed explicitly, so the label is a
  guard against a future seventh condition rather than a live branch. It is kept
  because the alternative — an exhaustiveness check — would make a future
  seventh condition return no refusal at all, which fails open. No test was
  weakened to accommodate it.
- **A harness correction worth recording.** The first mutation run reported four
  survivors, all route-level. The totals gave it away: 42 tests, not 91. A jest
  positional argument is a regex, so the bracketed dynamic-route segments matched
  nothing and only the module suite ran. Re-run with `--runTestsByPath`, all four
  were killed.
- Not run: `npm run test:e2e` (needs live credentials), and any live signed-in
  walk. See Known Gaps.

## Rollout Plan

Merge to main. No migration, no flag, no environment variable, no worker job. It
becomes active on the next routine Azure Container Apps deploy of main through
the repo-owned workflow; this change neither requires nor triggers one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: not applicable — no runtime update is requested.
- ACA runtime invariant: unchanged; no revision, traffic weight, or Container App
  template is touched.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable; no flag or environment variable.
- Live signed-in proof required: **yes**, and still owed. See Known Gaps.

## Rollback Plan

Revert the squash commit. The change is additive prose on two refusal paths plus
one new module with no other callers and one new export on an existing module;
reverting restores the previous bodies exactly, since neither status nor refusal
code was changed in either direction. No data is written, so there is nothing to
unwind.

## Audit Evidence

- The PR and its CI run.
- The required AI surface control catalog job's `src/lib/programs/__tests__`
  step, which runs the module's cases.
- The mutation tally above, reproducible from the three named suites.

## Known Gaps

- **Not live-proven.** No signed-in walk has been taken. The direction that
  matters most on a walk is the regression one: a document whose recorded
  lineage really is stale must STILL get the comparison's own sentence, which
  this change does not touch. Owed to Anand, alongside the walks still owed for
  u605, u607, u608, u609, u610 and u612.
- **The two route test directories are merge-dark.** Both are named only by a
  workflow that is required by nothing, so the five route cases added here run
  locally and in that workflow but cannot block a merge. The module's 22 cases
  are in a required directory and carry the proof. Wiring those two directories
  is already the next candidate on the Moves route backlog and is held only
  because it needs the same workflow files an in-flight release is editing.
- **The committed census on the base is one behind its own tree**, for the sixth
  release in a row. Proved here rather than assumed: with a completely clean tree
  at the base commit the audit reports the identical `+1/+1`. Not caused or fixed
  here, and deliberately not regenerated — regenerating would carry another
  release's `+1` and would collide with two in-flight branches. Worth a process
  call on whether the gate should read a tree-derived regen instead of a
  committed count.
- **The unreachable narrowing guard.** Each route keeps a short refusal below the
  classifier's, labelled unreachable, so the comparison that follows narrows its
  two reads without a non-null assertion. It carries the previous sentence
  because no reader can reach it; if a future change makes it reachable, it is
  the one place the old collapsed wording survives.
- **Reachability is stated, not overclaimed.** The absent-approved-option reading
  is reachable by regenerating the options document after architecture documents
  exist; the unreadable-basis readings need an approved-evidence read to fail.
  Neither is a first-load path, and both had no sentence a reader could act on.
- Out of scope: the 500 catch-all on both routes still puts raw internal error
  text under `message`, which neither client reads. Carried.
