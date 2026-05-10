# Output Validation And Repair Spec

Version: 2026-05-09
Status: implemented baseline

## Purpose

Agent prompts reduce bad output, but they cannot guarantee it. AbarVa therefore applies a lightweight repair pass at the shared response-shaping choke point before text reaches CXO chat surfaces.

## Current Enforcement

Implemented in `src/lib/agent/output-discipline/response-contract.ts` and called by `shapeAgentResponseForSurface()` / `shapeStreamingAgentTextForSurface()`.

The repair pass:

- detects raw markdown emphasis markers
- strips bracketed raw pattern/use-case/vendor IDs such as `[P-HC-005]`
- replaces bare raw user-facing IDs such as `UC-HC-FRONT-001` with a generic source-backed phrase when no label is available
- splits prose paragraphs longer than three sentences into readable chunks

## Why This Is Text-Level First

Today’s active chat surfaces use a mix of plain text, markdown rendering, and shaped text. Text-level repair gives immediate protection across Moves, Intelligence, Source, Tower, and Setup without requiring every renderer to adopt custom citation tags in the same release.

## Next Renderer Slice

The next implementation slice should add custom citation rendering for structured tags:

- `<abv-pattern id="...">human label</abv-pattern>`
- `<abv-usecase id="...">human label</abv-usecase>`
- `<abv-vendor id="...">human label</abv-vendor>`
- `<abv-sources>...</abv-sources>`

Until those tags are rendered safely, prompts should prefer natural-language source basis and confidence over raw custom tags.

## QA Gates

Every agent-output slice should run:

- response contract unit tests
- response-shape regression tests
- 60-fixture golden answer eval
- TypeScript
- build
- forbidden legacy-tenant-name scan
