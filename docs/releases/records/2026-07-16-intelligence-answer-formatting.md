# 2026-07-16-intelligence-answer-formatting — Fewer, Shorter Prose Paragraphs Before Exhibits

## Release ID

`2026-07-16-intelligence-answer-formatting`

## Status

`candidate`

## Plain-English Summary

Live review of the Intelligence chat answer (using the dock's own "Expand chat" overlay for a clearer look) showed aVa writing 5 separate flowing paragraphs before the decision table/charts — technically within the existing per-paragraph word cap, but cumulatively reading as a wall of text rather than a scannable executive answer. Tightened the shared answer-shape prompt contract (`CONSULTANT_ANSWER_SHAPE_CONTRACT` and `CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH` in `response-policy.ts`, used by Home, Intelligence, and Tower) to cap total paragraph count (2-3 max before any exhibit) and explicitly push 3+ related facts/gaps/options into a bullet list or the governed table format instead of narrative paragraphs.

## Layer Impact

- `global-control-lane`: `src/lib/intelligence/ask/response-policy.ts` — shared answer-shape prompt contract used by Home, Intelligence, and Tower chat surfaces.

## Client Applicability

- All clients: yes — shared prompt-copy change, not tenant-scoped.
- Specific clients: observed on Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts` — both `CONSULTANT_ANSWER_SHAPE_CONTRACT` and `CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH` now cap total paragraph count and push multi-item content toward bullets/tables instead of narrative paragraphs.
- This release record.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand`
- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts --runInBand` (regression check, unaffected by this change)
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
- Live signed-in proof required: yes, after merge + deploy — re-ask a ranking question on Meridian and confirm the prose is 2-3 short paragraphs (or bullets) rather than a long narrative chain before the exhibit.

## Rollback Plan

Revert the PR. This is a prompt-copy-only change; reverting restores the prior (looser) paragraph guidance with no other side effects.

## Audit Evidence

- Parent PRs: #4851, #4856, #4858, #4861, #4863, #4864.
- Live evidence: observed via the Intelligence chat dock's "Expand chat" overlay on `https://app.abarva.ai/intelligence?client=meridian` — 5 separate paragraphs before the table for "For Meridian agent assist, rank the top opportunities by value and complexity. Show the tradeoff in an executive-ready way."
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- Suggested-questions panel still shows static starter prompts rather than contextual follow-ups grounded in the last answer — re-confirmed live in this session, separate from this fix; the ` ```followups ` fence mechanism from #4858 needs re-verification after the #4863/#4864 prompt rewrite.
- Live signed-in re-proof of the formatting improvement pending this PR's merge + deploy.
