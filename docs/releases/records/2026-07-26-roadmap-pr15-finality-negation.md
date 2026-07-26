# 2026-07-26-roadmap-pr15-finality-negation — PR15: negation-aware finality check

## Release ID

`2026-07-26-roadmap-pr15-finality-negation`

## Status

`candidate`

## Plain-English Summary

PR14 tightened the finality check, but the PR14 live Meridian build (run `c285f43b`) still flagged
`lifecycle_finality_mismatch` — it matched "board-ready" inside the AI-draft disclaimer **"It is not a
final or board-ready artifact"**. That phrase is NEGATED (the narrative says it is NOT board-ready,
which is consistent with `review_draft`), and every draft narrative carries this disclaimer verbatim.
PR15 makes the finality check **negation-aware**: a finality phrase is only counted when it is NOT
preceded (within ~28 chars) by a negation (not / does not / is not / never / no longer / without). A
draft that wrongly claims it IS "approved for release" still fires — the check keeps its value.

## Layer Impact

- **global-control-lane** (flag-gated): calibration of the pure consistency validator.

## Client Applicability

- Gated behind the **feature flag** `moves_governed_roadmap_downloads` (Meridian first). No other change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`; ACA runtime invariant verified
  after deploy; live Meridian build re-run required.

## Changes Included

- `src/lib/deliverables/roadmap-prose-structure-consistency.ts` — negation-aware finality detection.
- `src/lib/deliverables/__tests__/roadmap-governed-output.test.ts` — negated-disclaimer regression test.

## QA / Validation

- Status: **pass** — 18/18 affected; `tsc` 0; `eslint` clean; baseline unchanged. Live re-run captures
  the result post-deploy.

## Audit Evidence

- PR: to be opened. Follows PR14 #5648. Live diagnosis: run `c285f43b` matched "board-ready" inside the
  negated draft disclaimer on Meridian Move `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6`.

## Rollout Plan

Squash-merge; deploy; re-run the Meridian build to capture the download success path.

## Rollback Plan

Revert, or disable the flag. No schema/data change.

## Known Gaps

After deploy, re-run the Meridian build. If the dedicated pass + calibrated checks pass, a governed
contract persists and `current/{html,docx,pptx}` returns 200 with the same content hash — capture it.
Any further honest gate is reported, never a manufactured contract. Durable-worker migration + status
endpoint/UI, orchestrator parity, and PowerPoint acceptance remain staged.
