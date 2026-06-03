# AI Liability Retrofit Checkpoint Runbook

Backlog row: T251
Owner: AbarVa platform owner
Cadence: after every AI-enabled feature PR and before pilot launch review

## Purpose

Use this runbook to keep the AI liability retrofit wave reviewable. The
checkpoint answers whether every audited Intelligence, Moves, Source, Tower,
Setup, and agent-chat surface has the required responsible-AI controls:

- visible AI-assisted or generated-output label when applicable
- source citations or evidence references
- confidence, assumptions, limitations, or missing-input disclosure
- human decision owner, rationale, and attestation for consequential actions
- regression test or verifier coverage

## Source Files

- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md`

## Update Procedure

1. Review the merged PRs and tracker rows T231-T250.
2. Update the checkpoint table only when implementation or accepted external
   evidence changes a row state.
3. Keep `Done`, `In progress`, and `Not started` truthful.
4. Recompute strict completion and weighted execution signal.
5. Run:

```bash
node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs
npm run release:check -- --base origin/main --head HEAD
```

6. Update the release record for any changed evidence.

## Launch Rule

Do not treat the wave as pilot-complete while any T231-T250 row remains
`In progress` or `Not started`.

The weighted signal is useful for planning and sequencing, but only strict
100% `Done` closes T251.

## Current Follow-Up Queue

1. T250: close deferred catalog claims and extend CI coverage across every
   audited surface.
2. T238/T240: finish Source vendor-recommendation and savings/cost assumption
   coverage beyond the completed external-action gate.
3. T242/T243: finish Tower prediction assumption disclosure and persisted
   human acknowledgment evidence.
