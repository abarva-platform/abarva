# I4 · Intelligence · Pattern Content Renderer / Detail Enrichment

Slice ID: I4
Slice name: Intelligence · Pattern Content Renderer / Detail Enrichment
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Enriches the I3 tenant pattern detail page with a deterministic
authored-content panel. For each canonical I1 pattern key the panel
renders pattern definition, how Sentinel detects it, why it matters,
failure modes, interventions, required evidence, related patterns,
and per-handoff guidance. **No live Sentinel runtime, no Claude /
OpenAI / Pinecone invocation, no graph traversal, no migrations.**

## What changed

- New module
  [src/lib/intelligence/sentinel-pattern-content.ts](../../../src/lib/intelligence/sentinel-pattern-content.ts):
  - Public types: `SentinelPatternContentCompleteness`,
    `SentinelPatternFailureMode`, `SentinelPatternIntervention`,
    `SentinelPatternRelatedPattern`, `SentinelPatternHandoffGuidance`,
    `SentinelPatternAuthoredContent`.
  - Public helper: `buildSentinelPatternAuthoredContent(patternKey)`
    — returns a deterministic `SentinelPatternAuthoredContent` for
    each of the five canonical I1 pattern keys, or `null` for
    unknown keys.
  - Re-export: `SENTINEL_PATTERN_CONTENT_KEYS` mirrors
    `SENTINEL_PATTERN_KEYS_IN_RANK_ORDER` (I1) so a regression in
    either contract is caught.

- New component
  [src/components/intelligence/SentinelPatternContentPanel.tsx](../../../src/components/intelligence/SentinelPatternContentPanel.tsx):
  - Server component (no client interactivity).
  - Renders pattern header (eyebrow + name + content-completeness +
    `source · deterministic seed` chip), then sectioned content for:
    Definition · How Sentinel detects it · Why it matters · Failure
    modes · Interventions · Required evidence · Related patterns ·
    Handoff guidance.
  - Renders an honest amber "authored content is partial" callout
    when the content's `contentCompleteness === 'partial'`.
  - Footer caption disclaims live retrieval / Atlas / Claude / OpenAI
    invocation.

- Integrated into the I3 detail surface
  [src/components/intelligence/SentinelPatternDetail.tsx](../../../src/components/intelligence/SentinelPatternDetail.tsx):
  - New `<PatternAuthoredContentSection>` block rendered between the
    "Suggested handoffs" block and the footer.
  - Routes related-pattern links through
    `/tenant/<routeSlug>/intelligence/patterns/<patternKey>` (already
    wired by I3).
  - No structural changes to the existing I3 blocks; the addition is
    purely additive.

- New tests
  [src/__tests__/integration/intelligence/sentinel-pattern-content.test.ts](../../../src/__tests__/integration/intelligence/sentinel-pattern-content.test.ts):
  21 deterministic tests across 6 describe blocks covering: content
  determinism + null on unknown keys, pattern-key parity with I1
  rank order, full required field set per canonical pattern,
  no-fabricated-dollars, no-live-runtime claim, signal-type
  whitelist (`howSentinelDetected` only references the canonical S9e
  signal types), and module hygiene across the content module + the
  content panel + the I3 integration source.

## How it consumes I1 / I2 / I3 detections

```text
SentinelPatternKey (I1)
        │
        ▼
buildSentinelPatternAuthoredContent(patternKey)        ← I4
        │
        ▼
SentinelPatternAuthoredContent
        │
        ▼
<SentinelPatternContentPanel content=…/>               ← I4 component
        │
        ▼
embedded in <SentinelPatternDetail view=…/>            ← I3 surface
```

The content module imports only the I1 detection module for type
narrowing. The content panel imports only `next/link` and the I4
content type. The integration into the I3 surface is purely
additive — no existing block is replaced, no existing import is
removed.

## What is deterministic today

- Content for every canonical I1 pattern key is byte-equal across
  repeated calls.
- Content for unknown keys is `null` (test enforced).
- Each authored content carries: definition, ≥1 detection signal
  type, ≥1 failure mode, ≥1 intervention, ≥1 required evidence
  entry, ≥1 handoff guidance row, and `contentCompleteness ∈
  {'partial','authored'}`.
- All five canonical patterns are `contentCompleteness: 'authored'`
  today; the panel keeps the partial-mode UI honest for future
  authored content.
- `howSentinelDetected` only references the canonical S9e signal
  types (test enforced).
- `relatedPatterns` reference only canonical I1 pattern keys; no
  self-reference (test enforced).
- No content invents a dollar amount in any string field (test
  enforced).
- `authoredAt` is always `'deterministic_seed'` (test enforced).

## What is NOT yet live Sentinel runtime

- No Claude / OpenAI / Pinecone invocation.
- No live retrieval; `requiredEvidence` is a checklist, not a
  resolved citation chain.
- No graph traversal — `relatedPatterns` are static, not derived
  from a pattern graph today.
- No persistence of authored content; every render rebuilds.
- No subscription to content updates; future authoring slices will
  swap entries via the same module without contract changes.

## What is deferred

- **True authored content management** — a future slice can replace
  the static content map with a content-management read model that
  exposes draft / live / retired states.
- **Pattern graph traversal** — once the graph lands, related-pattern
  rows will be derived from the graph rather than authored
  cross-references.
- **Authored content drafting tool** — Steward-led drafting flow
  remains deferred.
- **Live evidence registry binding** — `requiredEvidence` becomes
  resolvable to E-id citations when the registry slice lands.

## Honest fallbacks used

- Unknown pattern keys return `null`; the integration in the I3
  detail page calls `buildSentinelPatternAuthoredContent` and
  renders nothing when `null` so the surface remains honest for
  future patterns added without authored content.
- Content panel surfaces `contentCompleteness: 'partial'` as an
  amber dashed-border callout rather than hiding the absence.
- Footer disclaims live retrieval / model invocation.
- `source · deterministic seed` chip is always visible in the
  panel header.
- Content module imports nothing from Sentinel runtime, Atlas /
  Nexus / agent runtime, Source UI, legacy /programs, mock.ts,
  auth, supabase, or model SDKs (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/sentinel-pattern-content.test.ts` — 21 passed
- Regression suites pass (I1, I2, I3).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
