# 2026-09-24-c505-compact-line-gate-reachable — the compact rebuild's line budget is load-bearing, not redundant

## Release ID

`2026-09-24-c505-compact-line-gate-reachable`

## Status

`candidate`

## Plain-English Summary

The shared advisor answer shaper trims a long answer down to a short one. After it
rebuilds the answer it checks two things before accepting the rebuild: that the
rebuilt answer is under the character target, and that it is within the paragraph
budget. A backlog item recorded that the second of those two checks could never
fail — that it was dead code kept alive by construction — and asked for a decision
between deleting it and making it do something.

Measurement answered the question instead. The check **can** fail, it fails on an
input the product can produce, and when it fails it changes which answer the reader
gets. So the correct decision is the opposite of the one the item leaned toward:
keep the check, and delete the comment that told the next reader it was dead.

Nothing about how answers are shaped changes here. What changes is that the check is
now pinned by a test, and the note in the source no longer says something untrue.

## Layer Impact

Release lane: `global-control-lane` — the shared answer shaper is control-plane
behaviour common to every client, and it ships unflagged. No client-scoped schema,
retrieval or data-plane path is touched, so this is not `client-data-lane`.

- **Layer 4 — Products.** Presentation only, and no behaviour changes: this is the
  shared answer shaper that every advisor surface renders through. No product output
  differs before or after — measured, see QA.
- Layers 1–3 (client intake, source adapters, canonical model) are untouched. No
  loader, adapter, schema, migration, read model or tenant-scoped path is involved.

## Client Applicability

- All clients: no behaviour change. The shaper's output is byte-identical before and
  after over the full suite corpus.
- Specific clients: none.
- Internal only: the corrected source comment and the new behavioral suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — comment only. The block above
  `countCompactLines` asserted that its caller's second operand "has no reachable
  FALSE case" and that a paragraph-count mutation "SURVIVES the C-503 suite". Both
  statements are false as of this record; the block now carries the measured path,
  the two mistakes in the original measurement, and an explicit instruction not to
  delete the operand. No executable line changed.
- `src/__tests__/behaviors/shared-shaper-compact-line-gate.test.ts` — new. Three
  cases pinning the reachable false case, that the substituted text causing it
  genuinely reaches the reader, and an independent negative control.

## QA / Validation

**The item was re-verified on my own base before a line was written, and its premise
turned out to be wrong.** Base `origin/main` `e47dd94e5bca976e9c789bb27c99ccd78a103418`.

**Step 1 — instrumented measurement of the existing corpus.** The gate was
temporarily instrumented to record both operands at every evaluation, and the six
suites that import the shaper were run: **99 tests, and the gate is evaluated 5
times, true/true on all five.** That is the entire evidence base the "cannot be
false" claim rested on, and five samples cannot establish unreachability.

**Step 2 — a counter-example through the public entry point.** With the same
instrumentation, one purpose-built input records
`charOk=true, lineOk=FALSE, lines=6, maxParagraphs=5, len=534, targetChars=900`.
The operand is reachable and it **decides the outcome**: a 534-character first
rebuild, comfortably inside the 900-character target, is rejected on the line count,
and the harsher second rebuild answers with 382 characters instead. The operand is
not redundant; it is the only thing standing between the reader and a rebuild that
breaks its own budget.

**The mechanism, and the two mistakes in the original measurement.** C-503 tried the
em-dash form of the `normalizeAssemblyArtifacts` " — Breakdown:" rewrite against the
prose path, where it is genuinely consumed, and generalised from there. (1)
`tableToCompactLines` reads `normalized`, the one text feeding the rebuild that is
**not** re-run through `normalizeAssemblyArtifacts` after `replaceLabels` has
substituted caller-supplied label text into the answer. (2) The table branch
neutralises the **em dash only** (`/\s+—\s+/g` to `": "`), while the artifact rule
matches a hyphen, an en dash **and** an em dash. A label carrying `" - Breakdown: "`
therefore reaches the rebuild live and breaks one entry across two lines.

**Mutation proof — two mutations, two caught.** Run against the new suite:

| # | Mutation | Result |
|---|---|---|
| 1 | Delete the second operand (the change C-505 leaned toward) | **CAUGHT** — 2 of 3 failed |
| 2 | Swap `countCompactLines` for a paragraph count | **CAUGHT** — 2 of 3 failed |

Mutation 2 is the survivor that caused C-505 to be filed in the first place: it
survived the C-503 suite, which is what made the branch look unreachable. It no
longer survives. Mutation 1 is the deletion this item existed to authorise, and the
suite refuses it.

**Clean baseline, same command and same scope on both sides.** Six shaper suites at
the base commit: **99 passed, 0 failed.** The same six plus the new suite after:
**102 passed, 0 failed.** The delta is exactly the three cases added; no existing
expectation moved, which is the correct result for a comment-only source change.

**Typecheck** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— **exit 0**, zero diagnostics, exit code read directly rather than through a pipe.

**Lint** `npx eslint` over both changed files — **exit 0**.

`node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the PR.

## Rollout Plan

Merge to `main` through the repo-owned squash path. The repo-owned
`aca-main-deploy` workflow builds and deploys on merge; no manual Azure command, no
migration, no flag, no worker job. There is no runtime behaviour to roll out — the
executable change is zero lines — so the deploy is carried for the runtime-invariant
proof rather than for any effect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, keyed to the
  squash SHA.
- Shared runtime mutators: none. No `az containerapp update`, no traffic change, no
  template edit from this branch.
- Approved image digest: whatever the repo-owned workflow publishes for this SHA;
  recorded on the claim line after the run completes.
- ACA runtime invariant: Container App template image must equal the image of the
  sole 100%-traffic revision, verified after the deploy run rather than asserted.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** No rendered output differs, so a signed-in
  lane would be a proof with no subject. Stated rather than skipped quietly.

## Rollback Plan

Revert the squash commit. The change is a source comment and one new test file; no
migration, no data, no flag, nothing stateful to unwind. Reverting restores the
incorrect comment, which is the only cost.

## Audit Evidence

- The pull request, its check runs read at the final head OID, and its `mergedAt`.
- `src/__tests__/behaviors/shared-shaper-compact-line-gate.test.ts` — the pinned
  counter-example, readable without running anything.
- `docs/releases/records/2026-09-23-shared-shaper-paragraph-budget.md` — the C-503
  record whose mutation table this corrects. It is left in place unaltered: it is
  audit history, and the correction pattern is append-only.
- The deploy run keyed to the squash SHA and the digest comparison.

## Known Gaps

- **The em-dash asymmetry is left standing, deliberately.** Widening the table
  branch from `/\s+—\s+/` to `[-–—]` would close this injection path and make the
  operand unreachable again — C-505's deletion option arriving by a longer route. It
  is a real behaviour change on real table answers and belongs to its own reviewed
  item, not to a change written to correct a claim. Filed as a new backlog item.
- The reachable case runs through caller-supplied label text. No production caller is
  known today to emit a label of that shape; the point is that the shaper cannot
  detect one and its budget check is what absorbs it. This record does not claim a
  live user-visible defect, because none was measured.
