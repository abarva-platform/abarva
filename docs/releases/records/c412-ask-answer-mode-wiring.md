# 2026-09-28-ask-answer-mode-wiring — Assert answer-mode wiring inside the Ask module by execution

## Release ID

`2026-09-28-ask-answer-mode-wiring`

## Status

`candidate`

## Plain-English Summary

The Intelligence Ask module decides, from the wording of a question, which of several
executive answer modes applies. That decision does two things: it adds a mode-specific
contract to the instructions sent to the model, and it guarantees a deterministic block
of content — for the Moves-execution mode, a phase plan — even when the model does not
produce it. Both behaviours were working. Neither was covered.

Until 2026-09-27 the only thing tying that behaviour to the module a reader's question
actually travels through was a test that read the module's own source as text and
required two function-call substrings to appear somewhere in it. That test was deleted,
correctly: a substring match stays green when the call is still present but no longer
wired to anything, and goes red when the call is merely reformatted, so it answered the
wrong question in both directions. Its replacement covers the downstream synthesizer
only. The result was that the module could have been unwired — the mode never
classified, the deterministic content never added — and every suite in the repository
would have stayed green.

This change adds a suite that drives the module's real entry point end to end and
asserts the wiring by what happens rather than by what the file says. No product
behaviour changes; no runtime file is touched.

## Layer Impact

**Release lane: `global-control-lane`.** The change ships shared repository control-plane
behavior — one test suite and one continuous-integration step — that applies to every
client alike and is behind no feature gate. It is not `client-data-lane`: it touches no
schema, RLS policy, seed, ingestion path, retrieval path or private data plane. It is not
`internal-admin`, `public-demo` or `experimental`: it adds no operator capability, no
public route and no flagged capability.

- **Layer 4 — Products (Intelligence):** test coverage only. No product code, prompt,
  read model, projection or route is modified. The suite exercises existing behaviour
  and asserts it; nothing it asserts is new behaviour.
- **Layers 1–3 (intake, adapters, canonical model):** not touched.
- **CI / tooling:** one workflow step gains one named test file.

## Client Applicability

- All clients: no change in behaviour. This is a test and CI change.
- Specific clients: none.
- Internal only: yes — the added coverage and the CI step are internal.
- Public/demo only: no.
- Feature flag: none. The suite sets no flag and reads no flag.

## Changes Included

- `src/lib/intelligence/ask/__tests__/c412-ask-answer-mode-wiring.test.ts` — new suite,
  three cases, driving the real exported entry point of `src/lib/intelligence/ask/index.ts`.
- `.github/workflows/intelligence-library-suites.yml` — the new suite added to the
  existing "Run reachable Intelligence library suites" step as one named file, with the
  reason recorded beside the four files already named there.

Wired by named file rather than by directory on purpose: the coverage census still
reports `src/lib/intelligence/ask/__tests__` PARTIAL — 23 test files, 2 covered — and one
of the unrun files in it is red on purpose behind an open owner decision, so the
directory cannot be wired whole yet. The census is left reporting that honestly instead
of being silenced. The step runs `--no-coverage`, so no directory-aggregate coverage
floor is charged for the new imports.

## QA / Validation

**What is mocked and what is not.** Retrieval is mocked at its own module boundaries and
the audited Anthropic client is mocked, because both are I/O. The classifier, the
answer-mode registry, both prompt builders, the deterministic fallback, the synthesizer
and the module's own exported entry point all run for real — mocking any of them would
reproduce the defect being repaired. Expected strings are produced by calling the same
registry-backed builders rather than copied into the test, so the cases cover whatever
the registry declares today and cannot drift from it.

**Scope baseline, measured over the same command this change extends** — the workflow
step's own jest invocation, run locally before and after:

| | Suites | Tests | Failing |
|---|---|---|---|
| before (`origin/main` `293cf7a106`, suite absent) | 22 | 154 | 0 |
| after | 23 | 157 | 0 |

**The suite is green on unmutated code, which for a missing-coverage item is the
expected result and is not the evidence.** The evidence is that it can fail. Five
mutations were applied one at a time; each was confirmed to have changed the file
(`git diff --numstat`, non-empty) *before* the run, because a mutation that changes
nothing reads exactly like a caught one. An early attempt at the first mutation left the
file byte-identical and produced a false "caught" reading; it was discarded and redone.

| # | Mutation | Case that fired | Result |
|---|---|---|---|
| M1 | `ask/index.ts`: replace the classifier call at the final fallback with the literal `"general"` | fallback case | caught (1 failed / 2 passed) |
| M2 | `ask/index.ts`: delete the `applyCxoAnswerModeFallbacks` call entirely | fallback case | caught (1 failed / 2 passed) |
| M3 | `synthesizer.ts`: replace the classifier call with the literal `"general"` | model-contract case | caught (1 failed / 2 passed) |
| M4 | `synthesizer.ts`: make the contract injection unconditional | ordinary-question case | caught (1 failed / 2 passed) |
| M5 | `ask/index.ts`: stop forwarding the reader's question to the synthesizer | model-contract case | caught (1 failed / 2 passed) |

Five applied, five caught, each by the case the item's acceptance predicts for it.

**One design choice was measured rather than reasoned, and the first version of the
reasoning was wrong.** The fallback case drives the rich-text path. All three of the
synthesizer's own fallback applications are gated on the plain-text branch, so on the
rich-text path the module's own call is the only one that runs and the case is
attributable to that module and nothing downstream. This was verified in both
directions: with the module's call deleted and the plain-text path selected, the
phase-plan heading and all seven phase labels still reached the caller, so a case written
on that path would not have detected M2 at all. Separately, the plain-text path reshapes
the block — emphasis and list markers stripped, one line re-cut mid-sentence — which is
filed work of its own, is not caused by this change, and is not covered by it.

**Other gates, from this worktree:**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit code
  0**, zero diagnostics. Judged on the exit code, not on a grep: a bare `npx tsc
  --noEmit` exits 134 on this host with no output, which greps as a false clean.
- `npx eslint` on the new file — exit 0, no findings.
- The suite saves and restores `ANTHROPIC_API_KEY` around its cases rather than setting
  it at module scope. Jest shares one `process.env` across every suite in a worker, so a
  key left behind would silently change the behaviour of any sibling suite that asserts
  the unconfigured refusal. All five mutations were re-measured after this change, since
  amending the suite after measuring would otherwise have left the table describing a
  different file: same five caught, same case firing for each.
- Workflow YAML parsed and the step re-read from the parsed document to confirm it names
  the new file, rather than grepping the raw text.
- `npm run audit:test-ci-coverage:check` — exit 0. `census shape: coverage shape matches
  the committed census`; counts drift by exactly `testFiles 2528 -> 2529 (+1);
  coveredTestFiles 2181 -> 2182 (+1)`, which that gate reports rather than enforces. This
  is also the independent evidence that the wiring took effect: the census resolves the
  new suite to **covered**, so the named-file entry is recognised by the same reader that
  decides which directory gets wired next — a YAML line alone would have moved
  `testFiles` and left `coveredTestFiles` behind.

**Not verified:** nothing about this change is observable to a signed-in user, so no
signed-in proof is claimed or owed. No product surface renders anything it touches and
no runtime module is modified.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow then builds and deploys as it
does for any merge. There is no runtime behaviour to enable: the change is a test file
and one CI step, so the deploy carries it only incidentally.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. This change runs no Azure command and mutates no
  Container App template, revision weight, env var, flag, secret or scale setting.
- Approved image digest: resolved by the repo-owned workflow at merge; recorded in the
  claim register once the run completes.
- ACA runtime invariant: to be proven after merge — Container App template image equal
  to the image of the 100%-traffic revision, digest-pinned, revision healthy.
- Worker image invariant: unchanged; no worker job image is affected.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: **no.** No product surface changes and no runtime module
  is modified.

## Rollback Plan

Revert the single commit. Nothing to undo beyond that: no migration, no data write, no
flag, no runtime configuration. Reverting removes one test file and one line plus a
comment from one workflow step, returning the wired scope to 22 suites / 154 tests.

## Known Gaps

- **The Ask route handler is not covered and is explicitly out of scope.**
  `src/app/api/intelligence/ask/route.ts` makes the same two calls and still carries no
  assertion binding them to it, because all three suites under its own `__tests__`
  `jest.mock` the whole Ask module. The deleted byte assertion covered the route as well
  as the module, so closing the module half does not close the route half. That residual
  belongs to a successor item and is recorded rather than left implied.
- **The suite covers one mode's deterministic fallback, not every mode's.** Only two
  registry entries declare a fallback today, and the fallback case drives the
  Moves-execution one. The ordinary-question case does read every registry entry, so a
  contract or fallback added to any mode is covered in the negative direction
  immediately; the positive direction is covered for one mode.
- **`src/lib/intelligence/ask/__tests__` remains PARTIAL in the coverage census** — 24
  test files with 3 covered after this change, up from 23 with 2. Wiring the directory
  whole still waits on an open owner decision about a suite in it that is red on purpose.
  The census is left reporting this accurately; nothing here silences it.
- **The plain-text answer path reshapes the deterministic block** — emphasis and list
  markers stripped, at least one line re-cut mid-sentence. Observed while measuring this
  change, not caused by it, and filed work of its own. This suite does not assert over
  that path and does not repair it.
- **The coverage census JSON is deliberately not regenerated in this change.** That file
  was held by another agent's live claim while this work ran. The census drift gate
  compares shape rather than counts, and an ordinary added test moves counts only, so
  leaving it is correct rather than merely convenient.

## Audit Evidence

- The pull request and its CI run, including the workflow step's own log showing the
  suite executing on a real runner at 23 suites / 157 tests — grepping the YAML is not
  evidence that a step ran.
- The merge SHA, and the deploy run resolved to it by ancestry rather than by run
  ordering, since concurrency can cancel or supersede the run keyed to a SHA.
- The five-mutation table above, reproducible from the mutations as described.
- Item C-412 in the execution backlog, and the claim and release lines for it in the
  append-only claim register.
