# 2026-09-23-shared-shaper-paragraph-budget — The paragraph budget counts paragraphs

## Release ID

`2026-09-23-shared-shaper-paragraph-budget`

## Status

`candidate`

## Plain-English Summary

The shared advisor answer shaper shortens an answer when it is longer than a
character target or longer than a paragraph budget. The paragraph budget was
measured by a helper that split the text on a blank line **or on a single
newline**, so it was really counting lines. A soft line break inside one
paragraph therefore spent a whole paragraph of the budget, and an answer that
was inside both of its declared limits was rebuilt as a lead line plus a few
bullets anyway — losing most of its content for a reason that was not the
stated one.

The helper now splits on a blank line only. The two places in the same module
that genuinely want lines call a separate line splitter, and each says why in
a comment beside it.

The known positive pre-dates this change and is quoted rather than invented: a
comment in `src/__tests__/integration/intelligence-chat-shape.test.ts` names a
fixture measuring 861 characters against a 900-character target, in 5
paragraphs against a 5-paragraph budget, but 6 lines. Re-measured on
`origin/main` before any edit: still 861 / 5 / 6.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, not
feature-gated, no client-scoped data path.

- **Layer 4 — Products.** Presentation only, and narrower than the backlog
  filing assumed (see QA). No canonical model, adapter, intake, schema or
  tenant-data behaviour is touched. No number, metric or fact changes: this
  module shapes prose that has already been produced.

## Client Applicability

- All clients: yes in principle — the module is shared — but see QA. Measured
  across 47 fixtures on ten surfaces, no rendered surface output changes.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — `paragraphSplit` splits on a
  blank line only; a new `lineSplit` carries the old behaviour for the two
  line-shaped readers; `countVisibleParagraphs` renamed `countCompactLines`
  and moved onto `lineSplit`; the lead-candidate list inside `compactForChat`
  moved onto `lineSplit` and renamed to say so.
- `src/__tests__/behaviors/shared-shaper-paragraph-budget.test.ts` — new, 12
  cases.
- `src/lib/answer/__tests__/shared-response-shaper.test.ts` — one existing
  case re-aimed, not weakened, with the reason recorded above it.

No migration, no route, no script, no runtime configuration.

## QA / Validation

**Red first, over the same scope, on the same machine.**

- The new suite against the unrepaired product code: **4 failed, 7 passed**.
- The same suite against the repaired code: **12 passed, 12 total** (a
  twelfth case was added afterwards to kill a surviving mutation; the red
  measurement above is of the eleven that existed at that moment).
- Declared scope — the twelve suites that import the shaper or the surface
  shaper: **145 passed, 0 failed, 4 skipped** on `origin/main` at
  `45867a8f9`; **157 passed, 0 failed, 4 skipped** after. One suite went red
  in between and is discussed below.
- `npm run test:behaviors`: **110 suites, 972 tests, 0 failed.**
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  **exit 0**, judged by exit code.
- `npx eslint` over the three changed files: **exit 0**.

**Blast radius, measured rather than argued.** A 47-fixture corpus was shaped
through `shapeAgentResponseForSurface` on ten surfaces and through
`shapeSharedAdvisorResponse` both ways — 611 cells — before and after. **8
cells differ.** Three are direct `shapeSharedAdvisorResponse` calls whose
answers are now returned whole instead of rebuilt; five are
`length_over_target` issues that stop being raised falsely. **No issue starts
being raised.** **No rendered surface output differs at all** — 470 surface
cells, zero changes.

**A claim in the backlog filing is corrected by that measurement.** C-503 says
the bug "still governs the four declared form surfaces". It does not govern
what those surfaces render: on a compacting surface `compactConsultantChatText`
runs first and has already rebuilt the answer to at most five lines before the
shared shaper sees it. This is therefore a repair to the shared shaper's own
declared contract with no measured change to any rendered surface today. The
last four cases in the new suite pin that statement so it cannot quietly stop
being true.

**Mutation testing — seven deliberate breaks, six caught.**

| mutation | result |
|---|---|
| splitter back to the bare-newline bug | 4 failed — caught |
| splitter never splits (budget cannot fire) | 3 failed — caught |
| compact-rebuild gate counts paragraphs | **12 passed — SURVIVED** |
| lead candidates counted as paragraphs | 1 failed — caught |
| issue detector counts lines again | 1 failed — caught |
| budget loosened by three | 2 failed — caught |
| `lineSplit` becomes a paragraph split | 1 failed — caught |

The survivor is recorded rather than dropped, and it is not a coverage gap. The
compact rebuild assembles at most `maxParagraphs` parts, each single-line by
construction, and joins them with single newlines — so that half of its gate
has **no reachable false case** and the character check beside it is doing the
real work. The one path that could insert a newline there was tried
(`normalizeAssemblyArtifacts` rewriting " — Breakdown:") and is consumed
upstream by `cleanLeadLine`. It is a redundant guard, filed as backlog item
C-505; removing it is not this item's change to make.

**The one existing case that went red.** `collapses compact ranked lists into
chat-sized evidence lines` in `shared-response-shaper.test.ts`. It is not stale
about its subject; it is stale about its trigger. Its fixture is six lines in
one paragraph at 393 characters against a 900-character target, so the only
thing that ever pushed it over budget was the line-counting bug being repaired.
Its `targetChars` is lowered to 320 so the character half of the same gate
fires; **every assertion is left exactly as written** and the output it asserts
is the same collapsed text it has always asserted. The reason sits above the
case in the file, along with the fact that this input cannot reach the
compactor through the product at all — `looksAlreadyStructured` admits three or
more bullet lines, so the only production caller passes `preserveStructure:
true` for it.

**Signed-in proof is OWED, not claimed.** Nothing here was verified against a
signed-in surface, and the measurement above says why that is proportionate:
no rendered surface output changes. If a reviewer wants it anyway, the four
form surfaces are the ones to look at.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys from that merge; no manual Azure command, no image build, no flag, no
environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`.
- Shared runtime mutators: none. This change runs no `az` command.
- Approved image digest: whatever the main deploy workflow produces for the
  merge commit.
- ACA runtime invariant: to be proven after merge — Container App template
  image digest equal to the 100%-traffic revision digest.
- Worker image invariant: unchanged by this release; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not for correctness of this change (no
  rendered surface output differs, measured). Recorded as owed rather than
  waived.

## Rollback Plan

Revert the single commit. There is no migration, no data write and no
configuration change, so a revert is complete on its own. Reverting restores
the line-counting budget and the content loss with it.

## Audit Evidence

- The pull request and its checks.
- The red-first and post-fix counts above, reproducible with
  `npx jest --runTestsByPath src/__tests__/behaviors/shared-shaper-paragraph-budget.test.ts`.
- The known positive: the `C-009` comment in
  `src/__tests__/integration/intelligence-chat-shape.test.ts`.
- The ACA deploy run for the merge commit and its digest comparison.

## Known Gaps

- The surviving mutation above: the compact-rebuild gate carries a half with no
  reachable false case. Filed as C-505, not fixed here.
- Backlog item C-504 is untouched and still open: answers on non-compacting
  surfaces are unbounded in length, and the `length_over_target` signal that
  would report it is computed at every call site and read by none. This change
  makes that signal *more* accurate; it does not make anybody read it.
- An over-budget answer with no keyword the lead picker matches on is still
  reduced to its opening sentence. That is the C-500 / C-504 class of loss and
  is deliberately not addressed here.
