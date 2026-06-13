# 2026-06-12-docgen-policy-tiers — central document-generation policy (model + token tiers, env-configurable)

## Release ID

`2026-06-12-docgen-policy-tiers`

## Status

`candidate`

## Plain-English Summary

The keystone of the high-quality-document program (the audit's "immediate next").
Adds a single source of truth for which Claude model and token budget each kind
of work may use, so serious deliverables can never run on chat-answer settings.

Four tiers — Chat / Working-draft / Board-grade / Large-package — each with an
**environment-configurable** model id and token budget (safe Opus-class defaults
that do not starve final artifacts). A deliverable→tier registry covers all the
Moves and Source deliverables (Charter, Discovery, Business Case, RFP, Strategy
Memo, etc.); unknown types fail **safe to board-grade**, never to a chat budget.
The orchestrator's model-caller now resolves its model from this policy by the
deliverable's tier instead of a hardcoded constant. A guard
(`assertDeliverablePolicy`) throws if a deliverable resolves to a chat tier or a
starved budget — enforced by a regression test.

## Layer Impact

- `global-control-lane`: new `src/lib/ai/document-generation-policy.ts`; the
  Deliverable Intelligence Orchestrator model-caller reads the model from it.
  No schema, no API change, no runtime model change (defaults match prior
  behavior: board-grade still `claude-opus-4-8`).

## Client Applicability

- All clients: policy is shared; no per-tenant behavior change in this slice.
- Feature flag: none (additive policy + a default-equivalent rewire).

## Changes Included

- `src/lib/ai/document-generation-policy.ts` — tiers, env-configurable
  `ABARVA_CLAUDE_*_MODEL` + `ABARVA_DOCGEN_*_MAX_TOKENS`, deliverable→tier
  registry, `resolveDocumentPolicy`, `tierForDeliverable`, `policyForTier`,
  `assertDeliverablePolicy` (the chat-budget guard).
- `src/lib/deliverables/orchestrator/model-caller.ts` — resolves the model per
  request from the policy (tier-4 packages → large-package model) instead of the
  hardcoded `claude-opus-4-8` constant; caller `model` override preserved.
- `docs/build/DOCUMENT_GENERATION_MODEL_POLICY.md` — the policy doc.
- Tests: `src/lib/ai/__tests__/document-generation-policy.test.ts` (9 tests incl.
  the keystone guard: a final deliverable cannot use a chat-tier budget).

## QA / Validation

- `npx tsc --noEmit`: clean. `npx eslint` on changed files: clean.
- Jest: 9 policy tests pass; the 54 orchestrator + business-case tests still pass
  after the model-caller rewire (default model unchanged at `claude-opus-4-8`).

## Rollout Plan

Merge and deploy. Behavior-neutral by default (board-grade model unchanged). To
upgrade a model later, set the env var (e.g. `ABARVA_CLAUDE_BOARD_GRADE_MODEL`)
— no code change. Next slices route Source/Moves final paths through this policy.

## Rollback Plan

Revert the model-caller rewire (restores the hardcoded default); the policy
module is additive and inert if unused. No data change.

## Audit Evidence

- Branch: `feat/docgen-policy-tiers`.
- Follows `docs/build/CLAUDE_DOCUMENT_GENERATION_AUDIT_2026-06.md` (PR-1) — this
  is its recommended PR-2.

## Known Gaps

- Source route-local paths (D01/D05/D09 via `prompt-registry.ts`) do not yet
  read this policy — that is the next slice (Source migration). The policy is in
  place for them to adopt.
- Per-pass token budgets in `prompt-builder.ts` remain generous (16k for
  draft/rewrite/render) and are not yet derived from the tier ceiling; harmless
  (they already exceed chat budgets) and can be unified in a later slice.
