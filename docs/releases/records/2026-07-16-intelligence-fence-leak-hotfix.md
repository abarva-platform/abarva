# 2026-07-16-intelligence-fence-leak-hotfix — Raw Decision-Table JSON Still Leaking After #4858

## Release ID

`2026-07-16-intelligence-fence-leak-hotfix`

## Status

`candidate`

## Plain-English Summary

Live re-test on Meridian after #4858 deployed showed the raw ` ```decision-table ` JSON was **still** visibly leaking into the chat answer, even though #4858 added client-side detection for that fence pattern. Root cause: `route.ts`'s streaming loop scrubs each delta chunk individually (`displaySafeIntelligenceDelta`), and governed fence markers like ` ```decision-table ` are long enough to be split across multiple small model-token chunks. By the time the client accumulates and pattern-matches the streamed text, the fence marker itself can be corrupted/fragmented, so the client's leak-detection regex (added in #4858) never matches it — the "is this text safe to show raw" check was trying to pattern-match text that might already be mangled.

Fix: stop trying to detect a leak on the (possibly-corrupted) raw streamed text. Whenever the server has successfully extracted structured artifacts (tables/charts/graphs — which it does by parsing the SAME underlying text server-side, on the unscrubbed accumulator, so it's reliable), always prefer that clean packet body over the raw stream, full stop. No leak pattern-matching needed. Extracted this decision into a new pure, exported, unit-tested function (`resolveAssistantAnswerText`) instead of leaving it as unexported inline logic, given this is the second bug found in this exact code path in one day.

## Layer Impact

- `global-control-lane`: `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — client-side answer-text resolution for the Intelligence chat dock only.

## Client Applicability

- All clients: yes.
- Specific clients: reported and live-tested on Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — new exported `resolveAssistantAnswerText(rawStreamedAnswer, packetBody, hasArtifacts)`; when `hasArtifacts` is true, unconditionally prefers `packetBody` over the raw stream instead of requiring a leak-pattern match first.
- `src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts` — 5 new tests, including one that reproduces a corrupted/fragmented fence marker (simulating per-chunk scrub corruption) and confirms the packet body still wins.

## QA / Validation

- Pass: `npx jest src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts --runInBand` (5/5, new)
- `npx jest src/components/intelligence-advisory/ --runInBand`: 5/7 pass; the same 2 `AdvisoryIntelligencePage.test.tsx` failures (unrelated "Opportunity map" Trends-tab assertions) reproduce identically on `origin/main` before this change — confirmed pre-existing.
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
- Live signed-in proof required: yes, after merge + deploy — re-ask the ranking query on Meridian and confirm no raw ` ```decision-table ` JSON is visible anywhere in the final rendered answer.

## Rollback Plan

Revert the PR. The change only affects which of two already-computed strings (`rawStreamedAnswer` vs `packetBody`) gets displayed once artifacts exist; reverting restores the prior (still-broken) leak-detection heuristic with no other side effects.

## Audit Evidence

- Parent PRs: #4851, #4856, #4858.
- Live failure evidence: captured in-session (not committed) — full page-text dump and screenshot from `https://app.abarva.ai/intelligence?client=meridian` after #4858 deployed, showing the raw decision-table and followups JSON still present in the rendered answer despite #4858's fix.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- A brief flash of raw/partial text is still possible WHILE the answer is actively streaming (before the final `agent-answer` event arrives) — this fix only guarantees the FINAL rendered state is clean once streaming completes and artifacts are known to exist. Eliminating the mid-stream flash entirely would require not scrubbing/displaying raw deltas at all for fence-shaped queries, a larger change out of scope here.
- Live signed-in re-proof on Meridian pending this PR's merge + deploy.
