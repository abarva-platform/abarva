# 2026-05-30-azure-corpus-context-contract — Azure Corpus Context Contract

## Release ID

`2026-05-30-azure-corpus-context-contract`

## Status

`candidate`

## Plain-English Summary

This release makes Sentinel and Nexus explicitly tenant-context and industry-corpus aware across Intelligence, Moves, and Source. It also removes active runtime reliance on Supabase, Pinecone, and Neo4j SDK paths in the touched retrieval, upload, graph, classification, seed, and demo-data surfaces, routing those reads and writes through the Azure/Postgres data-plane compatibility layer instead.

## Layer Impact

- Agent reasoning layer: Adds a module context contract so answers must start from approved tenant facts, use industry corpus patterns as decision intelligence, and distinguish tenant evidence from general patterns.
- Intelligence module: Injects the contract into Sentinel synthesis so responses produce decision-ready outputs, uncertainty, evidence gaps, AI-insertion controls, and module-appropriate next decisions.
- Moves / Nexus module: Injects the contract into Nexus composition so Move shaping produces fundable/killable artifacts, business case elements, gates, unsafe-to-fund conditions, and Tower handoff signals.
- Source module: Injects the contract into Source synthesis so sourcing outputs include RFI/RFP/BAFO material, contract clauses, AI/data obligations, adoption telemetry, exit rights, productivity guarantees, and savings proof.
- Data plane: Converts touched active retrieval/upload/graph/classifier/demo/seed paths to Azure Postgres-compatible adapters.

## Client Applicability

- All clients: The context contract and Azure-backed runtime paths apply to all tenants and industries.
- Specific clients: SkyHarbor, Apex, Meridian, Northstar, and First Capital benefit when their tenant substrate and industry corpus records are loaded.
- Internal only: Corpus generation handoff and prompt docs guide internal seed generation.
- Public/demo only: None.
- Feature flag: None introduced.

## Changes Included

- PR: https://github.com/anandsundaram-hash/abarva/pull/2582
- Commits: `022251774` and follow-up merge from `main`.
- New contract: `src/lib/agent/module-context-contract.ts`.
- Runtime wiring: `src/lib/intelligence/ask/synthesizer.ts`, `src/lib/nexus/composer.ts`, `src/app/api/source/synthesis/route.ts`.
- Azure-only touched paths: `src/lib/agent/retrieval.ts`, `src/lib/retrieval.ts`, `src/lib/data/ingest.ts`, `src/lib/programs/classifier.ts`, `src/lib/intelligence/retrieval/*`, `src/lib/intelligence/genome-query-broker.ts`, `src/lib/graph/*`, `src/scripts/demo-data/generate.ts`, and `src/scripts/seed/*`.
- Documentation: `docs/build/CORPUS_GENERATION_PROMPT_MASTER.md`, `docs/build/CORPUS_GENOME_PATTERNS_HANDOFF.md`.

## QA / Validation

- Focused Jest passed: `npx jest src/lib/agent/__tests__/module-context-contract.test.ts src/lib/agent/__tests__/retrieval-tenant-leak.test.ts src/lib/intelligence/__tests__/genome-query-broker.test.ts src/app/api/health/__tests__/route.test.ts src/app/api/chat/step/__tests__/route-boundary.test.ts src/app/api/intelligence/query/__tests__/route-boundary.test.ts src/lib/knowledge/__tests__/client-vector-namespace.test.ts --runInBand`.
- Runtime bundle check passed with esbuild across Sentinel/Nexus/Source/Tower upload/retrieval/graph compatibility paths.
- Direct active-path provider import grep passed with zero active `@supabase`, Pinecone SDK, or Neo4j driver imports under `src/app`, `src/lib`, `src/scripts/demo-data`, and `src/scripts/seed`.
- ESLint on branch-diff TypeScript files passed with warnings only; warnings are existing unused-variable debt in seed and pattern helper files.
- `git diff --check` passed.
- Full local `npx tsc --noEmit --pretty false` is blocked in this worktree by install-state missing modules that are already declared in `package.json`: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

Merge PR #2582 after CI and Vercel previews are green. Production rollout is a normal Vercel deployment from `main`; no data migration is required by this release. Corpus seed scripts remain manually runnable through the existing seed pipeline and should be loaded per tenant/vertical under the Azure private data-plane runbook.

## Rollback Plan

Revert PR #2582 to restore prior retrieval, synthesis, upload, graph, and seed behavior. No database rollback is required for the runtime contract. If corpus seed scripts have been executed, rows are idempotent upserts and can be re-run after rollback/roll-forward; do not delete tenant corpus rows without a tenant-specific data-plane rollback ticket.

## Audit Evidence

- PR #2582: https://github.com/anandsundaram-hash/abarva/pull/2582
- Focused Jest output: 7 suites passed, 29 tests passed after merge with `main`.
- Active-path provider import grep: zero matches for Supabase/Pinecone/Neo4j SDK imports in checked runtime and seed paths.
- esbuild runtime bundle output: completed successfully for Sentinel, Nexus, Source synthesis, Tower seed-demo, upload, graph, classifier, and corpus retrieval entrypoints.
- CI evidence to attach after GitHub checks complete.

## Known Gaps

- Full typecheck depends on a complete dependency install; local worktree currently lacks packages already declared in `package.json`.
- Some compatibility files and tests retain legacy names such as `pinecone-client` or `Supabase Preview`; this release disables active provider use in touched paths but does not rename every historical compatibility filename.
- Existing database column names such as `pinecone_namespace` may remain as schema compatibility fields; this release does not perform schema renames.
