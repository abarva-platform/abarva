# W5 Chunk Plan: AbarVa Specific Consulting-Displacement Vector and the Partnership Model

Last validated: 2026-04-30

Pinecone namespace: `worldview`

Embedding model target: `text-embedding-3-large`

Embedding dimension target: `3072`

## Chunk-First Architecture

Target chunk count: 15

Required range: 14-16

Method: write the retrieval chunks first, then use the same claim spine to generate the long-form thesis and Pinecone-ready records. Each chunk is intended to stand alone for retrieval while preserving the full argument sequence.

## Metadata Contract

Each chunk carries:

- `thesis_id`
- `thesis_title`
- `slug`
- `chunk_id`
- `sequence`
- `chunk_count`
- `chunk_type`
- `last_validated`
- `pinecone_namespace`
- `embedding_model_target`
- `embedding_dimension_target`
- `voice`
- `audience`
- `source_ids`
- `source_urls`
- `themes`
- `abaspecific_capabilities`
- `commercial_posture`
- `risk_level`
- `citation_policy`

## Chunk Map

| Chunk | Title | Type | Themes | Source IDs |
| --- | --- | --- | --- | --- |
| W5-C01 | The wedge is consulting work that has become repeatable but remains billed as bespoke | thesis | consulting_displacement, productized_workflows, strategic_positioning | S01, S08, S13, S14 |
| W5-C02 | AI turns the consulting pyramid from an advantage into a cost question | market_structure | labor_arbitrage, knowledge_work, ai_productivity | S03, S04, S12, S20 |
| W5-C03 | The buyer problem is not advice scarcity; it is execution-grade decision memory | buyer_problem | decision_memory, workflow_redesign, enterprise_context | S01, S16, S18, S19 |
| W5-C04 | Source is the first displacement beachhead because sourcing is high-stakes and patterned | abarva_specific | source, sourcing, vendor_selection, commercial_governance | S02, S08, S13, S22 |
| W5-C05 | The partnership model is a power move, not a peace offering | partnership_model | partnerships, channels, ecosystem_strategy | S09, S10, S11, S15, S22 |
| W5-C06 | AbarVa should be explicit about its self-interest | commercial_posture | self_interest, commercial_model, trust | S08, S13, S14, S17 |
| W5-C07 | The product must displace decks with gates, not prose with prose | product_principle | workflow_gates, artifact_studio, evidence | S01, S14, S16, S18 |
| W5-C08 | Consulting displacement starts with the middle, not the top | disruption_path | disruption, middle_market, christensen | S08, S12, S20, S21 |
| W5-C09 | The aggregation point is buyer workflow attention | strategy | aggregation, platform_strategy, ecosystems | S09, S10, S15, S22, S24 |
| W5-C10 | The moat is pattern intelligence plus evidence provenance | moat | moat, pattern_fabric, evidence_provenance | S01, S16, S18, S19 |
| W5-C11 | The operating model should separate strategy partners, implementation partners, and evidence authority | operating_model | partner_taxonomy, governance, delivery_model | S09, S10, S11, S22, S24 |
| W5-C12 | Pricing should follow decision value and rigor, not seats | pricing_logic | pricing, value_based, commercial_model | S02, S03, S08, S13 |
| W5-C13 | The counter-positioning risk is that incumbents will copy the surface and keep the relationship | competitive_risk | incumbent_response, competitive_strategy, risk | S09, S10, S13, S15 |
| W5-C14 | The ethical line is not anti-consultant; it is anti-waste and anti-opaque claims | ethics | ethics, labor_transition, trust | S05, S06, S07, S18 |
| W5-C15 | The strategic outcome is a partner-mediated decision intelligence platform | conclusion | platform_outcome, decision_intelligence, partnership_model | S01, S08, S09, S13, S17 |

## Sequencing Logic

1. Establish the precise wedge: repeatable consulting method sold as bespoke labor.
2. Explain why AI changes the labor economics of the consulting pyramid.
3. Reframe the buyer problem as decision memory and governed context.
4. Make Source the first AbarVa-specific beachhead.
5. Define partnership as strategic control, not appeasement.
6. Make AbarVa self-interest explicit to preserve trust.
7. Translate the thesis into product principles.
8. Use Christensen to explain the initial attack path.
9. Use Thompson to explain aggregation through buyer workflow attention.
10. Define the moat as pattern intelligence plus evidence provenance.
11. Specify partner role separation.
12. Specify pricing logic.
13. Identify incumbent response risk.
14. Draw the ethical line.
15. Close with the strategic outcome.

## Validation Checklist

- 24 verified accessible sources recorded in research notes.
- 5 steelmanned counterarguments included.
- 15 chunks, within required 14-16 range.
- `last_validated` set to `2026-04-30`.
- `pinecone_namespace` set to `worldview`.
- `embedding_model_target` set to `text-embedding-3-large`.
- `embedding_dimension_target` set to `3072`.
- No invented consulting pricing, dates, citations, or quotes.
- Direct quotations avoided except short source titles and terms.
