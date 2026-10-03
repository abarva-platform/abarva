# 2026-10-03-moves-transition-evidence-gates — Phase transition evidence gates

## Release ID

`2026-10-03-moves-transition-evidence-gates`

## Status

`candidate`

## Plain-English Summary

Moves no longer treats an uploaded file alone as proof that a required phase
input is ready. Required transition-workbook responses must be reviewed, and
P2-P4 responses must be substantive and linked to approved evidence before the
phase can build or close. Accepted unknowns at the P1-to-P2 transition remain
explicit discovery work; they do not become client facts or prevent Discovery
from opening.

Accepted transition responses are passed into the next phase's generation
context with their evidence/source references and explicit unknown or
insufficient-evidence labels preserved.

## Layer Impact

Release lane: `global-control-lane` — shared Moves workflow behavior for all
clients.

- `PRODUCTS` (Moves): phase checklist, generation, and gate approval now share
  the same transition-evidence assessment.
- Canonical model and source adapters: unchanged. The gate uses approved
  evidence already available through the governed evidence-readiness path.

## Client Applicability

- All clients: yes — Moves P1-P4 transition readiness and P2-P5 generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- A shared transition-readiness assessment for workbook review, answer state,
  and approved-evidence linkage.
- Phase workspace evidence packets reflect unresolved transition answers.
- Phase generation blocks when required current-transition evidence is
  unresolved and includes accepted prior-transition responses in the prompt.
- Phase-gate GET and POST paths fail closed when transition readiness is
  unavailable or incomplete.
- Regression tests cover missing, unknown, rejected, unsourced, and
  evidence-linked workbook responses.

## QA / Validation

- Focused Jest suites: 5 suites / 139 tests pass, covering workbook context,
  evidence packets, gate approval, phase generation, and the Moves phase UI.
- `npm run typecheck`: clean.
- Scoped ESLint: clean.
- `git diff --check`: clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: all 11 gates
  passed.
- PR CI: pending.
- Signed-in runtime proof: pending deployment; required before this release is
  described as live-proven.

## Rollout Plan

Merge by squash through the protected-main PR process. The change becomes active
in the web image built from the merge SHA by the repo-owned ACA main deploy
workflow. No migration, data build, feature flag, or environment update is
introduced.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none introduced.
- Approved image digest: the digest produced for the exact merge SHA.
- ACA runtime invariant: verify template image and 100%-traffic revision match.
- Worker image invariant: verify required worker jobs use the same approved
  digest before claiming deployment complete.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — exercise workbook readiness, build
  blocking, gate blocking, and phase advancement through the authenticated Moves
  workflow, without direct data mutation or approval bypass.

## Rollback Plan

Revert the PR and redeploy the reverted main SHA through the repo-owned ACA
workflow. No migration or stored-data rewrite is required.

## Audit Evidence

- PR URL: (added on open).
- Focused Jest, typecheck, lint, release-check, and CI results.
- Exact merge-SHA deployment run, runtime image/digest invariant, and signed-in
  proof captured after deployment.

## Known Gaps

- Signed-in verification and the full synthetic phase journey remain open until
  the merged revision is deployed and exercised through the product UI.
- This change does not create or approve client evidence. Users must upload,
  review, and approve source material through the existing workflow.
