# Knowledge Evidence Ledger Contract

Document: `docs/build/KNOWLEDGE_EVIDENCE_LEDGER_CONTRACT.md`
Status: contract only
Scope: evidence, citation, ledger identity, quality gates, and migration approval boundaries
Runtime impact: none
Migration impact: none in this slice

## 1. Purpose

This contract defines how knowledge-layer claims, graph edges, agent outputs, and decision artifacts must cite evidence. It complements the knowledge graph contract by specifying the ledger discipline that prevents fabricated citations, cross-tenant evidence leaks, and unsupported decision-grade claims.

The evidence ledger is the canonical record of why a claim can be shown, recommended, escalated, or blocked.

## 2. Current Repo Grounding

| Area | Current convention | Contract implication |
| --- | --- | --- |
| `Source` type | `src/lib/intelligence/types.ts` defines source id, type, name, detail, confidence, URL, and as-of date. | Ledger entries must be renderable as `Source` objects. |
| Retrieval claims | Graph, structured, vector, and emergent retrieval all return claim text with a source and confidence. | Every ledger-backed claim should be retrievable in this same shape. |
| Evidence table | `supabase/migrations/20260421152501_intelligence_layer_core.sql` defines `evidence` with `client_id`, source id, entity linkage, observed/as-of dates, confidence, scope ids, and payload. | Use this table concept as the first evidence authority. |
| Knowledge sources | `supabase/migrations/024_knowledge_sources.sql` defines `knowledge_sources` and `knowledge_chunks` for public/licensed sources and chunks. | Citations should prefer source/chunk ids over prose-only references. |
| Signal evidence chains | `supabase/migrations/20260421151800_signal_evidence_chains.sql` exists for signal-to-evidence chaining. | Signal citations should preserve chain identity rather than flattening to text. |
| Contradictions | `supabase/migrations/20260421152700_contradiction_engine_foundation.sql` adds evidence ids, resolution evidence ids, source counts, confidence, and detection metadata. | Contradiction outputs require opposing evidence and resolution evidence separation. |
| Seed source basis | `SourceBasisRef` in `seed-types.ts` carries type, label, URL, as-of, and note. | Seed evidence can be normalized into ledger-compatible citation records. |
| Azure private data plane | Azure docs state raw customer data remains in customer-owned storage; AbarVa receives manifests/citation locators. | The ledger stores citation manifests, not raw private documents, unless explicitly approved. |

## 3. Ledger Principles

- No claim without source posture: every claim is `cited`, `structural`, `seeded`, `inferred`, `aggregate`, `missing`, or `not_evidence_backed`.
- No fake evidence ids: UI and docs must not invent `E-###` style ids unless those ids resolve to a real ledger entry.
- No raw private data by default: private data plane evidence is represented by manifest, locator, hash, and policy state.
- Tenant first: tenant evidence rows require `client_id`; public knowledge sources are separate from tenant evidence.
- Decision-grade requires traceability: evidence id, source locator, as-of date, confidence, and approval posture must be present.
- Missing evidence is a first-class ledger state, not a reason to fabricate a citation.
- Model-proposed citations are not accepted until deterministic validation or human review resolves them.

## 4. Ledger Entry Taxonomy

| Entry kind | Scope | Description | Decision-grade allowed? |
| --- | --- | --- | --- |
| `source_document` | tenant/public/licensed | Document-level authority such as uploaded file, vendor doc, regulation, report, or web source. | Yes, if locator and access policy are valid. |
| `source_chunk` | tenant/public/licensed | Citation-resolvable section, page, span, or chunk. | Yes. |
| `source_basis_ref` | seed/public | Normalized `SourceBasisRef` from seed/corpus metadata. | Usually supporting only until reviewed. |
| `structured_row` | tenant | Pointer to a source table row such as use case, application, spend row, KPI, contradiction, upload, or dataset. | Yes for structural claims. |
| `signal_chain` | tenant | Link between a signal firing and evidence chain. | Yes if source chain resolves. |
| `graph_edge_support` | tenant/public/aggregate/seed | Evidence supporting a graph edge. | Yes when cited or structural. |
| `contradiction_support` | tenant | Evidence for one side of a contradiction. | Yes, side-specific. |
| `resolution_support` | tenant | Evidence that a contradiction or gate was resolved. | Yes. |
| `benchmark_support` | public/aggregate | Benchmark source, cohort, methodology, and as-of. | Yes if cohort privacy threshold passes. |
| `private_manifest` | tenant | Private data plane manifest with locator/hash/policy, no raw bytes. | Yes if boundary policy permits. |
| `missing_evidence` | tenant/seed | Explicit gap record. | No; can block or warn only. |
| `model_proposed` | tenant/public | Citation proposed by an LLM or agent. | No until validated. |

## 5. Citation Contract

Every citation must be resolvable to a ledger entry or explicitly declared missing.

Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `ledger_id` | yes | Stable id. Human-friendly aliases are allowed only if they resolve. |
| `client_id` | tenant entries | Null only for public corpus / aggregate entries. |
| `scope` | yes | `tenant`, `public`, `licensed`, `aggregate`, `seed`, or `private_manifest`. |
| `entry_kind` | yes | From taxonomy above. |
| `source_type` | yes | Align with `Source.type` when rendered. |
| `source_id` | when available | `knowledge_sources.id`, `source_key`, upload id, table row id, or external source id. |
| `chunk_id` | citation chunks | Required for span/page/chunk-level citations. |
| `locator` | yes for non-structural | URL, page, section, object path, row pointer, or private manifest pointer. |
| `title` | yes | Human-renderable label. |
| `publisher` | when available | Required for public/licensed sources where known. |
| `observed_at` | event/fact evidence | When the fact was observed. |
| `as_of_date` | time-sensitive evidence | Required for benchmarks, market data, policies, vendor posture, regulations, and stale-risk claims. |
| `confidence_level` | yes | `high`, `medium`, or `low`. |
| `quality_state` | yes | See quality states. |
| `access_state` | yes | See access states. |
| `license_class` | public/licensed | Align with `knowledge_license_class` when source comes from knowledge sources. |
| `content_hash` | private or parsed evidence | Required when raw content is not stored in the ledger. |
| `redaction_state` | tenant/private | Required when evidence may include sensitive data. |
| `created_by` | yes | `system`, `human`, `agent_proposed`, `migration`, or `seed`. |
| `review_state` | yes | `unreviewed`, `validated`, `approved`, `rejected`, or `superseded`. |

## 6. Quality States

| State | Meaning | Can support decision-grade output? |
| --- | --- | --- |
| `raw` | Ingested or referenced, not parsed or checked. | No. |
| `parsed` | Text/metadata extracted. | No, unless structural only. |
| `classified` | Type, topic, tenant, and source posture assigned. | Limited. |
| `citation_ready` | Locator resolves to exact source/chunk/span. | Yes for supporting claims. |
| `quality_checked` | Confidence, freshness, license/access, and redaction checked. | Yes. |
| `approved_for_evidence` | Explicitly approved for evidence use. | Yes. |
| `approved_for_agent_use` | Allowed in model context bundles. | Yes, within scope. |
| `stale` | As-of / refresh window expired. | Warning only unless waiver exists. |
| `revoked` | Access or approval revoked. | No. |
| `rejected` | Invalid, hallucinated, irrelevant, or disallowed. | No. |
| `missing` | Required evidence is absent. | No; blocks or warns. |

## 7. Access States

| State | Meaning |
| --- | --- |
| `public` | Public corpus citation. |
| `licensed` | Citation can be used under license constraints. |
| `tenant_internal` | Tenant-confidential evidence. |
| `private_manifest_only` | Only manifest/locator/hash leaves customer boundary. |
| `restricted_scope` | Requires `reasoning_scope_id` or `disclosure_scope_id`. |
| `legal_privileged` | Requires privileged-context handling and explicit approval. |
| `revoked` | Must not be shown or used. |

## 8. Informational Ledger Shape

The following shape is informational only. It is not a migration in this slice.

```sql
-- Informational only. Requires separate migration approval.
create table knowledge_evidence_ledger (
  id text primary key,
  client_id uuid null references clients(id) on delete cascade,
  scope text not null check (scope in ('tenant', 'public', 'licensed', 'aggregate', 'seed', 'private_manifest')),
  entry_kind text not null,
  source_type text not null,
  source_id text,
  chunk_id text,
  related_entity_type text,
  related_entity_id text,
  title text not null,
  summary text,
  publisher text,
  locator jsonb not null default '{}'::jsonb,
  observed_at date,
  as_of_date date,
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  quality_state text not null,
  access_state text not null,
  license_class text,
  content_hash text,
  redaction_state text,
  reasoning_scope_id text,
  disclosure_scope_id text,
  created_by text not null,
  review_state text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table knowledge_claim_evidence_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid null references clients(id) on delete cascade,
  claim_key text not null,
  claim_kind text not null,
  ledger_id text not null references knowledge_evidence_ledger(id) on delete restrict,
  support_role text not null check (support_role in ('supports', 'contradicts', 'qualifies', 'resolves', 'missing_required', 'methodology')),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  unique (client_id, claim_key, ledger_id, support_role)
);
```

## 9. Claim Binding Rules

A rendered intelligence claim must carry one of these evidence postures:

| Posture | Required binding |
| --- | --- |
| `decision_grade` | At least one `approved_for_evidence` or `quality_checked` ledger entry, plus no unresolved required missing evidence. |
| `citation_ready` | At least one `citation_ready` ledger entry. |
| `structural` | Source table row pointer and `client_id` filter. |
| `seed_backed` | Seed id, version, and source basis if present; UI must say deterministic seed. |
| `aggregate_backed` | Aggregate ledger entry with cohort threshold and methodology. |
| `inferred` | Deterministic rule id/version plus input ledger ids. |
| `model_proposed` | Proposed source pointer, not decision-grade until validated. |
| `missing_required` | Missing evidence ledger entry; output must warn or block. |

## 10. Graph Edge Evidence

Graph edges consume the ledger through `graph_edge_support` or general ledger links.

Rules:

- `SUPPORTED_BY` edges must point to ledger ids or source/chunk ids that resolve into ledger ids.
- `CONTRADICTS` edges must identify side A and side B evidence separately.
- `CO_OCCURS_WITH` aggregate edges must include methodology and cohort threshold evidence.
- `IMPLIES` and `ESCALATES_TO` seed edges must retain seed version and cannot be shown as observed unless evidence exists.
- Edges with `origin = model_proposed` cannot trigger agent missions, gates, or executive claims until reviewed.

## 11. Agent and Artifact Output Rules

Nexus, Sentinel, Atlas, and Steward outputs must not collapse evidence posture into generic prose.

Required behavior for future runtime implementation:

- Agent response payloads include source arrays compatible with `Source`.
- Artifact sections that make claims carry `claim_key` values linked to ledger ids.
- Unsupported claims are either removed, downgraded to hypothesis, or paired with a missing-evidence entry.
- Contradiction narratives show evidence on each side and separate resolution evidence.
- Executive summaries can cite aggregates only when cohort threshold and methodology are present.
- Model-generated citations remain `model_proposed` until deterministic resolver checks the source id / chunk id / locator.

## 12. Private Data Plane Evidence

For Azure private data plane alignment, the ledger stores evidence manifests, not raw private data by default.

Private manifest fields should include:

- Boundary request id.
- Customer-controlled source system id.
- Dataset id or object path alias.
- Locator shape: table/row/column, file/page/section, blob path hash, or query snapshot id.
- Content hash or row hash.
- Observed/as-of timestamp.
- Redaction state.
- Access approval state.
- Expiry/revocation timestamp if applicable.

AbarVa control plane must not require raw private bytes to resolve whether a claim has evidence; it should be able to verify the manifest, locator, hash, approval state, and citation label.

## 13. Azure Migration Alignment

| Concern | Contract |
| --- | --- |
| Control Plane Postgres | Stores ledger metadata, public source records, aggregate evidence, graph evidence links, and artifact/agent claim links. |
| Private Data Plane Postgres | Stores customer-local dataset metadata and private evidence manifests when customer-owned. |
| Blob / ADLS | Stores raw uploaded/private files; ledger points by manifest and hash unless raw storage is explicitly approved. |
| Azure AI Search | Stores searchable chunks and vector/hybrid indexes; result metadata must include ledger/source/chunk ids and tenant filters. |
| Key Vault | Holds connection strings, search keys, model keys, and boundary signing material; no ledger entry stores secrets. |
| Model Gateway | Receives only approved source snippets / manifests according to `access_state` and `approved_for_agent_use`. |
| Cutover | Supabase to Azure migration must preserve ledger ids, source keys, chunk ids, evidence links, content hashes, and access/review states. |

## 14. Cutover Gates

| Gate | Required evidence |
| --- | --- |
| Ledger schema approval | Separate migration approval names ledger tables, indexes, RLS, and backfill plan. |
| Citation resolver | Given a ledger id, resolver can return renderable source label, locator, confidence, and access posture. |
| No fake ids | Search verifies no user-facing `E-###` or equivalent placeholder appears unless resolvable. |
| Tenant isolation | Tenant A cannot resolve tenant B ledger entries, private manifests, source rows, chunks, or graph support links. |
| Public/licensed separation | Public corpus and licensed sources carry license/access class and do not impersonate tenant evidence. |
| Private boundary | Private data plane evidence resolves by manifest/hash without moving raw bytes into control plane. |
| Staleness behavior | Stale evidence warns or blocks according to claim type. |
| Model proposal quarantine | Model-proposed citations cannot become decision-grade without validation. |
| Azure parity | Azure AI Search results and Azure Postgres ledger records preserve ids, tenant filters, and source labels. |
| Rollback ready | New ledger enforcement can be disabled without deleting existing evidence/source rows. |

## 15. Requires Separate DB Migration Approval

The following are explicitly out of scope for this docs-only slice and require separate approval:

- Creating `knowledge_evidence_ledger` or `knowledge_claim_evidence_links`.
- Changing `evidence`, `knowledge_sources`, `knowledge_chunks`, `signal_evidence_chains`, `contradictions`, or artifact tables.
- Backfilling ledger entries from seed files, source basis refs, public corpus, uploads, signal chains, graph edges, or private manifests.
- Adding RLS policies, tenant membership policies, or access-scope enforcement.
- Adding citation resolver functions, triggers, or materialized views.
- Migrating Pinecone metadata to Azure AI Search fields.
- Adding raw private document persistence to the control plane.
- Promoting model-proposed citations to validated citations without a validation workflow.

## 16. Open Blockers

- No approved ledger schema migration exists in this slice.
- Current evidence concepts are spread across `evidence`, `knowledge_sources`, `knowledge_chunks`, signal chains, contradiction fields, and seed source basis refs.
- Runtime citation resolver behavior is not standardized by this docs-only change.
- Private data plane manifest enforcement is architecture-aligned but not implemented here.
- Azure AI Search metadata parity must be validated when vector migration work begins.
