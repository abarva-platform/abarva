# 2026-09-25-moves-phase-workshop-guides — Add Phase-End Workshop Guides

## Release ID

`2026-09-25-moves-phase-workshop-guides`

## Status

`candidate`

## Plain-English Summary

Moves phase generation now includes a separate workshop/session guide at the end of each phase. The guide is a working document that tells the client and delivery team how to run the next phase: sessions, participants, evidence requests, decisions to test, notes to capture, and readiness checks.

Formal phase artifacts remain separate. A Charter stays an authorization record, a Discovery Report stays a diagnostic readout, a Business Case stays an investment decision document, and a Handoff Package stays an execution-transfer package. Workshop agendas and facilitation instructions no longer need to be stuffed into those formal documents.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates Moves phase deliverable registry, generated-artifact profiles, orchestrator mapping, document-generation tiering, and quality bars.
- Layers 1-3: No intake, adapter, canonical model, data-plane, migration, or tenant-data mutation changes.

## Client Applicability

- All clients: Receive phase-end workshop/session guide working documents when generating Moves phase packages.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds P2 `Design Workshop Guide` as a working document for P3 design sessions.
- Adds P3 `Planning Workshop Guide` as a working document for P4 planning/business-case sessions.
- Adds P4 `Mobilization Workshop Guide` as a working document for P5 mobilization and handoff sessions.
- Adds P5 `Execution Kickoff Guide` as a working document for the first execution cadence after planning handoff.
- Keeps these guides non-gate artifacts; they support execution of the next phase but do not create new approval criteria.
- Registers each guide with a DOCX narrative profile, quality bar, document-generation tier, and orchestrator mapping.
- Extends tests for canonical phase document sets, profile coverage, orchestrator mapping, and quality-bar coverage.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/__tests__/phase-deliverables.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts --runInBand` — pass, 45/45.
- `npm run typecheck` — pass.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow will rebuild and deploy the app image. No manual data build, migration, feature flag, or tenant-data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Yes, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No ad-hoc mutators in this release.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming runtime-live.
- Worker image invariant: Required after deployment because the deliverable worker consumes queued run payloads.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a refreshed phase build shows the phase's formal artifact(s) and the separate workshop/session guide working document.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to restore the prior phase registry and artifact profiles. No data rollback is required.

## Audit Evidence

- Pull request URL and merge SHA after PR creation.
- Focused Jest and typecheck output listed above.
- Post-merge ACA deploy run and runtime invariant proof.
- Signed-in phase build proof showing separate formal artifact and workshop/session guide documents.

## Known Gaps

This release registers and queues phase-end guide documents. It does not redesign the phase page UI, alter gate approval policy, or regenerate existing persisted artifacts automatically.
