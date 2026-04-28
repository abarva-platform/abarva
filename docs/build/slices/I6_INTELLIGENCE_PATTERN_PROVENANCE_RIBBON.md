# I6 · Intelligence Pattern Provenance Ribbon

## Scope

This slice adds a deterministic provenance ribbon to the existing Sentinel pattern detail surface. It is intentionally narrow: Pattern detail only, no graph-store schema, no live ingestion, no model runtime, no shell token edits.

## Files

| File | Action |
|---|---|
| `src/lib/intelligence/intelligence-provenance-ribbon-view.ts` | Added deterministic ribbon view builder |
| `src/components/intelligence/IntelligenceProvenanceRibbon.tsx` | Added visible provenance ribbon component |
| `src/components/intelligence/SentinelPatternDetail.tsx` | Renders ribbon below summary |
| `src/__tests__/integration/intelligence/sentinel-pattern-provenance-ribbon.test.ts` | Locks deterministic view + rendering + honesty claims |

## Provenance contract

The ribbon states:

- Primitive: Pattern
- Source: `pattern_detection_read_model`
- Store binding: deterministic read model + evidence trail projection
- Signals: seeded signal id count
- Programs: affected program route count
- Citations: `not_yet_wired`
- Runtime: no live Sentinel / no model invocation

## Explicit non-goals

- No graph-store provenance claim
- No citation wiring claim
- No live retrieval claim
- No Anthropic/OpenAI/Pinecone invocation
- No expansion to library, solutions, or contradiction pages
