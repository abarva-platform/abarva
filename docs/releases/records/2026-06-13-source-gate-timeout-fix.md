# 2026-06-13-source-gate-timeout-fix — Fix consulting-grade gate 504 on ACA

## Release ID

`2026-06-13-source-gate-timeout-fix`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Fixes a live HTTP 504 when generating a consulting-grade-gated Source deliverable (d02 Value Target
Brief, d03 Archetype Decision Record — and the same risk on d09). The synchronous draft → review →
rewrite ran past the ACA ingress request cut (~150s observed) because the route budgeted 285s (matching
the Vercel-style `maxDuration=300`) while the live runtime kills the request much earlier — so it was
killed mid-rewrite with a 504 instead of returning gracefully.

Two changes: (1) cap d02/d03 output at 2,000 tokens (they are short docs — 600-1000 / 500-900 words — so
no quality loss) so the full gated pass is fast; (2) lower the synchronous request budget to 110s so the
gate returns its draft + verdict (422) gracefully under the infra cut rather than 504-ing mid-rewrite.

## Layer Impact

- `global-control-lane`: Two constants — `maxTokens` on the d02/d03 prompt templates and the route's
  `SOURCE_SYNC_GENERATION_BUDGET_MS`. No schema, route contract, or new runtime dependency. The gate
  logic, models, and quality bar (8/10 across 10 dimensions) are unchanged.

## Client Applicability

- All clients: no behaviour change except that gated Source generation now completes (or returns a
  graceful verdict) instead of timing out.
- Specific clients: SkyHarbor — where this 504 was caught live walking the originated AMS event.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated generation is reached through `workspace_explorer_source` (SkyHarbor today).

## Changes Included

- `prompt-registry.ts`: d02_value_target and d03_archetype_decision `maxTokens` 4000 → 2000 (version → 2).
- `generate/route.ts`: `SOURCE_SYNC_GENERATION_BUDGET_MS` 285_000 → 110_000.

## QA / Validation

- PASS: `npx jest … strategy-authoring.test.ts` (4/4) · `npx eslint` clean · `npx tsc --noEmit` no errors.
- Pending: live re-test on ACA — regenerate d02/d03 on the SkyHarbor event and confirm a 200 + quality-gate
  verdict (not 504), at the state level.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift 100% traffic. Then re-walk the SkyHarbor
Strategy stage and regenerate d02/d03.

## Rollback Plan

Revert the PR — restores the prior constants. No data/schema to unwind.

## Audit Evidence

PR diff (two constants + this record), CI checks, local jest/eslint/tsc output above, and the live 504
screenshot/finding in the SkyHarbor walk that motivated the change. Generation egress remains audited at
runtime via `preflightAnthropicDirectClient` (ai_egress_audit).

## Known Gaps

- The deeper fix is asynchronous generation (job + poll) so gated deliverables never depend on a single
  synchronous request budget; this change is the targeted latency/timeout fix, not that refactor.
- d09 (RFP pack, 6200-token draft) may still approach the budget; if it returns a graceful 422 instead of
  a full rewrite, that is acceptable and better than a 504 — a dedicated d09 path is follow-up.
