# 2026-09-27-strategy-to-moves-contract-behavioral — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-27-strategy-to-moves-contract-behavioral`

## Status

`candidate`

## Plain-English Summary

One test suite used to check that our answer-mode feature worked by reading the
program's own source code and looking for 24 pieces of text in it. That is not a
test of whether the feature works — it fails when somebody reformats a line, and
it passes when the feature is switched off so long as the words stay on the page.
Both happened: the suite was failing because one statement had been rewritten
into a different shape while still calling exactly the same function.

The failing case is deleted, not repaired with a looser pattern, and replaced by
three cases that run the real answer-generation path and check what it does: that
the answer mode chosen for the question actually reaches the model, that the
deterministic content the product owes the reader is added to the model's text
before the answer is returned, and that an ordinary question gets none of that
special contract — which is the case that fails if the contract were applied to
everything.

The suite also now runs in CI. It never did. A suite that is green and runs
nowhere cannot be told apart from one that does not exist.

## Layer Impact

Release lane: `internal-admin` — this is test and CI governance. No product
surface, tenant dataset or runtime artifact is touched, so no client-facing lane
applies.

- **Layer 4 (Products) — no behaviour change.** No product file changed. The
  Intelligence answer path is byte-identical; only its test and the CI wiring
  moved.
- **Test and CI governance.** One suite changes classification from source-text
  scanner to behavioural, which is recorded in a new triage record so the
  repository's own control resolves it from the latest record rather than from
  the historical draw.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts` — the
  byte-scanning case deleted; three behavioural cases added over the real
  `synthesizeStream`. The other ten cases in the suite already asserted over
  returned values and are untouched.
- `.github/workflows/intelligence-library-suites.yml` — the suite named in the
  reachable Intelligence library step, in the same change as the rewrite.
- `docs/architecture/t495-strategy-to-moves-contract-triage.json` — new. Declares
  the suite `sourceTextScanner: false`, `verdict: "wired"`, superseding the
  `T-492` row by `recordedAt` rather than editing that draw.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`, not hand-edited.

## QA / Validation

Base `origin/main` `95271303533e33adb1bf67a3877597dc6fc9e66f`, in a dedicated
worktree.

**Re-verification first, by running the suite rather than reading it.** On that
base the suite was **1 failed / 10 passed of 11**, and the single failure was
the assertion the backlog item names: `expect(synthesizerCode).toContain("const
finalText = applyCxoAnswerModeFallbacks(cleanedText, answerMode)")`. The call is
still made — `synthesizer.ts:825` — written as a ternary arm.

| scope | before | after |
|---|---|---|
| the suite | 1 failed / 10 passed of 11 | 0 failed / 13 passed of 13 |
| `src/lib/intelligence/ask/__tests__` | 2 failed suites / 21 passed; 2 failed tests / 171 passed | 1 failed suite / 22 passed; 1 failed test / 174 passed |
| `src/__tests__/behaviors` | 153 suites / 1668 tests / 0 failing | 153 / 1668 / 0 |
| the wired workflow command, run verbatim | — | 22 suites / 154 tests / 0 failing |

The one remaining red in that directory is `ask-guardrails.test.ts`, which item
`T-497` left red on purpose behind an owner decision. It is not touched here, and
it is why this suite is wired **by named file** rather than by directory.

**The wiring is proven to reach the suite, not assumed:** `--listTests` over the
exact workflow command returns it.

**Five mutations against the product, each verified to have changed the file
before the suite was run, and the file restored after each:**

| mutation | result |
|---|---|
| `classifyAbarvaAnswerMode(args.query)` → `"general"` | 2 of 13 failed |
| the deterministic fallback dropped from the emitted answer | 1 of 13 failed |
| the mode injection made unconditional | 1 of 13 failed |
| the prompt directive removed from the user message | 1 of 13 failed |
| the system contract removed from the system prompt | 1 of 13 failed |

**The third mutation survived the first attempt, and the suite was at fault.**
The general-mode case looped over the four non-general modes only, and `general`
declares a system contract and a prompt directive of its own — so making the
injection unconditional injected general's contract and no case looked for it.
The loop now walks every entry the registry declares, so it also covers modes
added later.

**The control that governs this wiring was proven to refuse it.** Removing the
new triage record and running `T-770`'s control turns it red — 2 of 7 — naming
this suite and the exact workflow command as the breach. That is the wiring gate
firing on a real positive rather than on a fixture.

Other gates, each judged on its exit code: `npm run audit:test-ci-coverage:check`
0; `npm run audit:named-suite-requiredness` 0; `npm run
test:integration:ci-visibility` 0; `NODE_OPTIONS=--max-old-space-size=6144 npx
tsc --noEmit --pretty false` **0** with `tsconfig.tsbuildinfo` deleted first;
`npx eslint` on the changed suite 0.

**Typecheck found a real constraint, and the suite was changed rather than cast
around it:** `CXO_ANSWER_MODE_REGISTRY` holds 11 entries while the mode type
admits 5. The six extra entries are `active: false` placeholders declaring
neither contract, so the narrower type is correct; the suite reads the declared
fields through the registry's own interface instead of calling the builders, so
it needs no cast and still covers whichever modes carry a contract today.

## Rollout Plan

Merge to `main`. No runtime rollout: no product code, route, component, schema,
adapter, prompt, dataset or image changes. The effect is that CI runs one more
suite.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as usual; nothing here changes what it builds.
- Shared runtime mutators: none. No `az` command, no Container App, revision,
  traffic weight, flag or environment variable is touched.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unchanged by this release; it is read after merge and
  reported with the deploy, not claimed here.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing reaches a product surface.

## Rollback Plan

Revert the pull request. Nothing to undo beyond CI running one suite fewer; no
migration, no data change, no image.

## Audit Evidence

- The pull request and its checks.
- The CI job log for `intelligence-library-suites`, which must show the suite's
  13 cases — a green tick alone does not prove the named file was selected.
- `docs/architecture/t495-strategy-to-moves-contract-triage.json`, which records
  the measurements, the five mutations, the survivor and why it survived, and
  the residuals this change does not close.

## Known Gaps

- **The deleted case also asserted two other modules by their bytes.** It
  required `ask/index.ts` and the Ask API route to contain
  `applyCxoAnswerModeFallbacks(` and `classifyAbarvaAnswerMode(...)`. Those
  assertions proved the words were present and would have survived the feature
  being unwired, so deleting them removes a false assurance rather than real
  coverage — but neither module gains a behavioural assertion here, because
  driving either means standing up retrieval or a Next.js route. Recorded as a
  note on the owning backlog item rather than left implied.
- **The directory still cannot be wired whole**, for the owner-gated red named
  above. The census therefore keeps reporting it PARTIAL, which is the honest
  state.
- **The owning item is not closed.** Its acceptance is per suite; this closes one
  of the eleven in its claimable half. The three rows in its gated half need a
  lane decision from the owner and are untouched.
- **Observed, not fixed, and not asserted either way:** the two answer-mode
  builder functions have exactly one caller between them, guarded by `answerMode
  !== "general"`, while the registry's `general` entry declares both a system
  contract and a prompt directive — so that authored text cannot reach a model
  through this path. Whether that is deliberate is a question about what is sent
  to the model on every ordinary answer, which is a product decision.
