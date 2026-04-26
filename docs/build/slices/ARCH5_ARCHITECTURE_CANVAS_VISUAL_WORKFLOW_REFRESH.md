# ARCH5 · Architecture Canvas Visual + Workflow Refresh

**Wave:** wave-17
**Branch:** wave17/arch5-architecture-canvas-refresh
**Status:** code_complete
**Owner:** Codex (lane ARCH5)

## Summary

Refresh `/platform/admin/architecture` from a build-history listing into a premium architecture **journey canvas**. Adds a new `ArchitectureCanvas` component (and view-model builder) above the existing ARCH4 `ArchitectureOverviewPage`, telling the AbarVa system story across 10 deterministic workflow sections.

## Deliverables

| File | Description |
|---|---|
| `src/lib/admin/architecture-canvas-view.ts` | Pure TypeScript view-model. Exports `buildArchitectureCanvasView()` returning the executive brief, 9 planes, request + data flows, control plane model, Azure reference, gateway/registry boundary, mission runtime, built-vs-deferred items, and next actions. |
| `src/components/admin/ArchitectureCanvas.tsx` | `'use client'` React component. Renders the 10 workflow sections with selective dark-navy hero panel + off-white surface for the rest. |
| `src/app/(maestro)/platform/admin/architecture/page.tsx` | Mounts `<ArchitectureCanvas />` above the existing `<ArchitectureOverviewPage />`. ARCH4 functionality preserved. |
| `src/__tests__/integration/admin/architecture-canvas.test.ts` | 14 type-shape + source-scan tests. No jsdom, no React rendering. |

## 10 Workflow Sections (in order)

1. Executive Architecture Brief (selective dark-navy hero panel)
2. Architecture Planes Map (9 plane cards with built/deferred chips)
3. Request flow: Request → Context → Agent → Output (CSS-only diagram, ▸ arrows)
4. Data flow: Data → Evidence → Usability (CSS-only diagram)
5. SaaS Control Plane + Private Data Plane (two cards + boundary line)
6. Azure target reference (services + notes)
7. Model Gateway + Tool Registry boundary (two cards + rule)
8. Agent Mission Runtime (description + component chips)
9. Built now vs Deferred (8 items, status chips)
10. Next architecture actions (4 numbered actions with rationale)

Footer carries the deterministic caveat and `generatedAt`.

## Design canon (followed)

- Surface `#FBFAF7`, card `#FFFFFF`, border `#E8E6E1`
- Ink `#0A0C12`, body `#1F2433`, muted `#525866`
- Accent NAVY `#1B2B5C`. Selective dark-navy hero panel `#0F1E3F` (executive brief only)
- DM Sans throughout. NO teal/green/purple/neon. NO Mermaid. NO icons.

## Caveat

Architecture canvas reflects current implementation and explicit deferred items. Some planes (model gateway, tool registry) are intentionally deferred. The Azure private data plane is documented as target architecture; deployment path is in roadmap.
