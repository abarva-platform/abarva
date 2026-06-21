# 2026-06-21-scb-go-live-runbook — Go-live runbook for D (flip + prove)

## Release ID
`2026-06-21-scb-go-live-runbook`

## Status
`candidate`

## Plain-English Summary
Documentation only. Adds `docs/build/SCB_GO_LIVE_RUNBOOK.md` — the mechanical sequence for the final closure step D: pre-flip gate (C must pass on deployed code), pilot tenant (Apex, with the apexretail/apex-retail key footgun flagged), per-surface flag + env allowlist + flip order, per-surface acceptance proof (P grounded + F fenced), the high-signal cross-tenant/out-of-domain watch-list from the live-answer bank, and rollback. No code.

## Layer Impact
- **internal-admin lane:** documentation only — operator runbook. No code, schema, runtime, or client data plane.

## Client Applicability
- All clients: No change — documentation only.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: None.
- Feature flag: None (documents how the existing default-off `scb_shared_engine_*` flags are flipped).

## Changes Included
- `docs/build/SCB_GO_LIVE_RUNBOOK.md`

## QA / Validation
Validation: Pass (documentation). Markdown only; no build/test impact.

## Rollout Plan
Merge to `main` when the deploy lane is clear (doc-only, but main auto-deploys on push). No runtime rollout.

## Deployment Authority
Not applicable — documentation only.
- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a (documents the path)
- Live signed-in proof required: No.

## Rollback Plan
Revert the PR — documentation only.

## Audit Evidence
- Runbook references the live-answer bank probes (`evals/intelligence/live-answer/cases/`) and the `scb_shared_engine_*` flag family.

## Known Gaps
- None — operator documentation.
