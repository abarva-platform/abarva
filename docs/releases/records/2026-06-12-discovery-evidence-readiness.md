# 2026-06-12-discovery-evidence-readiness — Discovery Evidence Readiness

## Release ID

`2026-06-12-discovery-evidence-readiness`

## Status

`candidate`

## Plain-English Summary

Workspace uploads for Strategic Moves now capture governed evidence, route parsed upload signals into the Move discovery shape, and return a discovery readiness model. The readiness model maps uploaded evidence to the Discovery Plan's required evidence families, emits a gap register for missing required families, and blocks Phase 2 to Phase 3 advancement until required discovery evidence is covered.

## Layer Impact

- `global-control-lane`: Extends existing Moves workspace upload and phase-gate routes without adding a new generic upload or generation endpoint.
- `client-data-lane`: Uses existing `program_evidence_items`, `program_attachments`, and engagement charter fields; no schema migration is included.
- `public-demo`: Makes the P2 discovery loop visible and truthful in demo walkthroughs by showing which evidence families are covered versus missing.

## Client Applicability

- All clients: P2 to P3 phase-gate checks discovery evidence readiness.
- Specific clients: Tenants using the Moves workspace upload path receive evidence capture and readiness in the response.
- Internal only: No.
- Public/demo only: Useful for pilot/demo Moves walkthroughs.
- Feature flag: Existing `discovery_intake_v2` still controls charter discovery-shape routing; readiness scoring is deterministic from uploaded evidence rows.

## Changes Included

- Adds a Discovery evidence-family readiness mapper and gap-register read model.
- Updates Workspace upload to synchronously capture evidence rows, apply discovery extraction, and return readiness.
- Blocks Phase 2 to Phase 3 advancement with a 412 response when required evidence families are missing.
- Keeps existing attachment storage and async chunking behavior intact.
- Adds focused tests for evidence-family mapping, gap register behavior, and phase-gate blocking.

## QA / Validation

- Passed: `npm test -- --runTestsByPath src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/app/api/programs/phase-gate/__tests__/route.test.ts src/lib/programs/discovery/__tests__/auto-generate-discovery-plan.test.ts --runInBand`
- Passed: `npx eslint` on touched TS files
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `npm run audit:architecture-rules`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. No migration is required. The P2 to P3 gate begins using the deterministic readiness read model immediately; uploads continue to use existing object storage and evidence tables.

## Rollback Plan

Revert the PR. Existing uploaded files and evidence rows remain intact. The P2 to P3 gate returns to its previous behavior and Workspace upload returns to attachment-only processing.

## Audit Evidence

- PR URL and CI run for this release candidate.
- Local focused Jest output for readiness mapping and phase-gate blocking.
- Runtime evidence source: `program_evidence_items` mapped against the Discovery Plan blueprint.

## Known Gaps

- No live ACA browser, DB row, or Log Analytics verification is included in this slice.
- No new waiver UI is added; the blocked response names that a human waiver must be recorded before advancing if evidence cannot be uploaded.
- Evidence-family mapping is deterministic keyword/rule based; it does not claim semantic certainty from an LLM classifier.
