# W2 Chunk Plan - The Future of Knowledge Work and the Human + Agent + Corpus Assemblage

last_validated: 2026-04-30
pinecone_namespace: worldview
embedding_model_target: text-embedding-3-large
embedding_dimension_target: 3072
chunk_count: 16

## Chunk-First Strategy

The long-form thesis is generated from 16 retrieval-safe chunks. Each chunk is designed to stand alone in vector search while preserving a single argument arc. The chunks avoid broad essay sections like "background" and instead encode claims that an agent can retrieve, cite, and recombine.

Each chunk carries:

- `chunk_id`
- `thesis_id`
- `thesis_title`
- `chunk_index`
- `chunk_count`
- `title`
- `chunk_type`
- `summary`
- `body`
- `key_claims`
- `evidence_urls`
- `counterarguments`
- `tags`
- `last_validated`
- `pinecone_namespace`
- `embedding_model_target`
- `embedding_dimension_target`
- `source_file`
- `related_chunks`
- `confidence`

## Retrieval Design

- Chunks 1-3 define the thesis architecture.
- Chunks 4-7 define the operating model.
- Chunks 8-12 define risks, governance, and labor-market consequences.
- Chunks 13-16 define strategy, measurement, and compounding advantage.

The intended retrieval behavior is:

- A query about "future of knowledge work" should retrieve W2-01, W2-02, W2-05, and W2-16.
- A query about "AI agents in enterprise" should retrieve W2-04, W2-06, W2-07, W2-11, and W2-13.
- A query about "RAG/corpus/knowledge base" should retrieve W2-03, W2-07, W2-11, and W2-16.
- A query about "AI job loss or entry-level risk" should retrieve W2-10 and W2-12.
- A query about "AI productivity evidence" should retrieve W2-02, W2-14, and W2-15.
- A query about "AI governance" should retrieve W2-11 and W2-09.

## Chunk Inventory

| Chunk | Title | Type | Primary Function | Primary Evidence |
|---|---|---|---|---|
| W2-01 | The Assemblage Becomes the Unit of Work | thesis_claim | Establish the core frame | Microsoft WTI, OpenAI enterprise report, Anthropic Economic Index |
| W2-02 | Productivity Is Real, but Frontier-Bounded | evidence_synthesis | Bound the productivity claim | NBER, Organization Science, SSRN, Stanford AI Index |
| W2-03 | The Corpus Is the New Factory Floor | architecture_claim | Define corpus as production infrastructure | RAG, Lost in the Middle, Microsoft context/governance |
| W2-04 | Agents Are Bounded Workers, Not Employees | operating_model | Define practical agent role | Anthropic agents, Gartner autonomous agents, Microsoft Inside Track |
| W2-05 | Human Work Moves Up the Stack | role_design | Define human value | Microsoft WTI, OpenAI, WEF, PwC |
| W2-06 | Management Becomes Orchestration Design | management_thesis | Redefine manager role | Microsoft Inside Track, Gartner guardian agents, McKinsey |
| W2-07 | The Control Point Moves to Work Graph + Corpus Graph | strategy_thesis | Explain competitive advantage | Microsoft IQ/Agent 365, RAG, OpenAI enterprise report |
| W2-08 | Shadow AI Is a Signal, Not a Policy | adoption_pattern | Interpret informal use | OpenAI, Anthropic, MIT NANDA mirror, Microsoft WTI |
| W2-09 | Workslop Is the Negative Externality | failure_mode | Name the shallow-output failure | BetterUp/Stanford, McKinsey, OpenAI |
| W2-10 | Apprenticeship Must Be Redesigned | workforce_risk | Preserve junior learning | Stanford Canaries, NBER, WEF |
| W2-11 | Governance Becomes Throughput | governance_model | Treat controls as production layer | NIST, EU AI Act, ISO 42001, OWASP, Gartner |
| W2-12 | Labor Impact Will Be Uneven | labor_market | Avoid universal job-loss claims | ILO, Stanford Canaries, PwC, Stanford AI Index |
| W2-13 | The First Killer Apps Are Boring | deployment_pattern | Prioritize workflows over demos | Anthropic, Gartner, McKinsey, OpenAI |
| W2-14 | Measure Realized Value, Not AI Activity | metrics | Separate usage from impact | McKinsey, OpenAI, BetterUp, Stanford AI Index |
| W2-15 | Adoption Without Redesign Creates Pilot Theater | counterpattern | Explain why pilots fail | MIT NANDA mirror, McKinsey, Gartner |
| W2-16 | The Winning Firm Compounds Learning Loops | synthesis | Close the strategic argument | Anthropic Economic Index, Microsoft, ISO/NIST, RAG |

## Metadata Defaults

- `thesis_id`: `W2`
- `thesis_title`: `The Future of Knowledge Work and the Human + Agent + Corpus Assemblage`
- `last_validated`: `2026-04-30`
- `pinecone_namespace`: `worldview`
- `embedding_model_target`: `text-embedding-3-large`
- `embedding_dimension_target`: `3072`
- `source_file`: `worldview/long-form/W2_future_of_knowledge_work.md`

## Quality Bar

- 15-17 chunks required; this plan uses 16.
- Every chunk must have at least two accessible evidence URLs.
- Every chunk must be usable independently in retrieval.
- No invented quotes, dates, or citations.
- Direct quote usage should stay under 25 words per source; the final thesis uses paraphrase by default.
- Tone: direct, strategic, specific. Avoid hype, novelty theater, and vague future-of-work language.
