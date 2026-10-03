# 2026-10-02 — Saved Phase Inputs Reach a Deliverable's Evidence

## Release ID

`2026-10-02-saved-phase-inputs-reach-evidence`

## Status

`candidate`

## Plain-English Summary

What a person saves in each phase of a Move — the charter decisions, the discovery findings, the design choices, the reviewed estimate — is meant to be part of the governed evidence a deliverable is built from, so the deliverable can cite it. The code that loads those saved inputs asked the database for a column the table does not have. The request failed. The failure was treated as "this Move has no saved inputs" and nothing was reported.

As a result, no saved phase input has been part of any deliverable's evidence. The writer still saw the saved text as background, but could not cite it, and the check that every figure traces to evidence had nothing to trace a saved figure to. On a deployed build this showed up at the roadmap phase: the reviewed estimate's totals, reproduced exactly, were blocked as unsupported.

The request now asks for columns the table has, so saved inputs are loaded as evidence. If the read fails for any reason, it is logged with the Move and the reason; the build still proceeds on the evidence it has. A test now checks the columns this loader asks for against the table definitions.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable evidence:** Saved phase inputs, up to and including the phase being built, join the evidence bundle. This is the behavior the code was written to have; it is the first time it is in effect. It applies to every phase's deliverables, not only the roadmap phase.
- **Evidence gates and numeric lineage:** Unchanged.
- **Canonical model:** No schema or data changes. No new columns.

## Client Applicability

- All clients using Moves receive the behavior after deployment, on deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/program-module-evidence-columns.ts` (new): the columns read from the saved-inputs table.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: use them; date a saved input by when it was completed, started, or created; log a failed read.
- `src/lib/deliverables/orchestrator/__tests__/evidence-loader-columns.test.ts` (new): the columns exist in the table as the migrations define it, for this query and for every literal query in the loader.

## QA / Validation

- Targeted Jest: pass — deliverable orchestrator suites, `34 suites, 473 tests`, 3 new.
- The new test reads the migration files. Mutation check: with the missing column added back to the list, it fails.
- A one-off check of every table and column the loader queries found this one missing column and no other.
- Scoped typecheck of the changed files: clean. Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Full typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, a roadmap-phase build and the earlier design-phase build reported the same evidence item count and the same evidence size, although seven further inputs — including the reviewed estimate — had been saved in between.
- The deployed table definition was not inspected directly; the conclusion rests on the migrations and on that observation.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow and confirm the build's evidence count rises and the estimate tables are cited to the reviewed estimate.

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
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Deliverables in every phase will now be built with more evidence than before. Their content will change. This has not been observed live for the earlier phases.
- Saved inputs are a person's own statements. As evidence they are marked internal and can be cited; a figure typed into a saved input can now support the same figure in a deliverable.
- Deliverables already built are not rebuilt.
- The other reads in this loader still treat a failure as "nothing to load" without logging.
- The column test parses the migration files; it does not query a database.
