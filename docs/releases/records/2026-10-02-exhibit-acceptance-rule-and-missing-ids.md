# 2026-10-02 — The Exhibit Author Is Told the Acceptance Rule; a Blocked Artifact Names the Missing Exhibits

## Release ID

`2026-10-02-exhibit-acceptance-rule-and-missing-ids`

## Status

`candidate`

## Plain-English Summary

An exhibit written by the model is kept only if it has properly structured data and a description that makes at least three distinct statements. An exhibit that fails either is discarded. Neither rule was told to the step that writes exhibits, a discarded exhibit left no trace, and an artifact then blocked for missing exhibits did not say which ones.

After an earlier change today told that step which exhibit keys are required, two roadmap-phase deliverables were still blocked for missing exhibits on a deployed build, and nothing recorded whether the exhibits had been left out or written and discarded.

Three changes, none to the rules themselves:

- The step that writes exhibits is told the two rules an exhibit must meet to be kept, and which kind of structure suits a table-like exhibit, a timeline, or a set of dependencies.
- A discarded exhibit is logged with its key and the rule it failed.
- When an artifact is held, the reason includes what each blocking finding found — for missing exhibits, their names.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable generation:** Additional instruction text to the exhibit-writing step; a log line; a longer blocked reason.
- **Quality gate:** Unchanged. The same exhibits are required and the same acceptance rules apply.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`: the acceptance rule in the required-exhibits instruction.
- `src/lib/deliverables/orchestrator/section-generation.ts`: `exhibitRejectionReason`; a discarded exhibit is logged.
- `src/lib/deliverables/orchestrator/persistence.ts`: `quarantineReasonWithDetail`.
- Tests for each.

## QA / Validation

- Targeted Jest: pass — deliverable orchestrator suites, `33 suites, 475 tests`, 5 new.
- Scoped typecheck of the changed files: clean. Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Full typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, two roadmap-phase deliverables were blocked for missing exhibits after the required keys had been added to the instruction; the reason named no exhibit.
- Signed-in runtime verification of this change: pending deployment. Whether the exhibits are then kept is not known in advance; if they are not, the reason and the log will now say why.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow and read either the exhibits that were kept or the reason that names the ones that were not.

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

- The supported structures are diagrams and grids. Several required exhibits are tables by nature (a RACI, a measurement table, a decision box). They can be expressed as a grid; whether that renders well has not been observed.
- The description rule counts statements, not their quality.
- This does not establish that every roadmap-phase deliverable can now meet its exhibit requirement. It makes the next failure explain itself.
