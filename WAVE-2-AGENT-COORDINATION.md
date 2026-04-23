# Wave 2 · Agent Coordination

**Purpose:** Single source of truth for the 4-stream agent work split announced Apr 23, 2026. Each agent appends status in its own section. No cross-writes.

---

## Agent A · Stream 1 · Agent Posture Spec

**Owner file:** `page-strategic-purpose-definition.md` (design package)
**Status:** not started
**Blocks:** Streams 2, 4
**Completed:** —
**Next:** Author agent posture sections for Programs (Nexus), Intelligence (Sentinel), Tower (Atlas), Admin (Steward). Each posture = agent name + domain, voice contract (one paragraph), guided-choice style, cross-agent handoff protocol, conversation state scope.
**Blockers:** none · but depends on the design package md file being available at a writable path under the repo. Currently it lives in `/Users/anand/Library/Mobile Documents/...` which is outside the repo. Need to either (a) copy the package into the repo as a tracked asset, or (b) treat Agent A's output as a package PR back to the design package author.

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

## Integration checkpoint · wave 2 done when

- [ ] Agent A · posture sections present for Programs/Intelligence/Tower/Admin
- [ ] Agent B · 7 new primitives in component library (AgentRail variants, avatar, guided-choice, conversation turn, streaming pane, state indicator) with props documented
- [ ] Agent C · 14 Morrison Rich deliverables authored, all 12 Rich components per contract, all citations resolve, timeline coherent
- [ ] Agent D · agent interaction exemplar renders Nexus mid-intake with all primitives composed
- [ ] Cross-cutting · zero unresolved `{{}}` tokens · zero broken citations · zero missing composite disclaimers · zero 404s · agent-rail mutual-exclusivity honored
