# Golden IROPS Answer Benchmark

## Benchmark Question

`What are airlines doing with IROPS? Give me trends and ROI if such AI investments. Charts or tables will be nice.`

## Product Bar

This is the Intelligence quality benchmark for an airline disruption-recovery question. The answer must feel like a senior airline operations and enterprise-AI advisor, not like a database readout.

The answer must:

- Understand IROPS as an airline irregular-operations recovery and value problem.
- Explain what airlines are doing with AI across disruption prediction, recovery orchestration, passenger reaccommodation, crew/aircraft/gate recovery, maintenance, and operations-control workflows.
- Provide named examples when public/current research sources are supplied.
- Provide ROI or quantified outcome ranges only with source type and caveat.
- Separate SkyHarbor tenant evidence from industry corpus, expert benchmarks, vendor/analyst claims, public/current sources, derived calculations, and gaps.
- Explain why data quality, crew legality, recovery operations, real-time systems, audit trails, and value baselines matter.
- Connect the industry pattern back to SkyHarbor's architecture and loaded evidence.
- Produce tables or chart-ready data when requested.
- End with clear next analysis options.

## Failure Conditions

Fail the answer when it:

- Starts with row counts, retrieval mechanics, or `I found X records`.
- Lacks named examples or fails to state that public/current research was not supplied.
- Gives ROI without a caveat or source type.
- Does not connect back to SkyHarbor.
- Treats industry corpus or expert planning ranges as SkyHarbor fact.
- Does not produce a table or chart-ready artifact when requested.
- Exposes raw internal record IDs.
- Sounds like a database report rather than a senior consultant.

## Required Answer Shape

1. Executive answer: 2-4 direct sentences.
2. Market / industry trend synthesis.
3. Named examples table.
4. ROI / value pool table.
5. SkyHarbor relevance panel.
6. Data and architecture prerequisites.
7. Recommendation / decision frame.
8. Tables/charts/graphs where supporting evidence exists.
9. Citation and evidence-source separation.

## Implementation Contract

The Intelligence backend routes this benchmark through `airline_irops_ai_roi` in `src/lib/intelligence/ask/advisor-composer.ts`. That composer injects the case-team brief immediately before Claude synthesis and widens the token/word budget only for this route.
