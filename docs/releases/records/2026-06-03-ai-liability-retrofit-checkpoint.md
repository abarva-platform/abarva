# 2026-06-03-ai-liability-retrofit-checkpoint - AI Liability Retrofit Completion Checkpoint

## Release ID

`2026-06-03-ai-liability-retrofit-checkpoint`

## Status

`candidate`

## Plain-English Summary

Refreshes the completion checkpoint for the AI liability retrofit wave. The
checkpoint shows which T231-T250 controls are done or in progress after the
latest merges, and names the remaining pilot blockers without overstating
readiness.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: governance, release readiness, responsible-AI controls.
- Runtime impact: none. This is a documentation, runbook, and verifier slice.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: none.
- Internal only: AbarVa readiness and release governance.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md`
- `docs/security/ai-surface-control-catalog.json`
- `docs/runbooks/ai-liability-retrofit-checkpoint.md`
- `docs/build/AI_LIABILITY_RETROFIT_CHECKPOINT_2026-06-03.md`
- `scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs`
- `docs/releases/records/2026-06-03-ai-liability-retrofit-checkpoint.md`

## QA / Validation

- Pass: `node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The checkpoint becomes the internal readiness artifact for
sequencing the remaining T231-T250 work.

## Rollback Plan

Revert this PR. No runtime or data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Checkpoint document.
- Runbook.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T251 remains `In progress` until every row in T231-T250 is `Done` with
implementation or accepted external evidence. Current strict completion is
11 / 20 rows = 55%; the weighted signal is 15.5 / 20 = 77.5%; there are no
remaining `Not started` rows, but 9 rows still require durable evidence,
broader coverage, or live persistence.
