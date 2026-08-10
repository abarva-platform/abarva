# Home Claude Architecture Diagram Output Contract

## Purpose

Home architecture visuals must be authored as stored diagram assets, not improvised inside the page.
Claude may generate review candidates, visual grouping ideas, concise explanatory wording, and SVG
drafts. Claude does not own current-state architecture, numbers, relationships, calculations,
authority, gates, or publication approval.

Production Home visuals must be compiled from a deterministic `HomeDiagramSemanticSpecV2` after
semantic validation and human approval. The semantic spec owns exact labels, values, scope,
evidence references, current/directional/hypothesis/unknown state, and allowed calculations.

## Non-Negotiable Authoring Rule

There is no hidden post-Claude scrubbing, rewriting, relabeling, or layout repair of a Claude
review candidate.

All instructions must be in the prompt before generation. If Claude output fails validation, the
system rejects the pack and sends the failure report back to Claude for regeneration. Validators do
not modify the SVG or the narrative.

No validator may convert a Claude review candidate into publication-approved Home content unless a
deterministic semantic validator and human reviewer have already approved the underlying semantic
spec.

## Required Claude Output

Claude may be called once for the full pack or once per diagram. For review-grade generation, the
preferred path is one Claude call per diagram so each SVG can be complete, detailed, and validated
without truncation.

When called for the full pack, Claude must return a single JSON object with this shape:

```json
{
  "pack_id": "skyharbor-home-architecture-diagram-pack-v1",
  "tenant_key": "skyharbor-air",
  "tenant_name": "SkyHarbor Global",
  "artifact_type": "home_architecture_diagram_pack",
  "pack_version": "v1.0.0",
  "generated_model": "claude-*",
  "prompt_version": "home-claude-architecture-diagram-pack-v1",
  "no_post_claude_mutation": true,
  "diagrams": [
    {
      "id": "patterns-enterprise-operating-system",
      "tab": "patterns",
      "title": "Enterprise operating system pattern map",
      "subtitle": "Executive-safe one sentence explanation.",
      "svg": "<svg ...>...</svg>",
      "confidence": "planning_grade",
      "source_refs": ["enterprise_context", "architecture_graph"]
    }
  ]
}
```

When called for one diagram, Claude must return a single JSON object with this shape:

```json
{
  "id": "patterns-enterprise-operating-system",
  "tab": "patterns",
  "title": "Enterprise operating system pattern map",
  "subtitle": "Executive-safe one sentence explanation.",
  "svg": "<svg ...>...</svg>",
  "confidence": "planning_grade",
  "source_refs": ["enterprise_context", "architecture_graph"]
}
```

The generator stores Claude's raw response verbatim at `raw-claude-response.json` or at one
`raw-claude-response-<diagram-id>.json` file per diagram, extracts the JSON object without changing
content, and writes each `svg` string exactly as returned.

For review generation, raw responses, generated SVGs, snapshots, and the review manifest are stored
under `reports/home-claude-architecture-generation/`. They are not runtime assets.

## Lifecycle States

The generation lifecycle is intentionally separated:

- `generation_complete`: Claude returned parseable candidate output.
- `svg_structural_pass`: candidate SVG passed structure, accessibility, unsafe-feature, and
  raw-output-fidelity checks.
- `semantic_validation_pass`: deterministic semantic spec validation passed.
- `human_review_approved`: an accountable reviewer approved the semantic output.
- `publication_approved`: the deterministic renderer may publish runtime assets.

`approved_for_render` must not be authored by Claude. Runtime/public assets require
`publication_approved`.

## JSON String Discipline

Claude must return valid JSON. SVG values must be JSON strings, not raw XML blocks.

- Do not put literal line breaks inside the `svg` string.
- Escape all quote characters that appear inside SVG attributes.
- Prefer a compact one-line SVG string.
- Do not use markdown fences.
- The response must parse with `JSON.parse` before validation runs.

## Required Diagram Coverage

Claude must generate diagrams for these Home tabs:

- `patterns`: enterprise operating system pattern map
- `economics`: economics and value-control architecture
- `posture`: evidence and authority posture map
- `coherence`: scoped current-state architecture index
- `trajectory`: executive shift and gate map

Future packs may add `summary`, `watchlist`, and `evidence`, but the five above are the minimum
quality bar for Home V0.3.

## Visual Standards

Each SVG must:

- Be a complete `<svg>` document with `xmlns`, `viewBox`, `<title>`, and `<desc>`.
- Use a professional enterprise palette with navy, blue, teal, amber, slate, and restrained red.
- Use bounded text sizes; no giant headers, no viewport-scaled fonts, no text overflow.
- Prefer scoped diagrams over a single giant diagram.
- Show domain-specific architecture where relevant: ERP differs from digital channels; data and AI
  differs from private cloud/mainframe/data-center architecture.
- Include explicit airline architecture signals when evidenced or directionally required:
  mainframe, z/OS/CICS/DB2/MQ, private data centers, private cloud, hybrid egress, integration
  fabric, EDW/marts, data science, BI, portals, and AI action gates.
- Separate known facts, directional interpretation, and unknowns.

## Forbidden SVG Features

Claude must not emit:

- `<script>`
- `<foreignObject>`
- event handlers such as `onclick=`
- external URLs or remote image references
- embedded base64 images
- animation that changes meaning or causes motion sensitivity issues

## Validation

Structural validation is allowed to reject only. It checks manifest shape, file existence,
accessibility metadata, unsafe SVG features, required tab coverage, XML well-formedness, minimum
content density, and exact stored-SVG-to-raw-Claude-output fidelity.

Validation must not:

- Rewrite SVG markup
- Wrap or resize text
- Replace labels
- Remove unsupported claims
- Convert unknowns to zero
- Promote directional content to facts

Semantic validation must separately prove:

- Every visible number exists in the allowed-values contract.
- Calculations reconcile and overlap detection passes.
- Source references resolve to exact facts or relationships.
- Current, directional, hypothesis, target, and unknown states are visually distinct.
- No current-state component is created from a required signal alone.
- No future state or gate lacks an authority source.
- Counts carry snapshot, scope, and denominator.
- Home stays within Home boundaries and routes deeper decisions to the owning module.

## Runtime Rendering

Home renders only deterministic runtime assets that have semantic and human approval. It does not
call Claude at page load.

The evidence drawer or audit export may show:

- prompt version
- raw Claude response hash
- generated model
- validator report
- asset paths
- source references
