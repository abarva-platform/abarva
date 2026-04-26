# ADM8 · Agent Readiness Deep Drill

| Field | Value |
|---|---|
| **Slice ID** | ADM8 |
| **Status** | code_complete |
| **Date** | 2026-04-26 |
| **Category** | admin |
| **Risk** | low |

## Goal

Produce a deterministic, static-manifest agent readiness inventory for all four
AbarVa agents (Nexus, Sentinel, Atlas, Steward). Each agent is assessed across
key readiness factors (with status and notes), active blockers, and a recommended
next action. System-level dimensions (mission queue, context, evidence, model
gateway, tool registry) and top platform-level blockers are also captured.

This is a purely static read model — no live agent execution, no model calls, no
DB access — suitable for founder/boardroom demos and operator review.

## Files

### Source

| File | Purpose |
|---|---|
| `src/lib/admin/agent-readiness-deep-drill.ts` | Pure TypeScript read model. Exports types and `buildAgentReadinessDeepDrill()`. |
| `src/components/admin/AgentReadinessDeepDrill.tsx` | React Server Component rendering the full deep drill view. |

### Tests

| File | Purpose |
|---|---|
| `src/__tests__/integration/admin/agent-readiness-deep-drill.test.ts` | Integration tests asserting shape, agent presence, factor structure, determinism, and no-network guarantee. |

## Agents covered

| Agent | Mission type | Readiness | Key blocker |
|---|---|---|---|
| Nexus | orchestration | partial | Live mission queue not wired |
| Sentinel | intelligence | partial | Evidence integration uses seed manifest only |
| Atlas | cost-value | partial | Value ledger slice not complete |
| Steward | governance | partial | Deployment pipeline blocked — no CI integration |

## Guarantees

- `deterministicSourceCaption` is always `'Static manifest — not live agent execution'`
- `generatedAt` is hardcoded to `'2026-04-26'`
- No `Date.now()`, no `Math.random()`, no `fetch()`, no `new Date()` calls
- No model imports, no agent SDK imports, no Supabase imports
- No `'use client'` in either the lib or the component

## Status

`code_complete` — TypeScript clean, Jest tests pass, build verified.
Admin page mount deferred — the existing `/platform/admin/page.tsx` is a complex
client-rendered portal; co-mounting a server component would expand blast radius
beyond ADM8 scope. Component is exported and ready for a dedicated server route
or parent refactor.
