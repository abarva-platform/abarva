# 2026-06-09-agent-ready-promotion-evaluator — PR-P1 promotion eligibility evaluator (read-only)

## Release ID

`2026-06-09-agent-ready-promotion-evaluator`

## Status

`candidate`

## Plain-English Summary

PR-P1 of the governed promotion workflow. A **read-only** evaluator that, for
every `governed_object_readiness` sidecar row, computes the ten promotion
criteria and a recommendation (`agent_ready` / `restricted` / `blocked` /
`remain_not_reviewed`). It **performs no writes and no promotions** — it only
reports what *would* be eligible. The recommendation ladder mirrors the canonical
`evaluateGovernedObject` / `computeProposedReadiness` gates so the preview, the
ledger, and the runtime gate agree. The committed preview report was generated
from a live read-only run over the sidecar (59,753 rows).

## Layer Impact

- **global-control-lane**: adds governance evaluator lib + pure render module +
  a read-only preview script + the preview report. No schema changes, no writes,
  no runtime behavior change.

## Client Applicability

- All clients: the evaluator covers every tenant + corpus_global. The preview
  reports per-tenant counts (incl. SkyHarbor). No client data mutated.

## Changes Included

- `src/lib/governance/promotion-evaluator.ts` — pure `evaluatePromotion(row)`.
- `src/lib/governance/promotion-preview-render.ts` — pure aggregation + markdown.
- `src/scripts/governance/promotion-preview.ts` — read-only DB glue (SELECT only).
- tests: `promotion-evaluator.test.ts` (11), `promotion-preview.test.ts` (2).
- `docs/governance/AGENT_READY_PROMOTION_PREVIEW_2026-05-09.md` — live preview.

## QA / Validation

**Result: pass.**

- jest: 13 tests pass (evaluator branches + aggregation/render).
- eslint: clean. tsc: 0 errors in changed files.
- Live read-only run (operator-job, image `sha256:eff23224…`): 59,753 rows
  evaluated → **100% `remain_not_reviewed`, 0 agent_ready, 0 blocked, 0
  restricted**. No source rows mutated (SELECT-only).

## Rollout Plan

Merge to `main`. No runtime rollout, no migration, no writes. PR-P2 (write path)
follows, gated on this preview being reviewed/accepted.

## Rollback Plan

Revert the PR. Purely additive read-only code + a report; nothing to undo.

## Audit Evidence

- Preview report with live counts; operator-job exec id; PR + CI.

## Known Gaps

- All 59,753 rows recommend `remain_not_reviewed` because the sidecar's evidence
  columns (`source_basis`, `confidence_level`, `provenance`, `retrievability`,
  `cited_render_verified_at`, `applicable_agents`) are not yet populated/verified.
  Promotion requires an evidence-population + cite-render-verification pass first
  — that is PR-P2 scope, not this read-only preview.
- The PR-P2 stamping columns (`promoted_at`, `promoted_by_job`,
  `promotion_reason`) do not exist yet; the SQL plan in the report documents the
  migration PR-P2 will add.
