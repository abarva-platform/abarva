# 2026-07-16-intelligence-followups-and-leak-fix — Contextual Follow-Ups + Raw Fence Leak Fix

## Release ID

`2026-07-16-intelligence-followups-and-leak-fix`

## Status

`candidate`

## Plain-English Summary

Two fixes found during live signed-in testing on Meridian right after #4856 deployed:

1. **Static suggested questions.** The "SUGGESTED QUESTIONS" list under the aVa chat dock was always showing the same 3 starter prompts, never questions relevant to what aVa had just answered. Root cause: `composeAvaAnswer()`'s `nextSteps` field (which the client falls back from) was never populated by the Intelligence `answer-only` route branch — it always defaulted to empty, so the client always fell back to the static starter list. Fix: aVa now ends every answer with a governed ` ```followups ` fenced JSON array of 2-3 questions grounded in that specific answer; the server parses it (same pattern as the decision-table fence) and passes it through as `nextSteps`.
2. **Raw JSON visibly leaking into the chat.** After #4856 shipped the ` ```decision-table ` fence, live testing showed the raw, unprocessed fence JSON appearing directly in the visible answer text for several seconds before/instead of being replaced by the clean rendered table. Root cause: the client has a defense-in-depth check (`hasRawMarkdownTableFragment` / `hasRawTableLeak`) that decides whether to keep showing the raw streamed text or swap to the cleaned packet body once the final answer arrives — but it only recognized raw Markdown pipe-tables (`| ... |`), not the new governed fence types. It never detected a decision-table (or chart, or followups) fence as "unsafe to show raw," so it kept displaying the raw streamed text, JSON and all. Fixed in both places this check exists (`AdvisoryIntelligencePage.tsx` and `AgentDock.tsx`, plus `AgentDock.tsx`'s secondary `stripMarkdownTableFragments` safety net) to also treat ` ```decision-table `/` ```chart`/` ```followups` fences as a leak that forces the swap to the clean packet body.

Also investigated and explicitly NOT fixed here: live testing showed a ~20-30s wait before any text appears for a ranked-decision query. Confirmed via code read that the server streams tokens live with no artificial buffering (`for await (const event of stream) { ... yield chunk }`, no gating) and the client throbber correctly hides on the first non-empty character — so this is genuine model time-to-first-token latency from asking Claude to reason through and emit a much larger structured payload (3 rows × 9 fields of detailed text) before any visible output, not a rendering bug. Tracked as a known gap; a real fix (e.g. streaming prose and table separately) is a larger design change out of scope here.

## Layer Impact

- `global-control-lane`: `src/lib/intelligence/ask/synthesizer.ts` (prompt), `src/lib/intelligence/answer/structured-exhibits.ts` (fence parsing), `src/app/api/intelligence/ask/route.ts` (wiring `nextSteps`), `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` and `src/components/agent/AgentDock.tsx` (client-side leak detection, shared by multiple agent dock surfaces).

## Client Applicability

- All clients: yes — shared prompt/rendering fix.
- Specific clients: reported and live-tested on Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts` — `answerOnlyDirective` now instructs the model to end every answer-only response with a ` ```followups ` fenced JSON array.
- `src/lib/intelligence/answer/structured-exhibits.ts` — new `followupsFenceFromProse()`, new `StructuredExhibits.followups: string[]` field.
- `src/app/api/intelligence/ask/route.ts` — passes `exhibits.followups` as `nextSteps` into `composeAvaAnswer()`.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — `hasRawMarkdownTableFragment` now also detects ` ```decision-table`/`chart``/`followups `` fences.
- `src/components/agent/AgentDock.tsx` — same fence detection added to its own copy of `hasRawMarkdownTableFragment`, plus `stripMarkdownTableFragments` now strips whole fenced blocks (not just pipe-table lines) as a secondary safety net.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` — 4 new tests for the followups fence parser (extraction, cap-at-3, no-fence default, malformed-fence safety).
- This release record.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` (45/45, 4 new)
- Pass: `npx jest src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts --runInBand` (4/4)
- Pass: `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` (3/3)
- `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand`: 43/49 pass; the same 6 failures reproduce identically on `origin/main` with this change stashed out — confirmed pre-existing, not a regression from this PR.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Live signed-in re-test on Meridian pending this PR's merge + ACA deploy.

## Rollout Plan

Merge via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys automatically on push to `main`. No env var, flag, or migration change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: assigned by the existing main-deploy workflow on merge.
- ACA runtime invariant: unaffected.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after merge + deploy — re-ask the ranking query on Meridian and confirm (a) suggested questions change to be relevant to the answer just given, and (b) no raw ` ```decision-table ` JSON is visible in the answer text at any point during or after streaming.

## Rollback Plan

Revert the PR. Both fixes are additive/defensive (new optional field, broader leak-pattern match); reverting restores prior (broken) behavior with no other side effects.

## Audit Evidence

- Parent PRs: #4851, #4856.
- Live failure evidence: captured in-session (not committed) — screenshots of the raw JSON fence visible in the chat transcript on `https://app.abarva.ai/intelligence?client=meridian`, and of unchanged suggested-questions across turns.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- Time-to-first-token latency (~20-30s observed) for ranked-decision queries is a real UX cost of the larger structured-output prompt from #4856, confirmed not to be a rendering bug. Not addressed in this PR; would need a larger design change (e.g., streaming prose and the decision table as separate calls) to improve.
- Live signed-in re-proof on Meridian pending this PR's merge + deploy.
