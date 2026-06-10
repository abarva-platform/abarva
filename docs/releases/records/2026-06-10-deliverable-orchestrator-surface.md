# 2026-06-10-deliverable-orchestrator-surface — Deliverable Orchestrator in-product surface

## Release ID

`2026-06-10-deliverable-orchestrator-surface`

## Status

`candidate`

## Plain-English Summary

Makes the Deliverable Intelligence Orchestrator (merged in #3383) reachable in-product.
Adds a governed API route that, for the signed-in tenant, assembles governed evidence,
runs the six-pass board-grade authoring flow through the audited Anthropic egress, applies
the quality gate, and persists the result as a downloadable artifact — or returns the
quality-gate blockers when the document does not meet the bar. A Source surface page +
"Generate board-grade deliverable" action invoke it. Also hardens the model caller to
stream (removing the SDK's 10-minute non-streaming ceiling that long board-grade passes
can hit).

## Layer Impact

- `global-control-lane`: new API route `POST /api/v1/deliverables/generate`, a service +
  evidence assembler + request builder in `src/lib/deliverables/orchestrator/`, a UI action
  component, a Source page, and one new Source sub-nav tab. Reuses existing seams
  (`requireTenancy`, `queryTenantContext`, `loadTenantAiPolicyRecord`, `saveGeneratedArtifact`,
  audited egress). No schema or data-plane change.

## Client Applicability

- All clients: yes — any signed-in tenant can reach `/source/deliverables` and generate.
  Generation only uses that tenant's governed, agent-ready evidence; vendor-facing audiences
  exclude `internal_only` evidence. Output is gated and persisted per tenant.
- Feature flag: none (additive surface; no existing behavior changed).

## Changes Included

- `src/app/api/v1/deliverables/generate/route.ts` — POST handler (tenancy + validation + 422-on-block + 200-on-success).
- `src/lib/deliverables/orchestrator/generate-service.ts` — `runDeliverableForTenant` (assemble → build → generate → gate → persist; injectable deps).
- `src/lib/deliverables/orchestrator/evidence-assembler.ts` — `assembleGovernedEvidence` (Azure Search → clean citation-numbered evidence; vendor-facing exclusion).
- `src/lib/deliverables/orchestrator/build-request.ts` — `buildDeliverableRequest` (board-grade defaults).
- `src/lib/deliverables/orchestrator/model-caller.ts` — switched to streaming (`messages.stream().finalMessage()`).
- `src/components/deliverables/GenerateDeliverableButton.tsx` + `src/app/(maestro)/source/deliverables/page.tsx` + Source sub-nav tab.
- Tests: `__tests__/surface.test.ts`, `src/app/api/v1/deliverables/generate/__tests__/route.test.ts` (+ updated model-caller mock for streaming).

## QA / Validation

- `jest src/lib/deliverables/orchestrator src/app/api/v1/deliverables` → 47/47 pass.
- `jest tests/unit/nav-active-state`, QA route-ownership + smoke-inventory suites → pass (new tab/page don't break parity).
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.
- Evidence assembler enforces the vendor-facing exclusion; the route returns 422 with blockers when the quality gate refuses (no silent weak export).

## Rollout Plan

Squash-merge to main → ACA image build/deploy. Additive; the surface appears as a new
Source "Deliverables" tab. No migration. Live generation requires `ANTHROPIC_API_KEY`
(already configured on ACA) and tenant governed evidence in the Azure Search index.

## Rollback Plan

Revert the PR. No schema/data changes; removing the route + page + tab restores prior
behavior. The merged orchestrator library (#3383) is unaffected.

## Known Gaps

- No live end-to-end run of the route itself yet (the orchestrator is live-proven in #3383
  via the SkyHarbor ACA run; this PR's route + service are proven via mocked-collaborator
  tests). First live invocation will be on ACA where the key + tenant index are present.
- The Source page prefills an AMS RFP example and uses a synthetic `sourceArtifactRef`; a
  later change should bind the action to a selected source event id.
- PPTX exec-deck rendering is still deferred; the persisted format is DOCX (XLSX is a
  companion exhibit, not the primary artifact format).

## Audit Evidence

Tests above; release record; the merged orchestrator's live proof in
`docs/deliverables/SKYHARBOR_AMS_LIVE_PROOF.md`.
