# Intelligence Client Grounding Packet — Azure Layer Reconciliation

Date: 2026-07-18  
Scope: Intelligence `/api/intelligence/ask`, active V7 dossier retrieval, Meridian/Healthcare Demo context grounding, companion canvas inputs, suggested follow-ups.

## Why This Audit Exists

The product issue was not that aVa cannot write a strong AI strategy answer. The issue was that Intelligence did not always assemble the right client grounding packet before Claude/aVa was called. For questions such as AI agent assist, the answer path could retrieve AI initiative rows while missing current contact-center stack, data readiness, executive interview signals, AI tool usage, process bottlenecks, and evidence gaps.

That makes the answer sound like a good generic consultant. It does not consistently prove why aVa is better than asking GPT or Claude directly.

## Azure Data Layer Findings

Local direct Postgres access is private-network blocked:

- Server: `pg-abarva-context-lab-001.postgres.database.azure.com`
- Resource group: `rg-abarva-database-lab-eastus2`
- Public network access: disabled
- Local symptom: `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`

Read-only reconciliation was performed inside the live ACA web container, which has VNet-visible access to the database.

## Live Runtime / Data Plane Snapshot

Live ACA web runtime observed:

- Container App: `ca-abarva-web-lab-eastus`
- Resource group: `rg-abarva-controlplane-lab-eastus`
- Active revision observed: `ca-abarva-web-lab-eastus--mb2834e6b`
- Runtime image observed: `acrabarvalab001.azurecr.io/abarva/web@sha256:74dae0f47cb5fbfd607a4affac13bb3deeef53f216d267280be653ad9d1a0f32`

Meridian active V7 contract:

- Tenant key: `meridian-health`
- Active contract: `v7.1.0-meridian-current-state-20260709`
- Promotion status: `active`
- Load status: `validated`
- Business records: `442`
- Field count: `11,507`
- Graph nodes: `97`
- Relationship edges: `69`
- Retrieval chunks: `118`

The prior deeper synthetic pack remains superseded:

- Contract: `v7.0.0-synthetic-depth-v2-20260703`
- Business records: `3,828`
- Field count: `112,444`
- Graph nodes: `2,285`
- Relationship edges: `1,000`
- Retrieval chunks: `700`

## Active V7 Business Records by Dimension

| Dimension | Records |
| --- | ---: |
| Portfolio entity registry | 1 |
| Enterprise profile | 1 |
| Business functions | 7 |
| Org ownership and decision rights | 7 |
| Workforce personas | 6 |
| Applications and systems | 15 |
| Data assets and integrations | 36 |
| Vendors and contracts | 7 |
| Spend and value | 10 |
| Programs and business priorities | 7 |
| AI initiatives | 3 |
| Operations, risk, and controls | 28 |
| Relationship graph | 69 |
| Source evidence registry | 4 |
| Metric definitions | 11 |
| Industry and market patterns | 7 |
| Expert lenses | 5 |
| Client rate card and cost basis | 4 |
| Function-system-data-vendor bridge | 60 |
| Service tower and managed services scope | 3 |
| Retrieval registry | 118 |
| Graph relationship dictionary | 17 |
| Operational process evidence | 10 |
| External benchmark and market corpus | 2 |
| Infrastructure and cloud estate | 4 |

## Enterprise Context Layer Snapshot

The older enterprise context layer still contains useful richness and is fully embedded:

- Sources: `24`
- Source files: `24`
- Records: `1,533`
- Facts: `13,659`
- Relationships: `300`
- Evidence rows: `0`
- Chunks: `1,533`

Top source families by record count include:

- `family-3-data-connectivity/F10_integrations-interfaces.csv`: `240`
- `family-7-outcome-intelligence/O05_raid-log.csv`: `184`
- `family-2-technology-estate/F05_applications-systems.csv`: `150`
- `family-7-outcome-intelligence/O04_benefits-realization.csv`: `138`
- `family-3-data-connectivity/F09_data-analytics-estate.csv`: `120`
- `family-4-financial-commercial/F11_vendors-contracts-licenses.csv`: `95`
- `family-7-outcome-intelligence/O01_business-metrics.csv`: `92`
- `family-7-outcome-intelligence/O02_industry-benchmarks.csv`: `92`
- `family-7-outcome-intelligence/O03_competitor-plays.csv`: `92`
- `family-2-technology-estate/F06_system-function-mapping.csv`: `80`
- `family-5-execution-operations/F13_initiatives-portfolio.csv`: `72`
- `family-6-governance-ai-evidence/F17_ai-automation-footprint.csv`: `14`

## Tower / AI Portfolio Layer Snapshot

The CIO Tower mart has additional AI value and governance data that should remain part of the governed source universe:

- Command center rows: `1`
- Value funnel rows: `4`
- Program decision lane rows: `12`
- AI portfolio rows: `250`
- CXO action rows: `4`
- Evidence lineage rows: `7`
- Required field gap rows: `7`

Observed command center values:

- Total IT budget: `$650M`
- Run budget: `$487.5M`
- Change budget: `$162.5M`
- Approved program budget: `$291.9M`
- AI-tagged program exposure: `$53.7M`
- Promised value: `$35.5M`
- Partially finance-validated value: `$3.8M`
- Realized value: `$0`
- Candidate AI opportunities: `242`
- Watch pressure: `80`

## Root Cause

The active Intelligence answer path treated active V7 as dominant. When V7 was present, older tenant enterprise, structured-fact, technology, routed, and worldview sources were suppressed from the model-visible packet.

That suppression is good for avoiding stale duplicate records, but it becomes harmful when useful enterprise context has not yet been promoted into active V7. For AI strategy and use-case questions, that meant Claude could receive broad V7 rows without the richer client-current-state slices needed to ground the answer.

## Change Implemented

The fix adds an Intelligence-specific Client Grounding Packet:

- Detects AI strategy, AI use-case, trend, automation, current-state, data-foundation, tool-usage, and readiness questions.
- Assembles one source-owned grounding packet from active V7 plus tenant enterprise, structured facts, technology sources, and routed sources.
- Inserts that packet into the selected sources before the source limit is applied.
- Feeds the same packet to answer synthesis, companion canvas, trace, product-truth guards, and suggested follow-ups.
- Keeps retired-fact, source-safety, and product-truth gates in the same existing path.

The V7 retriever now also selects current-state dimensions for AI/use-case prompts by default:

- Applications and systems
- Data assets and integrations
- Vendors and contracts
- Programs and business priorities
- AI initiatives
- Operations, risk, and controls
- Function-system-data-vendor bridge
- Operational process evidence
- External benchmark and market corpus
- Infrastructure and cloud estate

## Expected Product Behavior

For a prompt like:

> Should Meridian prioritize AI agent assist in the contact center?

aVa should answer through the client packet, not as generic market advice. A good answer should mention:

- The loaded tenant and industry context.
- Relevant current-state systems or state that current system evidence is missing.
- Interview/priorities if present.
- AI initiative/tool usage evidence if present.
- Process bottlenecks and data-readiness constraints.
- Industry benchmarks as benchmarks, not tenant facts.
- Evidence gaps and what must be confirmed before board/CFO use.

## Validation

Local targeted regression:

```bash
npx jest src/lib/intelligence/ask/__tests__/client-grounding-packet.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts --runInBand
```

Result:

- Test suites: `2 passed`
- Tests: `6 passed`

Known warning:

- Jest reports duplicate manual mocks for Markdown/GFM helpers. This is an existing repo warning and did not fail the targeted tests.

## Open Gaps

- Direct local Postgres inspection remains blocked by private networking; read-only DB proof must run from ACA/VNet-visible execution.
- `enterprise_context_evidence` is currently `0` for Meridian even though source files, chunks, facts, and relationships are populated. The UI should avoid presenting this as “no evidence exists” without explaining the registry distinction.
- Some rich enterprise context still lives outside active V7. The grounding packet fixes model visibility, but the longer-term data-governance target is promotion/reconciliation into the canonical active context model.
