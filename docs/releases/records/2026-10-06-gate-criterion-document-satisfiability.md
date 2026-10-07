# 2026-10-06-gate-criterion-document-satisfiability — Keep an unsatisfiable gate criterion from going hard

## Release ID

`2026-10-06-gate-criterion-document-satisfiability`

## Status

`candidate`

## Plain-English Summary

Most conditions for leaving a phase are settled by looking for a signed document
of a particular type. A phase's build produces a fixed set of document types. If
a condition only accepts type names that no phase builds, then no amount of
answering questions, building, or signing can satisfy it.

Three conditions on the fourth-to-fifth phase transition are in exactly that
state today. All three are declared optional, so the phase still advances and
the condition reads as an unmet nice-to-have. That is survivable, and the
decision to leave them that way was taken deliberately in earlier changes.

What is not survivable is the same shape declared as blocking. Then the product
fails in the worst way available to it: every question is answered, every
document builds and is signed, and the gate still refuses, with nothing on
screen a user could act on. The phase becomes un-exitable. This is a plausible
next edit rather than a hypothetical one, because the per-pattern requirement
declarations already name several of these same type names as blocking
conditions, and work is under way to make those declarations drive behaviour.

A sibling guard already pins the opposite direction — that the blocking
document-only conditions it enumerates are matched by something the phase
builds. This change pins the complement: it fails if any condition that no build
can satisfy is ever promoted to blocking, if one of the listed exceptions
quietly becomes satisfiable and its written reason goes stale, or if a new
condition is added whose accepted type names nothing builds.

Writing the guard also surfaced three conditions the evaluator can settle that
no gate rule declares at all, so they are never reached. Each was superseded by
a stricter sibling condition and the looser branch was left behind. They are
recorded with the sibling that replaced them rather than deleted, and the guard
fails if one is declared without first giving it a document a phase can build.

No product behaviour changes. No gate got stricter or looser, and no new refusal
was introduced.

## Layer Impact

- `global-control-lane`: test-only. Layer 4 (Products — Moves phase gates). No
  change to layers 1–3: no intake, adapter, or canonical-model change. No
  product code, route, schema, prompt, flag, or generated output changes. The
  guard reads existing exported functions and the evaluator's own source and
  asserts a property that already holds on `main`; it adds no runtime code
  path.

## Client Applicability

- All clients: the guard runs in CI only and changes no client-visible
  behaviour.
- Specific clients: none.
- Internal only: yes — CI guard.
- Public/demo only: no.
- Feature flag: none. The test is unconditional.

## Changes Included

- `src/lib/programs/__tests__/gate-criterion-document-satisfiability.test.ts`
  (new, in an already CI-wired directory swept by a required check): five
  assertions over `gateCriteriaForPhase`, `phaseCanonicalKeysForRoute` and
  `DELIVERABLE_REGISTRY`, plus the evaluator's declared criterion set.
- `docs/architecture/test-ci-coverage-census.json`: regenerated. See Known Gaps
  for the inherited portion of the delta.

## QA / Validation

- PASS — new suite: 5 tests.
- PASS — the whole `src/lib/programs/__tests__` directory, which is the unit a
  required check sweeps: 130 suites, 1318 tests.
- PASS — mutation testing, 4 of 4 killed. Promoting a listed exception to
  blocking fails 2 assertions; making one of its accepted type names buildable
  fails 1; declaring one of the unreachable conditions fails 1; renaming a
  listed condition out of its rule fails 2. The tracked tree was verified
  byte-identical after the mutation run before anything was committed.
- PASS — `npx tsc -p tsconfig.json --noEmit` with an 8 GiB Node heap, no
  diagnostics.
- PASS — `npx eslint` on the new file.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN — signed-in walk. This change adds no surface to walk; it is a CI
  guard with no runtime path. The end-to-end walk is still owed for the gate
  transitions themselves and is tracked separately.

## Rollout Plan

Merges to `main` via squash with auto-merge. The guard takes effect on the next
run of the required check that sweeps the directory. Nothing to enable, stage,
or roll forward; no runtime behaviour is gated on it.

## Deployment Authority

Repo-owned CI only. No Azure Container Apps deploy, no revision or traffic
change, no environment-variable or flag mutation, and no data-plane write. The
shared Product/Lab runtime is untouched by this change, so the runtime digest
invariant is unaffected and no live proof is claimed.

## Rollback Plan

Revert the single commit. The only runtime-adjacent file is a regenerated
census, which the generator rebuilds from the tree, so a revert needs no
follow-up. Deleting the new test file alone also fully disables the guard, since
no product module imports it and nothing reads its exports.

## Audit Evidence

- The new suite and its five assertions.
- The mutation table under QA, with the surviving-tree check.
- The census delta, with the inherited portion isolated and measured separately
  (see Known Gaps).

## Known Gaps

- **The three listed conditions are reported, not repaired.** Each stays
  optional and unsatisfiable-by-build. Teaching one to read a document a phase
  actually builds would either duplicate a sibling condition that already reads
  that document, or turn a built-but-unsigned document into a new blocking
  refusal. That is a decision about where the bar sits, not a drift to repair
  silently, so the guard records the argument and fails if someone wires it up
  and leaves the stale reason standing. **Owner: product.**
- **Three evaluator branches no rule declares are recorded, not deleted.**
  Removing an unreachable branch means editing a large, actively-changed shared
  module for no behavioural gain, and the list is the more useful artifact. One
  of the three accepts only type names nothing builds, so declaring it would
  fail every evaluation until such a document exists.
- **Six further conditions accept no buildable type name but keep a free-text
  fallback**, so they are satisfiable without any document and a build/accept
  drift does not strand them. They are deliberately out of scope: the guard
  covers only the document-only branches, which are the ones that can strand a
  phase.
- **The "document-only" test is the absence of an alternation in the branch
  body.** A branch that gained a non-document route expressed some other way
  would read as document-only and be held to the stricter bar. That direction is
  safe — it over-reports rather than under-reports — but it is not exact.
- **The incoming census was stale by two files.** Two suites merged recently
  without a refresh. This branch's regeneration therefore moves the counts by
  three: two inherited, one from this change. The inherited two were isolated
  and measured separately rather than absorbed silently — regenerating on this
  base without the new file moves the total to 2770, and with it to 2771. The
  uncovered count is unchanged at 164, which is what says the new suite is
  swept by the directory rather than left dark.
