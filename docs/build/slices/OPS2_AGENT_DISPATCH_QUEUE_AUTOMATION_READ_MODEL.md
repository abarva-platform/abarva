# OPS2 - Multi-Agent Dispatch Queue Automation Read Model

## Purpose

OPS2 lands a deterministic, file-pure read model over the dispatch queue
manifest at `docs/build/agent-dispatch-queue.json`. It exposes the canonical
lifecycle vocabulary, normalized item shape, ready/blocked filters, a
deterministic batch recommender, and a totals-reconciling summary so that the
founder, integration agent, and downstream UI surfaces share one honest view of
the dispatch queue.

This slice is read-only. No agents are spawned, no model providers are invoked,
and no shell, network, or migration calls are made.

## What changed

- `src/lib/ops/agent-dispatch-queue.ts` (new)
  - Canonical state tuple `DISPATCH_QUEUE_STATES` covering the seven lifecycle
    states: `proposed`, `ready`, `blocked`, `in_progress`, `completed`,
    `failed`, `deferred`.
  - Lane, priority, and block-reason vocabularies as readonly tuples.
  - Types: `DispatchQueueItem`, `DispatchQueueState`, `DispatchQueueSummary`,
    `DispatchQueueRecommendation`, `DispatchQueueBlockReason`.
  - Helpers: `listDispatchQueueItems`, `getDispatchQueueItemsByState`,
    `getReadyDispatchItems`, `getBlockedDispatchItems`, `recommendNextBatch`,
    `summarizeDispatchQueue`.
  - Reads the canonical JSON synchronously through `readFileSync` +
    `path.join(process.cwd(), ...)`. Normalizes the on-disk shape (`status`,
    `dependsOn`, `laneType`) into the stable view-model (`state`,
    `dependencies`, `sourceLane`, `targetAgent`).
  - Every output item carries
    `createdFrom: 'deterministic_dispatch_queue_read_model'`.
- `src/__tests__/integration/ops/agent-dispatch-queue.test.ts` (new)
  - Asserts the JSON file parses, exposes a non-empty source, schemaVersion 1,
    and at least 5 items.
  - Asserts the canonical state vocabulary contains all 7 states and every
    item state in the seed is valid.
  - Asserts `getReadyDispatchItems` returns only ready items.
  - Asserts `getBlockedDispatchItems` returns only blocked items each carrying
    a canonical `blockReason`.
  - Asserts `recommendNextBatch` is deterministic, ordered by priority,
    conflict risk, dependency count, then id, and honors the maxItems cap.
  - Asserts `summarizeDispatchQueue` reconciles `byState`, `byLane`,
    `byPriority`, and `blockedReasonCounts` totals against `totalItems`,
    `readyCount`, and `blockedCount`.
  - Module hygiene: no Sentinel / Atlas / Nexus / Agent / Source / Auth /
    Supabase imports; no `Date.now`, `Math.random`, `new Date`, `fetch`; no
    `child_process`, `execSync`, `spawnSync`; no `spawn(`, `exec(`, or
    `new Agent(` patterns; no Anthropic / OpenAI runtime; no fabricated dollar
    amounts.
- `docs/build/slices/OPS2_AGENT_DISPATCH_QUEUE_AUTOMATION_READ_MODEL.md`
  (this file).
- `docs/build/build-slices.json` - appends the OPS2 entry with status
  `code_complete` and bumps top-level `lastUpdated` to `2026-04-26`.
- `docs/build/production-readiness.json` - unions notes on the
  `validation_qa` and `production_deployment` components, bumps top-level
  `lastUpdated` to `2026-04-26`, and conservatively preserves all existing
  statuses (no promotions).

## What is explicitly out of scope

- No agent runtime spawning, scheduling, or orchestration.
- No model gateway calls, no Anthropic / OpenAI / Cohere / Databricks runtime.
- No CI / Vercel / GitHub polling, no live deploy verification, no
  observability ingestion.
- No persistence of dispatch state - the JSON file remains the canonical
  deterministic seed, owned by the founder and integration agent.
- No UI surface - this slice is the read model only. UI / API surfaces will
  build on top in later slices.
- No mutation of `agent-dispatch-queue.json` itself in this slice; the existing
  manifest is consumed as-is.

## Why it is safe

- The module imports only `fs` (`readFileSync`) and `path` (`join`) from
  Node's standard library.
- All outputs are derived synchronously from the JSON file; identical inputs
  produce byte-equal outputs across calls.
- No side effects, no global state, no network, no shell, no spawning.
- Every emitted item is tagged
  `createdFrom: 'deterministic_dispatch_queue_read_model'` to make the
  provenance unambiguous.
- The companion integration test enforces these invariants by reading the
  source file as text and pattern-matching against forbidden imports and
  patterns.

## How to re-run

```sh
cd /Users/anand/Projects/nexus-big-ops2
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/ops/agent-dispatch-queue.test.ts
npm run build
```

## Production readiness impact

- `validation_qa`: notes UNIONed with an entry acknowledging that OPS2 lands
  the deterministic dispatch queue read model and an integration suite
  covering shape, normalization, ready/blocked filters, deterministic batch
  recommendation, summary reconciliation, and module hygiene. Status is
  preserved (no promotion); `nextAction` is conservatively appended without
  overwriting prior wording.
- `production_deployment`: notes UNIONed with an entry acknowledging that the
  OPS2 read model surfaces a deterministic dispatch queue view but does not
  poll Vercel, deploy, or invoke any production runtime. Status is preserved
  (still `blocked` until live deploy / CI / observability lands).
- No status promotions. Conservative-status policy from the OPS1 operating
  model is preserved.
