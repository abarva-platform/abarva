# 2026-06-20-source-token-limits — Raise Source artifact token ceilings

## Release ID

`2026-06-20-source-token-limits`

## Status

`candidate`

## Plain-English Summary

The previous output token ceilings on Source artifact generation were too low for
board-grade deliverables. Live QA of d09 (RFP Package) showed `artifact_completeness:
5/10` with "truncated body is a blocking defect" — the 11-section RFP was cut off
at §7 before completing the commercial model, evaluation scorecard, and risk register.
This raises all ceilings to give Opus 4.8 room to complete every required section
without truncation.

Changes:
- `DEFAULT_MAX_TOKENS`: 4,000 → 24,000 (used by d01 Strategy Memo, d05 Scope Memo)
- d02 Value Target Brief: 2,000 → 12,000
- d03 Archetype Decision Record: 2,000 → 12,000
- d09 RFP Package: 6,200 → 40,000
- Route `maxDuration`: 300s → 600s (d09 at 40k tokens on Opus 4.8 runs 4–8 min)

## Layer Impact

**Lane:** `global-control-lane` — prompt registry constant change only; no schema,
API, or data change.

- `src/lib/source/agent-generation/prompt-registry.ts`: five `maxTokens` values raised.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: `maxDuration` 300→600.

## Client Applicability

All clients: yes — every Source artifact generation.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: raise DEFAULT_MAX_TOKENS
  4k→24k; d02/d03 2k→12k; d09 6.2k→40k.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`:
  `maxDuration` 300s→600s.
- `docs/releases/records/2026-06-20-source-token-limits.md`: this record.

## QA / Validation

- `eslint`: expected PASS (constant value change only).
- `tsc`: expected PASS (no type changes).
- Live acceptance check: regenerate d09 on the Meridian AMS event after deploy;
  verify `artifact_completeness` scores ≥ 8/10 and all §1–§11 sections are present.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys; no migration needed.
3. Regenerate d09 on any event with d01+d05 present to confirm completion.

## Rollback Plan

Revert the commit. Constant-only change; no persisted state is affected.
Previously-generated documents are unchanged until re-run.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- No migration; no feature flag; no env var change required.

## Known Gaps

- At 40k tokens, d09 on Opus 4.8 will take 4–8 min wall-clock. `maxDuration` is
  now 600s. If the ACA ingress still 504s before 600s, d09 must move to a
  streaming or async-job path (the existing deliverable_runs durable queue is the
  natural candidate).
- Cost per full event (all 5 artifacts, 3-4 generation cycles including quality
  gate review) is approximately $30–50 — negligible relative to sourcing contract
  value, but monitor token spend in Anthropic dashboard.
- d02/d03 previously 504'd at 4000 tokens; now set to 12k synchronously. If 504s
  return at 12k, lower to 8k and investigate streaming first.

## Audit Evidence

- Live QA: d09 quality gate returned `artifact_completeness: 5/10`, `commercial_specificity:
  5/10` with explicit "truncated body is a blocking defect" finding. Root cause
  confirmed as 6200-token ceiling cutting off at §7.
- Branch: `fix/source-token-limits`
