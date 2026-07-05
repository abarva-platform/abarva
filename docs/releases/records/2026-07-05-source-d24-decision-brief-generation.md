# 2026-07-05-source-d24-decision-brief-generation — Decision brief generates from the event chain

## Release ID

`2026-07-05-source-d24-decision-brief-generation`

## Status

`candidate`

## Plain-English Summary

Friction-audit item #5 (first slice). The Atlas Decision Brief (`d24_decision_brief`)
is the board-grade recommendation that closes a sourcing event — and the single
highest-value document to auto-draft, because it should synthesize the entire event
chain (strategy → scope → scores → pricing → BAFO). Today it is hand-typed from a
blank stub.

This adds a generation template so the decision brief drafts itself from the upstream
artifacts already authored on the event: it pulls normalized TCO from the pricing
workbook and capability/security/transition scores from the scorecard to build the
finalist comparison, states the value posture from the value target, and gives a
conditional recommendation plus an honest counter-recommendation. When the scorecard
or pricing workbook has not been authored yet, it refuses to fabricate a comparison —
it states what is missing and recommends only to the extent the evidence supports.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients —
  `d24_decision_brief` becomes AI-generatable (`listSupportedGenerationCodes` 6 → 7). It
  binds only upstream artifacts already on the same event's substrate (no enterprise
  corpus, no cross-tenant data). No schema, seed, or migration.

## Client Applicability

- All clients: yes
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts` — new `d24_decision_brief`
  template. `upstreamRequired: []` (never hard-blocks); `upstreamOptional` binds
  `d01_strategy_memo`, `d02_value_target`, `d05_scope_memo`, `d16_scorecard`,
  `d19_pricing_workbook`, `d22_bafo_question_pack`. The system prompt forbids inventing
  vendors/scores/prices absent from the bound upstream and requires a
  counter-recommendation + the sign-off list.

## QA / Validation

- `listSupportedGenerationCodes()` runtime check → returns 7 codes (adds
  `d24_decision_brief`). **pass.**
- `npx tsc -p tsconfig.json --noEmit` → no errors in the changed file. **pass.**
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts` → clean. **pass.**
- Not yet live-proven: brief quality against a real authored event chain needs an ACA
  deploy (localhost cannot reach the private DB). **not-run** (blocked on environment).

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook. No
migration, no feature flag. Record the ACA revision/image when deployed.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the `d24_decision_brief`
template returns the brief to hand-authoring with no data effect. No schema/migration to
unwind.

## Audit Evidence

- PR URL (to be added on open).
- CI: `release:check`, tsc, eslint.
- `body_generation_metadata` on generated `d24_decision_brief` artifacts records the
  prompt template id/version and the upstream codes bound at generation time.

## Known Gaps

- The remaining payoff artifacts are not yet wired: `d16_scorecard` needs a structured
  scoring model (not just a prose template) to be genuinely useful; `d20_trap_log` and
  `d22_bafo_question_pack` grounding on structured pricing anomalies / open gaps is a
  fast-follow.
- The brief consumes upstream bodies whether or not they are approved; it does not yet
  gate on upstream approval status.
