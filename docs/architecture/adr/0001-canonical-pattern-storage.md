# ADR-0001 — Canonical Pattern Storage

**Status:** Proposed
**Date:** 2026-05-29
**Author:** AbarVa Founder + Claude (drafting)
**Decision required by:** Codex execution start of Packet 35 Phase 0

---

## Context

The 2026-05-29 production database audit revealed **three parallel pattern storage locations** in the live Azure Postgres database:

| Storage | State | Purpose | Volume |
|---|---|---|---|
| `canonical_industry_ai_patterns` | Populated | Apparent canonical for industry × function patterns | 312 rows |
| `pattern_packs` | Populated (legacy) | Client-scoped pattern packs | 28 rows |
| `corpus_patterns` | Schema-only (empty) | Apparent newer intended canonical | 0 rows |
| `client_private_patterns` | Schema-only | Per-client private patterns | 0 rows |
| `framework_overlays` | Schema-only | Framework-shaped overlays | 0 rows |
| `corpus_overlays` | Schema-only | Industry-shaped overlay packaging | 0 rows |
| `data_segment_industry_context` | Schema-only | Per-segment industry context | 0 rows |

In addition, **embedding-store overlay content** lives in `enterprise_context_chunks` with `tenant_key + overlay_namespace` tagging — created for the SkyHarbor airline overlay via PR #2378.

This creates ambiguity about:
- Which table is canonical going forward
- Whether the populated 312 patterns are actually retrieved by Sentinel
- Where new generated overlays (retail, healthcare, financial services) should land
- How structured pattern queries interact with vector retrieval

Per Packet 31 §1.4 (Single Source-of-Truth Declarations), this state violates invariant I3 spirit: *"For each domain, exactly one module owns it."*

---

## Decision

**ONE canonical table for industry pattern storage: `corpus_patterns`.**

Rationale:

1. **Name is more accurate.** "Canonical industry AI patterns" was a narrow framing focused on AI use cases. "Corpus patterns" is the broader concept the platform has evolved into.

2. **Schema is the newer intended design.** Whoever authored the `corpus_patterns` schema upgrade clearly designed it as the forward-state. We honor that intent rather than entrench the older table.

3. **Migration is mechanical.** 312 + 28 = 340 rows fit in a single migration with explicit lineage tracking.

4. **Companion tables already exist.** `client_private_patterns`, `framework_overlays`, `corpus_overlays`, `data_segment_industry_context` clearly belong with `corpus_patterns` as a coherent schema family. Promoting `corpus_patterns` consolidates the family.

5. **Retrieval integration is cleaner.** The vector embedding path can read consistently from this family without three parallel lookups.

---

## Detailed Decision

### D.1 — Canonical table definition

`corpus_patterns` is the single source of truth for industry pattern storage.

Every pattern has:
- `id` (UUID) — stable identifier
- `pack_id` — reference to the pack that owns this pattern
- `pack_code` — short code (e.g., `RETAIL.A.1`, `AIRLINE.M.11`)
- `industry` — controlled vocabulary (`retail`, `airline`, `healthcare`, `financial_services`, `energy`, `manufacturing`, `cross_industry`, etc.)
- `super_category` — controlled vocabulary (e.g., `retail_strategy`, `e_commerce`, `omnichannel`)
- `function_area` — controlled vocabulary (legacy field, retained for back-compat with `canonical_industry_ai_patterns`)
- `pattern_name` — human-readable name
- `summary` — one-sentence summary
- `mechanism` — how it works
- `decision_relevance` — why a CXO cares
- `pitfalls` — failure modes
- `industry_exemplars` — anonymized peer references
- `cross_references` — JSONB array of related pattern IDs
- `provenance` — JSONB: source (manual, generated, migrated), source_packet, source_pr, generation_model
- `created_at`, `updated_at`
- `version` — semver-style versioning per pattern
- `status` — `active`, `deprecated`, `superseded`

### D.2 — Companion tables

| Table | Purpose | Relationship |
|---|---|---|
| `corpus_packs` (rename from any existing if needed) | Pack-level metadata | parent of `corpus_patterns` via `pack_id` |
| `corpus_overlays` | Overlay packaging — collection of packs as a deployable unit | many-to-many with `corpus_packs` |
| `corpus_pattern_embeddings` | Vector embeddings for retrieval | 1:1 with `corpus_patterns` via `pattern_id` |
| `client_private_patterns` | Per-client private patterns not part of public corpus | references `corpus_patterns` schema for consistency |
| `tenant_overlay_subscriptions` (rename if needed) | Which tenant subscribes to which `corpus_overlays` | many-to-many |
| `data_segment_industry_context` | Per-segment industry context for substrate-level grounding | separate concern; not deprecated |
| `framework_overlays` | Framework-shaped overlays (vs industry-shaped) | parallel concept; out of scope for this ADR |

### D.3 — Retrieval integration

Sentinel retrieval reads from:

1. **Substrate chunks** in `enterprise_context_chunks` (per-tenant tenant facts) — UNCHANGED
2. **Pattern embeddings** in `corpus_pattern_embeddings` (industry overlays) — NEW canonical path
3. Filtered by:
   - `tenant_overlay_subscriptions` for the requesting tenant
   - `industry` matching tenant's industry + `cross_industry`

The retrieval layer queries both stores, fuses results, scores by relevance, and returns top-K.

**Existing `enterprise_context_chunks` rows with `overlay_namespace` tagging** (from PR #2378 airline work) migrate to `corpus_pattern_embeddings` during Phase 0 execution. The `overlay_namespace` field is retired.

### D.4 — Migration scope

**Phase 0 (this ADR's execution):**

1. Migrate `canonical_industry_ai_patterns` (312 rows) → `corpus_patterns`
   - Preserve original IDs as `provenance.legacy_id`
   - Map `function_area` field directly (column exists)
   - Author or default `super_category` based on `function_area` + `industry`
   - Set `provenance.source = 'migrated_from_canonical_industry_ai_patterns'`
   - Set `status = 'active'`

2. Migrate `pattern_packs` (28 rows, client-scoped) → `corpus_patterns` + `client_private_patterns`
   - Patterns that are industry-applicable → `corpus_patterns` with `status = 'active'`
   - Patterns that are client-specific → `client_private_patterns`
   - Founder + Codex review the 28 rows together to classify

3. Migrate airline overlay chunks from `enterprise_context_chunks` → `corpus_patterns` + `corpus_pattern_embeddings`
   - Parse the airline overlay markdown structure (Packet 31's 184 packs / 2,760 patterns)
   - Insert into `corpus_packs` + `corpus_patterns`
   - Generate `corpus_pattern_embeddings`
   - Subscribe SkyHarbor tenant via `tenant_overlay_subscriptions`
   - **Verify SkyHarbor smoke** still passes (the Packet 30 Phase 1 standard) post-migration

4. Deprecate non-canonical tables
   - `canonical_industry_ai_patterns` — mark as `DEPRECATED` in a view comment, set table to read-only
   - `pattern_packs` — same
   - `enterprise_context_chunks` overlay rows — delete after migration verified

### D.5 — Deprecation policy

`canonical_industry_ai_patterns` and `pattern_packs` enter a **read-only deprecation window:**

- Phase 0 closes with both tables read-only
- 30-day window for any unexpected reads to surface
- After 30 days: tables dropped, data archived in `archives/` for audit trail

During the deprecation window, CI guard fails on any new INSERT/UPDATE to deprecated tables.

### D.6 — Lineage and audit trail

Every migrated row has `provenance` populated with:
- `source` — `migrated_from_canonical_industry_ai_patterns` or `migrated_from_pattern_packs` or `migrated_from_airline_overlay_chunks`
- `legacy_id` — original ID
- `migrated_at` — timestamp
- `migration_pr` — PR number

This enables full audit trail back to the original storage.

### D.7 — Industry discriminator strategy

The `industry` column in `corpus_patterns` is the discriminator. Controlled vocabulary:

- `cross_industry` — applies to all tenants
- `airline` — SkyHarbor, future airline tenants
- `retail` — Apex, future retail tenants
- `healthcare_provider` — Meridian, Northstar, Helix, future provider tenants
- `healthcare_payer` — future payer tenants (PHS PHP)
- `financial_services_banking` — Brindlemark, First Capital, future banking
- `financial_services_insurance` — future insurance tenants
- `energy` — Keystone, future energy tenants
- `manufacturing` — future
- `government` — future
- `education` — future

Per-tenant retrieval = `WHERE industry IN ('cross_industry', tenant.industry)`.

**Sub-industry granularity** (e.g., grocery within retail) handled via `super_category` field, not via additional discriminator columns. Keeps the schema flat.

### D.8 — Where new generated overlays land

Per Packet 35 Wave 1–5 retail authoring:

- All 5,500 retail patterns land in `corpus_patterns` with `industry = 'retail'`
- Tier A (retail core) patterns get `super_category` from controlled vocab (e.g., `retail_strategy`, `e_commerce`, etc.)
- Tier B (format verticals) patterns get the format as `super_category` (e.g., `grocery`, `apparel`)
- Tier C (adjacent industries) patterns split: if pattern is genuinely cross-industry → `industry = 'cross_industry'`; if retail-adjacent only → `industry = 'retail'` with `super_category` indicating adjacency
- Tier D (cross-cutting) patterns → `industry = 'cross_industry'` with super_cat indicating function

Embeddings generate during the authoring pipeline and land in `corpus_pattern_embeddings`.

---

## Consequences

### Positive

1. **One source of truth.** Future Codex executions, future engineers, future Series A due diligence team see one table.
2. **Packet 31 I3 invariant compliance.** ESLint guard can now enforce `corpus_patterns` as the single import target.
3. **Retrieval consistency.** Sentinel always reads from one path; no parallel-system confusion.
4. **Migration enables Packet 35 generation.** New retail/healthcare/financial overlays land cleanly.
5. **Existing investment preserved.** 312 patterns + 28 legacy packs + airline overlay all migrate, none lost.
6. **Audit trail intact.** Provenance fields preserve full lineage.

### Negative

1. **Migration risk.** Bad migration could break SkyHarbor (the only working demo). Mitigation: smoke test SkyHarbor post-migration before deprecating any source.
2. **Schema change blast radius.** Code references to `canonical_industry_ai_patterns` and `pattern_packs` need updating. Mitigation: grep + refactor as part of Phase 0.
3. **Embedding regeneration cost.** Migrating airline overlay chunks may require re-embedding if the chunk shape changes. Mitigation: preserve chunk content verbatim; only re-key by `pattern_id`.

### Neutral

- The deprecated tables stay readable for 30 days. Nothing is destroyed; archival is the floor.

---

## Alternatives Considered

### Alternative 1 — Promote `canonical_industry_ai_patterns` to canonical

**Rejected because:**
- Name is narrower than concept
- Schema may not have the companion tables (`overlays`, `subscriptions`)
- Doesn't honor the intent of the schema upgrade work that created `corpus_patterns`

### Alternative 2 — Keep both tables; use `canonical_industry_ai_patterns` for existing content, `corpus_patterns` for new content

**Rejected because:**
- Two-table dual-read pattern is the exact anti-pattern Packet 31 §1.5 documents (stale dual-store assumption)
- Doubles retrieval complexity forever
- Future engineers won't know which to use

### Alternative 3 — Move everything into `enterprise_context_chunks` with overlay namespace tagging

**Rejected because:**
- Structured pattern metadata (industry, super_category, version, status) loses fidelity in a chunks-only model
- Pattern updates require deleting + re-embedding rather than UPDATE
- Pack-level operations (deprecate a pack, version a pack) become awkward
- Loses the "browseable pattern catalog" capability that becomes a Series A demo artifact

---

## Implementation Steps

1. **Codex audits actual current schemas** of `corpus_patterns` family — what fields exist, what's missing per this ADR
2. **Codex writes migration scripts** in `scripts/migrations/0001-canonical-pattern-storage/`
   - `01-add-missing-fields.sql` — add any fields per D.1 not yet in `corpus_patterns`
   - `02-migrate-canonical-industry-ai-patterns.sql` — populate from old table
   - `03-migrate-pattern-packs.sql` — populate from legacy packs (with founder classification review)
   - `04-migrate-airline-overlay-chunks.sql` — parse + populate from `enterprise_context_chunks`
   - `05-mark-deprecated.sql` — read-only flag on old tables
3. **Codex updates retrieval code** to read from `corpus_patterns` + `corpus_pattern_embeddings`
4. **Codex runs migration in dev/staging first**, verifies SkyHarbor smoke
5. **Production migration** with rolling deploy (per Packet 30 §5.7)
6. **Smoke test SkyHarbor** post-migration; smoke test Apex (cross-industry patterns still retrievable)
7. **Update Packet 35 Phase 1 audit query** to read from `corpus_patterns`
8. **Codex updates Packet 31 §1.4 single-source-of-truth declaration** to name `corpus_patterns` explicitly
9. **Author release record** per Packet 31 §1.2 I8 with `## Audit Evidence` section

---

## Acceptance Criteria

Phase 0 ADR execution complete when:

- [ ] All 312 canonical_industry_ai_patterns migrated with full provenance
- [ ] All 28 pattern_packs migrated (split between corpus_patterns and client_private_patterns per founder classification)
- [ ] All airline overlay chunks migrated to corpus_patterns + corpus_pattern_embeddings
- [ ] SkyHarbor production smoke passes (3 questions return tenant + overlay grounding)
- [ ] Apex production smoke passes (3 questions return tenant + cross-industry grounding)
- [ ] Old tables flagged DEPRECATED, read-only, scheduled for 30-day drop
- [ ] Retrieval code updated to read from canonical path
- [ ] CI guard added: no new INSERT/UPDATE to deprecated tables
- [ ] Packet 31 §1.4 updated to reflect canonical naming
- [ ] Packet 35 Phase 1 audit query updated
- [ ] Release record committed with Audit Evidence

---

## References

- Packet 31 §1.2 I3 (single source of truth invariant) — `docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md`
- Packet 31 §1.4 (Single Source-of-Truth Declarations)
- Packet 31 §1.5 (Anti-Patterns Catalog — "stale dual-store assumption")
- Packet 35 (Retail & Adjacent Corpus packet) — gated on this ADR
- 2026-05-29 production DB audit results
- PR #2378 (airline overlay load) — content to migrate

---

## Status Updates

| Date | Status | Author | Note |
|---|---|---|---|
| 2026-05-29 | Proposed | Anand + Claude | Initial draft |

---

*End of ADR-0001. Awaiting founder approval to authorize Codex Phase 0 execution.*
