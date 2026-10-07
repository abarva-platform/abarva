# 2026-10-06-phase-intelligence-declared-archetype — Phase Intelligence reports the archetype a Move declared

## Release ID

`2026-10-06-phase-intelligence-declared-archetype`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace has an Intelligence view with three readouts: the key design decision,
a "Strategic signal", and the governed gate/evidence truth. The Strategic signal is meant to show
a value lever or a pain theme from a curated industry/function pack — the shipped reference
material for a specific business function.

A Move only has a function pack if one was recorded against it. When none was, the panel scored the
Move's text — its code, name, coarse archetype column, phase label, status, tenant name, industry
code, and the whole charter serialised as JSON — against every function pack for that industry and
spoke for whichever scored highest.

That fallback had no idea a Move can *declare* what kind of work it is. Archetype identities and
function pack keys are two separate id spaces, and no function pack covers a governed data
foundation. Measured on this code: a Move whose charter contains nothing but the governed
data-foundation declaration bound an unrelated clinical-interoperability pack at 0.188 confidence —
just over the 0.18 floor the classifier applies — and the panel then presented that pack's named
value lever and planning range as this Move's strategic signal. Add the kind of prose a
data-foundation charter legitimately carries, and the same input instead bound the contact-centre
pack at 0.212. Both are a wrong answer that renders perfectly: a labelled planning range for a
different kind of work, on screen, under the heading "Strategic signal".

Identity is declared, never inferred. This change moves the binding decision into its own module
and gives it one new rule: when a Move declares an archetype the registry recognises, the keyword
guess does not run. The panel says what the Move declared, says plainly that no curated pack covers
it, and shows no function key, no binding confidence, and no benchmark it has no basis for.

A Move that declares nothing recognisable is unaffected. The coarse `program_archetype` column
alone is deliberately not a declaration: none of the five values a database constraint permits in
that column names a registry archetype, so every legacy Move reaches the classifier on exactly the
path it took before — including the short-name alias arm.

## Layer Impact

Release lane: `global-control-lane` — shared Moves phase-workspace behaviour for all clients, not
gated by a flag, reachable only through an explicit archetype declaration.

- **Layer 4 — Products (Moves).** The Intelligence view's Strategic signal item only. No other item
  in that panel changes, and no other surface consumes this decision.
- No change to layers 1–3. No schema change, no read-model change, no adapter change. Nothing is
  written; the binding is a pure read-time projection.

## Client Applicability

- All clients: yes — but only reachable for a Move that declares an archetype the registry
  recognises. No currently-declared Move exists, so the behaviour change is latent until a
  declaration lands.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The explicit declaration is itself the gate; a Move that declares nothing
  takes the identical path it took before.

## Changes Included

- `src/lib/programs/phase-intelligence-function-binding.ts` — new. Holds the binding decision that
  was inline in the summary builder: `resolvePhaseIntelligenceFunctionBinding` returns a discriminated
  result (`bound` / `declared_archetype` / `unbound`), `declaredArchetypeForBinding` resolves the
  declaration through the canonical `resolveDeclaredProgramArchetypeId` precedence and accepts it
  only when `archetypeForDeclaredId` recognises it, and `buildMoveFunctionBriefText` plus the legacy
  short-name alias move across verbatim.
- `src/lib/programs/phase-intelligence-summary.ts`
  - Calls the new module instead of resolving the binding itself; the moved helpers are deleted, not
    duplicated.
  - `buildStrategicSignalItem` renders the declared case: the declared archetype's name in the
    title, its id in the facts, and an explicit statement that archetype ids and function pack keys
    are separate spaces.
- `src/lib/programs/__tests__/phase-intelligence-function-binding.test.ts` — new, 9 cases.
- `src/lib/programs/__tests__/phase-intelligence-summary.test.ts` — two rendered-output cases; the
  existing `evidence-readiness` mock now spreads `jest.requireActual` so the canonical declaration
  precedence is exercised for real rather than stubbed away.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No host change was needed. The panel's server route and its React host already pass the Move; the
field this change reads is one the Move record already carried.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__` — 122 suites, 1239 tests, the whole directory, not
  only the two suites this change touches. Registration proof: census `testFiles` 2758 → 2759 and
  `coveredTestFiles` 2594 → 2595 with `uncoveredTestFiles` unchanged — the +1 is this change's one
  new test file and the equal covered delta is its registration.
- **PASS** Baseline check. With the suppression removed and the suites kept, 3 of the 9 binding
  cases fail; the 6 that stay green are the regression guards — a persisted key still binds, every
  storable column value still falls through, the classifier and its alias still answer for a legacy
  Move, and an unknown industry is still unbound. Those must hold in both directions.
- **PASS** Mutation testing, 8 mutations, 7 killed: removing the declaration check; moving it after
  the classifier; accepting any non-empty id as declared; dropping the persisted key's precedence;
  dropping the legacy alias arm; making the declared render fall through to the pack renderer;
  replacing the declared archetype id in the facts with a constant.
  One survivor, diagnosed and not a coverage gap: rewriting `kind === "bound"` as
  `"identity" in resolved` is exactly equivalent, because only that variant of the result carries an
  `identity` — the mutation changes the file and nothing else.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on all four changed files — 0 problems.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — see PR.
- **NOT RUN** Live signed-in walk. No runtime rollout accompanies this record, and the behaviour it
  changes is not reachable by any declared Move today, so there is nothing a walk could observe. A
  walk is owed once a Move carries a declaration.

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
  change that declares an archetype on a Move.

## Rollback Plan

Revert the single squash commit. The change is additive and read-time: no migration, no backfill, no
written state, no flag to unset. Reverting restores the keyword guess for every Move, including a
declared one, and restores the moved helpers to the summary module — the new module has exactly one
caller, so nothing else is left dangling.

## Audit Evidence

- PR URL and its CI run, including the required check whose directory step executes
  `src/lib/programs/__tests__`.
- The census diff in this PR: `testFiles` 2758 → 2759, `coveredTestFiles` 2594 → 2595,
  `uncoveredTestFiles` unchanged.
- The two confidence figures quoted in the summary (0.188 and 0.212) were measured against the
  pre-change resolver with the declared charter as its only input; the floor they clear
  (`FUNCTION_CLASSIFY_CONFIDENCE_FLOOR = 0.18`) is in
  `src/lib/programs/function-identity.ts`.

## Known Gaps

- The declaration still has to reach a Move. Until one carries a registry archetype, this change
  alters nothing a user sees. That declaration is an operator-job and human-approval step, not a
  code step.
- The classifier's own floors are untouched. A legacy Move that declares nothing can still be bound
  at 0.188 confidence, and the panel still prints that number as a fact rather than declining to
  speak. Raising the floor would change which legacy Moves bind and was deliberately kept out of
  this change.
- The legacy short-name alias is still a hand-written two-regex rule for one industry and one
  function key. It is now pinned by a case that proves the classifier abstains on that exact brief,
  so the arm cannot be deleted silently — but it is still a special case, not a catalogued rule.
- A Move that declares an archetype for which a curated function pack *is* later catalogued will
  take the declared path and show no pack. Resolving an archetype to a pack, where one genuinely
  corresponds, is a separate piece of work; today the two id spaces are disjoint.
- The panel's other two items (decision record, gate/evidence truth) are unchanged and were not
  audited for the same class of inference.
