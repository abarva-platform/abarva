# 2026-06-12-moves-orchestrator-lineage-expansion — expand Moves orchestrated deliverables and lineage writes

## Release ID

`2026-06-12-moves-orchestrator-lineage-expansion`

## Status

`candidate`

## Plain-English Summary

This release expands the flag-gated Moves document-generation engine beyond the already-wired Costed Business-Case Pack. When `moves_orchestrated_deliverables` is enabled for a tenant, the existing board-grade Moves routes can now author Charter, Discovery, Target Architecture, Estimate, CFO Value, Mobilization, and Master Dossier artifacts through the governed multi-pass Deliverable Intelligence Orchestrator. The old deterministic renderers remain the default and the fallback path.

The engine also now writes Workspace Explorer lineage into `generated_artifacts.cited_input_ids` when the artifact used real UUID-backed governed inputs from `program_evidence_items`. Recorded charter and baseline JSON remain valid evidence in the generated source register, but they are not forced into UUID lineage columns.

## Layer Impact

- `global-control-lane`: Adds a shared route helper and a generic Moves orchestrator runner that preserve existing per-route contracts while changing the internal engine only when the tenant flag is on.
- `client-data-lane`: Extends generated artifact persistence to populate `cited_input_ids` for real governed input rows, using the lineage column shipped in the Workspace Explorer seam release.
- `experimental`: The orchestrated path remains guarded by `moves_orchestrated_deliverables` and is default off for tenants not explicitly enabled.

## Client Applicability

- All clients: Receive no behavior change while `moves_orchestrated_deliverables` is off.
- Specific clients: Only tenants enabled through `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS` use the orchestrated authoring branch.
- Internal only: Operators and QA can inspect `x-deliverable-engine: orchestrated` and `x-deliverable-cited-input-count` headers when the branch is active.
- Public/demo only: None.
- Feature flag: `moves_orchestrated_deliverables`.

## Changes Included

- Adds `runOrchestratedMoveDeliverable`, a generic Moves adapter over the shared Deliverable Intelligence Orchestrator.
- Keeps `runOrchestratedBusinessCase` as a compatibility wrapper over the generic adapter.
- Adds `maybeRenderOrchestratedMoveArtifact`, a route helper that returns a response only when the tenant flag is enabled and orchestration passes; otherwise the existing deterministic renderer runs.
- Wires the helper into existing board-grade Moves routes:
  - `/api/v1/moves/board-grade-charter-skeleton`
  - `/api/v1/moves/board-grade-discover-brief`
  - `/api/v1/moves/board-grade-solution-architecture`
  - `/api/v1/moves/board-grade-estimate-model`
  - `/api/v1/moves/board-grade-cfo-pack`
  - `/api/v1/moves/board-grade-mobilize-packet`
  - `/api/v1/moves/board-grade-master-dossier`
- Updates the existing `/api/v1/moves/board-grade-business-case` orchestrated branch to persist lineage ids.
- Adds tailored Moves deliverable structures for target architecture, operating model, estimate, value model, mobilization plan, handoff pack, and executive playback.
- Extends `loadMoveBusinessCaseInput` to load committed `program_evidence_items` for generation context and lineage.
- Extends generated-artifact repository persistence with `citedInputIds`.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts src/lib/artifacts/__tests__/repository.test.ts src/lib/programs/board-artifacts/__tests__/board-grade-persistence.test.ts --runInBand` passed: 3 suites, 17 tests.
- `npx eslint` on all changed TypeScript and route files passed.
- `npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge through PR and deploy normally. The deterministic path remains active until a tenant is added to `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS`. For lab proof, enable the flag for the target tenant, call the existing board-grade route with `?moveId=...`, and verify the response header, generated artifact row, and `cited_input_ids`.

## Rollback Plan

Revert this PR. Because the change is additive and does not alter the route contract or add a schema migration, rollback restores deterministic route behavior. Any generated artifacts written while the flag was enabled remain audit records and do not need deletion.

## Audit Evidence

- PR: to be attached after creation.
- Focused Jest, ESLint, and TypeScript command outputs in the PR checks.
- Generated artifact rows should show `source_artifact_ref = move:<moveId>:<artifactId>` and `cited_input_ids` only when UUID-backed governed inputs were assembled.

## Known Gaps

- No live ACA deploy or state-level DB/log verification is included in this slice; that is reserved for DG-PR-H / WE-DoD after a real SkyHarbor Move is originated or restored.
- Azure Blob binary persistence for DOCX/XLSX bytes remains DG-PR-E; this slice continues using the existing generated-artifact HTML metadata path.
- Source engine migration remains quarantined behind the Source-D09 workstream and is intentionally untouched.
- Charter JSON and baseline JSON evidence are cited in the generated document but are not written to UUID lineage arrays because they are not row ids.
