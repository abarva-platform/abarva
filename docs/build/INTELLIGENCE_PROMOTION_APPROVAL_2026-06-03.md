# Intelligence Pattern Promotion Approval

Date: 2026-06-03
Backlog: T234
Lane: global-control-lane

## What Changed

The Intelligence-to-Moves handoff now has a consuming human approval step, not
just an API contract. When an origination brief is created from an Intelligence
session and carries a selected pattern, the Programs brief panel renders a
human promotion gate before the brief can be submitted for approval.

## Control Behavior

- `src/app/api/v1/programs/originate/from-thread/route.ts` already returns a
  `promotionGate` contract with `sourceThreadId`, `selectedPatternKey`, and
  `humanPromotionRationale` requirements.
- `src/components/programs/origination/ProgramBriefPanel.tsx` now renders
  `Human promotion gate required` for Intelligence-originated pattern
  promotions.
- The submit button remains hidden until the human has:
  - accepted responsibility for the pattern promotion,
  - entered a rationale of at least 24 characters,
  - and carried evidence refs for the source thread and selected pattern.
- `src/lib/programs/origination-submit.ts` enforces the same gate server-side
  and writes `briefSnapshot.intelligence_promotion_gate` into the approval
  request snapshot before the Move enters approval.

## Audit Packet Fields

The approval snapshot records:

- `source_thread_id`
- `selected_pattern_key`
- `human_promotion_accepted`
- `human_promotion_rationale`
- `evidence_refs`
- `accepted_at`
- `accepted_by_user_id`

## QA Evidence

- `src/lib/programs/__tests__/intelligence-promotion-approval.test.ts`
  verifies fail-closed validation for missing acceptance, short rationale, and
  missing evidence refs.
- `src/components/programs/origination/__tests__/ProgramBriefPanel.test.tsx`
  verifies the promotion approval card blocks submit until the evidence packet
  is complete.
- `src/lib/programs/__tests__/origination-submit-contract.test.ts` verifies the
  server path persists the promotion gate packet.
- `scripts/ai-liability/verify-intelligence-promotion-approval.mjs` checks the
  implementation, catalogs, build note, and release record.

## Known Gaps

This closes the current Intelligence pattern-to-Move origination workspace
path. Future promotion surfaces must call the same server gate before creating
or advancing a Move.
