# 2026-08-15-source-ava-grounding-polish — Source aVa Grounding Polish

## Release ID

`2026-08-15-source-ava-grounding-polish`

## Status

`candidate`

## Plain-English Summary

Closes two small Source aVa hardening gaps:

- aligns the Source reactive panel label and its regression test with the product spelling `aVa`;
- makes Source event-status grounding use approval-ledger evidence before calling prior stages
  complete, matching the Source journey rail's completion discipline.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products. This is presentation and Source aVa prompt-grounding behavior only; no tenant
data, canonical facts, adapters, or financial calculation logic changes.

## Client Applicability

- All clients: Source users see the same product spelling in the reactive panel, and Source aVa
  event-status answers no longer infer prior-stage completion from stage position when approval
  evidence is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourcingReactivePanel.tsx`
- `src/components/source/__tests__/SourcingReactivePanel.test.tsx`
- `src/app/api/chat/agent/route.ts`
- `src/lib/source/ava/mode-grounding.ts`
- `src/lib/source/ava/__tests__/mode-grounding.test.ts`

## QA / Validation

- PASS: `npx jest src/components/source/__tests__/SourcingReactivePanel.test.tsx --runInBand`
  (5/5 tests passed).
- PASS: `npx jest src/lib/source/ava/__tests__/mode-grounding.test.ts --runInBand`
  (19/19 tests passed).
- PASS: `npx eslint --max-warnings=0 src/app/api/chat/agent/route.ts src/lib/source/ava/mode-grounding.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/components/source/SourcingReactivePanel.tsx src/components/source/__tests__/SourcingReactivePanel.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to `main`. No database migration, data load, feature flag, or manual runtime action is
required.

## Deployment Authority

- Repo-owned deploy workflow: Normal main deploy workflow if/when application code deploys.
- Shared runtime mutators: None.
- Approved image digest: Not applicable at PR time.
- ACA runtime invariant: Required only before claiming the presentation change is live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming live product proof.

## Rollback Plan

Revert the PR to restore the prior label/test expectation and the prior event-status grounding
fallback.

## Audit Evidence

PR, targeted test output, lint output, and release-control output.

## Known Gaps

This does not complete the broader aVa hard-QA backlog or the signed-in 38-question rerun. Live
browser/aVa proof is still required before calling the change live-proven.
