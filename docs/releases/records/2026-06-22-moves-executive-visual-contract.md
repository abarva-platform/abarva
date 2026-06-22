# 2026-06-22-moves-executive-visual-contract — Moves and Source Executive Visual Contract

## Release ID

`2026-06-22-moves-executive-visual-contract`

## Status

`candidate`

## Plain-English Summary

Moves and Source deliverables now carry an explicit executive visual standard in their artifact profiles. Major client-facing artifacts such as architecture, solution design, current-state diagnostics, business cases, roadmaps, executive handoffs, sourcing decision briefs, scorecards, transition plans, and value ledgers must render real visuals or styled tables in the final artifact instead of passing as polished prose.

## Layer Impact

- `global-control-lane`: Updates the shared deliverable profile contract and the quality gate used before artifacts are persisted. The change is tenant-agnostic and applies wherever these profiled orchestrated deliverables run.
- `internal-admin`: No admin route or data-loader behavior changed.
- `client-data-lane`: No schema, seed, ingestion, retrieval, or private client data changed.

## Client Applicability

- All clients: Applies to clients using the orchestrated Moves or Source deliverable pipeline.
- Specific clients: SkyHarbor remains the current production-lab canary tenant for the visual deliverable path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Enforcement still follows the existing deliverable quality contract rollout path, but profiles marked `visualRendererRequired` are quarantined when prose-only even if the general quality contract is observe-only.

## Changes Included

- Added `ArtifactVisualStandard` to the deliverable profile contract.
- Added visual standards for major Moves artifacts: current-state/discovery, root cause, target architecture, solution design, operating model, sourcing strategy, roadmap, business case, executive handoff, tower metrics, and value measurement.
- Added visual standards for major Source/aVa artifacts: sourcing strategy, RFP package, evaluation scorecard, pricing/commercial artifacts, decision brief, risk attestation, selection memo, transition plan, and value ledger.
- Broadened the quality gate so client-facing artifacts with visual standards block prose-only outputs.
- Updated persistence to inspect the final saved HTML for rendered visual evidence: SVG, visual exhibit blocks, deck exhibit blocks, `data-exhibit`, or styled tables.
- Added regression tests for Moves, Source/aVa, and profile-contract visual standards.

## QA / Validation

- `npx jest src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts --runInBand` passed: 2 suites, 21 tests.
- `npx jest src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts --runInBand` passed: 4 suites, 34 tests.
- `npx eslint src/lib/deliverables/profiles/types.ts src/lib/deliverables/profiles/registry.ts src/lib/deliverables/profiles/registry-source.ts src/lib/deliverables/quality/deliverable-quality-contract.ts src/lib/deliverables/orchestrator/persistence.ts src/lib/deliverables/quality/__tests__/story-visual-gate.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the image, then run a SkyHarbor production-lab canary deliverable to inspect saved artifact visuals.

## Deployment Authority

- Repo-owned deploy workflow: Required for production-lab rollout after merge.
- Shared runtime mutators: None.
- Approved image digest: To be recorded by deploy workflow.
- ACA runtime invariant: Must pass in deploy workflow.
- Worker image invariant: Worker job must use the same deployed digest as web.
- Feature/env flag update path: Existing deliverable quality and structured-exhibits flags.
- Live signed-in proof required: Yes, for final user-visible artifact proof.

## Rollback Plan

Revert this release commit and redeploy the previous ACA image. No migration rollback is required because this release changes TypeScript contracts, profile metadata, gates, tests, and release documentation only.

## Audit Evidence

- Branch: `codex/moves-executive-visual-contract`
- Test commands listed above.
- Release record: this file.

## Known Gaps

This release enforces the executive visual contract and blocks prose-only outputs, but it does not yet implement every dedicated renderer named in the standard, such as native finance waterfalls, radar charts, dependency heatmaps, and every individual sourcing chart. The current gate verifies that final artifacts render visual/table evidence; per-visual-item coverage should be added as each dedicated renderer lands.
