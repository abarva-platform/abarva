# 2026-09-23-advisor-surface-shared-compaction — Advisor answers are no longer summarised away above 900 characters

## Release ID

`2026-09-23-advisor-surface-shared-compaction`

## Status

`candidate`

## Plain-English Summary

A long advisor answer lost most of its content before anyone read it.

Fed a three-option vendor shortlist of 1,361 characters, the answer shaper returned 229
characters: the opening line, the first option's first sentence, and one bullet. The second
option, the third option and the closing recommendation were **absent from the output**, not
reordered or abbreviated. A reader saw one recommendation where three had been made, with
nothing on screen to suggest anything was missing.

The cause is that there are **two** compactors on this path and only one of them was switched
off for advisor surfaces.

1. `compactConsultantChatText` is gated on `shouldCompactSurface()`, which already returns
   `false` for every advisor surface. That gate is correct and has been for months.
2. `compactForChat`, inside the shared response shaper, runs whenever a separate flag —
   `preserveStructure` — is false, and rebuilds the answer as a lead line plus up to three
   bullets against a 900-character target. `preserveStructure` was computed from a structure
   detector that recognises pipe tables, section headers, three-or-more bullets and
   three-or-more numbered lines. Advisor answers are deliberately none of those: they are
   prose paragraphs. So every advisor answer over the target took the second compactor **by
   construction**, on surfaces whose whole contract is that they must not be compacted.

The fix makes `preserveStructure` the union of the two reasons to preserve: the answer is
already structured, **or** the surface is one this module has already declared must not be
compacted. Both compactors now hang off the same gate, so the exclusion cannot drift apart
per-surface again. The four declared form surfaces — `setup`, `/admin/setup`, `/setup`,
`/platform/admin` — are unchanged and still compact.

**This defect has been filed four times.** `C-009` (in a test comment, with the mechanism
correct), `C-500`, `C-501` and `C-502`. None had landed. `C-009` also identified a second
real bug that this change does **not** fix and that is recorded under Known Gaps.

## Layer Impact

**Release lane: `global-control-lane`.** Shared answer-rendering behaviour for all clients, not feature-gated and not client-scoped.

- **Layer 4 — Products.** Answer rendering on the Source, Tower, Intelligence and Strategic
  Moves advisor surfaces. More of the model's answer reaches the reader; nothing new is
  computed, retrieved or asserted.
- **Layers 1–3 — unaffected.** No intake, adapter, canonical-model, schema, migration,
  tenant-data or retrieval change. No numbers are produced or altered by this change: Tower
  read models still own values and this touches only how prose is rendered.

## Client Applicability

- All clients: yes — this is shared answer-rendering behaviour on the control plane.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour change is unconditional for surfaces already declared
  non-compacting.

## Changes Included

| File | Change |
|---|---|
| `src/lib/agent/response-shape.ts` | `preserveStructure` is now `looksAlreadyStructured(cleaned) \|\| !shouldCompactSurface(surface)`. One expression; the rest of the diff is the comment explaining the two-compactor mechanism |
| `src/lib/agent/__tests__/response-shape-regression.test.ts` | New `Damage class 4` block — four cases, written against two surfaces rather than one fixture |
| `src/__tests__/integration/intelligence-chat-shape.test.ts` | `it.failing` promoted to `it`; its comment updated to record which of the three fixes it named was taken |
| `scripts/quality/source-integration-quarantine.json` | `alsoIgnored` entry removed and `alsoIgnoredCeiling` lowered 1 → 0, in the same change, as the ratchet requires |
| `src/__tests__/behaviors/source-quarantine-ceiling-is-a-ratchet.test.ts` | Two cases re-expressed against the now-empty list, each with the reason; both still fail when their rule is removed |
| `.github/workflows/source-integration.yml` | `src/__tests__/integration/source-chat-shape.test.ts` named by exact path, registering it with the CI-visibility gate |
| `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` | `excludedRootFiles` for `source` is now `[]`, with the reason |
| `scripts/quality/integration-root-quarantine.json` | `source-chat-shape.test.ts` entry removed — it was the one entry on that list whose verdict was `real` rather than `update` |
| `scripts/quality/check-integration-root-quarantine.mjs` | `CEILING` lowered 5 → 4 in the same change, as that file's own ratchet requires |

## QA / Validation

**Red first, on the known positive already on disk.** `src/__tests__/integration/source-chat-shape.test.ts`
is the case this defect was written against; it was **not edited**, which is what makes it a
real known positive rather than a fixture written to pass. On `origin/main` `14369d271`:
`1 failed, 6 passed, 7 total`, failing on `Expected substring: "Daisy Intelligence is a
credible second"`. After the fix: `7 passed, 7 total`.

**Same scope, both sides — the 13 suites that reach the shaper:**

| | before | after |
|---|---|---|
| suites | 1 failed, 12 passed | 13 passed |
| tests | 1 failed, 4 skipped, 166 passed, 171 total | 4 skipped, 171 passed, 175 total |

The four new tests account for the difference in total.

**Behaviour floor:** `npm run test:behaviors` → `109 suites, 960 passed, 960 total`.

**Source integration workflow command, run locally:** `103 suites, 779 passed, 779 total` —
including `source-chat-shape.test.ts`, which this change causes CI to run for the first time.

**Both quarantine gates, run the way CI runs them:**
`npm run check:integration-root-quarantine` → `23 tests, 23 pass, 0 fail`, then
`Integration root quarantine is clean: 4 root-level suites excluded (4 update, 0 delete, 0 real)`.
`node scripts/quality/check-source-integration-quarantine.mjs` → exit `0`,
`0 swept-in sibling paths are excluded (ceiling 0)`.

**Two ratchets fired during this work, and both were followed rather than worked around.** The
Source quarantine's ratchet fired as soon as the shaper was fixed, because the list named a
suite that now passes. The integration-root ratchet — which landed on `main` mid-flight — fired
on the rebase, for the adjacent reason: the suite is now named by a workflow, so the exclusion
excluded nothing. Each was cleared by deleting the entry and lowering the ceiling in the same
change, which is the move both gates exist to force.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` →
exit `0`, judged by exit code rather than by grepping for diagnostics.

**Lint:** `npx eslint` over the changed files → exit `0`.

**Mutation check — five deliberate breakages, each caught, each by a named case.**

| mutation | caught by |
|---|---|
| M1 revert the fix (`preserveStructure = looksAlreadyStructured(cleaned)`) | 5 cases across all three shaper suites, including the untouched known positive |
| M2 over-widen (`preserveStructure = true`) | `STILL compacts a declared form surface` **and** a pre-existing Intelligence case, `still applies the template to an admin form surface` |
| M3 narrow to `surface === "source"` | `preserves the same prose on /tower` **and** the promoted Intelligence case |
| M4 remove the `alsoIgnored` headroom rule from the checker | `refuses a cleared swept-in path that left its ceiling where it was` — the rewritten case, so it is not vacuous |
| M5 remove the over-ceiling rule | `still refuses a list that grew past its ceiling` — the other rewritten case |

M2 and M3 are each caught by two independent cases, one of which pre-dates this change. The
negative control is therefore not the sole catcher of over-widening.

**The negative control's truth is independent of this change.** `setup` is one of the four
surfaces `shouldCompactSurface` deliberately keeps — "dashboard / form, not advisor chat", in
the module's own words. That case passed before the fix and after it, which is what a control
whose truth comes from the declared list rather than from the fix should do.

**One measurement corrected during the work, recorded rather than quietly fixed.** The
span-preservation case first compared paragraphs verbatim and reported the second option as
dropped. It was not dropped: a downstream paragraph pass moves that option's closing sentence
onto its own line, so the output is **one character longer** than the input (1,262 vs 1,261)
and no paragraph matches verbatim. The case now compares with whitespace collapsed, which
still fails on a genuine drop and no longer reports re-wrapping as content loss.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on merge. No
migration, no feature flag, no data build, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command was run against any shared runtime.
- Approved image digest: produced by the deploy workflow; recorded in the register after merge.
- ACA runtime invariant: to be proven after merge — Container App template image equals the
  100%-traffic revision image, revision healthy.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** This changes what a signed-in reader sees on an
  advisor surface, so it is owed and must not be implied by the test results.

## Rollback Plan

Revert the PR. The product change is a single boolean expression with no persisted state, no
migration and no flag, so reverting restores the previous rendering exactly. The quarantine,
workflow and behaviour-test changes revert with it as one unit; reverting the product change
alone would leave the quarantine ratchet correctly failing, which is the ratchet working.

## Audit Evidence

- The untouched known positive, `src/__tests__/integration/source-chat-shape.test.ts`, red on
  `14369d271` and green after.
- The five mutation results above, each naming the case that caught it.
- `scripts/quality/check-source-integration-quarantine.mjs` exit `0` with
  `0 swept-in sibling paths are excluded (ceiling 0)`.
- `npm run check:integration-root-quarantine` → 23/23 and a clean list at ceiling 4.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → exit `0`.
- PR checks and the deploy run keyed to the merge SHA.

## Known Gaps

1. **Signed-in acceptance is OWED, not done.** Every result here is a test result. No
   signed-in check on the deployed SHA has been made, and this change does alter what a
   reader sees.
2. **`paragraphSplit` counts lines, not paragraphs — REAL, still present, not fixed here.**
   Identified in the `C-009` comment: it splits on `\n\s*\n` **or** a bare `\n`, so an
   861-character five-paragraph fixture was over a five-paragraph budget because of a line
   break inside a paragraph. This change stops that bug reaching an advisor surface; it does
   not repair it, and it still governs the four form surfaces. Filed separately rather than
   folded in.
3. **Advisor answers are now unbounded in length on non-compacting surfaces.** That was
   already true for any answer the structure detector recognised; it is now true for prose as
   well. `shapeSharedAdvisorResponse` still reports `length_over_target` in its `issues`
   array, so the condition is observable — but nothing currently reads it. Worth a decision,
   not a silent cap: losing 83% of a governed answer is the worse failure of the two.
4. **Attribution was not established and is not guessed.** Which change introduced the
   behaviour is not determined here. The `C-009` comment shows it was understood and
   documented before this run.
