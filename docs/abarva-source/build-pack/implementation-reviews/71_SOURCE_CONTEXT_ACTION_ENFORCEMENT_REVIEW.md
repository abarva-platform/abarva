# 71_SOURCE_CONTEXT_ACTION_ENFORCEMENT_REVIEW

## Slice
`WIRE4` - Source Context-Used and Three-Choices Enforcement

## Purpose
Make context visibility and actionable guidance explicit across key Source surfaces without adding model calls, uploads, persistence, workflow engines, or approval runtime.

## Wireframe/Design References
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/12_AbarVaContextUsedStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`
- `docs/platform-design/experience-system/components/10_AbarVaArtifactStrip.md`
- `docs/platform-design/experience-system/AGENT_CENTRIC_ENFORCEMENT_REVIEW.md`
- `docs/abarva-source/build-pack/implementation-reviews/67_SOURCE_WIREFRAME_IMPLEMENTATION_GAP_AUDIT.md`

## Implementation Notes
- Added deterministic context/action railing to `SourceRouteShell` for event detail route:
  - Context chips (`Context used`)
  - 3 contextual suggestions
  - Disabled custom ask input with deterministic caveat text
- Extended `SourceFoundationShell` with optional context chips and action rail to support artifact and value shells.
- Extended `SourceEventsPortfolio` with explicit custom ask placeholder while keeping three-choice behavior.
- Extended `SourceArtifactDrawer` with context disclosure and artifact-specific action layer:
  - Show evidence
  - Show version history
  - Explain missing inputs
  - Disabled custom ask
- Wired `SourceEvents/[eventId]` page with concrete context/action props:
  - Program/Stage/Gate/Program link context chips
  - Suggested actions aligned to event workflow
- Added anchors in `NexusEngagementCanvas` to back event-detail shell actions (`#source-route-*`).
- Kept Atlas/Nexus agent language, no generic chat UI, no API calls, no model runtime.
- Kept all behavior deterministic and seed-driven.

## What the shell now shows
- `/source/events`
  - Context strip in portfolio surface
  - Three deterministic choice actions
  - Disabled custom ask
- `/source/events/[eventId]`
  - Route-level context used strip
  - Three contextual action links
  - Disabled custom ask
- `/source/events/[eventId]/scorecard`
  - Steward card with context and custom ask already present and retained
- `/source/events/[eventId]/artifacts/[artifactId]`
  - Shell-level context chips and actions
  - Artifact-level context, action layer, and custom ask
- `/source/value`
  - Shell-level context strip
  - Atlas action layer preserved within value component

## Validation
- `npx jest src/__tests__/integration/source/source-context-action-enforcement.test.ts --runInBand`
- `npx eslint --max-warnings=0 src/components/source/SourceRouteShell.tsx src/components/source/SourceFoundationShell.tsx src/components/source/SourceArtifactDrawer.tsx src/components/source/SourceEventsPortfolio.tsx src/components/source/NexusEngagementCanvas.tsx src/app/(maestro)/source/events/[eventId]/page.tsx src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx src/app/(maestro)/source/value/page.tsx src/__tests__/integration/source/source-context-action-enforcement.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`
- `bash scripts/integration/hygiene_gate.sh --skip-build` (if available in batch environment)

## What remains deferred
- Full live chat behavior and model orchestration are still deferred by design constraints.
- No upload/parsing, workflow engines, or final vendor selection automation introduced in this slice.
- Additional Source route-level action anchors for every non-core region can be expanded in a follow-up slice.
