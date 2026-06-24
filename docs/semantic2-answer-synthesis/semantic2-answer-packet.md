# Semantic2 Answer Packet — the single answer contract (Part 2)

Canonical source: [`src/lib/semantic2/contract.ts`](../../src/lib/semantic2/contract.ts).

## Why one contract
Every surface used to compose its own answer prose, gap language, and citation labels (see the [composition audit](current-answer-composition-audit.md)). That divergence is how the same question produces a librarian answer on one surface and a row-count dump on another. `Semantic2AnswerPacket` is the **one shape** every surface produces and every renderer consumes. **There is no second answer contract.**

`HomeKnowResponse` (the FE KNOW-mode shape) is a **projection** of this packet via `toHomeKnowResponse()`, not a parallel type — so Home and the shared engine cannot drift.

## The packet at a glance
- **Identity:** `surface`, `mode`, `tenantKey`, `question`, `intent`, `status`.
- **Executive synthesis (the lead):** `directAnswer` (+ `currentState`, `interpretation`, `businessImplication`, `operatingModelRisk`, `confidenceStatement`, `missingEvidence`, `recommendedNextPath`).
- **Grounding:** `entitiesUsed`, `factsUsed`, `relationshipsUsed`, `metricsUsed`, `conflicts`, `gaps`, `citations`.
- **Artifacts:** deterministic `table`/`chart`/`graph`/`report`/`handoff`/`gap_panel`, each with a `source` (semantic_fact | semantic_metric | semantic_relationship | semantic_view | corpus | derived) and citations.
- **Advisory (Intelligence/Source only):** `advisoryContext` — corpus patterns, expert lenses, benchmarks, decision frame, options, recommendation.
- **`quality`** and **`safety`** self-assessment blocks (the Part 6 gate reads these).

## Hard rules (enforced by the Part 6 validator)
1. **`directAnswer` must not lead with a row count.** Counts/coverage live in `artifacts` as expandable proof. (`safety.noRowCountLead`)
2. **Tenant claims need tenant citations.** Corpus claims need corpus citations. Expert opinion is labeled a *lens*, never stated as tenant fact.
3. **Home (KNOW) may not use `advisoryContext`, experts, or recommendations.** `SEMANTIC2_SURFACE_RULES.home` encodes this; `toHomeKnowResponse` drops the advisory layer entirely.
4. **No raw IDs / schema / debug language in prose** (`safety.noRawIdsInProse`, `noDebugLanguage`). Lineage lives in `citations`, not sentences.
5. **Gaps are field/mapping-specific**, never "no data found" — `SemanticGap.gapType` distinguishes `missing_field` vs `unmapped_field` vs `missing_relationship` vs `missing_source` vs `low_confidence`.

## Surface rules
`SEMANTIC2_SURFACE_RULES` (in the contract) declares per surface: `mode`, whether advisory/experts/recommendations are allowed, and that tenant claims require citations.

| Surface | Mode | Advisory | Experts | Recommend |
|---|---|---|---|---|
| home | KNOW | ✗ | ✗ | ✗ |
| intelligence | ANALYZE | ✓ | ✓ | ✓ |
| source | SOURCE | ✓ | ✓ | ✓ |
| moves | EXECUTE | ✗ | ✓ | ✓ |
| tower | CONTROL | ✗ | ✗ | ✗ |

(`ava` is a router alias; it resolves to a concrete surface upstream and defaults to the restrictive KNOW posture.)

## Relationship to the existing scaffold
- The thin scaffold packet in `build-answer-packet.ts` was renamed `LegacySemantic2AnswerPacket` and marked `@deprecated`. It is the row-count offender (`"I found N rows"`); **Part 3 replaces its builder** with the semantic synthesis composer that emits the canonical packet.
- The existing `route-question.ts` `Semantic2Surface` union is **reused** by the contract (imported, not re-declared) — one surface vocabulary.

## Mode vocabularies (note)
The route layer (`Semantic2Route.mode`) uses its own strings (`KNOW | DECIDE | SOURCE | EXECUTE | CONTROL_PROVE`) for routing. The **answer** layer uses `Semantic2Mode` (`KNOW | ANALYZE | DECIDE | EXECUTE | SOURCE | CONTROL`). The Part 3 composer maps route-mode → answer-mode per surface; they are intentionally separate layers, not a fork.
