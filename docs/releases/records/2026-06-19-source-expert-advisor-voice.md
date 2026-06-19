# 2026-06-19-source-expert-advisor-voice — Author Source deliverables as an expert advisor

## Release ID

`2026-06-19-source-expert-advisor-voice`

## Status

`candidate`

## Plain-English Summary

Generated Source deliverables (strategy memo, scope memo, etc.) read as rigorous
but mechanical — like an auditor labelling claims "verified / asserted / unknown"
and filling in a section checklist, rather than like a seasoned consulting partner.
The cause was the generation voice: Claude was told it is an "information-integrity
validator… not advisor", and the per-artifact prompts were structural checklists.
This reframes the shared voice to a senior sourcing advisor with a point of view,
judgment from experience, and flowing executive prose — while keeping the
no-fabrication / gap-honesty discipline (now expressed as advice, not bare audit
tags). The strategy-memo prompt is reframed from a checklist into an expert
recommendation. The change is to the prompt only; the no-fabrication rules,
client-clean language guard, and required-section coverage are preserved.

## Layer Impact

- `global-control-lane`: shared deliverable-generation prompt
  (`lib/source/agent-generation/prompt-registry.ts`). Affects the authored tone of
  every Source artifact via the shared `SENTINEL_VOICE`. No data/schema/API change;
  the quality gate and section conformance are unchanged.

## Client Applicability

- All clients: yes — every Source deliverable generation.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `explore/source-gen-prompt`. Rewrote `SENTINEL_VOICE` (expert advisor +
  preserved integrity discipline + anti-mechanical guidance) and the d01 strategy-
  memo tone block (checklist → expert recommendation).

## QA / Validation

- `jest prompt-registry.test.ts strategy-authoring.test.ts` → **PASS** (8/8;
  client-clean-language and required-section guards still hold).
- `eslint` → **PASS** (exit 0).
- Live before/after: regenerate the First Capital Strategy Memo
  (`c8cdad34…/d01_strategy_memo`) on the deployed image and compare tone —
  **run as the acceptance check**.

## Rollout Plan

Merge to main → ACA build/deploy → re-pin traffic. Verified ahead of merge via a
direct image build + live regeneration on the lab app.

## Rollback Plan

Revert the commit. Prompt-only; the prior voice returns immediately on next
generation. No persisted state (already-generated docs are unchanged until
re-run).

## Audit Evidence

- PR: (filled on open) `explore/source-gen-prompt`
- Before/after Strategy Memo drafts for the First Capital event.

## Known Gaps

Only `SENTINEL_VOICE` and the d01 prompt were reframed in this pass; d02/d03/d05/d09
inherit the new shared voice but their per-artifact instruction blocks are still
checklist-shaped and can be reframed in a follow-up. The consulting-grade quality
gate remains RFP-specific (d02/d03 generate single-pass) — making it per-artifact
is a separate follow-up.
