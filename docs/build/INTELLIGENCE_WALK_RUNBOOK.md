# Intelligence (Sentinel) Surface · Production Walk Runbook

**Status:** Verification runbook for the Sentinel/Intelligence bundle
(PR-INT-A through PR-INT-F).
**Date:** 2026-04-29
**Purpose:** Step-by-step founder walkthrough to verify the layered
PRs land coherently in production. Replaces the ad-hoc walk for
`SESSION_BRIEF_INTELLIGENCE.md` PR-INT-F.

This runbook complements the automated verification (TypeScript +
ESLint + Jest, all green at PR-INT-E close) with the parts that only
a live browser session can confirm: the chat surface fires the right
tools, the reactive panel materializes the right cards, the agent
voice reads as Sentinel (not Nexus) and so on.

---

## Pre-flight

1. Pull the latest `main` after PR-INT-E merges:
   ```
   git checkout main && git pull origin main
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. Confirm the boundary grep stays empty (load-bearing — any direct
   data-room/vector/graph import from app or agent code is a bug):
   ```
   grep -rn "from '@/lib/knowledge/enterprise-data-room\\b\\|from '@/lib/knowledge/enterprise-data-room-persistence" \
     src/app/ src/lib/agent/
   # Expected: no output

   grep -rn "vector-search-provider-contract\\|graph-provider-contract" \
     src/app/ src/lib/agent/
   # Expected: no output (PR-INT-C/E imports are comment-only)
   ```

---

## Walk

### Step 0 · Sign in

- Navigate to the app, sign in as the admin Clerk test account
  (`anand+clerk_test@abarva.com`, OTP `424242`). The active client
  must resolve to Apex Retail (`apex-retail`) — Sentinel tools rely
  on the broker for tenant-scoped reads.

### Step 1 · Open `/intelligence`

- Confirm the new page header reads **"Ask Sentinel about the
  corpus"** with a mono kicker showing pattern count + active filter.
- Confirm the agent canvas fills the upper viewport (chat ~60% / right
  pane ~35%) and the legacy pattern library is collapsed inside a
  `<details>` accordion below.
- Confirm the right pane shows the **"Sentinel reasoning · live"**
  empty state — librarian voice, citation invitation. NOT Nexus's
  copy.

### Step 2 · Test `search_patterns`

- In the chat textarea, ask:
  ```
  Show me patterns like AI use case portfolio management.
  ```
- Expect Sentinel to call `search_patterns` (visible in the network
  tab as a tool_use turn) and emit one or more `pattern-match`
  artifacts. The right pane should populate with **Sentinel · Pattern
  match** cards inside ~2 seconds of the first chunk arriving.
- Confirm Sentinel's prose references the cards by name, not by raw
  ID ("I matched this to *Analytics Modernization* — see the card on
  your right.").

### Step 3 · Test `pattern_neighborhood`

- Ask:
  ```
  Walk the neighborhood for pattern_ai_use_case_portfolio depth 1.
  ```
- Expect a single `graph-neighborhood` summary card to land in the
  right pane (Sentinel · Graph neighborhood, with topEdges list)
  alongside per-neighbor `pattern-match` cards.
- The summary card should show `nodeCount` / `edgeCount` and respect
  the 8-edge cap when the manifest's `relatedPatternIds` exceeds
  eight.

### Step 4 · Test `evidence_lookup`

- Ask:
  ```
  Cite evidence for vendor lock-in risk for our active programs.
  ```
- Expect `evidence_lookup` to fire and call `SentinelBrokerAdapter`.
  The right pane shows **Sentinel · Evidence** cards (one per
  citation Apex Retail's data room returned), each carrying the
  citation locator + confidence + approval state.
- Open the network panel and confirm the chat request body has
  `surface: "intelligence"` (semantic, sent by AppShell). The route
  canonicalizes it to `"/intelligence"` (URL-shaped) before
  `getRelevantTools` resolves.

### Step 5 · Test `validate_synthesis`

- Paste a synthesis like:
  ```
  Vet this synthesis for me: "We are activating a customer data
  platform programme with a managed-CDP vendor that claims 92%
  identity-resolution match rate against our point-of-sale systems.
  Per pattern playbook v1, this approach achieves measured baseline
  delta within nine months."
  ```
- Expect:
  - `validate_synthesis` is invoked.
  - One or more `pattern-match` cards (CDP-shaped patterns from the
    manifest) land in the right pane.
  - One or more `contradiction-flag` cards land — the CDP
    `Vendor Identity-Resolution Claim vs Source-System Reality`
    template should fire because the synthesis trips the
    `identity resolution` / `match rate` / `vendor` keywords.
  - Quality-gate issues come back in Sentinel's prose (the gate
    JSON is in the tool's data payload; Sentinel narrates it).

### Step 6 · Test the boundary stays clean during real traffic

- Inspect the chat tool turn payloads (network panel).
- Confirm `evidence_lookup` returns a `tenant_key: "apex-retail"`
  in its data payload — that's the broker-side seam, not a direct
  data-room read.
- Confirm none of the tool responses contain raw L4 evidence text;
  the broker default (`allowL4RawContext: false`) blocks raw L4 by
  contract.

### Step 7 · Cross-surface sanity

- Navigate to `/programs`. Confirm Nexus is the agent (not Sentinel).
  AppShell's `DEFAULT_AGENT['programs']` resolves to Nexus; Sentinel
  is `/intelligence`-scoped.
- Navigate to `/intelligence`, then to `/programs/<id>`, then back
  to `/intelligence`. Confirm the chat reset (each surface owns its
  own AtlasPageState; no cross-contamination).

---

## What "passing" looks like

- Layout: Sentinel chat dominant on left; reactive pane on right
  populates with Sentinel-branded cards as tools fire.
- Voice: Sentinel reads as the librarian — terse, citation-first,
  contradiction-aware. Not Nexus's coaching tone.
- Tools: All four (search_patterns, pattern_neighborhood,
  evidence_lookup, validate_synthesis) fire and dispatch their
  artifacts.
- Boundary: No direct data-room/vector/graph import from
  `src/app/**` or `src/lib/agent/**`.

## Known gaps (flagged in PR bodies, not blocking PR-INT-F merge)

- Vector retrieval is keyword-overlap until the broker contract
  grows a `vectorQuery` field
  (`SESSION_BRIEF_INTELLIGENCE.md` Open Decision #2 +
  `GRAPH_VECTOR_READINESS.md` §5).
- Graph traversal beyond `co_applies_with` is keyword-described in
  the artifact card but the manifest only authors `co_applies_with`
  edges today. `contradicts` / `depends_on` / `precedes` arrive as
  the manifest grows.
- Per-pattern detail routes (`/intelligence/patterns/<id>`) exist
  but aren't yet AgentCanvas-shaped. Future PR can mirror the
  list-page reshape.

## Future-pack-copyedit list

(Surfaced from PR-W's evidence-binding tests — out of scope for this
bundle but worth tracking.)

- P1 → P2 phase-pack handoff has minor wording drift; copy-edit
  pass to align `producesForNext` + `requiresFromPrior` literals
  recommended.
