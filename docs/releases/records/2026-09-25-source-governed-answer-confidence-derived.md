# 2026-09-25-source-governed-answer-confidence-derived — Derive governed-answer confidence instead of stamping it

## Release ID

`2026-09-25-source-governed-answer-confidence-derived`

## Status

`candidate`

## Plain-English Summary

Three Source answer builders — award readiness, BAFO instructions and pricing comparison — each
attached a confidence rating of `high` to the vendor-response evidence they hand to the model.
That rating was a fixed word in the code, not a conclusion. It was written onto the same object
that honestly reported the evidence had not been reviewed and had not been indexed, so the one
field a reader would use to judge the other two was the one field nothing checked.

This change derives the rating from state the builder already holds: whether a named human
accepted the response package, whether it was machine-read without loss, and whether its rows
point back at a source document. One ladder now serves every builder in the directory, including
the one that was already deriving its rating correctly.

**The answers customers see today do not change.** The reader these three builders call only
emits packages that a human has already accepted, so the derived rating comes back `high` for
every package in production — the same word as before, now earned rather than asserted. What
changes is the failure mode: if that reader ever admits an unaccepted package, the confidence
rating follows the evidence down instead of continuing to claim `high`.

## Layer Impact

**Release lane: `global-control-lane`.** Shared application behavior for all clients, not feature-gated.

- **Layer 4 — Products (Source).** Three governed answer builders and one shared converter. No
  read path, query, schema, or rendered answer text changes.
- **Governance contract.** Objects reaching `buildValidatedAgentContextBundle` now carry a
  confidence level that varies with their evidence. No policy rule changed.
- Layers 1–3 (client intake, source adapters, canonical model) are untouched.

## Client Applicability

- All clients: yes, on the code path — every tenant using Source answer generation.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is output-identical on current data (see QA below), so it needs
  no gate.

## Changes Included

- `src/lib/source/ava/governed-answer-confidence.ts` — new. Holds the confidence ladder
  (`confidenceFromGovernanceState`), the vendor-response adapter
  (`normalizedVendorResponseGovernanceState`, `confidenceForNormalizedVendorResponse`) and the
  shared governed-field block `vendorResponseGovernedFields`.
- `src/lib/source/ava/award-readiness-governed-answer.ts`,
  `src/lib/source/ava/bafo-instructions-governed-answer.ts`,
  `src/lib/source/ava/pricing-comparison-governed-answer.ts` — each candidate builder now spreads
  the shared governed fields instead of writing its own object with a literal, and is exported so
  its output can be asserted directly, matching the pattern the sibling builders already use.
- `src/lib/source/ava/artifact-quality-governed-answer.ts` — `confidenceForArtifact` now
  delegates to the shared ladder rather than re-implementing it. Its behaviour is unchanged; the
  point is that one rule has one home.
- Three test files under `src/lib/source/ava/__tests__/` gain per-builder assertions.

## QA / Validation

**The measurement that justifies the item, taken before any edit.** Each of the three literals
was changed in turn to `"unverified"` — a value the builder could never legitimately produce —
and its own suite was run. Per call site, not once for the container:

| call site | suite | result with the literal corrupted |
|---|---|---|
| `award-readiness-governed-answer.ts:60` | `award-readiness-governed-answer.test.ts` | 3 of 3 passed |
| `bafo-instructions-governed-answer.ts:58` | `bafo-instructions-governed-answer.test.ts` | 3 of 3 passed |
| `pricing-comparison-governed-answer.ts:70` | `pricing-comparison-governed-answer.test.ts` | 3 of 3 passed |

With all three corrupted at once, the entire directory — 26 suites, 383 tests — stayed green. The
field was unguarded, not weakly guarded.

**Scope baseline, same scope both sides.** 4 suites / 23 tests / 0 failing before; 4 suites /
35 tests / 0 failing after. Whole directory: 26 suites / 383 tests / 0 failing before; 26 / 395 /
0 after.

**Mutation — eight run, seven caught.** Every mutation was diffed against the unmutated file
first, so a mutation that failed to apply could not be recorded as caught:

| # | mutation | failing cases |
|---|---|---|
| 1 | ladder returns `high` unconditionally — the original defect, restored | 6 |
| 2 | the `approved` rung deleted | 4 |
| 3 | `parsed` inverted | 6 |
| 4 | `cited` pinned false | 3 |
| 5 | the `medium` rung returns `low` | 6 |
| 6 | the shared field block re-stamps the literal | 6 |
| 7 | `retrievability` claims `search_indexed` | 6 |
| 8 | `reviewState` read for truthiness instead of compared to `"accepted"` | **0 — survived** |

Mutation 4 survived the first draft of the suite and is the reason for a second pass: the
`medium` fixture satisfied both rungs at once, so the `cited` rung was met by its sibling. Two
cases were added that reach `medium` by one rung with the other false, in each direction, and the
mutation is now caught.

**Mutation 8 survives and is reported rather than papered over.** It is unreachable, which was
settled by reading the type rather than by sampling inputs: `SourceNormalizedResponseReviewState`
is declared at `src/lib/source/vendor-response-matrix.ts:43` as the single-member union
`"accepted"`, so `Boolean(x)` and `x === "accepted"` cannot disagree on any value the type
admits. The strict comparison is kept deliberately — it is the line that stops a second member
silently counting as an acceptance — and it cannot be guarded behaviourally until that second
member exists.

**Output equivalence, established by search rather than by sample.**
`readNormalizedVendorResponsePackages` (`src/lib/source/vendor-response-persistence.ts:84`) is
the only production source these three builders read. It has one `return`, it skips any artifact
with no acceptance authority (`if (!authority) continue;`), and its single package literal stamps
both `reviewState: "accepted"` and `authority.acceptedArtifactOnly: true`. Every package it emits
therefore satisfies the `approved` rung and derives `high` — the same value the literal produced.
No rendered answer changes on current data.

**Commands.** `npx jest --runTestsByPath <the four suites>`; `npx jest --testPathPatterns
'src/lib/source/ava/__tests__'`; `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — exit 0, judged by exit code with `tsconfig.tsbuildinfo` removed first;
`npx eslint` over the eight changed files — exit 0.

**CI reachability.** These three suites are already merge-blocking: `Source aVa library suites`
runs the whole `src/lib/source/ava/__tests__` directory on every pull request, with one named
exclusion that is not any of them. No wiring is owed and none was added.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. No
migration, no flag, no data build, no worker change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the deploy run after merge.
- ACA runtime invariant: template image digest must equal the 100%-traffic revision digest;
  verified after the deploy run completes.
- Worker image invariant: not applicable — no byte under any worker path.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** These are server-side objects; the confidence level is
  never rendered to a signed-in reader, and the change is proven output-identical on current
  data, so a signed-in pass would have no subject.

## Rollback Plan

Revert the single squash commit. The change is additive plus three call-site rewrites, touches no
schema and no persisted value, so a revert restores the prior behaviour exactly.

## Audit Evidence

- PR URL and CI run: recorded on merge.
- The before/after and mutation tables above, each reproducible from the commands listed.
- `src/lib/source/ava/__tests__/{award-readiness,bafo-instructions,pricing-comparison}-governed-answer.test.ts`
  — the per-builder assertions, in both directions.

## Known Gaps

1. **May a `not_reviewed` + `not_indexed` candidate be `high` at all? Yes, and deliberately so —
   the guard does not belong in `evaluateGovernedObject`.** Confidence states how well-founded
   the content is; `retrievability` and `agent_readiness_status` state whether the object has
   been indexed and reviewed for agent use. They are orthogonal, and the policy treats them that
   way: `evaluateGovernedObject` reads `confidence_level` only for presence
   (`src/lib/governance/context-corpus-policy.ts:254`) and never weighs its value. A cross-field
   ban on that combination would reject the call site that was already correct — a client-final
   artifact that nobody has embedded derives `high` from `confidenceForArtifact` while
   `retrievabilityForArtifact` returns `not_indexed` and readiness stays `not_reviewed`, which is
   reachable today for any client-final artifact with `parseStatus` other than `parsed`. So the
   derivation was fixed and no policy rule was changed.
2. **What stops the next builder writing a literal?** Not a text scan — a scan cannot tell a
   derived value from a stamped one. `vendorResponseGovernedFields` is the answer available in
   code: a new builder that spreads it inherits the derivation, and one that overrides a field
   has to write that override into the diff where a reviewer sees it. This is a structural
   improvement, not a gate, and it is stated as such.
3. **The two remaining `confidence: "high"` literals in `source-workspace-visual-answer.ts`
   (`:555`, `:1217`) are NOT the same defect, and were left alone.** Three reasons, each checked
   rather than assumed. They are a different field on a different object — `confidence: string`
   declared at `:73` on an answer *citation*, not `confidence_level: ConfidenceLevel` on a
   `GovernedCandidate` — so no governance gate consumes them. They make a different claim: `:555`
   is the citation on a refusal packet asserting that a named contract is absent from the current
   packet, which the builder knows with certainty because it just looked, so `high` is the
   correct value rather than an unearned one. And that file already derives where state exists to
   derive from — `:1228`, `:1350`, `:1359` and `:1370` all vary with their input — so the literal
   is a local judgement, not a missing rule.
4. Mutation 8 survives, unreachable by construction. Stated in full above.
