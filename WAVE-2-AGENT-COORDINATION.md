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
**Status:** C1 in-flight (spawned 2026-04-23, branch `design/wave-2-agent-c1-morrison-p1`), C2-C4 pending
**Shared references (read-only):** `wireframe-d17-morrison-decision-memo.html`, `morrison-rich-authoring-work-order.md`, `intelligence-layer-pattern-design-pack-FULL.md` (Owned Brand Margin Recovery pattern)
**Shared JSON (Agent C owns, sub-agents append-only):**
- `src/content/deliverables/apex-retail/morrison/_timeline.json` — canonical chronology
- `src/content/deliverables/apex-retail/morrison/_evidence-base.json` — E1/E2/... resolution
**Sub-agent split:**
- **C1** · Phase 1 · D01 Charter, D02 Stakeholder Map, D03 Success Metric Tree, D04 Intake Synthesis
- **C2** · Phase 2 · D07 Financial Baseline, D08 Pain Points, D09 RCA, D10 Benchmark, D11 Hypotheses
- **C3** · Phase 3 · D12 Roadmap, D15 Intervention Portfolio, D16 Business Case, D18 Risk Register (D17 already done)
- **C4** · Phase 4 · D19 Delivery Plan, D20 Sprint Artifacts, D22 Change Management, D24 Outcome Measurement Plan
**Sequencing recommendation:** Tier A first (D01, D03, D07, D09, D15, D16, D19 — demo spine) · Tier B next (remaining Phase 1-3) · Tier C last (Phase 4).
**Next:** create `_timeline.json` + `_evidence-base.json` seeds before any deliverable authoring begins.

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
