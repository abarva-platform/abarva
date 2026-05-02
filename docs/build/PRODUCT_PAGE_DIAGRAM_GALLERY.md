# Product Page Diagram Gallery

Date: 2026-05-02
Owner: `codex-product-page`

## Diagram Set

| Tab                      | Diagram                      | What it explains                                                                                                                 | Program leverage                                                                                                   |
| ------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Architecture             | Architecture stack           | AbarVa sits above foundation reasoning as the operating layer for agents, context, gates, and workspaces.                        | Use it to explain why AI strategy needs workflow, evidence, and portfolio observation before it becomes execution. |
| Knowledge layer          | Knowledge and corpus flow    | Client context, pattern intelligence, and market context feed a retrieval substrate used by Sentinel, Nexus, Atlas, and Steward. | Use it to show how uploaded artifacts, metrics, and practitioner patterns train agent behavior.                    |
| Data plane and security  | Private data-plane boundary  | Shared product orchestration stays separate from tenant-private context and retrieval boundaries.                                | Use it with client security teams to explain isolation, app-wiring handoffs, and migration readiness.              |
| Lifecycle and discipline | Lifecycle with agent overlay | P0-P6 phases align with Sentinel challenge, Nexus execution, Steward readiness, and Atlas observation.                           | Use it to convert strategy workshops into programs, sourcing events, evidence gates, and value monitoring.         |
| Scalability and vision   | Codex authoring pipeline     | Rubric, corpus, validation, publication, retrieval, telemetry, and outcome feedback create the learning loop.                    | Use it to explain how corpus gaps become backlog and how verified records improve future recommendations.          |

## Visual Direction

The diagrams are inline SVGs, not screenshots. They use a restrained editorial palette: paper background, ink text, copper, sage, aqua, blue, and plum accents. The intent is to feel like an executive architecture explainer, not a product screenshot collage.

## Implementation Notes

- Source file: `src/components/product/ProductDiagrams.tsx`
- Content mapping: `src/lib/product/product-page-content.ts`
- Route surface: `/product`
- App shell: shared `AppTopBar` plus `AppShell`, with legacy chrome bypass through `MaestroChrome`
