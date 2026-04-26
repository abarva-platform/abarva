# I7 · Intelligence · Internal / External Source Basis

Slice ID: I7
Slice name: Intelligence · Internal / External Source Basis
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Adds a deterministic source-basis read model that distinguishes
intelligence grounded in **internal evidence** (program evidence,
workshop notes, the evidence ledger) from intelligence grounded in the
**external pattern library** (industry benchmarks, vendor intelligence,
the public pattern pack), with an explicit per-basis confidence label
(`low` / `medium` / `high`). **No live retrieval, no Claude / OpenAI /
Pinecone invocation, no live registry binding, no migrations.**

## What changed

- New module
  [src/lib/intelligence/source-basis.ts](../../../src/lib/intelligence/source-basis.ts):
  - Public types: `IntelligenceSourceBasisKind` (the canonical
    six-tuple of internal and external kinds),
    `IntelligenceSourceBasisConfidence` (`'low' | 'medium' | 'high'`),
    `IntelligenceSourceBasis`, `IntelligenceSourceBasisSummary`.
  - Public helpers: `buildIntelligenceSourceBasisSeed()`,
    `summarizeIntelligenceSourceBasis(bases)`,
    `getInternalOnlyBases(bases)`, `getExternalOnlyBases(bases)`.
  - Test-only convenience tuples: `INTELLIGENCE_SOURCE_BASIS_KINDS`,
    `INTELLIGENCE_SOURCE_BASIS_CONFIDENCES`.
  - Deterministic seed coverage across all 5 canonical I1 pattern
    keys, with at least 1 internal and 1 external basis per pattern,
    exercising all 6 source basis kinds and all 3 confidence labels.
  - Every basis carries a structured `citationLocator` seed reference
    (e.g. `program/{slug}/value-worksheet#row-{n}`,
    `tenant/{tenantSlug}/ledger/{slug}#row-{n}`,
    `pattern-pack/public/{slug}#archetype-{n}`,
    `benchmark/{slug}/cohort#row-{n}`,
    `vendor-intel/{slug}/pack#section-{n}`) — never a live URL and
    never a literal `E-###` token.
  - Summary `honestDisclaimer` mentions "deterministic seed" and
    "no live external retrieval".

- New tests
  [src/__tests__/integration/intelligence/source-basis.test.ts](../../../src/__tests__/integration/intelligence/source-basis.test.ts):
  Pure deterministic suite covering builder determinism (byte-equal
  across calls, deterministic id form, unique ids), seed coverage (all
  6 source basis kinds, all 3 confidence values, every pattern key
  carries ≥ 1 internal and ≥ 1 external basis), per-basis contract
  (non-empty label / rationale / locator, no live URLs, kinds and
  confidences belong to the canonical tuples), summarizer correctness
  (totals, internal+external partition, breakdown sums, disclaimer,
  determinism, empty-input behavior), internal / external accessor
  partition, serialization hygiene (no `https://`, no `E-\d+`, no
  `$<digit>`), and module hygiene (no Sentinel / Atlas / Nexus / agent
  runtime, no Source UI, no legacy /programs, no mock.ts, no auth, no
  supabase, no model SDK, no `Date.now` / `Math.random` /
  `new Date(` / `fetch(`).

## How it consumes I1

```text
SentinelPatternKey (I1)
        │
        ▼
buildIntelligenceSourceBasisSeed()                     ← I7 builder
        │
        ▼
readonly IntelligenceSourceBasis[]
   ├─ internal_program_evidence
   ├─ internal_workshop_notes
   ├─ internal_evidence_ledger
   ├─ external_pattern_library
   ├─ external_industry_benchmark
   └─ external_vendor_intelligence
        │
        ▼
summarizeIntelligenceSourceBasis(bases)                ← I7 summarizer
        │
        ▼
IntelligenceSourceBasisSummary
   ├─ internalCount / externalCount
   ├─ confidenceBreakdown (low / medium / high)
   ├─ kindBreakdown (per-kind tally)
   └─ honestDisclaimer
```

The module imports only the I1 detection module (for the canonical
`SentinelPatternKey` tuple). It does not import EVID2 / EVID3 / I6 —
the basis read model is intentionally orthogonal to the Evidence
Dataset Drawer so a future surface can render either or both without a
circular dependency.

## What is deterministic today

- Builder output is byte-equal across repeated calls (test enforced).
- Summary output is byte-equal across repeated calls with the same
  input (test enforced).
- Seed coverage:
  - All 5 canonical I1 pattern keys carry at least 1 internal and 1
    external basis.
  - All 6 source basis kinds appear across the seed set.
  - All 3 confidence labels (`low`, `medium`, `high`) appear across
    the seed set.
- Every basis carries the deterministic
  `intel-source-basis-seed-N` identifier and
  `createdFrom: 'deterministic_intelligence_source_basis_seed'`
  (test enforced).
- Every basis kind starts with `internal_` or `external_`; the
  internal / external accessors honor that partition.
- No live URLs and no `E-###` literal citation tokens appear anywhere
  in the serialized seed (test enforced).
- No fabricated dollar amounts (test enforced).

## What is NOT yet live

- No Claude / OpenAI / Pinecone invocation.
- No live retrieval; `citationLocator` strings are structured seed
  references, not resolvable URLs.
- No live EVID2 / EVID3 projection; the seed is hand-authored.
- No live confidence scoring; confidence labels are hand-assigned.
- No live persistence of source-basis attributions.

## What is deferred

- **Live confidence scoring** — once the evidence ledger exposes
  freshness, lineage tier, and attestation density, confidence can be
  computed rather than authored.
- **Live EVID2 / EVID3 projection** — a future slice can replace the
  hand-authored seed with a deterministic projection over the
  Evidence Ledger MVP and Evidence Claim Support models without
  changing the I7 type contract.
- **Multi-tenant scoping** — the current seed is anchored on the
  Apex Retail demo tenant; tenant scoping is deferred until the
  basis read model is wired to the live registry.
- **Surface integration** — the I7 read model is consumed by a future
  Sentinel pattern detail / Atlas brief panel slice; this slice ships
  the read model only.

## Honest fallbacks used

- An empty input array to the summarizer reports zero counts and the
  stable honest disclaimer rather than throwing or fabricating.
- Every basis carries a per-row `rationale` rather than collapsing the
  attribution into a single sentence.
- Confidence labels are explicitly `low` / `medium` / `high` —
  surfaces should never coerce them into a numeric score.
- The module is a pure read model; no surface or runtime touches the
  seed today.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/source-basis.test.ts`
  — pass
- `npx eslint --max-warnings=0` over the touched files — pass

## Status

Code complete. Pending founder review.
