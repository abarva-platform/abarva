# Knowledge Identity And Count Contract

Date: 2026-04-29
Status: Draft contract for implementation PRs
Owner: Knowledge-layer governor

## Purpose

AbarVa now has more than one knowledge universe in the app. That is acceptable only if each universe has a clear identity contract and count label. This document defines the names, IDs, count semantics, and merge rules so corpus growth, generated manifests, graph retrieval, and app surfaces do not silently double-count or cross-link the wrong objects.

## Canonical Terms

| Term | Meaning | Current count label | Source of truth |
| --- | --- | ---: | --- |
| Deterministic corpus | Source-controlled typed primitives loaded by `loadCorpus()` | 198 primitives | `src/lib/intelligence/loader.ts` |
| Corpus patterns | `PatternSeed` records inside the deterministic corpus | 149 patterns | `loadCorpus().patterns` |
| Sourcing corpus | Sourcing-domain `PatternSeed` records loaded through `SOURCING_PATTERNS` | 101 patterns | `src/lib/intelligence/seed-patterns-sourcing.ts` |
| Generated design manifest | Browsable design-pack manifest generated from the older `Patterns` source directory | 17 patterns | `src/lib/intelligence/generated/pattern-manifest.json` |
| Genome graph patterns | Graph-store pattern nodes used by graph retrieval | DB-dependent | Neo4j/Cypher or future Postgres graph tables |
| Knowledge sources | Ingested document/source chunks used by Ask retrieval | DB-dependent | Supabase `knowledge_sources` / `knowledge_chunks` |

Do not use the generic phrase `patterns` in status surfaces without the universe qualifier. Use `corpus patterns`, `manifest patterns`, `sourcing patterns`, or `graph patterns`.

## Identity Fields

Every knowledge resolver should preserve these fields when available:

| Field | Example | Required for | Notes |
| --- | --- | --- | --- |
| `corpusId` | `PAT-SRC-CAT-CRM-001` | Deterministic corpus | Primary key for `PatternSeed` records |
| `slug` | `enterprise-crm-platform-sourcing-playbook` | Cross-surface display and fallback matching | Stable, human-readable bridge |
| `manifestId` | `pattern_ai_use_case_portfolio` | Generated design manifest | Not equivalent to `corpusId` |
| `graphId` | Graph node ID or code | Graph retrieval | Provider-specific until graph contract is implemented |
| `sourceFile` | `seed-patterns-sourcing-categories.ts` | Debugging and audit | Should not leak into customer UI |
| `tenantId` | `tenant-demo` or customer tenant ID | Runtime/private data | Required for observed instances, never for global seeds |

## Resolver Rules

1. Prefer exact `corpusId` for deterministic corpus records.
2. Prefer exact `manifestId` only inside generated-manifest routes.
3. Use `slug` only as a bridge between universes; log when slug bridging happens.
4. Never assume `manifestId === corpusId`.
5. Never merge manifest and corpus counts by adding them together without de-duplicating by a declared key.
6. Treat graph nodes as separate identities until they carry an explicit `corpusId` or `slug` bridge.
7. Tenant-observed instances must reference a global seed by `corpusId` plus tenant-scoped instance ID.

## Count Labels

Use these labels in docs, APIs, and health views:

| Label | Definition |
| --- | --- |
| `corpusPrimitiveCount` | Patterns + signals + solutions + contradictions from `loadCorpus()` |
| `corpusPatternCount` | PatternSeed records from `loadCorpus()` |
| `sourcingPatternCount` | PatternSeed records in `SOURCING_PATTERNS` |
| `manifestPatternCount` | Entries in `generated/pattern-manifest.json` |
| `graphPatternCount` | Pattern nodes in the graph store |
| `loadedAt` | Time the count snapshot was produced |
| `sourceBasis` | `source_code_seed`, `generated_manifest`, `database_graph`, `database_source`, or `mixed` |

## CI And Report Expectations

A future integrity script should print a single JSON object with these fields:

```json
{
  "loadedAt": "2026-04-29T00:00:00.000Z",
  "corpusPrimitiveCount": 198,
  "corpusPatternCount": 149,
  "sourcingPatternCount": 101,
  "manifestPatternCount": 17,
  "manifestCorpusSlugOverlap": 12,
  "manifestCorpusIdOverlap": 0,
  "staleCopyFindings": []
}
```

The script should fail CI only for structural violations:

- Duplicate IDs inside the same universe.
- A solution or contradiction reference to a missing corpus ID.
- A route mapping to a missing corpus pattern.
- A manifest bridge that claims ID equivalence without an explicit mapping.

The script should warn, not fail, for stale marketing/docs copy unless that copy appears in operator-facing product UI.

## Runtime Surface Labels

| Surface | Required source label |
| --- | --- |
| `/api/chat/agent` | `sourceBasis=source_code_seed`, with stage/category retrieval source shown in traces |
| `/api/intelligence/ask` | `sourceBasis=mixed`, with retriever-specific provenance |
| Knowledge Fabric health | `sourceBasis=source_code_seed`, counts from `loadCorpus()` |
| Public patterns | `sourceBasis=curated_seed_subset` |
| Generated manifest browsing | `sourceBasis=generated_manifest` |

## Migration Guidance

Near term:

- Keep `loadCorpus()` as the deterministic corpus source of truth.
- Keep generated manifest as a named design-pack manifest, not the canonical full corpus.
- Add route-level tests for any mapping from stage/category/request text to corpus IDs.

Medium term:

- Add a resolver that can return `{ corpusId, slug, manifestId, graphId, sourceBasis }` for a pattern-like object.
- Backfill manifest entries with `corpusId` only after verified slug/content matching.
- Move graph identity toward the Postgres graph contract rather than defaulting to Neo4j-specific identity.

Do not perform destructive consolidation until the resolver contract is implemented and tested.

## Open Decisions

- Whether the generated manifest remains a design-pack artifact or becomes generated from `loadCorpus()`.
- Whether graph nodes should use `corpusId` as primary key or keep provider-native IDs with a bridge table.
- Whether stale docs copy should fail CI or stay as warning-only until operator UI is affected.
