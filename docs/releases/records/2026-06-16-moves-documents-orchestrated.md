# 2026-06-16-moves-documents-orchestrated — Route Strategic Moves Documents through the governed orchestrator

## Release ID

`2026-06-16-moves-documents-orchestrated`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves "Documents" tab (and the per-phase workspace "Generate full
package" panel) previously generated each deliverable with a single Claude call
that had no plan gate and no quality gate, saving the result straight to the
database. That path could fabricate content and could not be held back when the
draft was weak.

This change retires that single-pass path for all Moves UI and routes every
per-phase deliverable through the already-built, already-tested governed
orchestrator: a six-pass authoring flow (plan + grounding + draft + red-team +
polish + format) with plan and quality gates, governed evidence, and audited
Claude egress. Each document's "Generate" control now shows a live percent
progress band, surfaces a blocked state with reasons when the quality gate holds
the draft back, and links to the finished artifact when it succeeds. The retired
HTTP route (`POST /api/v1/programs/:id/generate`) no longer runs the single-pass
engine; it now delegates to the orchestrator and returns a run id to poll, so any
lingering programmatic caller also lands on the governed path. A small mapping
module translates each per-phase registry key (charter, discovery_report, …) to
the orchestrator's deliverable type so the artifact gets the right consultant
section flow.

Each deliverable is now persisted and downloaded in its **prescribed** format
rather than HTML-only. The full structured `RenderableDeliverable` is stored in
the artifact metadata (`metadata.renderableDoc`) alongside the existing HTML
preview, and the persisted `outputFormat` follows the deliverable's prescribed
format (most documents → Word/DOCX; the financial model → Excel/XLSX, resolved
from the deliverable registry's `formatRecommendation`). The artifact download
route (`GET /api/v1/artifacts/[artifactId]`) renders the structured doc on demand
through the already-built `renderDeliverableDocx` / `renderDeliverableExcelCompanion`
renderers, supports `?format=docx|xlsx|html`, and falls back to the stored HTML
for older artifacts that predate structured persistence (never 500). Inline-HTML
preview behavior is unchanged.

No design changes: the existing Documents-tab layout, colors, fonts, and
black/ghost buttons are unchanged — only the engine, the progress band, and the
download format.

## Layer Impact

- `global-control-lane`: shared app behavior for all Moves clients. The Moves
  Documents tab, the phase-workspace generate panel, and the
  `POST /api/v1/programs/:id/generate` route now run the governed multi-pass
  orchestrator instead of the single-pass `streamAgentTurn` path. No tenant
  feature flag gates this; it is the default for every client using Strategic
  Moves.

## Client Applicability

- All clients: yes — every tenant using Strategic Moves gets the governed
  orchestrated generation in the Documents tab and phase workspace.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (default behavior change)

## Changes Included

- New `src/lib/programs/orchestrated-deliverable-map.ts` — maps a per-phase
  registry deliverable key → orchestrator `deliverableType` (charter,
  discovery_report, target_architecture, operating_model, roadmap, business_case,
  estimate_model, value_model, handoff_pack), normalized, with self-fallback.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — the per-document
  "Generate" action now renders `GenerateDeliverableButton` (module='moves',
  mapped deliverableType, move archetype, moveId as sourceArtifactRef, move
  name + phase as decisionContext, tenant cover name as clientDisplayName).
  Added `archetype` / `moveName` / `clientDisplayName` props.
- `src/components/strategic-moves/GeneratePhasePackage.tsx` — rewritten to use
  `GenerateDeliverableButton` per document; the single-pass `fetch` to
  `/api/v1/programs/:id/generate` and the "Generate all … AI Draft documents"
  control are removed.
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`,
  `src/components/strategic-moves/StrategicMovePhaseClient.tsx`,
  `src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx` — thread the
  move's archetype/name/tenant into the panel/package.
- `src/app/api/v1/programs/[programId]/generate/route.ts` — retired: the
  single-pass `streamAgentTurn` / `draftModuleDeliverable` engine is removed; the
  route now creates a `deliverable_runs` row, runs `runDeliverableForTenant` in
  the background, and returns `202 { runId, status:'running' }`.
- Tests: rewrote
  `src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts`
  to assert orchestrated delegation; updated and extended
  `src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx`
  with a new assertion that the Documents tab POSTs to
  `/api/v1/deliverables/generate` and never to the single-pass programs route.
- Reused (not modified) the already-committed async contract: orchestrator,
  progress, generate-service, runs-repository, `GenerateDeliverableButton`, the
  `/api/v1/deliverables/generate` + `/runs/{id}` routes, and the
  `deliverable_runs` migration.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — passed for all changed files (only
  pre-existing path-alias `@/…` noise and unrelated missing optional deps
  `@azure-rest/ai-document-intelligence`, `@axe-core/playwright` remain).
- `npx jest src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx`
  — passed (3/3), including the new orchestrated-path assertion.
- `npx jest src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts`
  — passed (3/3): 202 + runId, archetype-mapped run, legacy-key fallback, 404.
- Full Moves suite (`src/components/strategic-moves` +
  `src/__tests__/integration/programs`): 1524 passed with my change vs 1521 on the
  clean base (+3 new). The 38 failing suites are pre-existing and identical
  before and after my change (data-plane / env-dependent integration tests, e.g.
  `BoardArtifactsPanel.test.tsx`) — no regression introduced.
- `npm run audit:architecture-rules` — passed (0 violations, 14 files scanned).
- ESLint on all changed files — clean.

## Rollout Plan

Merge to `main` via squash PR, then build and deploy the web image to Azure
Container Apps (`app.abarva.ai`). No migration is introduced by this PR (the
`deliverable_runs` table + progress columns already shipped with the committed
async contract). No feature flag — active for all clients on deploy.

## Rollback Plan

Revert this PR's commit and redeploy the prior ACA image. No schema change to
unwind. Because the change is engine-routing only (the orchestrator, runs table,
and async routes already exist independently), reverting restores the previous
single-pass behavior without data migration.

## Audit Evidence

- PR URL: (to be added when opened)
- CI: Architecture Rules + Release Control gate on the PR; local
  `audit:architecture-rules` and `release-check` runs recorded above.
- Test output: jest runs for the two named test files (3/3 each) and the
  before/after suite counts (1521 → 1524 passing) captured in this session.
- Live ACA proof: PENDING — the orchestrated async path itself is live-proven
  (per prior records), but generation initiated from the Moves Documents tab /
  phase workspace has not yet been driven end-to-end on the ACA private DB after
  this rewire. Needs a real Move: click Generate on a Documents-tab document,
  confirm a `deliverable_runs` row, watch the % band, and open the persisted
  artifact.

## Known Gaps

- Live ACA verification of generation initiated specifically from the Moves
  Documents tab / phase workspace is pending (see Audit Evidence).
- `solution_design` and `sourcing_strategy` registry keys have no dedicated
  orchestrator structure yet; they map to `target_architecture` / themselves and
  use the generic board-grade brief. Adding dedicated structures would sharpen
  those two artifacts but is out of scope here.
- The legacy "Other documents (legacy)" rows in `PhaseDocumentsPanel` still link
  to the phase workspace for generation rather than rendering an inline
  orchestrated button; canonical per-phase documents are fully rewired.
