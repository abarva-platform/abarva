# 2026-09-29 — Moves Run-Backed Deliverable Sign-Off

## Release ID

`2026-09-29-moves-deliverable-signoff`

## Status

`candidate`

## Plain-English Summary

Moves phase documents now retain the canonical deliverable row when its version content is not readable through the document projection. If a generated run artifact is available, the page can still offer review and sign-off against the canonical `deliverables_v2` ID. A run artifact alone never becomes approval authority.

## Layer Impact

- **Release lane: `global-control-lane`.** This is a shared Moves workflow surface and is not tenant-specific or feature-gated.
- **Layer 3 — Canonical Enterprise Model:** No canonical data contract changes. Existing sign-off and client-readiness checks remain authoritative.
- **Layer 4 — Products:** The Moves document projection no longer hides a canonical deliverable row behind an inner version join, and its run-artifact fallback exposes sign-off only when that canonical row exists.

## Client Applicability

- All clients: Yes, for Moves phase documents using the run-artifact fallback.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Preserve deliverable rows when the related version projection is empty or unavailable.
- Expose the existing sign-off action and role-approval panel on a run-backed row using its `deliverables_v2` ID.
- Keep the generated-artifact-only path download-only.
- Add positive and negative regression coverage for sign-off availability and the existing fail-closed readiness route.

## QA / Validation

- Targeted Moves and governed sign-off validation: Pass (6 suites, 73 tests), including readiness-blocker acknowledgement and unmatched/unreadable Office-companion rejection.
- Typecheck: Pass (`npm run typecheck`).
- Lint: Pass (ESLint on the changed source and test files).
- Release check: Pass (`node scripts/release-check.mjs --base origin/main --head HEAD`).
- Signed-in deployed proof: Pending; required before marking this release live-proven.

## Rollout Plan

Merge through the protected `main` PR path, then deploy the exact merge SHA using the repo-owned ACA main deploy workflow. No migration, feature flag, or data backfill is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the approved main deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification; this UI-only change does not alter worker code.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify a current run-backed P1 artifact exposes sign-off through its canonical deliverable row, and the phase gate advances only after the actual sign-off succeeds.

## Rollback Plan

Revert the code change through a follow-up PR and deploy that merge SHA through the same ACA workflow. No data rollback is needed; existing artifacts and approval records are unchanged.

## Audit Evidence

- Regression tests in `moves-liability-visible-controls.test.tsx`.
- Governed sign-off route tests in `route.test.ts`.
- PR, CI, exact-SHA ACA deployment, runtime invariant, and signed-in smoke evidence: Pending.

## Known Gaps

The sign-off endpoint remains the final authority for evidence readiness and artifact lineage. A run artifact without a matching canonical deliverable row intentionally remains non-signable.
