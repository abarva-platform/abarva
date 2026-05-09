# Knowledge Corpus Remediation Tracker

Date: 2026-05-09

Purpose: provide one source of truth for what is complete, what is only partially complete, and what remains from the knowledge-corpus remediation report. This tracker covers the full outcome, not only Wave 1.

Status legend:

- Done: merged to `main`, QA/CI passed, and no known follow-up is required for that specific slice.
- Partial: design or scaffolding exists, but runtime behavior, persistence, QA, or content coverage is incomplete.
- Not started: no merged implementation or reviewed design artifact in `main`.
- Deferred: intentionally held for a later wave because an upstream dependency must land first.

## Executive Status

The full report remediation is not complete.

Wave 1 foundation is complete and merged. The broader goal, making Nexus, Sentinel, and Atlas use a persisted consultant-grade pattern intelligence layer at runtime, is still in progress.

Current truth:

- Canonical schema and normalization foundation: Done.
- Pattern inventory and duplicate-risk visibility: Done.
- Persistence decision: Done; canonical corpus data must be persisted.
- Persisted canonical corpus system of record: Done.
- Backfill preview: PR-A2 complete and CI-green.
- Runtime pattern-first retrieval in agents: Not started.
- Large industry corpus expansion: Deferred until persistence and retrieval are in place.
- End-to-end validation that agents retrieve and use patterns: Not started.

## Merged Evidence

| PR | Status | Merge commit | Outcome |
| --- | --- | --- | --- |
| [#1823](https://github.com/anandsundaram-hash/abarva/pull/1823) | Done | `6aba77bfbdae9f50c73319804981c541d403d2f7` | Canonical industry AI pattern contract and source mapping. |
| [#1824](https://github.com/anandsundaram-hash/abarva/pull/1824) | Done | `0f8a7118ea14617ea467e6e3795181f9d3d97fb5` | Pattern crosswalk inventory and duplicate-risk report. |
| [#1826](https://github.com/anandsundaram-hash/abarva/pull/1826) | Done | `8a040c560d91d65ea569c9e7fe4c8e70c1a4ea78` | Canonical enum normalizers and tests. |
| [#1827](https://github.com/anandsundaram-hash/abarva/pull/1827) | Done | `cc8ac37c4b2e73587bbb1714be9c39621da3f309` | Canonical pattern draft builder and tests. |
| [#1828](https://github.com/anandsundaram-hash/abarva/pull/1828) | Done | `a18fe1a89ea3266f69217ac6987f536f696eaacf` | Pattern-first retrieval design blueprint. |
| [#1829](https://github.com/anandsundaram-hash/abarva/pull/1829) | Done | `c3f91db922188c1178ba9a405f7648adca7a359a` | Wave 1 execution summary. |
| [#1831](https://github.com/anandsundaram-hash/abarva/pull/1831) | Done | `c93fa0fa06b6e2dbe7552c6aa65d8aef1f752d65` | Persistence decision locked: canonical corpus must be persisted. |

## Execution Ledger

| Slice | PR | Branch / worktree | Agent owner | Files changed | Validation run | DB migration/backfill status | Open issues | Next slice | Gate status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-A1 Persisted Canonical Corpus Schema | [#1835](https://github.com/anandsundaram-hash/abarva/pull/1835) Add persisted canonical corpus schema | `knowledge/persisted-canonical-corpus-schema-2026-05-09` / `/tmp/nexus-kc-a1` | DB/Persistence | `supabase/migrations/20260513150000_canonical_industry_ai_patterns.sql`; `src/lib/intelligence/canonical/persistence-contract.ts`; `src/lib/intelligence/canonical/persistence-contract.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_PERSISTENCE_READ_CONTRACT_2026-05-09.md`; tracker | `git diff --check`; `npx eslint src/lib/intelligence/canonical/persistence-contract.ts src/lib/intelligence/canonical/persistence-contract.test.ts`; `npm test -- --runInBand src/lib/intelligence/canonical/persistence-contract.test.ts`; `npm run test:behaviors -- --runInBand`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | Additive migration only. No backfill writes. Authenticated read-only RLS; service-role write path. DB application pending normal migration deployment. | Backfill not executed by design; runtime readers not wired yet. | PR-A2 Backfill Preview | green |
| PR-A2 Backfill Preview | [#1836](https://github.com/anandsundaram-hash/abarva/pull/1836) Add canonical corpus backfill preview | `knowledge/canonical-corpus-backfill-preview-2026-05-09` / `/tmp/nexus-kc-a2` | Corpus migration | `src/scripts/intelligence/preview-canonical-corpus-backfill.ts`; `src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_PREVIEW_2026-05-09.md`; `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`; `package.json`; tracker | `git diff --check`; `npx eslint src/scripts/intelligence/preview-canonical-corpus-backfill.ts src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `npm test -- --runInBand src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `npx tsc --noEmit --pretty false`; `npm run intel:canonical-corpus:preview` with configured env file; `npm run build`; GitHub CI green before merge | Dry-run only. No DB writes. Read-only DB inspection included 28 `pattern_packs` and 40 `genome_patterns`; preview produced 271 rows. Backfill execution pending. | Preview found 11 canonical id collisions, 255 rows missing provenance, and 40 rows with unsupported quantitative claims. These must be handled before write execution. | PR-A3 Runtime Pattern Index | green |

## Full Report Outcome Tracker

| Workstream | Status | Evidence in `main` | What remains |
| --- | --- | --- | --- |
| Phase 1 audit of existing corpus/schema | Partial | Wave 1 artifacts reference the audit findings; crosswalk inventory is merged. | The requested `docs/build/KNOWLEDGE_CORPUS_AUDIT_2026-05-09.md` is not present in `origin/main` and should be merged or superseded by this tracker plus a reviewed audit doc. |
| Canonical industry AI pattern framework | Done | `CANONICAL_INDUSTRY_AI_PATTERN_CONTRACT_2026-05-09.md`; `industry-ai-pattern.ts`. | Final canonical id review workflow and owner assignment remain open. |
| Source-to-target mapping | Done | `PATTERN_SOURCE_TO_TARGET_MAPPING_2026-05-09.md`. | Mapping must be kept current as new sources are added. |
| Crosswalk inventory | Done | `PATTERN_CROSSWALK_INVENTORY_2026-05-09.md`; generated JSON inventory. | Needs scheduled regeneration after schema/content changes. |
| Duplicate-risk report | Done | `PATTERN_DUPLICATE_RISK_REPORT_2026-05-09.md`. | Actual merge/deprecation decisions are not done. |
| Canonical enum normalization | Done | `normalizers.ts`; `normalizers.test.ts`; alias rules doc. | Runtime source data is not rewritten, by design. |
| Canonical draft builders | Done | `build-canonical-pattern.ts`; `build-canonical-pattern.test.ts`. | Builders expose drafts only; they do not persist canonical records. |
| Persistence architecture decision | Done | PR #1831; Wave 1 summary and retrieval docs updated. | Implementation of the persisted system of record remains. |
| Persisted canonical corpus table/view | Done | PR #1835 adds additive table, RLS/read contract, tests, and docs. | DB migration application follows normal deployment process. |
| Canonical corpus backfill | Preview complete in PR-A2 | PR #1836 previews deterministic payloads and reports collisions/gaps. | Do not execute writes until canonical id collisions, provenance gaps, and unsupported claim flags are reviewed. |
| Runtime canonical pattern index | Not started | Design only in retrieval blueprint. | Build index from persisted source of record, with source-code/DB transition adapters as needed. |
| Nexus pattern-first retrieval | Not started | Design only. | Update Nexus program/chat routes so patterns are retrieved after tenant/move/evidence and before synthesis. |
| Sentinel evidence/pattern gap checks | Not started | Design only. | Add checks for missing evidence, artifacts, KPIs, guardrails, failure-mode mitigation, and tenant-pattern contradictions. |
| Atlas value/KPI grounding | Not started | Design only. | Separate projected/tracked/verified value and require baseline/measurement/provenance before quantified claims. |
| `corpusPatterns` hydration | Not started | Design only. | Update context broker to populate `corpusPatterns` and handle explicit no-match states. |
| Warning handling | Not started | Design only. | Resolve behavior for `WARNING_CORPUS_PENDING`, `WARNING_VECTOR_PENDING`, and `WARNING_WORLDVIEW_PENDING`. |
| User-visible source basis/confidence | Not started | Design only. | Show source basis, confidence, missing fields, and unsupported claim flags in agent responses/tool outputs. |
| Keyword fallback when vector is unavailable | Not started | Design only. | Deterministic field-first fallback ranking and fallback-mode caveats. |
| Phase-specific Nexus training framework | Not started | Existing older docs may be adjacent, but no report-specific `NEXUS_PHASE_TRAINING_FRAMEWORK_2026-05-09.md` is merged. | Create consultant-grade phase training manual tied to canonical patterns and Strategic Moves gates. |
| Industry coverage matrix | Not started | No report-specific coverage matrix is merged. | Create matrix for Retail, Financial Services, Healthcare across front/middle/back office. |
| Large industry/function pattern expansion | Deferred | Existing corpus has partial coverage. | Wait until persistence and runtime retrieval exist; then add reviewed content packs. |
| Pattern QA validation scripts | Partial | Normalizer and draft-builder unit tests exist. | Add corpus-wide validation for canonical fields, KPIs, data requirements, provenance, unsupported quantitative claims, and sample retrieval queries. |
| Runtime retrieval sample-query QA | Not started | None. | Validate sample queries against actual retrieval results, not just docs. |
| DB mutation/content migration | Deferred | No Wave 1 DB mutation. | Requires additive persistence design and review before any content backfill. |

## Current Counts From Wave 1 Inventory

Source: `docs/knowledge-corpus/generated/pattern-crosswalk-inventory.json`.

| Source system | Count |
| --- | ---: |
| `pattern_seed` | 186 |
| `generated_pattern_manifest` | 17 |
| `pattern_packs` | 28 |
| `genome_patterns` | 40 |
| `phase_packs` | 6 |
| `deliverable_registry` | 15 |
| `knowledge_source_doc` | 16 |

Industry coverage in the inventory:

| Industry | Objects |
| --- | ---: |
| `cross_industry` | 204 |
| `retail` | 77 |
| `healthcare` | 31 |
| `financial_services` | 16 |
| `energy` | 4 |
| `public_sector` | 1 |
| `other` | 8 |

Duplicate-risk summary:

| Risk | Objects |
| --- | ---: |
| high | 22 |
| medium | 192 |
| low | 94 |

## Completion Gates

The remediation is complete only when all gates below are green:

1. Persisted canonical corpus store or approved persisted view exists.
2. Canonical records can be regenerated/backfilled deterministically from source systems.
3. Nexus retrieves canonical patterns before synthesis.
4. Sentinel checks evidence, guardrails, KPIs, artifacts, and failure modes against canonical patterns.
5. Atlas separates projected, tracked, and verified value using canonical KPI/value fields.
6. `corpusPatterns` is hydrated in the context broker.
7. Source basis, confidence, missing fields, and unsupported quantitative claims are visible to users or agent tooling.
8. Retrieval sample queries return relevant patterns with confidence and provenance.
9. Corpus-wide validation passes for required fields, KPI minimums, data requirements, artifacts/workshops, provenance, and unsupported quantitative claims.
10. Retail, Financial Services, and Healthcare have reviewed front-office, middle-office, back-office, and cross-functional pattern depth.

## Recommended Next PR Train

1. `knowledge/persisted-canonical-corpus-schema-2026-05-09`
   - Add additive persisted canonical corpus table or view design/migration.
   - No content backfill yet unless reviewed in the PR.
2. `knowledge/canonical-corpus-backfill-preview-2026-05-09`
   - Add deterministic dry-run backfill/preview from current sources into canonical records.
   - Produce diff/count/provenance report before any write.
3. `knowledge/runtime-pattern-index-2026-05-09`
   - Build runtime index/read API from the persisted canonical source of record.
4. `knowledge/nexus-pattern-first-retrieval-2026-05-09`
   - Wire Nexus retrieval before synthesis and hydrate `corpusPatterns`.
5. `knowledge/sentinel-atlas-pattern-grounding-2026-05-09`
   - Add Sentinel evidence-gap checks and Atlas value/KPI grounding.
6. `knowledge/corpus-qa-validation-2026-05-09`
   - Add corpus-wide validators and sample retrieval QA.
7. `knowledge/industry-coverage-matrix-2026-05-09`
   - Add reviewed coverage matrix before expanding content.
8. `knowledge/industry-pattern-content-wave-1-2026-05-09`
   - Add deeper industry/function content only after persistence, retrieval, and validators are in place.

## Stop/Report Conditions

Stop and report before claiming completion if:

- persistence exists only as generated JSON or in-memory state
- a runtime agent still synthesizes domain advice without retrieving canonical patterns first
- `corpusPatterns` remains empty for domain-specific move questions
- sample retrieval queries have not been tested
- content is added before duplicate-risk and provenance handling are resolved
- quantitative claims are present without source basis and confidence rationale
- DB writes are required but migration/backfill review has not happened
