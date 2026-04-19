# AbarVa · Full Handoff Manifest for Claude Code

**Date:** April 19, 2026
**Session context:** Extending AbarVa platform from Pack 10 (Tower Shell, live on prod) toward investor-demo readiness. Four new packs drafted — hand this manifest + the four pack docs to Claude Code in sequence.

---

## The four packs

| # | Pack | Purpose | Effort | File |
|---|---|---|---|---|
| A | **Nexus Depth** | Natural conversation, 4-choice affordance with free-type fallback, Maestro memory layer | ~1-2 days | `abarva-pack-nexus-depth.md` |
| B | **Industry Knowledge Layer** | 39 data sources ingested across 4 tiers (government, frameworks, academic/vendor, curated news), retrieval merge with citation format, refresh worker | ~5-7 days | `abarva-pack-industry-knowledge-layer.md` |
| C | **Intelligence Graph** | 14-node reasoning graph, 6 Cypher traversal queries, graph-extraction pipelines per source type, agent retrieval integration | ~3-4 days | `abarva-pack-intelligence-graph.md` |
| D | **Agent Interface Principles** | 10 interaction principles (streaming stages, citation pills, entity pills, micro-viz, trace drawer, anticipation, delight, specificity enforcement) | ~3-4 days | `abarva-pack-agent-interface.md` |

**Combined effort:** ~13-17 days at 1 engineer. Some phases run in parallel across worktrees.

---

## Execution order

```
Week 1 ──────────────────────────────────────────────
  Worktree α · Pack A · Nexus Depth (2 days)
  Worktree β · Pack B phases 1-5 · Ingest all 39 sources (4 days)

Week 2 ──────────────────────────────────────────────
  Worktree α · Pack C · Intelligence Graph (3 days, depends on B Phase 1)
  Worktree β · Pack B phase 6 · Retrieval merge (1 day)
  Worktree β · Pack B phase 7 · Refresh + maintenance (1 day)

Week 3 ──────────────────────────────────────────────
  Worktree α · Pack D · Agent Interface Principles (3 days)
  Merge everything to main
  Demo pass on all 3 demo clients
```

Principle: packs A + B run in parallel from day 1. C depends on B Phase 1 (migration) only — can start as soon as that merges. D benefits from C (entity pills, delight traversal need graph populated), but its first three principles (Specificity, Citations, Trace Drawer) deliver 70% of value and can start in parallel too.

---

## Dependencies (explicit)

- Pack A → standalone, no dependencies
- Pack B Phase 1 (migration + retrieval architecture) → standalone
- Pack B Phases 2-5 (data ingestion) → depend on B Phase 1
- Pack B Phase 6 (retrieval merge) → depends on B Phases 2+ (at least Tier 1 loaded)
- Pack C → depends on B Phase 1 migration; graph populates richer as Phases 2-5 complete
- Pack D Principle 2 (citations) → depends on B Phase 6
- Pack D Principle 3 (entity pills) → depends on C (graph populated)
- Pack D Principle 10 (delight) → depends on C + 3+ completed engagements with triggered patterns

Everything else in Pack D is independent.

---

## Pre-flight questions for Anand

Before Claude Code starts, confirm:

1. **Embedding model:** Voyage-3 (cheaper, ~2% better retrieval) or OpenAI text-embedding-3-large (you likely already have the key)?
2. **Pinecone plan:** current starter will handle ~500K vectors across new global namespaces; confirm no upgrade needed unless Tier 4 news grows fast.
3. **Neo4j Aura tier:** current Pro Trial expires May 2, 2026. Confirm continuation (Pack C needs graph to keep running).
4. **Haiku budget:** Maestro extractor (~$0.20/month) + topic classifier during ingestion (~$5 one-time) + anticipation (~$5/month per active user) — all trivial. Confirm OK.
5. **APOC availability on Aura:** Pack C Phase E (graph visualization) uses `apoc.path.subgraphAll`. If not available on your tier, fallback is manual multi-hop Cypher (documented in pack).

---

## Bundled cleanup items (do in any worktree, before ship-all)

These are the outstanding items from prior sessions. Bundle into Pack A worktree early:

**1 · Delete forbidden client rows.** Run diagnostic first, then delete empty ones:
```sql
SELECT c.id, c.name, count(uc.id) AS use_cases, count(e.id) AS engagements
FROM clients c
LEFT JOIN use_cases uc ON uc.client_id = c.id
LEFT JOIN engagements e ON e.client_id = c.id
WHERE c.name IN ('CommonSpirit Health','First Capital Financial','HP Inc','MD Anderson','Meridian Health System')
GROUP BY c.id, c.name;
```

If all empty:
```sql
BEGIN;
DELETE FROM clients
WHERE name IN ('CommonSpirit Health','First Capital Financial','HP Inc','MD Anderson','Meridian Health System')
  AND id NOT IN (SELECT DISTINCT client_id FROM use_cases WHERE client_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT client_id FROM engagements WHERE client_id IS NOT NULL);
COMMIT;
```

**2 · Add forbidden-name guard.** New constant `FORBIDDEN_CLIENT_NAMES` in `src/lib/config/naming.ts` — reject any client insert where name matches. Add equivalent check for use cases, engagements, seed scripts. Forbidden list:

```typescript
export const FORBIDDEN_CLIENT_NAMES = [
  'CADE', 'Accenture', 'Dell', 'McKinsey', 'Deloitte', 'BCG', 'Bain',
  'Huron', 'Navigant', 'Presbyterian', 'PHS', 'MD Anderson',
  'CommonSpirit Health', 'HP Inc',  // unwanted seeds
].map(s => s.toLowerCase());
```

**3 · Remove menu items.** Search the codebase for any nav config containing "Solutions" or "AI Value Realization" or "AI Value". Delete those entries. The current menu should be exactly: Dashboard · Engagements · Data setup · User setup · Intelligence · Control Tower · Admin.

**4 · Delete dead Solutions-library code.** Files and directories to remove (if they exist):
- `src/app/solutions/`
- `src/components/solutions/`
- `src/lib/solutions/`
- `db/migrations/*solutions*.sql` (only if not yet run on prod; if run, add a drop migration instead)
- Any `solutions` table references in seed scripts

**5 · Fix Value card formatter bug.** The Tower Value card shows `$22 verified` — missing k/M suffix. Check `src/components/tower/ValueCard.tsx` or equivalent formatter. Use the same `formatCurrency` helper that renders `$286k` correctly on Projected.

**6 · Rotate Neo4j API Client Secret.** Manual: console.neo4j.io → Account Details → API Credentials → Rotate. Update `.env.local` and Vercel env vars.

---

## Success criteria — when this is "done"

Anand runs a new engagement on a non-demo client. In the first 5 turns:

- Nexus listens, asks probing questions, offers 4 choices including free-type
- Nexus cites `[hhs_hipaa_security_rule § 164.308]` with a clickable pill that opens the chunk
- Nexus references a specific peer benchmark with a micro-viz
- "Why did Nexus say this" drawer shows retrieval + graph trace
- Nexus recognizes Anand from prior engagements ("fourth engagement, third industry...")
- At some point, a delight moment surfaces a cross-connection
- No mentions of MD Anderson, McKinsey, or any other forbidden name anywhere in the UI

When all of that holds, this is ready for Shail.

---

## What to paste to Claude Code

Start the handoff session with:

> "I have four build packs to execute in a coordinated rollout. Packs A, B, C, D — Nexus Depth, Industry Knowledge Layer, Intelligence Graph, Agent Interface Principles. Execution plan and dependencies are in `abarva-full-handoff-manifest.md`. Start with Pack A on one worktree and Pack B (phases 1-5) on another in parallel. Before beginning, answer the pre-flight questions in the manifest and ask me for clarification on any. Bundle the cleanup items from the manifest into Pack A worktree. When each pack's phase completes, commit with the message specified in the pack doc and summarize what shipped. Ready?"

Then paste the four pack files + this manifest into the Claude Code session.

---

## Out of scope for this session

- Pack 11 (Tier 1 API integrations — Anthropic, OpenAI, Microsoft Graph, cloud billing)
- Pack 12-15 (Control Tower intelligence, governance, forecasting, auto-engagement triggering)
- Real-time web search during conversations
- Analyst data licensing (Gartner, Forrester, IDC)
- Per-user RLS via Clerk JWT (Migration 021 — still blocked pending Clerk config)

These come after the demo. Don't let Claude Code scope-creep into them.
