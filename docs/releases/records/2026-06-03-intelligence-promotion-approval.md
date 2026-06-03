# 2026-06-03-intelligence-promotion-approval - Intelligence Promotion Approval

## Release ID

`2026-06-03-intelligence-promotion-approval`

## Status

`candidate`

## Plain-English Summary

Intelligence pattern recommendations can no longer flow into a Move brief
without a human promotion gate on the active origination path. When a Move is
shaped from an Intelligence session and a selected pattern, the UI requires a
human approval checkbox, rationale, and evidence refs; the server enforces the
same packet before the brief enters the approval queue.

## Layer Impact

- `global-control-lane`: shared Intelligence-to-Moves control behavior now
  enforces human ownership before pattern promotion.
- `client-data-lane`: no migration or schema change. Approval evidence is
  stored in the existing approval-request snapshot for the active client.

## Client Applicability

- All clients: yes, for Intelligence-originated Move briefs with a selected pattern.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/intelligence-promotion-approval.ts`
- `src/lib/programs/origination-submit.ts`
- `src/components/programs/origination/ProgramOriginationWorkspace.tsx`
- `src/components/programs/origination/ProgramBriefPanel.tsx`
- `src/lib/programs/__tests__/intelligence-promotion-approval.test.ts`
- `src/components/programs/origination/__tests__/ProgramBriefPanel.test.tsx`
- `src/lib/programs/__tests__/origination-submit-contract.test.ts`
- `scripts/ai-liability/verify-intelligence-promotion-approval.mjs`
- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/build/INTELLIGENCE_PROMOTION_APPROVAL_2026-06-03.md`

## QA / Validation

- Pass: `node scripts/ai-liability/verify-intelligence-promotion-approval.mjs` (48 checks).
- Pass: `npx jest src/lib/programs/__tests__/intelligence-promotion-approval.test.ts src/components/programs/origination/__tests__/ProgramBriefPanel.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts --runInBand` (30 tests).
- Pass: `npx eslint src/lib/programs/intelligence-promotion-approval.ts src/lib/programs/origination-submit.ts src/components/programs/origination/ProgramOriginationWorkspace.tsx src/components/programs/origination/ProgramBriefPanel.tsx src/lib/programs/__tests__/intelligence-promotion-approval.test.ts src/components/programs/origination/__tests__/ProgramBriefPanel.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Blocked unrelated locally: `npx tsc --noEmit --pretty false` reports the existing repo-wide missing `@axe-core/playwright` type dependency in `tests/accessibility/public-axe.spec.ts`; no slice-specific TypeScript errors were reported.

## Rollout Plan

Merge to `main`. The UI/server gate becomes active on the next Vercel deploy.
No migration or manual backfill is required.

## Rollback Plan

Revert the PR. Existing approval requests remain readable because the packet is
stored in the existing snapshot JSON.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2902.
- CI run: pending.
- Local QA output: pending.
- Build note:
  `docs/build/INTELLIGENCE_PROMOTION_APPROVAL_2026-06-03.md`.

## Known Gaps

Future pattern-promotion surfaces that bypass the current origination workspace
must reuse the same server-side gate before creating or advancing a Move.
