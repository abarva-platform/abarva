# 2026-10-01 — Moves Phase Intelligence Gate Alignment

## Release ID

`2026-10-01-moves-phase-intelligence-gate-alignment`

## Status

`candidate`

## Plain-English Summary

Phase Intelligence now uses the same current-phase gate projection as the Moves workspace instead of independently recalculating it. Historical phases still receive an explicit historical gate evaluation. This keeps the executive summary and the approval surface aligned without changing the gate itself.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Moves product behavior for all clients.
- **Products:** Moves presentation logic only. No canonical records, evidence, gate rules, approvals, or data-plane behavior change.
- **Agent context:** No change. Phase Intelligence remains a deterministic summary of governed state.

## Client Applicability

- All clients using the Moves Phase Intelligence surface.
- Feature flag: None.

## Changes Included

- Reuse one Move read for Phase Intelligence strategic and gate summaries.
- Use the Move's current-phase gate criteria for the current phase; explicitly evaluate a prior phase when viewing historical phase state.
- Add regression coverage for conflicting duplicate evaluations and historical-phase behavior.

## QA / Validation

- Authenticated synthetic Moves workspace reproduced a mismatch between the Phase Intelligence gate count and the Approve & Build gate count; refresh did not resolve it.
- Focused unit suite: `src/lib/programs/__tests__/phase-intelligence-summary.test.ts` — 5 tests passed.
- Targeted ESLint — passed.
- `npm run typecheck` under Node.js 24 — passed.
- Full release check, CI, deployed runtime invariant, and post-deploy signed-in verification: pending.

## Rollout Plan

Merge by squash through the protected `main` PR flow. Deploy only through `.github/workflows/aca-main-deploy.yml`. Verify the exact merge SHA, active 100%-traffic revision, template image, and required worker image digests before signed-in verification.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Pending merge/deploy.
- Worker image invariant: Pending merge/deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; compare current-phase gate summary with Approve & Build and confirm a blocked gate remains blocked.

## Rollback Plan

Revert the release commit in a follow-up PR and deploy the resulting `main` SHA through the repo-owned ACA deploy workflow. No schema or data rollback is required.

## Audit Evidence

- PR and CI links: Pending.
- Signed-in reproduction and post-deploy comparison: Pending.
- Deployment run and digest evidence: Pending.

## Known Gaps

The underlying gate and evidence records remain authoritative. This change aligns the Phase Intelligence projection with the workspace projection; it does not approve or advance any Move.
