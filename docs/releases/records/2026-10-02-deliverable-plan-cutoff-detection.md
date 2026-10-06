# 2026-10-02 — Deliverable Plan Cut-off Detection

## Release ID

`2026-10-02-deliverable-plan-cutoff-detection`

## Status

`candidate`

## Plain-English Summary

Architecture deliverables are built from a structured plan that a model produces first. That plan was requested with a fixed output limit. When a Move's context was rich enough that the plan needed more room, the response was cut off at the limit — and the part that had been produced was then checked as if it were the whole plan. The check reported that the plan's story had too few steps and no exhibits, the architecture deliverable was blocked, and every deliverable depending on it was blocked with it. The message described a weak plan; the actual problem was an unfinished one.

Plan generation now looks at why the response ended. If it was cut off, it asks again once with twice the room. If that is also cut off, it stops with a message saying so. The starting limit is also higher. A plan that finishes and is genuinely thin is still rejected exactly as before.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable generation:** Output budget and cut-off handling for the planning step of structured architecture deliverables. The plan's validation rules are unchanged; nothing is relaxed.
- **AI egress:** Same governed call path. At most one additional call, only when the first response was cut off.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients generating structured architecture deliverables receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/planning/deliverable-plan-generation.ts`: check the stop reason before validating; one retry at a larger budget; explicit error when both are cut off; starting budget raised.
- Tests for the retry, the explicit error, no retry on a complete response, and a caller-supplied budget.

## QA / Validation

- Targeted Jest: pass — `2 suites, 15 tests` for deliverable planning, 5 new.
- Targeted ESLint and Prettier on changed files: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: a phase build on a synthetic workflow blocked at the architecture plan with the fields that were missing being exactly the trailing fields of the plan. The stop reason of that response was not recorded, so cut-off is the inferred cause, not an observed one.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, re-run the blocked phase build on the synthetic workflow. If the architecture deliverable builds, the cause was the cut-off. If it blocks again with the same message, the plan is complete and genuinely failing validation, and that is a separate defect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The cause of the observed block is inferred from which fields were missing, not from a recorded stop reason. The rollout step above is what confirms or refutes it.
- The stop reason and output token count of the planning call are still not written to the run record, so a future block of this kind is again diagnosable only by inference.
- A larger plan budget raises the worst-case cost and duration of the planning step.
