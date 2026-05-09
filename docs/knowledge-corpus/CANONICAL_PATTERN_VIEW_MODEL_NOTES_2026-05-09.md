# Canonical Pattern View Model Notes

Date: 2026-05-09

Status: Wave 1 draft-builder notes. No runtime behavior change.

Runtime files:

- `src/lib/intelligence/canonical/build-canonical-pattern.ts`
- `src/lib/intelligence/canonical/build-canonical-pattern.test.ts`

## Purpose

The canonical draft builder projects existing pattern-like records into `IndustryAIPatternDraft` objects. It does not create a new source of truth, persist records, mutate database content, or rewrite source data.

The view-model layer exists so Wave 2 retrieval can ask a simple question:

> What canonical fields are available for this pattern, and what is still missing?

## Supported Sources

| Builder | Source | Behavior |
| --- | --- | --- |
| `fromPatternSeed()` | TypeScript `PatternSeed` corpus | Maps id/title/thesis/domain/vertical/confidence/source documents and flags missing provenance when `source_basis` and confidence rationale are absent. |
| `fromManifestEntry()` | Generated pattern manifest | Maps manifest metadata, sector applicability, evidence requirements, interventions, source file, and confidence floor. |
| `fromPatternPackRow()` | Supabase `pattern_packs` row shape | Maps category, sector applicability, phase deliverables, evidence requirements, failure fields, interventions, confidence level, and source metadata when present. |
| `fromGenomePatternRow()` | Supabase `genome_patterns` row shape | Maps code/name/description/industry/office/tags and flags quantitative fields that lack structured source references. |

## Guardrails

1. Builders fill only available fields.
2. Builders never invent KPI values.
3. Builders never invent quantitative outcomes.
4. Builders never fabricate source references.
5. Builders keep source system and source id in `source_crosswalk`.
6. Builders expose `missing_required_fields`.
7. Builders set `missing_provenance` when `source_basis` or `confidence_rationale` is absent.
8. Builders treat quantitative fields without structured source references as `unsupported_claim_flags`.

## What The Draft Is Not

`IndustryAIPatternDraft` is not yet a validated canonical pattern.

A draft can be missing:

- primary and secondary KPI sets
- baseline requirements
- measurement method
- agentic architecture
- human-agent workflow design
- autonomous action boundaries
- escalation points
- responsible AI guardrails
- recommended workshops
- gate evidence
- source basis
- confidence rationale

That is expected in Wave 1. The point is to make gaps machine-visible before adding large volumes of content.

## View Model Shape

Every draft includes:

- `canonical_id`
- `title`
- `source_crosswalk`
- `source_systems`
- `source_ids`
- available canonical fields
- `missing_required_fields`
- `missing_provenance`

Downstream Wave 2 retrieval should use these draft fields as a normalized read model, not as proof that the corpus is complete.

## Quantitative Claim Handling

The builder does not infer value ranges or KPI targets.

If a source row provides a quantitative field without a structured source reference, the builder can preserve it in `quantitative_claims` and add an `unsupported_claim_flags` entry. Nexus, Sentinel, and Atlas should not present those numbers externally until source basis and confidence rationale are attached.

## Recommended Wave 2 Use

1. Build an in-memory canonical pattern index from existing sources.
2. Retrieve candidate drafts by industry, enterprise area, function, process area, use-case category, and phase.
3. Prefer drafts with fewer missing fields and complete provenance.
4. Show source basis and confidence when recommending a pattern.
5. Ask the user for missing evidence when required fields are absent.
6. Refuse to make precise value claims when `unsupported_claim_flags` are present.

## QA Coverage

Unit tests cover:

- one Retail `PatternSeed`
- one Healthcare `PatternSeed`
- one Financial Services `PatternSeed`
- one generated manifest pattern
- one `pattern_packs`-like fixture
- one `genome_patterns`-like fixture

The tests assert that missing fields are surfaced, provenance gaps are explicit, and KPI/quantitative values are not invented.
