# CXO Executive Canvas Contract

## Standard

AbarVa executive surfaces render strategic exhibits through the shared CXO canvas contract in `src/lib/cxo-canvas`.

The model may choose the advisory frame and emit structured payload values. AbarVa owns the native renderer, validation, fallback, and visual language. No surface may render arbitrary model-authored HTML, JSX, SVG, Mermaid, CSS, chart code, or raw JSON as the executive exhibit.

## Approved Canvas Types

- `executive-canvas-sequencing`
- `value-readiness-matrix`
- `gate-to-value-roadmap`
- `proof-boundary-card`
- `risk-control-heatmap`
- `portfolio-allocation-map`
- `process-reinvention-map`
- `architecture-dependency-map`
- `operating-model-canvas`
- `thirty-sixty-ninety-roadmap`

Legacy Intelligence names are accepted only by the adapter for compatibility and normalize to the canonical names.

## Payload Rules

Each payload may include `canvasType`, `title`, `summary`, `items`, `lanes`, `metrics`, `gates`, `proofBoundary`, `decisionRequired`, `sourceNotes`, and `confidence`.

Object arrays must contain objects, not raw strings. Internal protocol markers such as `<<<TAB:`, `grounding:`, prompt traces, raw Claude output, model routing syntax, and system prompt labels are stripped or rejected before rendering.

## Shared Renderer

All surfaces must render through `CxoCanvasRenderer` and `CXO_CANVAS_RENDERERS`. A surface may pass context such as `{ surface: "intelligence" }`, but it must not fork a separate renderer or parse canvas JSON itself.

If validation fails, render `SafeFallbackCanvas` with the text:

`Executive canvas unavailable. Showing structured recommendation summary.`

The fallback may show sanitized summary, decision, or proof-boundary fields. It must never expose raw JSON.

## Initial Implementation Scope

The first full native renderer is `executive-canvas-sequencing`. The registry also includes native cards for the existing Intelligence value/readiness, gate-to-value, and proof-boundary shapes so current Intelligence behavior migrates to the shared path without losing the existing board exhibit behavior.
