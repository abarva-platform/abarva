# AbarVa · Intelligence v1 · Implementation Prompt

| | |
|---|---|
| **Doc ID** | `INTELLIGENCE_V1_IMPLEMENTATION_PROMPT_2026-05-07` |
| **For** | Claude Code (one prompt, hard scope) |
| **Authority** | Anand · sole sign-off |
| **Companion** | [INTELLIGENCE_DESIGN_INTENT_2026-05-07.md](INTELLIGENCE_DESIGN_INTENT_2026-05-07.md) · [wireframe-intelligence-2026-05-07.html](../../design-canon/wireframe-intelligence-2026-05-07.html) |
| **Status** | Drafted post-design-pass · gated on §0 substrate prereqs |

---

## §0 · PREREQUISITE — substrate readiness (BLOCKER)

This implementation cannot ship correctly until the following substrate state is true. The substrate readiness check on 2026-05-07 found **15 of 44 cells MISSING** across the 4 demo tenants and a hard CHECK constraint that prevents segments 15–23 from being stored at all.

**Before any surface code is written, these substrate prerequisites must be addressed (in this order):**

### 0.1 Drop the 1–14 segment ceiling
- File: `supabase/migrations/20260430121500_apex_setup_data_layer.sql`
- Constraint: `CHECK (family_number BETWEEN 1 AND 14)` on `data_inventory_segments`
- Action: New migration that extends to 1–23, plus the partition table for segments 15–23.
- Without this, Intelligence cannot consume KPI History (15), Stakeholder Notes (16), Peer Benchmarks (17), Financial Model (18), Decision Traces (19), Scenario Library (20), Vendor Intelligence (21), Graph Relationships (22), or AI Transformation (23) through the canonical substrate path. The loose `intelligence_layer_core` tables remain as a fallback but are not segment-keyed.
- Also: extend the segment-id type at `src/lib/knowledge/tenant-data/types.ts:18-34` from 14 IDs to 23.

### 0.2 Resolve the demo tenant set
- Memory says demo tenants are Apex Retail / Arcturus / Meridian. Code has Apex Retail / Meridian Health / First Capital Financial / Keystone Energy. **No Arcturus.**
- Pick three demo tenants and lock the names. Either retire/archive the fourth or rename Keystone → Arcturus everywhere.
- Update `seed-wave-lib.ts` (lines 109–188), tenant key map for the broker boundary (`apex-retail` vs `apexretail` per memory), and the AbarVa wordmark switcher.

### 0.3 Author the missing primary segments
For all 3 locked demo tenants:
- **Segment 16 — Stakeholder Notes.** Synthetic CIO/COO/CFO interview verbatims. ~12-18 entries per tenant, named voices.
- **Segment 18 — Financial Model.** Quarterly P&L plan-vs-actual, program burn rates, IT budget rollups. Minimum 8 quarters of history.
- **Segment 20 — Scenario Library.** 3-4 pre-built scenarios per tenant with modeled outcomes.

### 0.4 Promote three segments from STUB to LOADED
- **Segment 15 — KPI History.** Replace `trendSummary` text fields with ≥13 quarters of quarterly actuals per top KPI.
- **Segment 17 — Peer Benchmarks.** Replace `peerCompanies[]` strings with a metric × peer matrix (8–10 peers × 15–20 metrics).
- **Segment 19 — Decision Traces.** Add dissent tracking, owner attribution, option set, choice rationale per decision (currently telemetry-shaped).

### 0.5 Wire segments 4, 13, 14, 22, 23
Already LOADED for Apex/Meridian; needs parity for the third locked tenant.

**Done state for §0:** Each of the 3 demo tenants has ≥7 of 11 Intelligence-primary segments at LOADED status. Verifier scripts in `src/scripts/seed/verify-{tenant}-intelligence-layer.ts` updated and green.

**Codex coordination.** Per memory rule, before doing any of §0.1–§0.5, run:
```
gh pr list --state open --search "INT-* OR context-broker OR retrieval OR pinecone OR corpus OR substrate OR segment"
```
If Codex has work-in-flight on substrate, pause and align before duplicating.

---

## §1 · Scope (v1)

**What ships in v1:**
- The Intelligence surface at `/intelligence` (and tenant-scoped variant at `/(maestro)/tenant/[tenantSlug]/intelligence`)
- Three states: empty / partial / mature, rendered from real substrate readiness state
- Page header → attention strip (4 tiles) → top synthesis card (mature only) → pattern queue → "what we can't yet see"
- Pattern card with: type chip, topic chip, confidence (numeric 0.78 + filled bar), agent attribution, name (Georgia 19px), 2-3 sentence implication, substrate citations, three affordances
- The **Shape into a Move** affordance — opens `/programs/new?from_pattern={patternId}` (or whichever route is the Strategic Moves originate flow at the time of build) with pre-populated context (pattern name, evidence, agents, suggested phase, suggested Move name, back-link to pattern)
- Filter pills (type, confidence, topic) with deep-link state in URL params
- Confidence indicator: numeric + visual bar (per Q3 best-answer)
- Minimal state preferred over empty state when ≥3 patterns can surface (per Q4 best-answer)

**What does NOT ship in v1 (deferred to v2):**
- Syntheses gallery (a dedicated browse page for all syntheses)
- Agent reasoning trace viewer (the "Document reasoning" affordance opens a stub modal in v1)
- Scenario library exploration
- Peer benchmarking dashboard
- "Surface to Tower" affordance
- "Discuss with sponsor" affordance
- "Add to my watch list" affordance

**Out of scope entirely:**
- Tower references of any kind (per Q5 best-answer; until Tower ships)
- Any chat input on the Intelligence page (§2.2 boundary)
- Any reasoning telemetry console (§2.3 boundary)
- Any configuration affordances (§2.4 boundary)
- Any 23-segment landscape table (§2.5 boundary)
- Any portfolio view that duplicates Strategic Moves or Source (§2.7 boundary)

---

## §2 · Hard scope rules (boundary enforcement)

These rules MUST be enforced in code review. Any PR that violates a rule is rejected.

| Rule | Enforcement |
|------|-------------|
| **R-2.2 No chat input on Intelligence** | Remove `src/app/intelligence/ask/` route entirely; remove `IntelligenceAgentCanvas`, `IntelligenceAgentCanvas`, `IntelligenceCanvasModeTabs` from imports under `/intelligence`. ESLint rule blocks any `<form>` element with text input on `/intelligence` pages. |
| **R-2.3 No reasoning telemetry console** | Remove `src/app/intelligence/failure-modes/` from primary navigation. Failure-mode reference content moves to `/library/failure-modes/` (or stays as orphan reference, not linked from Intelligence). The `J0FailureModeCard`, `J0FailureModeGrid`, `J0AffordanceLink` components are NOT used on the new Intelligence surface. |
| **R-2.4 No configuration on Intelligence** | No Reset, no Load Demo, no Connector config, no Upload, no Save. Read-only surface (except for "Dismiss with reason" which writes a reason; that's per-pattern state, not configuration). |
| **R-2.5 No 23-segment landscape on Intelligence** | The substrate is consumed; never displayed segment-by-segment. The "What we can't yet see" section is allowed to *name* a segment (e.g., "Load segment 18 — Financial Model") but never to enumerate or visualize all 23. |
| **R-2.6 No Tower references** | Grep guard in CI: `rg -n "Tower" src/app/intelligence src/components/intelligence` must return zero matches. Add Tower in v2 only after Tower itself ships. |
| **R-2.7 No portfolio duplication** | The pattern queue is patterns-and-contradictions, not Programs and not Source events. If a card lists a Program by name, it does so as evidence (citation), not as the primary content unit. |
| **R-4.1 Every claim has name + citation + confidence** | Pattern card schema enforces all three. Components reject patterns missing any of the three. |
| **R-4.2 Restraint discipline** | Confidence < 0.5 → primary affordance becomes "Watch — don't shape yet" (not "Shape into a Move"). |
| **R-4.4 Sponsor-grade vocabulary** | Pattern names use plain English (e.g., "NIM compression accelerating"), not analyst jargon. Linter checks: pattern names ≤ 90 chars, no compound noun phrases ≥ 4 nouns deep. |

---

## §3 · File plan

### 3.1 New files
```
src/app/intelligence/page.tsx                         # rewrite — new IA, no chat
src/app/intelligence/loading.tsx                      # already exists — ensure aligned
src/app/intelligence/layout.tsx                       # already exists — verify

src/components/intelligence-v1/
  IntelligencePage.tsx                                # top-level, picks state
  IntelligencePageHeader.tsx                          # eyebrow + h1 + subline
  IntelligenceAttentionStrip.tsx                      # 4 KPI tiles
  IntelligenceTopSynthesisCard.tsx                    # mature-state hero
  IntelligencePatternQueue.tsx                        # filter pills + card list
  IntelligencePatternCard.tsx                         # the card
  IntelligenceWhatWeCantSee.tsx                       # gap section
  IntelligenceEmptyState.tsx                          # state 1
  ShapeIntoMoveButton.tsx                             # the central affordance — also reused by Strategic Moves originate route

src/lib/intelligence/
  patterns.ts                                         # pattern type, query, sort
  contradictions.ts                                   # contradiction detector
  syntheses.ts                                        # cross-substrate synthesis
  shape-into-move.ts                                  # builds originate-flow context
  state-resolver.ts                                   # picks empty/partial/mature
  vocab-linter.ts                                     # sponsor-grade check
```

### 3.2 Files to remove from /intelligence
```
src/app/intelligence/ask/                              # §2.2 violation — chat surface
src/app/intelligence/failure-modes/                    # §2.3 violation — telemetry console
src/app/intelligence/author/                           # editorial workflow ≠ Intelligence
src/app/intelligence/quality/                          # quality lens = telemetry
src/app/intelligence/synthesize/                       # active workflow ≠ Intelligence
src/app/intelligence/topics/                           # browse view, not pattern queue
src/components/intelligence/IntelligenceAgentCanvas.tsx
src/components/intelligence/IntelligenceCanvasModeTabs.tsx
src/components/intelligence/IntelligenceReasoningModeStrip.tsx
src/components/intelligence/J0*.tsx                    # all 4 — reasoning telemetry
src/components/intelligence/IntelligenceQualityLens*.tsx
src/components/intelligence/IntelligenceAuthorPage.tsx
```
Move (don't delete) the failure-mode reference content:
```
src/app/intelligence/failure-modes/  →  src/app/library/failure-modes/
```

### 3.3 Files to KEEP and adapt
```
src/components/intelligence/IntelligenceProvenanceRibbon.tsx     # reuse for citations
src/components/intelligence/IntelligenceSourceBasisPanel.tsx     # reuse for "Document reasoning" stub
src/components/intelligence/EvidenceDatasetDrawer.tsx            # may underlie citations on hover
```

### 3.4 API routes
```
src/app/api/intelligence/patterns/route.ts            # GET — returns ranked patterns/contradictions/syntheses
src/app/api/intelligence/state/route.ts               # GET — returns empty/partial/mature + counts
src/app/api/intelligence/dismiss/route.ts             # POST — record dismiss reason
src/app/api/intelligence/shape-into-move/route.ts     # POST — initiate originate flow with pattern context
```
Remove `src/app/api/intelligence/ask/route.ts` (chat).

### 3.5 Strategic Moves originate hook
Find the existing originate flow (`/programs/new` per agent recon). Add a query-param hydrator that accepts `?from_pattern={patternId}` and:
1. Fetches the pattern via `/api/intelligence/patterns/{id}`
2. Pre-populates Move name (from pattern name suggestion)
3. Pre-populates originating intent (pattern's implication in narrative form)
4. Pre-populates linked substrate (citations attach as Move context)
5. Pre-populates suggested agents (pattern's `agent_attribution`)
6. Sets back-link `originating_intelligence_pattern_id = patternId` on the resulting Move
7. Logs abandonment if the user closes without confirming (telemetry: `intelligence.shape_into_move.abandoned`)

---

## §4 · Acceptance criteria

A PR is mergeable when ALL of the following are true:

### 4.1 Visual fidelity
- [ ] All three states (empty / partial / mature) render and match the wireframe at `docs/design-canon/wireframe-intelligence-2026-05-07.html` within ±8px on 1280px viewport
- [ ] Pattern card has all six anatomy parts (chip, topic, confidence, agent, name, implication, citations, affordances)
- [ ] Top synthesis card only renders when synthesis confidence ≥ 0.75 AND substrate breadth ≥ 4 segments
- [ ] Low-confidence (<0.5) patterns render in the subordinated treatment (cream bg, gray bar, "Watch" affordance)
- [ ] Contradictions sort to top of pattern queue, with red left border

### 4.2 Boundary enforcement (R-2.x rules)
- [ ] `rg -n "Tower" src/app/intelligence src/components/intelligence-v1` returns 0 matches
- [ ] `rg -n "Ask|chat|input.*type=.text." src/app/intelligence/page.tsx` returns 0 matches
- [ ] No imports of `J0FailureModeCard`, `IntelligenceAgentCanvas`, `IntelligenceCanvasModeTabs` from `/intelligence` routes
- [ ] No `<input type="text">` or `<textarea>` on any `/intelligence` page
- [ ] No "Reset", "Load demo", "Upload", "Save", "Configure" CTAs anywhere on `/intelligence`

### 4.3 Shape-into-Move correctness
- [ ] Clicking "Shape into a Move" on any pattern navigates to `/programs/new?from_pattern={id}` with all 6 hydrator fields populated
- [ ] The resulting Move has `originating_intelligence_pattern_id` set in the database
- [ ] Abandonment logs telemetry event `intelligence.shape_into_move.abandoned` with pattern id and dwell time
- [ ] The Strategic Moves originate flow's existing tests still pass with the new hydrator code path

### 4.4 Substrate consumption
- [ ] At least 1 pattern surfaces from each of segments 4, 14, 15, 17, 18, 19, 23 in mature state for the lead demo tenant
- [ ] At least 1 contradiction surfaces from segment 11/21 (vendor) cross-referenced with segment 19 (decisions)
- [ ] The top synthesis card cites ≥ 4 segments
- [ ] "What we can't yet see" lists the substrate gaps that block specific syntheses, with deep-links into Setup

### 4.5 State logic
- [ ] Empty state renders when 0 patterns can surface (confidence-floor check, not a count check)
- [ ] Partial state renders when 1–15 patterns surface OR no synthesis-grade combination is loaded
- [ ] Mature state renders when ≥ 16 patterns surface AND at least one synthesis ≥ 0.75 confidence is ready
- [ ] State transitions are deterministic given substrate state — same substrate → same state, every time

### 4.6 Tests
- [ ] Unit tests for `state-resolver.ts` covering all three transitions
- [ ] Unit tests for `vocab-linter.ts` accepting "NIM compression accelerating" and rejecting "Net interest margin variance trending negative quarter-over-quarter"
- [ ] Behavior test: dismiss with reason persists per-user, doesn't bleed to other users (RLS check)
- [ ] Behavior test: shape-into-move pre-population is correct for at least one pattern of each type (pattern, contradiction, synthesis)
- [ ] Integration test: with seed substrate, the lead demo tenant renders mature state

### 4.7 Performance
- [ ] Time-to-first-pattern (TTFP) on `/intelligence` page < 1.2s on cold load (cached substrate)
- [ ] Pattern queue scrolls at 60fps with 50 cards rendered
- [ ] Filter pip changes do not re-fetch patterns; client-side filter only

---

## §5 · Failure modes

The implementation must explicitly handle each:

| Failure | Symptom | Mitigation |
|---------|---------|------------|
| **F-1 Empty substrate** | Tenant has 0 patterns | Empty state with Setup CTA; no error toast |
| **F-2 Stale substrate** | Last refresh > 24h ago | Subline shows "Last refreshed N hours ago"; no blocking modal |
| **F-3 Pattern with no citations** | Schema violation | Pattern is hidden from queue; logged to `intelligence.violations.missing_citation` |
| **F-4 Confidence missing** | Schema violation | Pattern is hidden; logged |
| **F-5 Synthesis below threshold** | Synthesis ready but conf < 0.75 | Demoted to a synthesis card in queue, not promoted to top |
| **F-6 Originate flow unreachable** | Strategic Moves route 500s | Shape-into-Move button disabled with "Move flow unavailable — reasoning saved" tooltip; pattern context persists for retry |
| **F-7 RLS leakage** | User sees another tenant's pattern | Server enforces tenant_id; client display also checks; integration test covers |
| **F-8 Pattern name violates vocab** | Compound noun jargon | Linter blocks at pattern-author time; runtime check redacts to "Pattern (vocab redacted)" if it slips through |
| **F-9 Concurrent dismiss** | Two users dismiss same pattern | Last-write-wins on the per-user dismiss; pattern itself remains visible to others |
| **F-10 Substrate ceiling not extended** | Migration §0.1 not applied | Surface fails-closed: shows "Substrate prerequisites not met. See `docs/build/intelligence/INTELLIGENCE_V1_IMPLEMENTATION_PROMPT_2026-05-07.md` §0." |

---

## §6 · Testing & verification

Before opening a PR, the implementer runs:

```bash
# Type + lint
npx tsc --noEmit
npx eslint src/app/intelligence src/components/intelligence-v1 src/lib/intelligence

# Unit + behavior
npm run test:behaviors -- intelligence
npm run test:nav -- intelligence

# Integration (requires DB)
npm run db:migrate
npm run db:seed
npm run test:integration -- intelligence

# Boundary grep guards
rg -n "Tower" src/app/intelligence src/components/intelligence-v1 && exit 1 || true
rg -n "<input type=.text.|<textarea" src/app/intelligence && exit 1 || true
```

Open a draft PR with screenshots of all three states (empty / partial / mature) on the lead demo tenant.

---

## §7 · Sequencing & PR strategy

This is **not one PR**. It's a wave. Suggested sequence:

| PR | Title | Scope | Gates |
|----|-------|-------|-------|
| INT-V1-0 | substrate prereqs (§0) | migration, types, segments, tenant naming | DB migrate green, verifiers green for 3 tenants |
| INT-V1-1 | scaffold + state resolver | new components folder, state-resolver, page picks correct state | unit tests for resolver |
| INT-V1-2 | empty + partial states | page header, attention strip, pattern queue, gap section | wireframe parity for state 1, 2 |
| INT-V1-3 | mature state + top synthesis | top synthesis card, sorting, filter pills | wireframe parity for state 3 |
| INT-V1-4 | shape-into-move | hydrator, originate-flow plumbing, back-link, abandonment telemetry | end-to-end behavior test passes |
| INT-V1-5 | removals + boundary guards | delete /ask, /failure-modes (relocate), J0 components, ESLint guards | grep guards return 0 |
| INT-V1-6 | seed wiring + production walk | demo data flows for the 3 tenants, all-three-states walk | manual walk on each tenant |

Each PR is independently reviewable, mergeable, revertable.

---

## §8 · Pilot readiness (memory rule: no demo thinking)

Per founder memory `feedback_no_demo_thinking.md`, every choice must hold up to pilot scrutiny — not just demo. The implementation must satisfy:

- **Audit trail.** Every pattern surface event, dismiss, and Shape-into-Move click is logged with user, timestamp, tenant. (`evidence_ledger` writes per action.)
- **RBAC.** Per `project_gate_approval_model.md`: in pilot, any user can dismiss a pattern (per-user); in production, dismissal that affects others requires admin/maestro role. v1 ships per-user dismiss only; cross-user is v2.
- **RLS.** Per `project_per_user_rls_pilot_ready.md`: every Intelligence query goes through tenant-bound RLS policies. Add a pen-test in INT-V1-6 verifying tenant A cannot see tenant B's patterns even with crafted requests.
- **Real content.** No fabricated patterns. If a pattern would require substrate the tenant doesn't have, the pattern doesn't render — it shows up in "What we can't yet see" instead.

---

## §9 · Coordination notes

- **Codex parallel track.** Per memory `project_codex_parallel_track.md`, Codex owns persistence (graph + vector + tenant). The seam for Intelligence is the broker bundle. Surface code (this prompt) reads through `AgentContextBroker` — never directly imports `EnterpriseDataRoom` / `vector` / `graph`. Per `feedback_broker_boundary.md`: violation = PR rejected.
- **Apex tenant key split.** Per `project_apex_tenant_key_split.md`: app uses `apexretail`; broker/data-room uses `apex-retail`. Implementation must map at the API boundary, not propagate the split.
- **Setup integration.** "Load in Setup →" CTAs deep-link to specific Setup panels (e.g., `/setup?segment=18` opens the Financial Model upload area). Coordinate with Setup/Admin redesign track per `project_setup_admin_redesign.md`.

---

## §10 · Done state

v1 ships when:
1. All seven INT-V1 PRs are merged
2. The three demo tenants render their natural state (we expect: lead tenant mature, second partial, third partial — ideally none in empty)
3. A founder walk-through can demonstrate the full chain: Setup loads substrate → Intelligence surfaces a pattern → Shape into a Move → Move appears in /programs with back-link to the Intelligence pattern
4. All R-2.x boundary grep guards pass in CI

End of implementation prompt.
