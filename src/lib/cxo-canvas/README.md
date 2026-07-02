# CXO Executive Canvas

The CXO canvas contract is the shared native exhibit layer for Intelligence, Moves, Source, Tower, Home/Context, and Artifacts.

The model owns advisory judgment. AbarVa owns the governed renderer. Model output may include only an `abarva-canvas` fenced JSON payload that validates against this contract. It must not emit arbitrary HTML, JSX, SVG, Mermaid, CSS, chart libraries, or executable display code.

## Canonical Canvas Types

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

Legacy Intelligence payload names are accepted by the validator and normalized to canonical names, but new prompts and fixtures must use the canonical IDs.

## Required Shape

Every payload starts with:

```json
{
  "canvasType": "executive-canvas-sequencing",
  "title": "AI funding sequence",
  "summary": "Optional executive framing",
  "lanes": [],
  "items": [],
  "metrics": [],
  "proofBoundary": {},
  "decisionRequired": "Optional decision required",
  "sourceNotes": [],
  "confidence": 8
}
```

Arrays of `items`, `lanes`, `metrics`, and `gates` must contain objects. Raw strings in object positions are invalid and render the safe fallback.

## Rendering Rule

Use `CxoCanvasRenderer` from `rendererRegistry.tsx`.

```tsx
<CxoCanvasRenderer payload={payload} context={{ surface: "intelligence" }} />
```

Malformed payloads, unknown `canvasType` values, and payloads with protocol/debug markers fall back to:

`Executive canvas unavailable. Showing structured recommendation summary.`

The fallback never prints raw JSON.
