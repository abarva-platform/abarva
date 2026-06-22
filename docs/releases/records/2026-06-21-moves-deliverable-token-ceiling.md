# 2026-06-21-moves-deliverable-token-ceiling — Moves deliverable max_tokens 8k → 32k + Opus 4.8

## Release ID

`2026-06-21-moves-deliverable-token-ceiling`

## Status

`candidate`

## Plain-English Summary

The `v2-generator.ts` draft and revision passes used `max_tokens: 8_000` and `claude-opus-4-7`. At 8k tokens (~6,000 words / ~15 pages), any deliverable longer than that is silently truncated. Board-grade Moves deliverables — strategic decision papers, execution roadmaps, master dossiers — are expected to run 20–50 pages. The model also aged out: `claude-opus-4-7` is superseded by `claude-opus-4-8`.

This PR bumps the draft and revision passes to `max_tokens: 32_000` (the Opus output ceiling) and updates all three passes to `claude-opus-4-8`. The quality review pass goes from 3,000 to 4,000 tokens to give it room to score longer documents.

No structural change — same 3-pass pipeline (draft → review → revise). Only the token ceiling and model name change.

## Layer Impact

- **global-control-lane**: `src/lib/deliverables/v2-generator.ts` — model and token constants only. No schema, migration, or new dependency.

## Client Applicability

- All clients: applies to every Moves deliverable that goes through the v2-generator path (charter, business case, execution plan, strategic decision paper, etc.).

## Changes Included

- `src/lib/deliverables/v2-generator.ts`:
  - `generateDraft`: `claude-opus-4-7` → `claude-opus-4-8`, `max_tokens: 8000` → `max_tokens: 32_000`
  - `reviewAgainstRubric`: `claude-opus-4-7` → `claude-opus-4-8`, `max_tokens: 3000` → `max_tokens: 4_000`
  - `reviseDeliverable`: `claude-opus-4-7` → `claude-opus-4-8`, `max_tokens: 8000` → `max_tokens: 32_000`

## QA / Validation

- TypeScript: PASS — no type changes, constant values only
- Logic review: PASS — `max_tokens: 32_000` is the documented Opus output ceiling; all three call sites are independent `messages.create` calls, no cascading effect
- Integration: PENDING — generate a Moves deliverable (charter or strategic decision paper) on ACA after deploy and confirm the output is not truncated at the old ~6k word boundary

## Rollout Plan

1. Merge PR to main (squash)
2. ACA auto-deploys updated web image
3. Trigger a deliverable generation from the Moves canvas; verify output length exceeds prior ~15-page limit

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy auto-deploys on push to main
- Shared runtime mutators: none
- No env var changes required

## Rollback Plan

Revert the three constant changes to `claude-opus-4-7` / `max_tokens: 8000`. The 3-pass pipeline is otherwise unchanged.

## Known Gaps

- The v2-generator is still monolithic (one Claude call per pass). True 50+ page documents benefit from decomposed map-reduce generation (section-by-section). 32k tokens gives ~24,000 words (~40–50 pages at 500 words/page) which covers most cases; the map-reduce redesign remains a follow-on.
- The quality revision threshold (score < 70) is unchanged. A harder gate (< 80) may be appropriate now that the model is stronger and the token budget is larger.

## Audit Evidence

- PR URL: (assigned on merge)
- CI: tsc + existing test suite
- Post-deploy: deliverable generation run showing content length > prior 8k token boundary
