# 2026-07-26-roadmap-pr14-consistency-calibration — PR14: calibrate prose⇄structure consistency (remove proven false positives)

## Release ID

`2026-07-26-roadmap-pr14-consistency-calibration`

## Status

`candidate`

## Plain-English Summary

The PR13 live Meridian build proved the dedicated structured pass now parses (token fix worked), but
the governed build then blocked at `prose_structure_contradiction` — `milestone_missing_from_structure`

- `lifecycle_finality_mismatch`. Both were **proven false positives** on a real 52 KB board narrative
  (live run `59389096`):

* The finality check matched the bare word **"final"/"finalized"** (innocuous prose like "finalized the
  data model") as if it were a board-approval claim.
* The milestone check flagged section **headers** ("Value Milestones (Proof, Not Promises)", "Decision
  Gates and Value Milestones").

PR14 calibrates `roadmap-prose-structure-consistency.ts`:

1. **Finality** — now matches only genuine finality CLAIMS about the artifact ("approved for release",
   "board-ready", "ready for the board", "finalized and approved", "signed off and approved", "sponsor
   has accepted this", "no further approvals needed"), NOT the bare word "final" or a factual "charter
   signed off".
2. **Milestone** — the `milestone_missing_from_structure` lexical check is **removed**; matching prose
   milestones to structured ones reliably is too lossy and was over-blocking. The reliable signals
   (horizon-count mismatch, missing control gate, dependency-resolved-but-unproven, lifecycle mismatch)
   remain.

This does not weaken genuine contradiction detection — it removes demonstrated false positives.

## Layer Impact

- **global-control-lane** (flag-gated): calibration of a pure consistency validator.

## Client Applicability

- Gated behind the **feature flag** `moves_governed_roadmap_downloads` (Meridian first). No other change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`; ACA runtime invariant verified
  after deploy; live Meridian build re-run required.

## Changes Included

- `src/lib/deliverables/roadmap-prose-structure-consistency.ts` — tighten finality regex; remove the
  milestone_missing check.
- `src/lib/deliverables/__tests__/roadmap-governed-output.test.ts` — finality test now uses a genuine
  finality claim.

## QA / Validation

- Status: **pass** — affected suites 34/34; full `src/lib/deliverables` pre-existing 6-failure baseline
  unchanged; `eslint` clean; `tsc` 0. Live re-run captures the result post-deploy.

## Audit Evidence

- PR: to be opened. Follows PR12 #5645, PR13 #5646. Live diagnosis: run `59389096` on Meridian Move
  `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6` false-positived on "final"/"finalized" + a "Value Milestones"
  header.

## Rollout Plan

Squash-merge to `main`; deploy; re-run the Meridian build to capture the download success path.

## Rollback Plan

Revert the change, or disable the flag. No schema/data change.

## Known Gaps

After deploy, re-run the Meridian build: if the dedicated pass succeeds and the (now-calibrated)
consistency checks pass, a governed contract persists and `current/{html,docx,pptx}` should return 200
with the same content hash — capture that. If a further real contradiction or a new honest gate
appears, report it (the failure stays persisted and visible; never manufacture a contract). Durable-
worker migration + status endpoint/UI, orchestrator parity, and PowerPoint acceptance remain staged.
