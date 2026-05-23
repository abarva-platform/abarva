# Legacy Corpus Cutover Log

P1 establishes the new corpus data layer as the source of truth. This log records the legacy content decisions made for the P1 PR and the residual work intentionally deferred to the follow-up sweep PR after P1 lands and before P6 starts.

## P1 Cutover Decisions

| Path | Decision | Target |
| --- | --- | --- |
| `worldview/README.md` | Migrated then archived. | `.archive/worldview/README.md`; source of truth is `corpus_patterns`. |
| `worldview/chunk-plans/W1_chunk_plan.md` | Archived as source material. | `.archive/worldview/chunk-plans/W1_chunk_plan.md`; not runtime content. |
| `worldview/chunk-plans/W2_chunk_plan.md` | Archived as source material. | `.archive/worldview/chunk-plans/W2_chunk_plan.md`; not runtime content. |
| `worldview/chunk-plans/W3_chunk_plan.md` | Archived as source material. | `.archive/worldview/chunk-plans/W3_chunk_plan.md`; not runtime content. |
| `worldview/chunk-plans/W4_chunk_plan.md` | Archived as source material. | `.archive/worldview/chunk-plans/W4_chunk_plan.md`; not runtime content. |
| `worldview/chunk-plans/W5_chunk_plan.md` | Archived as source material. | `.archive/worldview/chunk-plans/W5_chunk_plan.md`; not runtime content. |
| `worldview/chunks/W1_chunks.json` | Migrated by `npm run corpus:import`. | 17 `corpus_patterns` rows, slugs `worldview-w1-001` through `worldview-w1-017`. |
| `worldview/chunks/W2_chunks.json` | Migrated by `npm run corpus:import`. | 16 `corpus_patterns` rows, slugs `worldview-w2-001` through `worldview-w2-016`. |
| `worldview/chunks/W3_chunks.json` | Migrated by `npm run corpus:import`. | 32 `corpus_patterns` rows, slugs `worldview-w3-001` through `worldview-w3-032`. |
| `worldview/chunks/W4_chunks.json` | Migrated by `npm run corpus:import`. | 17 `corpus_patterns` rows, slugs `worldview-w4-001` through `worldview-w4-017`. |
| `worldview/chunks/W5_chunks.json` | Migrated by `npm run corpus:import`. | 15 `corpus_patterns` rows, slugs `worldview-w5-001` through `worldview-w5-015`. |
| `worldview/long-form/W1_foundation_models_as_enterprise_os.md` | Archived after chunk migration. | `.archive/worldview/long-form/W1_foundation_models_as_enterprise_os.md`; canonical rows come from chunk JSON. |
| `worldview/long-form/W2_future_of_knowledge_work.md` | Archived after chunk migration. | `.archive/worldview/long-form/W2_future_of_knowledge_work.md`; canonical rows come from chunk JSON. |
| `worldview/long-form/W3_erp_in_the_ai_era.md` | Archived after chunk migration. | `.archive/worldview/long-form/W3_erp_in_the_ai_era.md`; canonical rows come from chunk JSON. |
| `worldview/long-form/W4_software_and_consulting_restructuring.md` | Archived after chunk migration. | `.archive/worldview/long-form/W4_software_and_consulting_restructuring.md`; canonical rows come from chunk JSON. |
| `worldview/long-form/W5_abarva_consulting_displacement.md` | Archived after chunk migration. | `.archive/worldview/long-form/W5_abarva_consulting_displacement.md`; canonical rows come from chunk JSON. |
| `worldview/pinecone-ready/W1_pinecone.json` | Archived; Pinecone path retired. | `.archive/worldview/pinecone-ready/W1_pinecone.json`; Azure AI Search is canonical. |
| `worldview/pinecone-ready/W2_pinecone.json` | Archived; Pinecone path retired. | `.archive/worldview/pinecone-ready/W2_pinecone.json`; Azure AI Search is canonical. |
| `worldview/pinecone-ready/W3_pinecone.json` | Archived; Pinecone path retired. | `.archive/worldview/pinecone-ready/W3_pinecone.json`; Azure AI Search is canonical. |
| `worldview/pinecone-ready/W4_pinecone.json` | Archived; Pinecone path retired. | `.archive/worldview/pinecone-ready/W4_pinecone.json`; Azure AI Search is canonical. |
| `worldview/pinecone-ready/W5_pinecone.json` | Archived; Pinecone path retired. | `.archive/worldview/pinecone-ready/W5_pinecone.json`; Azure AI Search is canonical. |
| `worldview/research-notes/W1_research.md` | Archived as source material. | `.archive/worldview/research-notes/W1_research.md`; not runtime content. |
| `worldview/research-notes/W2_research.md` | Archived as source material. | `.archive/worldview/research-notes/W2_research.md`; not runtime content. |
| `worldview/research-notes/W3_research.md` | Archived as source material. | `.archive/worldview/research-notes/W3_research.md`; not runtime content. |
| `worldview/research-notes/W4_research.md` | Archived as source material. | `.archive/worldview/research-notes/W4_research.md`; not runtime content. |
| `worldview/research-notes/W5_research.md` | Archived as source material. | `.archive/worldview/research-notes/W5_research.md`; not runtime content. |
| `worldview/research-notes/source_catalog.md` | Archived as source material. | `.archive/worldview/research-notes/source_catalog.md`; not runtime content. |
| `worldview/synthesis/citation_audit.md` | Archived as source material. | `.archive/worldview/synthesis/citation_audit.md`; not runtime content. |
| `worldview/synthesis/cross_thesis_coherence.md` | Archived as source material. | `.archive/worldview/synthesis/cross_thesis_coherence.md`; not runtime content. |
| `worldview/synthesis/expanded_scope.md` | Archived as source material. | `.archive/worldview/synthesis/expanded_scope.md`; not runtime content. |
| `worldview/synthesis/quality_gate_report.md` | Archived as source material. | `.archive/worldview/synthesis/quality_gate_report.md`; not runtime content. |
| `worldview/synthesis/retrieval_infrastructure_decision.md` | Archived as source material. | `.archive/worldview/synthesis/retrieval_infrastructure_decision.md`; not runtime content. |
| `worldview/synthesis/sentinel_worldview_grounding_training_plan.md` | Archived as source material. | `.archive/worldview/synthesis/sentinel_worldview_grounding_training_plan.md`; not runtime content. |
| `worldview/synthesis/sentinel_worldview_training_addendum.md` | Archived as source material. | `.archive/worldview/synthesis/sentinel_worldview_training_addendum.md`; not runtime content. |
| `worldview/synthesis/voice_consistency_check.md` | Archived as source material. | `.archive/worldview/synthesis/voice_consistency_check.md`; not runtime content. |

The import uses Azure PG-generated UUIDs for `corpus_patterns.id`; the deterministic idempotency key is `corpus_patterns.slug`. A successful non-dry-run import resolves each row by the slug listed above, writes version 1 snapshots, generates embeddings through `callModel`, and uploads the published records to Azure AI Search.

## Deferred Sweep Decisions

Coordinator decision on 2026-05-23: do not broaden the P1 PR into every cross-zone deletion/rewrite. The files below remain content-as-code after P1 and must be migrated or deleted in the follow-up sweep PR before P6 starts.

| Path | Decision | Follow-up target |
| --- | --- | --- |
| `src/data/knowledge/contract-benchmarks.ts` | Deferred; migrate or delete. | `corpus_patterns` with category `industry-benchmark` or `corpus_overlays` where overlay-specific. |
| `src/data/knowledge/crossIndustry.ts` | Deferred; migrate or delete. | `corpus_patterns` / `corpus_overlays`. |
| `src/data/knowledge/failure-patterns.ts` | Deferred; migrate or delete. | `corpus_patterns`. |
| `src/data/knowledge/finserv.ts` | Deferred; migrate or delete. | `corpus_overlays` for financial-services overlays. |
| `src/data/knowledge/genome-patterns.ts` | Deferred; migrate or delete. | `corpus_patterns`. |
| `src/data/knowledge/industry-benchmarks.ts` | Deferred; migrate or delete. | `corpus_patterns` with category `industry-benchmark`. |
| `src/data/knowledge/peer-outcomes.ts` | Deferred; migrate or delete. | `corpus_patterns` / telemetry-derived read model. |
| `src/data/knowledge/regulatory.ts` | Deferred; migrate or delete. | `corpus_overlays` linked to relevant patterns. |
| `src/data/knowledge/retail.ts` | Deferred; migrate or delete. | `corpus_overlays` for retail overlays. |
| `src/data/knowledge/scoring.ts` | Deferred; audit as logic versus content. | Delete content constants; retain only scoring logic if needed. |
| `src/data/knowledge/vendor-outcomes.ts` | Deferred; migrate or delete. | `corpus_patterns` / Source-owned vendor data layer. |
| `src/lib/knowledge/synthetic-datasets.ts` | Deferred; migrate `KNOWLEDGE_DOCS`. | `corpus_patterns` category `industry-benchmark`; delete TS const after migration. |
| `src/data/apexretail/benchmarks.ts` | Deferred; migrate or delete. | Client-private corpus or P2 client substrate. |
| `src/data/firstcapital/benchmarks.ts` | Deferred; migrate or delete. | Client-private corpus or P2 client substrate. |
| `src/data/meridian/benchmarks.ts` | Deferred; migrate or delete. | Client-private corpus or P2 client substrate. |
| `src/data/arcturus/industry.ts` | Deferred; migrate or delete. | Client-private corpus or P2 client substrate. |
| `src/lib/programs/expert-kernel/domain/function-pack-registry.ts` | Deferred; migrate or delete. | `corpus_overlays` / future framework overlay records keyed by client vertical. |
| `src/lib/programs/expert-kernel/domain/function-pack-context-binding.ts` | Deferred; migrate or delete. | Runtime resolver should query corpus overlays instead of in-code packs. |
| `src/lib/programs/expert-kernel/domain/function-pack-types.ts` | Deferred; audit as type-only. | Delete if only supporting retired content path. |
| `intelligence/seeds/archetype-phase-deliverable-matrix.json` | Deferred; migrate or delete. | `corpus_patterns` if content, otherwise P2/P6 seed substrate. |
| `intelligence/seeds/tenant-portfolios/apexretail.json` | Deferred; migrate or delete. | P2 client substrate seed. |
| `intelligence/seeds/tenant-portfolios/arcturus.json` | Deferred; migrate or delete. | P2 client substrate seed. |
| `intelligence/seeds/tenant-portfolios/meridian.json` | Deferred; migrate or delete. | P2 client substrate seed. |

The follow-up sweep must also grep for residual content-shaped exports named like `*Patterns`, `*Benchmarks`, `*FunctionPack`, and `*KnowledgeDocs`, plus long string constants holding claim, evidence, counterargument, synthesis, or regulatory overlay text outside the approved in-code agent posture prompts.
