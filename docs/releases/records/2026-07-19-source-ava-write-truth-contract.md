# 2026-07-19-source-ava-write-truth-contract — Source aVa Write-Truth Contract

## Release ID

`2026-07-19-source-ava-write-truth-contract`

## Status

`candidate`

## Plain-English Summary

Source aVa no longer gets to imply that a chat answer was saved, locked, registered, captured, or written into the Source event record unless a real write path confirms it. On existing Source event pages, chat-only user input is treated as conversation context, not persisted evidence. If model text claims otherwise, a deterministic guard repairs the wording before it reaches the user.

## Layer Impact

- `global-control-lane`: Tightens the shared Source aVa answer quality gate used by the Source event chat dock.
- Source API/runtime: Applies the same write-truth repair to the legacy event-scoped Source ask route so old or test-only callers cannot reintroduce false persistence claims.
- Source backlog control: Updates the Source done ledger to reflect current merged/deployed Source slices and the next execution order.

## Client Applicability

- All clients: Yes, for Source event aVa answers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/answer-quality-gate.ts`: adds a deterministic Source record write-claim detector and repair notice.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: guards event-scoped Claude summaries with the same write-truth repair.
- `src/lib/source/ava/__tests__/answer-quality-gate.test.ts`: covers write-claim repair and the standalone legacy guard helper.
- `src/__tests__/integration/source/source-nexus-api-stub.test.ts`: locks the legacy route guard in static coverage.
- `docs/backlog/tracks/04-source-commercial/SOURCE_DONE_LEDGER.md`: refreshes Source backlog state and next order.

## QA / Validation

- `npx jest src/lib/source/ava/__tests__/answer-quality-gate.test.ts src/__tests__/integration/source/source-nexus-write-truth-guard.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand --runTestsByPath`: pass, 43/43. Jest printed existing duplicate manual mock warnings.
- `npx eslint src/lib/source/ava/answer-quality-gate.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/__tests__/integration/source/source-nexus-write-truth-guard.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts`: pass.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`: pass.
- `npm run release:check`: pass after adding explicit QA statuses to this release record.
- `git diff --check`: pass.

## Rollout Plan

Open PR from `codex/source-ava-write-truth-193333`. After checks pass, squash-merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, prove ACA runtime invariant, then run signed-in Source event aVa proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge for `app.abarva.ai`.
- Shared runtime mutators: Not used by this candidate.
- Approved image digest: Pending repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the merged PR and redeploy through the repo-owned ACA main deploy workflow. No schema, data, or feature-flag rollback is required.

## Audit Evidence

- Candidate branch: `codex/source-ava-write-truth-193333`.
- PR URL: Pending.
- Local validation: Pending.
- Live proof: Pending.

## Known Gaps

- This release prevents false persistence claims. It does not create a new chat-to-evidence write workflow; that must remain an explicit, governed product action.
