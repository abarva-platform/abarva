# Wave 2 · Agent Coordination

**Purpose:** Single source of truth for the 4-stream agent work split announced Apr 23, 2026. Each agent appends status in its own section. No cross-writes.

---

## Agent A · Stream 1 · Agent Posture Spec

**Owner file:** `docs/design-canon/page-strategic-purpose-definition.md` (in-repo canon)
**Status:** done (branch `design/wave-2-agent-a-posture`)
**Blocks:** Streams 2 (voice polish), 4 (interaction exemplar) — now unblocked
**Completed:**
- "Agent postures" top-level section added to the strategic purpose doc, placed after the shared design principles / priority ranking and before the end marker. Additive-only; no existing sections rewritten.
- Four authoritative agent subsections authored (Nexus ✱ / Sentinel ◈ / Atlas ▲ / Steward ◆), each covering: domain, voice contract (~100-130 words each, dialogue-grade), guided-choice style (closed vs generative options, escape-hatch behaviour), cross-agent handoff protocol (explicit triggers + chip phrasing), conversation state scope (per-surface / per-program / per-tenant / global + persistence rules).
- Cross-agent orchestration notes appended (mutual exclusivity, handoff-as-chip semantics, Steward as audit floor, voice-blending prohibition).
- Fixed agent ↔ surface ↔ glyph ↔ accent mapping reiterated at the top of the new section so the posture chapter is readable standalone.
- Total new content: ~2,070 words.
**Flag for Agent B:** The stub voice strings in `src/components/agent-rail/AgentRail.tsx` `AGENTS` const can now be replaced with canonical one-line descriptors drawn from the new posture sections. Suggested replacements (Agent B owns the final wording, but these fit the ~60-character rail tooltip budget and track the posture voice contracts):
- `nexus.voice`: `"Maestro-collegial · sketches trade-offs, names the next decision"`
- `sentinel.voice`: `"Forensic · reads telemetry aloud, names confidence and freshness"`
- `atlas.voice`: `"Operational · leads with what's hot, cuts to the relevant surface"`
- `steward.voice`: `"Utility-clerical · confirms what changed, by whom, when"`
**Next:** none in Agent A's scope · posture spec is complete and authoritative.
**Blockers:** none.

---

## Agent B · Stream 2 · Agent Primitive Library

**Owner file:** `src/components/agent-rail/AgentRail.tsx` (canonical primitive, in-repo) + the design package's `wireframe-component-library.html` (external)
**Status:** in progress
**Completed:**
- `AgentRail` primitive shipped (persistent-collapsed-narrow default · expand on click)
- `GuidedChoice` input baked in (3-5 chips + "something else" escape)
- 4 agent profiles pre-registered (Nexus/Sentinel/Atlas/Steward) with glyph + accent color + voice stub
- First wiring · Atlas on `/preview/tower` replacing the old bespoke AtlasDock · PR #106 merged
**Next:**
- `ConversationTurn` as standalone exported component (currently inlined)
- `StreamingResponsePane` (token-by-token appearance)
- `AgentStateIndicator` (listening/thinking/done/waiting)
- Mutual-exclusivity rule between agent-rail-expanded and document sidebars in consuming surfaces
- Voice-contract polish once Agent A posture spec lands (stubs are placeholders)
**Blockers:** voice contracts stubbed pending Agent A · not blocking shipment of primitives

---

## Agent C · Stream 3 · Morrison Rich Authoring

**Owner path:** `src/content/deliverables/apex-retail/morrison/`
**Status:** C1 done (branch `design/wave-2-agent-c1-morrison-p1`) · C2-C4 pending
**Shared references (read-only):** `wireframe-d17-morrison-decision-memo.html`, `morrison-rich-authoring-work-order.md`, `intelligence-layer-pattern-design-pack-FULL.md` (Owned Brand Margin Recovery pattern)
**Shared JSON (Agent C owns, sub-agents append-only):**
- `src/content/deliverables/apex-retail/morrison/_timeline.json` — canonical chronology
- `src/content/deliverables/apex-retail/morrison/_evidence-base.json` — E1/E2/... resolution
**Sub-agent split:**
- **C1** · Phase 1 · D01 Charter, D02 Stakeholder Map, D03 Success Metric Tree, D04 Intake Synthesis · **done 2026-04-23**
- **C2** · Phase 2 · D07 Financial Baseline, D08 Pain Points, D09 RCA, D10 Benchmark, D11 Hypotheses
- **C3** · Phase 3 · D12 Roadmap, D15 Intervention Portfolio, D16 Business Case, D18 Risk Register (D17 already done)
- **C4** · Phase 4 · D19 Delivery Plan, D20 Sprint Artifacts, D22 Change Management, D24 Outcome Measurement Plan
**Sequencing recommendation:** Tier A first (D01, D03, D07, D09, D15, D16, D19 — demo spine) · Tier B next (remaining Phase 1-3) · Tier C last (Phase 4).

### C1 · Phase 1 · status: done
- **Files authored:**
  - `src/content/deliverables/apex-retail/morrison/D01-d01-program-charter.md`
  - `src/content/deliverables/apex-retail/morrison/D02-d02-stakeholder-map.md`
  - `src/content/deliverables/apex-retail/morrison/D03-d03-success-metric-tree.md`
  - `src/content/deliverables/apex-retail/morrison/D04-d04-intake-synthesis.md`
- **New evidence IDs added to `_evidence-base.json`:** E10 (Marcus pricing-exclusion framing), E11 (Lena 15% assortment tolerance threshold), E12 (Reese category-lead resistance pattern). All additive; no existing entries modified.
- **Timeline:** no new `_timeline.json` entries needed · all C1 decision-log dates resolve to existing Phase 1 entries (2026-01-14, -16, -18, -22, -27).
- **Notes for downstream agents:**
  - **Agent A:** Nexus orchestrator agent carries formal PMO/reconciliation duties in D01 governance and D03 dual-ledger architecture · posture voice contract should align with this PMO role.
  - **Agent C2:** E10/E11/E12 are available for Phase 2 citation reuse · Lena's 15% threshold in particular anchors the assortment RCA arc toward D09.
  - **Agent C3:** Dual-sponsor veto architecture described in D02 is load-bearing for D15/D17 intervention-portfolio decisions · Katherine's veto domain is specifically named.
  - **Agent C4:** Dual-ledger reconciliation architecture in D03 flows directly into D24 outcome measurement · architecture is set; C4 operationalizes.

---

## Agent D · Stream 4 · Agent Interaction Exemplar

**Owner file:** `wireframe-agent-interaction-nexus.html` (design package · new)
**Status:** blocked on Agents A + B
**Scenario:** Maya intaking a new Meridian clinical documentation AI governance program. Nexus opens with an exact/partial/no-match outcome against the pattern library. 4 guided-choice options + "something else" escape. One conversation turn showing streaming mid-response. One cross-agent handoff moment (Nexus → Sentinel for pattern lookup).
**Blockers:** Agent A voice contract for Nexus · Agent B streaming-response-pane and agent-state-indicator primitives.

---

## Shared resources

### Morrison timeline seed (Agent C to instantiate)

Initial content is in this PR at `src/content/deliverables/apex-retail/morrison/_timeline.json`. Seed dates chosen to give every phase a coherent ~30-day window. Sub-agents append additional key_decisions entries additively.

### Morrison evidence base seed (Agent C to instantiate)

Initial content is in this PR at `src/content/deliverables/apex-retail/morrison/_evidence-base.json`. Each entry: id (E1, E2, ...), type, source (which deliverable + line), reference. Sub-agents append additively. Any inline citation chip (`E1`) in a deliverable must resolve to an entry in this file · the integrity linter should enforce.

---

## Flags & Decisions

- **[Agent B, 2026-04-23 03:30 UTC]** Voice contracts on the shipped `AgentRail` primitive are stubs (one-line descriptions in the `AGENTS` const). Awaiting Agent A posture spec to replace stubs with the authoritative voice paragraph. Change will be additive · stub lines will remain until replaced.
- **[Agent B, 2026-04-23 03:30 UTC]** `StreamingResponsePane` and `AgentStateIndicator` not yet shipped. Agent D is blocked on these for the interaction exemplar. Proposed build order: ship these next before moving to Sentinel/Steward wirings.
- **[Agent C, 2026-04-23 03:30 UTC]** Shared Morrison directory `src/content/deliverables/apex-retail/morrison/` does not exist yet. This PR creates it with seeded `_timeline.json` + `_evidence-base.json`. First deliverable authoring PR will add the first deliverable file.
- **[Design package location]** · The design package md files (wireframes, strategic purpose, work order) currently live outside the repo. Agent A writes need a repo-tracked copy OR a synced-back protocol. Flagging for Anand decision.

---

## Codex Overnight Work Order · Tier 1

**Owner branch:** `codex/overnight-tier1`
**Status:** Tier 1 complete · PR #111 open/green
**PR:** https://github.com/anandsundaram-hash/abarva/pull/111
**Rule:** one item per commit · Tier 1 PR only after 1.1-1.7 complete

| Item | Status | Evidence |
| --- | --- | --- |
| 1.1 Link crawler expansion | complete | `npm run integrity:link-crawler` passed with 696 routes, 8,492 internal links, 0 broken routes, 0 broken links, 0 redirect-chain violations. Report: `reports/link-crawler-2026-04-23T04-05-35-790Z.json`. |
| 1.2 Composite disclaimer audit | complete | Exact disclaimer constants centralized; rendered checks added in `src/__tests__/integration/composite-disclaimer-presence.test.ts`; CI workflow added in `.github/workflows/integrity.yml`. |
| 1.3 Evidence citation resolution check | complete | `npm run integrity:evidence-citations` passed with 1 evidence base, 57 rendered refs, 0 unresolved, 100% resolution. Report: `reports/evidence-citations-2026-04-23T04-20-42-475Z.json`. |
| 1.4 Tenant switcher re-scope validation | complete | Deterministic integration gate verifies Meridian → Apex re-scope across program list, pattern integration state, Tower data, and admin data signature with zero Meridian leakage. |
| 1.5 Tower sub-surface stub routes | complete | All five Tower scheduled surfaces render for all four tenants (20 routes) with Stub-style scheduled banner, Control Tower backlink, and composite disclaimer. |
| 1.6 Route-level integrity tests | complete | `src/__tests__/integration/canonical-routes.test.ts` renders every seed-spec canonical route, asserts 200-level route catalog coverage, shell structure, breadcrumbs, footer, and no unresolved `{{}}`, `undefined`, or `null` strings. |
| 1.7 Seed integrity report generator | complete | Seed dry runs now emit `reports/seed-integrity-{timestamp}.md`; `npm run integrity:seed-report` passed and validates totals, tier counts, phase distribution, schema warnings, and committed report `reports/seed-integrity-2026-04-23T04-35-00-000Z.md`. |

**Validation:** `npm run integrity:link-crawler` · `npm run integrity:disclaimers` · `npm run integrity:evidence-citations` · `npm run integrity:tenant-rescope` · `npm run integrity:tower-stubs` · `npm run integrity:canonical-routes` · `npm run integrity:seed-report` · `npx tsc --noEmit --pretty false`

---

## Integration checkpoint · wave 2 done when

- [ ] Agent A · posture sections present for Programs/Intelligence/Tower/Admin
- [ ] Agent B · 7 new primitives in component library (AgentRail variants, avatar, guided-choice, conversation turn, streaming pane, state indicator) with props documented
- [ ] Agent C · 14 Morrison Rich deliverables authored, all 12 Rich components per contract, all citations resolve, timeline coherent
- [ ] Agent D · agent interaction exemplar renders Nexus mid-intake with all primitives composed
- [ ] Cross-cutting · zero unresolved `{{}}` tokens · zero broken citations · zero missing composite disclaimers · zero 404s · agent-rail mutual-exclusivity honored
