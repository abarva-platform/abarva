# 2026-06-09-agent-context-bundle-trace — Trace governed Nexus/Sentinel context bundles

## Release ID

`2026-06-09-agent-context-bundle-trace`

## Status

`candidate`

## Plain-English Summary

Adds an observability spine that records exactly what context each governed
Nexus (Moves) and Sentinel (Intelligence) answer was built from, before Claude
was asked to reason. Every governed response now emits a structured
"context-bundle trace": which tenant it resolved, which tenant facts / corpus
patterns / artifacts were retrieved and put in front of the model, which
objects were eligible but excluded (and why — not reviewed, blocked,
restricted, tenant mismatch, missing policy, low confidence, wrong namespace),
a confidence distribution, a grounding report, and a sha256 hash of the exact
model input. The trace proves Claude was downstream of retrieval and never saw
a raw user-only prompt. It stores IDs and policy decisions only — never raw
prompts, PHI/PII, or source text — and ships a redacted-by-default mode plus a
lab/structured-log fallback when the private Azure database is unreachable.
This is the foundation later slices (golden suites, wisdom rubric, claim /
citation validation, tenant-leakage tests, production verification) build on.

## Layer Impact

- `client-data-lane`: new append-only table `public.agent_context_traces`
  (RLS-scoped per tenant key, immutable by trigger, IDs + hashes only). No
  changes to existing tenant data or retrieval results.
- `global-control-lane`: additive, non-blocking instrumentation on the shared
  Nexus orchestrator/composer and the Sentinel intelligence ask path. The model
  input is unchanged byte-for-byte; emission is fire-and-forget and can never
  alter or fail an answer.

## Client Applicability

- All clients: Yes — trace emission wraps the shared governed answer paths for
  every tenant (Apex, Meridian, Northstar, First Capital, SkyHarbor).
- Specific clients: n/a
- Internal only: Trace data is operations/audit-facing only; not surfaced to
  end users in this slice.
- Public/demo only: n/a
- Feature flag: `AGENT_TRACE_ENABLED` (default on; set `false` to disable),
  `AGENT_TRACE_RETAIN_LABELS` (default off → redacted), `AGENT_TRACE_LOG`
  (default on for the lab/no-DB structured-log fallback).

## Changes Included

- Migration: `supabase/migrations/20260609090000_agent_context_traces_v1.sql`
  (append-only table, RLS, immutability triggers, indexes).
- New module `src/lib/agent-trace/` (`types.ts`, `build.ts`, `redaction.ts`,
  `repository.ts`, `emit.ts`, `index.ts`).
- Instrumentation seams (additive, non-breaking):
  - `src/lib/nexus/composer.ts` + `src/lib/nexus/orchestrator.ts` — capture the
    exact model input and surface `modelInputHash`.
  - `src/app/api/v1/nexus/query/route.ts` — emit the Nexus trace.
  - `src/lib/intelligence/ask/synthesizer.ts` + `src/lib/intelligence/ask/index.ts`
    — forward the model-input hook.
  - `src/app/api/intelligence/ask/route.ts` — emit the Sentinel trace.
- Tests: `src/__tests__/behaviors/agent-trace.test.ts` (16 cases).

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-trace.test.ts` → 16/16 pass.
- `npx tsc --noEmit` → no new type errors in touched files (only 2 pre-existing
  optional-dependency errors in `document-intelligence-layout.ts` and a
  Playwright a11y spec, both unrelated and present on `origin/main`).
- `npx eslint` on all touched files → 0 errors.
- `npm run audit:architecture-rules` → green (no Supabase/Pinecone/Neo4j/Vercel
  runtime deps introduced; Azure/Postgres data plane only; Anthropic reasoning
  path unchanged).
- `npm run release:check -- --base origin/main --head HEAD` → green.
- Live Azure run: NOT executed from this workstation — the private Postgres is
  VNet-only and unreachable from localhost. In that condition the spine falls
  back to redacted structured-log emission; DB persistence is verified by the
  table contract test and must be confirmed once on Azure Container Apps after
  `npm run db:migrate`.

## Rollout Plan

1. Merge to `main` (squash) after CI is green.
2. Apply the migration on the Azure/Postgres data plane via `npm run db:migrate`
   (append-only, additive; safe to run on live).
3. Deploy the merged image to Azure Container Apps. Emission is on by default;
   set `AGENT_TRACE_ENABLED=false` to disable without redeploying code.
4. No traffic shift or data backfill required — traces accrue from first request.

## Rollback Plan

- Fastest: set `AGENT_TRACE_ENABLED=false` (stops all emission immediately; no
  redeploy needed).
- Code: revert the PR. The instrumentation is additive and non-blocking, so
  reverting cannot affect answer content.
- Migration: the table is append-only and isolated; it can be left in place
  (no FK dependents) or dropped with `DROP TABLE public.agent_context_traces`.
  No tenant data is touched by a rollback.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- CI run: Architecture Rules + release:check + behaviors jest.
- Migration replay: `supabase/migrations/20260609090000_agent_context_traces_v1.sql`.
- Trace contract: `src/lib/agent-trace/types.ts` + behavior test output.
- Local test log: 16/16 behavior cases pass (see QA / Validation).

## Context Ingestion Evidence

Not applicable. This slice does not load, parse, stage, embed, or commit any
tenant context/corpus. It observes the retrieval/assembly that already happened
and records IDs + policy decisions only. No Admin Data Loads, Blob staging,
worker queues, parsers, or embeddings are touched.

## Known Gaps

- `validation_status`, `claim_validation_status`, and `tenant_isolation_status`
  are emitted as `pending`; they are populated by PR-3 (wisdom rubric), PR-4
  (claim/citation validation), and the tenant-leakage tests respectively.
- `eligible_datasets`, `missing_context`, and the pattern grounding `namespace`
  are wired through the contract but populated conservatively in this slice;
  PR-4 enriches namespace validation against `industry-scope`.
- The `it_productivity` Sentinel reasoning sub-path and Source/Tower synthesis
  surfaces are not yet instrumented (Intelligence ask + Nexus moves only).
- Live Azure DB persistence is contract-tested but not yet exercised on ACA.
