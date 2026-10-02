# 2026-10-02 — An Unfinished Deliverable Plan Is Retried and Reported as Unfinished

## Release ID

`2026-10-02-deliverable-plan-early-end-retry`

## Status

`candidate`

## Plain-English Summary

Before an architecture deliverable is written, the product asks the model for a short structured plan and checks it. If the plan is weak, the build stops.

A plan can also come back unfinished: the response ends partway, and the fields after that point are simply absent. An earlier change recognised one cause of this — running out of output room — and retried with more room. A deployed build has since failed on a plan that stopped after its first few fields for a different reason. It was checked as if it were complete and reported as a plan with no target state, no decisions and no exhibits. Nothing in the failure said the response had ended early, or why.

Now, when a response ends with structural fields never emitted, whatever the reason, the plan is requested once more with the missing fields named. If the second response is also unfinished, the build stops with a message that says so and gives the reason each response ended. A plan with every field present is still checked exactly as before and is not retried. Every plan failure now records why the response ended.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable planning:** When the plan request is repeated, and what a failure reports. The plan's validation rules are unchanged and still apply to the final response. No rule is relaxed.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on architecture deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/planning/deliverable-plan-generation.ts`: detect structural fields that were never emitted; one retry naming them; a failure message that distinguishes unfinished from weak and carries the reason each response ended.
- Tests, including a correction: an existing test had pinned "do not retry" for exactly the unfinished input now observed.

## QA / Validation

- Targeted Jest: pass — the planning suites, `19 tests`, 4 new and 2 corrected.
- Mutation checks: with the retry disabled, 4 tests fail; with nothing counted as missing, 5 fail.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, an architecture build was blocked on a plan whose fields stopped after the current-state reading; the run finished too quickly to have reached the output limit, and no retry had occurred.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the design-phase deliverables of the synthetic workflow. Either the architecture deliverable builds, or the run record states that the plan ended early and why.

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
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Why the response ended early is not yet known. This change makes the next occurrence report it; it does not remove the cause.
- The streaming client returns a partly received structured response as a well-formed object with no flag. Other structured generation passes that use the same client have the same exposure and are not changed here.
- One retry only. A persistent early end still blocks the build, with the reason stated.
