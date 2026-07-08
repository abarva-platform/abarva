# 2026-07-08-source-ava-polish-gate — Source aVa chat polish: off-topic answers + garbled table/list rendering

## Release ID

`2026-07-08-source-ava-polish-gate`

## Status

`candidate`

## Plain-English Summary

Follow-up to the completed Source aVa chat build (16 answer modes across
#4583/#4585/#4586, plus live-found fixes #4588/#4590/#4594). Two polish gaps were
found by real, live browser testing on a real Source event
(`adcb1cd0-c586-4622-bd29-574cc5a10862`, Lakeshore Holdings AMS) and are fixed here.

**Gap 1 — "What evidence is missing?" answered off-topic.** Asked on the RFP stage,
this question was answered with an unrelated risk item (a generic
SOX/payment-approval compliance flag) instead of Source-event evidence readiness.
Root cause, verified by direct code inspection and a live classifier call (not
guessed): the question classifies correctly to `evidence_readiness` — no earlier
rule in `answer-mode.ts`'s `RULES` array matches this exact phrasing ahead of it —
and its Source-scoped grounding builds correctly too. The actual bug is one layer up
in `/api/chat/agent/route.ts`: on every turn, the route ALSO assembles a generic,
TENANT-WIDE `ContextBundle` (`getContextBroker().assemble` with mode `'full'`,
independent of the active Source event) via a keyword/semantic search, and injects it
into the SAME system prompt as the correctly Source-scoped grounding — with nothing
telling the model the generic block was off-topic for this turn. Broad keywords like
"evidence" and "missing" can surface an unrelated tenant-wide compliance/risk chunk,
and the model folded that into the answer instead of staying on the Source event's
topic. Fix: once a grounded, non-passthrough Source answer mode has fired for a turn
(`shouldSuppressGenericContextBundleForSourceMode`), the route now drops the generic
cross-module context-broker receipt from the model's PROMPT. The reactive "Context
Assembled" panel is untouched — it still shows the full bundle the broker actually
retrieved, since that's diagnostic transparency, not model input.

**Gap 2 — long answers rendered with garbled table formatting and stray fragments.**
A value-lever answer (real, correctly-grounded classified-value data) rendered as a
run-on unstructured line ("Lever | Type | Range Enhancement / change-order leakage |
Protected (risk hedge) | $12M–$18M Volume-band price flex-down |.") instead of a
table. Root cause, verified: the chat renders through `react-markdown` + `remark-gfm`
(`AgentMarkdown`), which only recognizes a GFM table when there is a header row, a
`| --- | --- |` separator row, and one data row per line. The garbled text had none
of that — no separator row, and the "rows" were collapsed onto one line — so
`remark-gfm` never built a table node and the literal `|` characters rendered as
plain paragraph text. This is un-parsed markdown, not a broken parser, and neither
`stripChatMarkdownFormatting` nor the existing `repairMalformedComparisonTables`
(which only targets the specific 4-column "Option | Strength | Weakness | Fit" shape)
caught it. A second symptom — a BAFO-ask answer where "1." appeared alone on its own
line with the real ask text as a disconnected paragraph below — has the same class of
root cause: the model emitted a bare numbered-list marker with nothing after it on
the same line, which markdown treats as a new, unrelated paragraph rather than a
continuation of item 1; this is the model's own malformed markdown, not a
join/streaming bug (`splitOverlongParagraphs` only ever splits on existing blank-line
boundaries, never merges or reorders text across them). Fix: (a) prevention — the
Source system prompt's `AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD` now instructs the model
to emit a properly-formed GFM table (header + separator row + one row per line) or a
bulleted list, never collapsed pipe text; (b) safety net — two new defensive repairs
in `response-shape.ts`: `repairRunOnPipeTableText` detects a collapsed multi-cell
pipe run-on and reflows it into a clean bulleted list (column alignment cannot be
safely recovered once rows are collapsed, so we never guess at reconstructing a
table — a clean list beats a broken table), and `repairOrphanedNumberedMarkers`
(final-flush only, not mid-stream) joins a lone numbered marker onto the next
paragraph when one is available. Both are wired into the SAME shaping functions
every surface already uses (`shapeStreamingAgentTextForSurface` /
`shapeAgentResponseForSurface`) and leave already-well-formed markdown (real GFM
tables, bullet/numbered lists) untouched.

## Layer Impact

- `global-control-lane`: shared chat-answer behavior for every surface that streams
  through `/api/chat/agent` and renders via `AgentMarkdown`/`response-shape.ts`. Gap
  1's fix is scoped to Source: it only changes prompt content when a Source-event
  grounded answer mode has fired (`sourceAvaAnswerMode` is only ever set on
  `source_analytics`-enabled Source turns); every other surface/turn is byte-for-byte
  unchanged. Gap 2's fix (the two new repair functions in `response-shape.ts`) runs
  for every surface's shaping pipeline, but is defensively conservative (requires 4+
  pipe-delimited segments collapsed onto one line, or a bare numbered marker followed
  by a real next paragraph) so it does not touch normal prose, real GFM tables, or
  well-formed numbered lists on any surface.
- `client-data-lane`: none. No schema, migration, or data-plane change.

## Client Applicability

- All clients / all tenants with `source_analytics` enabled: yes — both fixes apply
  uniformly to every tenant enrolled in `source_analytics` (Lakeshore in lab today);
  no additional tenant-specific gating was added or is required.
- Specific clients: n/a — not further scoped beyond the existing `source_analytics`
  flag for Gap 1's prompt-suppression change. Gap 2's render-side repairs run on all
  surfaces (Source, Tower, Programs, Home, etc.), gated only by the conservative
  pattern-match described above, not by tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; Gap 1's fix only activates within the
  existing flag-gated Source mode-grounding branch). Gap 2's repairs are not
  flag-gated — the previous behavior (raw garbled text on failure) had no flag either.

## Changes Included

- `src/lib/source/ava/answer-mode.ts` — new exported
  `shouldSuppressGenericContextBundleForSourceMode(mode)`: true for any grounded
  Source answer mode (Phase A/B/C), false for `stakeholder_alignment` or `null`. Pure
  function, no side effects.
- `src/app/api/chat/agent/route.ts` — derives
  `contextBundlePromptBlockForPrompt` from the new predicate and injects it into the
  system-prompt array in place of the raw `contextBundlePromptBlock` (the raw value
  still feeds the `context-bundle` artifact for the reactive panel, untouched).
- `src/lib/source/facts/view/ava-grounding-context.ts` —
  `AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD` gains a new "TABLE FORMAT" directive:
  instructs the model to emit a valid multi-line GFM table (header + `| --- |`
  separator row + one row per line) or a bulleted list, never collapsed pipe text.
- `src/lib/agent/response-shape.ts` — two new safety-net repairs:
  `repairRunOnPipeTableText` (reflows a collapsed pipe run-on into a bulleted list;
  leaves real GFM tables and ordinary prose untouched) and
  `repairOrphanedNumberedMarkers` (joins a lone numbered-list marker onto the next
  paragraph; final-flush only). Wired into `shapeStreamingAgentTextForSurface` (both
  repairs run live during streaming for the pipe-table case;
  `repairOrphanedNumberedMarkers` is intentionally NOT run mid-stream since "the next
  paragraph" may not have arrived yet) and `shapeAgentResponseForSurface` (both run
  at final flush).
- Tests (all new, all pass):
  - `src/lib/source/ava/__tests__/answer-mode.test.ts` — Gap 1 regression: "What
    evidence is missing?" classifies to `evidence_readiness` (not any earlier rule);
    case-insensitive / punctuation variants; `shouldSuppressGenericContextBundleForSourceMode`
    is true for every grounded mode and false for `stakeholder_alignment`/`null`.
  - `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts` — source-inspection
    regression (route.ts is too heavy for a full-stack test, matching the existing
    `agent-route-context-bundle.test.ts` / `source-l7-discipline.test.ts` pattern):
    pins the import, the derived variable, its use in the prompt array, and that the
    raw bundle still feeds the panel artifact.
  - `src/lib/agent/__tests__/source-ava-polish-gate-response-shape.test.ts` — Gap 2
    regression: the exact live-found run-on pipe string reflows to a clean bulleted
    list with no literal `|` (both streaming and final paths); a well-formed GFM
    table is left untouched; ordinary prose with a stray `|` is untouched; the
    orphaned "1." marker joins onto its next paragraph at final flush only (not
    mid-stream); a normal 3-item numbered list is untouched.
  - `src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` — "What value
    levers exist?" classifies to `general_advisory` (the grounded catch-all), and its
    grounding block never itself emits a raw pipe fragment (bullet-style value-type
    lines only) — proving the render-side repair is the correct backstop for
    whatever the model does with that data, not a grounding-data bug.
- Locked-in regressions (already passing before this PR, now covered by a named
  test so they cannot silently regress): "What should we ask in BAFO?"
  (`bafo_strategy.core` classification, existing `mode-grounding-phase-b.test.ts`
  coverage), "Is the RFP final and ready to issue?" (existing
  `mode-grounding-phase-c.test.ts` REGRESSION test from #4594), "Which RFP version is
  final?" (existing `answer-modes-fixture-suite.test.ts` honest-fallback coverage for
  `artifact_finality` with no client-final artifact).

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p . --noEmit` — ran to completion
  with 0 errors on `origin/main` before this change (verified directly, plain `npx
  tsc` without the increased heap OOMs on this repo's size — the increased heap is
  required, not optional) and 0 errors after this change. **Net-new = 0. Status:
  pass.**
- `npx eslint` on every changed/added file — 0 errors. One pre-existing warning
  (`'sanitizeAutonomousDecisionLanguage' is defined but never used` in
  `src/app/api/chat/agent/route.ts`) confirmed present on `origin/main` before this
  change too — not introduced by this PR. **Status: pass.**
- `npx jest src/lib/source/ava/__tests__/` — 182 tests, all green (full Phase
  A/B/C + stage-gate-fix suite, including this PR's additions).
- `npx jest` targeted at every new/changed test file together (answer-mode,
  mode-grounding-phase-c, the two new polish-gate test files, the route
  context-bundle/L7 tests, `ava-grounding-context.test.ts`) — 200 tests, all green.
- Full-repo `npx jest --silent` — compared against the same run on `origin/main`
  with this branch's changes stashed. Three pre-existing failures were found and
  confirmed IDENTICAL (same failure, same count) with and without this PR's changes:
  `src/app/api/chat/agent/__tests__/steward-trust-spine-wiring.test.ts` (1 of 4),
  `src/lib/agent/__tests__/response-shape-regression.test.ts` (2 of 10 — a
  `looksAlreadyStructured` table-detection issue unrelated to Source), and
  `src/app/api/chat/agent/__tests__/agent-quality-answer-key.test.ts` (1 of 6). None
  of these touch Source aVa, the context broker, or the response-shape repairs added
  here; they are stale on `origin/main` independent of this PR. This PR introduces
  **zero net-new test failures** anywhere in the repo. **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**
- Every file touched or added in this PR was re-read after editing to confirm it
  ends cleanly (no stray tags, no unterminated blocks, no leftover scratch code).

## Rollout Plan

Merge to `main` via squash. No DB migration, no schema change, no new feature flag.
Gap 1's fix only activates inside the existing `source_analytics`-gated Source
mode-grounding branch (an existing flag, unchanged). Gap 2's render-side repairs
apply to every surface's existing shaping pipeline with no flag — they only trigger
on the specific garbled-output pattern described above and are inert on well-formed
output. No traffic shift, no runtime image change is performed by this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged; not
  invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic,
  revision weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag;
  no new flag introduced.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore RFP-stage "What evidence is missing?" turn showing an on-topic Source
  evidence-readiness answer, and a value-lever/BAFO turn showing a clean
  table/bulleted list with no literal `|` characters. Not claimed in this record —
  this PR is `candidate`, not `live-proven`.

## Rollback Plan

Revert the PR. No migration was applied, so there is nothing to unwind at the DB
layer. Reverting the app code restores the exact prior behavior for both gaps
(the generic context-bundle receipt would once again be injected unconditionally,
and the two new repair functions would no longer run) — a clean, code-only rollback.

## Audit Evidence

- PR URL: see the branch `fix/source-ava-polish-gate` PR on
  `abarva-platform/abarva`.
- Live-found context: real browser testing on Source event
  `adcb1cd0-c586-4622-bd29-574cc5a10862` (Lakeshore Holdings AMS), various stages —
  the two gaps this record fixes.
- tsc / eslint / jest output captured in this record's QA section and in the PR
  description.
- No migration file added or applied.

## Known Gaps

- Gap 2's table repair is a defensive safety net, not a structural fix: when the
  model collapses table rows onto one line, column alignment cannot be safely
  recovered, so the repair reflows the data into a bulleted list rather than
  reconstructing a table. The TABLE FORMAT prompt directive is the real fix (prevent
  the model from collapsing rows in the first place); the render-side repair is a
  backstop for when it doesn't comply.
- Live signed-in Lakeshore proof (the exact two live-found questions, re-asked
  post-fix) is pending — this record is `candidate`, not `live-proven`.
- The three pre-existing test failures noted in QA/Validation
  (`steward-trust-spine-wiring.test.ts`, 2 in `response-shape-regression.test.ts`,
  `agent-quality-answer-key.test.ts`) are out of scope for this PR — they are stale
  on `origin/main` independent of Source aVa and are not touched here.
