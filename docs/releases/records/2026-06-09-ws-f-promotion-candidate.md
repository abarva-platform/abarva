# 2026-06-09-ws-f-promotion-candidate — Promotion-candidate state in the governed evaluator (WS-F)

## Release ID

`2026-06-09-ws-f-promotion-candidate`

## Status

`candidate`

## Plain-English Summary

Extends the EXISTING promotion evaluator (does not duplicate it) to make the
governed pipeline explicit: ingestion produces committed facts that become
**promotion_candidates** when they meet every evidence criterion, and a row only
becomes **agent_ready through governed sign-off** — never directly from a load.
Previously a fully-eligible-but-unapproved row was recommended `agent_ready`,
which blurred "eligible to promote" with "promoted." Now: every criterion met +
not yet approved → `promotion_candidate`; already approved (persisted
agent_ready) + criteria still pass → `agent_ready`; gaps → `remain_not_reviewed`;
hard blocks/sensitive unchanged. The promotion-preview report surfaces the new
state and lists promotion candidates as the rows eligible for governed
promotion.

## Layer Impact

- `global-control-lane`: pure change to `src/lib/governance/promotion-evaluator.ts`
  + `promotion-preview-render.ts`. No data mutation, no migration — the evaluator
  is read-only/advisory and the preview is a report. Reinforces (never weakens)
  the rule that agent_ready is earned.

## Client Applicability

- All clients: Yes — applies to every tenant's governed objects.
- Internal only: report is operations/governance-facing.
- Feature flag: none.

## Changes Included

- `src/lib/governance/promotion-evaluator.ts` — add `promotion_candidate` to the
  recommendation union; split the terminal branch; `isPromotionCandidate` helper.
- `src/lib/governance/promotion-preview-render.ts` — count + list candidates;
  promotion targets are candidates, not already-agent_ready rows.
- Tests: `promotion-evaluator.test.ts` (+3 cases, updated 2), `promotion-preview.test.ts` (updated).

## QA / Validation

- `npx jest` on evaluator + preview + production-readiness-promotion-gate →
  61/61 pass.
- `npx tsc --noEmit` / `npx eslint` → clean on touched files.
- `npm run audit:architecture-rules` / `npm run release:check` /
  `npm run validate:context-corpus` → green.

## Rollout Plan

Merge to `main` after CI green. No migration, no runtime answer-path change. The
next promotion-preview run (ACA operator job over `governed_object_readiness`)
emits the new candidate counts.

## Rollback Plan

Revert the PR. Pure advisory logic; no data effect.

## Audit Evidence

- PR URL: (filled on open).
- Test log: 61/61.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit — this is
the promotion-eligibility evaluator + preview report only.

## Known Gaps

- The persisted promotion approval workflow (writing `agent_ready` after
  sign-off) remains the existing governed step (PR-P2 SQL plan); this PR makes
  candidacy explicit but does not change how approval is recorded.
