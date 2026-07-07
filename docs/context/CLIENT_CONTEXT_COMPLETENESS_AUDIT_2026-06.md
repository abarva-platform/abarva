# Client Context Completeness Audit — Pipeline-State Diagnosis (Phase 2)

_Live-DB diagnosis 2026-06-10. Classified by EXACT pipeline state per the 11-level taxonomy.
Hard rule: no client is "ready" because chunks/records/facts exist. Only `CONTEXT_BUNDLE_PROVEN` = ready._

## Per-client pipeline-state summary

| Client | Files | Chunks | Records | Facts | Indexed | Retrievable | Citation-ready | Promotion | Agent-ready | Bundle-proven | Overall state | Primary bottleneck |
|---|--:|--:|--:|--:|:--:|:--:|:--:|:--:|:--:|:--:|---|---|
| **Apex Retail** | 42 | 6,497 (embedded) | **0** | **0** | n/a (no facts) | ✗ | ✗ | not_reviewed (6,498) | ✗ | ✗ | **CHUNKS_ONLY** | **fact-extraction gap** |
| **Meridian Health** | 15 | 3,506 (embedded) | 3,503 | 38,640 (active) | ❓ unconfirmed | ❓ unproven | ✅ 100% | not_reviewed (3,548) | ✗ | ✗ | **CITATION_READY_NOT_PROMOTED** | indexing → retrieval → promotion → bundle |
| **Lakeshore Holdings** | 13 | 1,542 (~373 pending) | 179 | 2,949 (active) | ❓ unconfirmed | ❓ unproven | ✅ ~99.6% | not_reviewed (1,542) | ✗ | ✗ | **CITATION_READY_NOT_PROMOTED** (small) + EMBED_INCOMPLETE | embeddings → indexing → registration → promotion → bundle (+ scale) |

> `Indexed = ❓`: the read probe found **no Azure AI Search index** answering for these tenants under the
> tried names (`tenant-context-v1`, `tenant-context`, `enterprise-context-v1`). Index name/existence must be
> resolved in Phase 6 before claiming indexed.

## Apex Retail — dimension detail (CHUNKS_ONLY)
0 records, 0 facts. 6,497 embedded chunks, dominated by `program_inventory` (5,695) — a chunk-heavy seed,
**not** template-extracted facts. Other segments present as chunks only (org_structure 126, it_landscape 96,
it_financials 95, application_portfolio 120, kpi_dictionary 50, vendor_contracts 38+20, sourcing_artifacts 32, …).
- **State:** `CHUNKS_ONLY` across all dimensions.
- **Gap:** fact-extraction / load gap.
- **Fix:** run the governed template-aligned loader (`load-enterprise-context.ts`) on the Apex dataset into
  `enterprise_context_records` + `enterprise_context_facts` (repo has `datasets/apex-retail-synthetic-v1`, 141 files);
  then re-chunk/index from facts so chunks carry record/fact provenance.

## Meridian Health — dimension detail (FACTS rich, citation-ready)
38,640 active facts across **15 dimensions** (all citation-ready): spend_baseline 4,320 · ci_relationships_dependencies
7,428 · cmdb_applications_services 3,360 · facilities_business_units 3,619 · incidents 3,590 · risk_compliance_register
2,730 · changes 2,427 · org_decision_rights 2,016 · slas 1,800 · problems 1,680 · vendors_contract_inventory 1,430 ·
data_domains_stewardship 1,210 · initiative_portfolio 1,140 · renewal_calendar 990 · policies_procedures 900.
- **State:** `CITATION_READY_NOT_PROMOTED` (facts) — pending index/retrieval confirmation.
- **Gap:** indexing gap + tenant/segment **retrieval** gap (memory: ~31% retrieval coverage; CMDB segment-name
  mismatch in `selectTenantEnterpriseSegments`) + promotion gap + bundle gap. **NOT** a content/load gap.
- **Fix:** confirm/run Azure Search indexing of active facts/chunks → fix retrieval tenant+segment filter →
  retrieval+citation proof → promotion eval → context-bundle proof across Moves/Source/Tower/Intelligence.

## Lakeshore Holdings — dimension detail (FACTS present, small; embeddings partial)
2,949 active facts across **13 dimensions** (citation-ready): kpi_metric 800 · cmdb_application 510 · org_role 339 ·
contract 192 · data_asset 192 · integration 160 · initiative 152 · business_capability 126 · risk 102 · configuration_item
211 · business_unit 80 · facility 72 · enterprise_profile 13. Chunks 1,542 with **~373 `pending` embeddings**
(data_estate 16, infrastructure 18, it_financials 67, it_landscape 68, org_structure 20, program_inventory 14,
enterprise_profile 10).
- **State:** `CITATION_READY_NOT_PROMOTED` (small scale) + `EMBED_INCOMPLETE` (chunks partial).
- **Gaps:** embedding-completion gap (373 pending) + indexing gap + retrieval gap + promotion gap + bundle gap +
  **app tenant-registration gap** (no `aliases.ts` entry) + enterprise-worthiness **scale/depth gap** (179 records vs
  Meridian 3,503; e.g. only 13 enterprise_profile, no incidents/changes/problems/slas/spend_baseline dimensions).
- **Fix:** finish embeddings → register canonical tenant alias → index → retrieve/cite proof → promotion → bundle;
  evaluate dimension-depth expansion to reach enterprise-worthy parity.

## Cross-client classification (taxonomy)
- **Apex Retail → state 3 (CHUNKS_ONLY).** Records/facts missing entirely.
- **Meridian Health → state 7→8 boundary (RETRIEVABLE_NOT_CITATION_READY is PASSED; sits at CITATION_READY_NOT_PROMOTED),
  pending state-5/6 confirmation (indexing/retrieval).**
- **Lakeshore Holdings → state 8 (CITATION_READY_NOT_PROMOTED) with a state-5 regression on ~373 chunks (FACTS_COMMITTED_NOT_INDEXED / embed-pending).**

## Acceptance (Phase 2)
No client called "ready" on chunk presence. Apex's chunk corpus is explicitly **not** counted as completeness —
it has zero facts. Meridian/Lakeshore facts are acknowledged but explicitly **not** "ready" absent indexing,
retrieval, promotion, and bundle proof.
