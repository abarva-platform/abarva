# 2026-09-28-moves-adaptive-evidence-smoke — Evidence-led Moves journey and estimate controls

## Release ID

`2026-09-28-moves-adaptive-evidence-smoke`

## Status

`candidate`

## Plain-English Summary

Makes Moves phase progression evidence-led from the step where the evidence is needed, captures a human-confirmed solution route before selecting the depth of P3 work, and distinguishes estimate-ready architecture from implementation-level process or operating-model design. P4 now carries an editable internal/vendor estimate with visible low/base/high hours and cost, provenance, confidence, and human-review effort. P5 is a mobilization and handoff package; it does not claim that project execution has started.

Adds a substantive synthetic evidence kit for repeatable smoke testing. Its upload allowlist contains only P1/P2 inputs, while future-phase output examples, alternate-route files, and QA canaries remain excluded. A validator independently checks that boundary and recalculates the estimate rows and summary.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 Client Intake: no intake storage or ownership model change; synthetic files are explicitly allowlisted for a Move-scoped smoke only.
- Layer 3 Canonical Model: no schema or migration change. Evidence starts pending review and must be approved before it can ground subsequent phase builds.
- Layer 4 Products: updates Moves route validation, evidence readiness, phase captures, artifact generation inputs, estimate presentation, and phase handoff language.
- No global corpus load, indexing, registry activation, or `agent_ready` promotion is included.

## Client Applicability

- All clients: Moves workflow changes apply after release.
- Specific clients: none.
- Internal only: synthetic test-kit validator and its fixture package.
- Public/demo only: no.
- Feature flag: none added or changed.

## Changes Included

- Human-confirmed P1/P2 route assessment with approved-evidence reference checks.
- Route-sensitive P3 scope that distinguishes technical-only, bounded process change, and material operating-model change.
- Evidence readiness checks at capture/build time; unreviewed evidence is not treated as approved prompt context.
- Versioned human revision and approval context retained for phase-to-phase feed-forward.
- Deterministic, editable P4 estimate model and prompt serialization; reviewer confirmation is required before build.
- P5 mobilization/handoff semantics, separate from downstream execution.
- Synthetic upload manifest and fail-closed kit validator with arithmetic and exclusion tests.

## QA / Validation

- Focused upload/generation UI and API suites: 4 suites / 114 tests passed.
- Programs, phase-pack, and phase-template suites: 110 suites / 1,073 tests passed.
- Phase-label integration suites: 2 suites / 60 tests passed.
- Reasoning suites: 58 suites / 760 tests passed; linked-program phase labels match the canonical phase registry.
- Phase Workspace composition and contract suites: 2 suites / 40 tests passed, including the P4 roadmap-workstream copy assertion.
- `src/lib/deliverables`: 100 suites / 1,104 tests and 3 snapshots passed.
- Synthetic kit validator: 6 mutation/regression tests passed; 14 allowlisted inputs and estimate arithmetic reconcile.
- `npm run typecheck`: clean.
- ESLint on changed TypeScript source and test files: clean.
- Context-corpus manifest validation: passed. Test-CI coverage census: refreshed and check passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: passed on the rebased candidate.
- Merge, deployment, authenticated upload, reviewer approval, artifact sign-off and signed-in smoke are pending; none is claimed as complete.

## Rollout Plan

Merge through the protected PR path. After approval, the repo-owned ACA main deploy workflow builds and deploys the merged revision. Do not upload the fixture or claim an end-to-end runtime pass until the deployed version, digest invariant, selected Move identity, extraction readback, human evidence review, approved artifact versions, and phase gates are verified.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none run by this candidate.
- Approved image digest: pending the repo-owned workflow.
- ACA runtime invariant: not checked; required after deployment.
- Worker image invariant: not checked; required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. Validate uploaded evidence extraction and source locators, review state, each P0–P5 gate, generated artifact version lineage, estimate inputs and totals, route-sensitive depth, and the P5 handoff boundary.

## Rollback Plan

Revert the PR through the protected repository process and redeploy via the repo-owned ACA main deploy workflow. No database migration is included. Do not delete or rewrite uploaded evidence as a rollback action; the smoke upload itself remains a separately controlled activity.

## Audit Evidence

- PR and CI results for this candidate.
- Synthetic package allowlist and estimate validation output.
- Post-deploy digest readback and signed-in smoke evidence, when performed.
- Evidence extraction, source locators, review decisions, generated artifact versions, and gate-state readback, when performed.

## Known Gaps

The synthetic package is prepared locally but is not uploaded, indexed, or agent-ready. No signed-in end-to-end smoke has been performed. Human review and approval of extracted evidence and generated artifacts remain required. Product-quality review of the generated P0–P5 deliverables remains part of the smoke, not something established by fixture validation.
