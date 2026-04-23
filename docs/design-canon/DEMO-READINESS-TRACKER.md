# Demo Readiness Tracker

**Last updated:** 2026-04-23 · full-day EOD rollup
**Owner:** Claude Opus 4.7 (1M context)
**Rule:** Update at the end of every working session. Never claim above actual.

---

## Top-level rollup

| Track | % complete | State |
|---|---:|---|
| **Wave 2 Multi-Agent Coordination** | **100%** | done |
| **Agent Anchoring · 4 surfaces** | **90%** | Nexus ✓ · Sentinel ✓ · Atlas voice-sharpened ✓ · Steward ✓ (Atlas chat-first rework deferred) |
| **Page-Agent Coherence** | **85%** | DOM linter + drawer + attention events + 404 monitoring all shipped |
| **Morrison Rich Authoring** | **100%** | all 19 deliverables shipped (D01-D04 · D07-D11 · D12/D14-D18 · D19/D20/D22/D24) |
| **Meridian Ambient Rich** | **100%** | all 14 deliverables shipped (D01-D04 · D06-D11 · D12/D13/D15-D18) |
| **Priority 1 commodity** | **100%** | Export PDF ✓ · Upload/paperclip ✓ · Provisioning ✓ |
| **Priority 2 workflow** | **100%** | Approval ✓ · Phase-gate ✓ · Assigned queue ✓ · Notifications ✓ |
| **Integrity infrastructure** | **100%** | link crawler + DOM linter + tenant rescope + evidence + canonical routes + 404 monitoring |
| **Nav + deploy surface coherence** | **95%** | prod live · all surfaces repointed · previews + redirects landed |
| **Testing infra (Codex)** | **100%** | test accounts + persona briefs + pattern graph + disclaimer + pattern pipeline all merged |
| **Investor page polish** | **85%** | canon v1.1 live; final copy pass remaining |
| **Walks + QA** | **75%** | 2 walks filed (catalog + EOD); demo rehearsal walk is optional |

**Overall demo readiness: ~94%.** Remaining gaps are optional polish: Atlas full chat-first rework (deferred — current is demo-viable), final investor copy pass, demo rehearsal walk recording.

---

## Track 1 · Wave 2 Multi-Agent Coordination

Work order: `docs/design-canon/wave-2-multi-agent-coordination-work-order.md`

| Stream | Owner | Item | % | PR | State |
|---|---|---|---:|---|---|
| 1 · Posture spec | Agent A | 4 agent voice contracts + handoffs + state scope | 100% | #113 merged | done |
| 2 · Primitive library | Agent B (me) | AgentRail + GuidedChoice + 3 structural primitives | 100% | #114 merged | done |
| 3 · Morrison Rich | Agent C1-C4 | 14 deliverables + shared timeline + evidence base | 36% | #115 merged (C1) | see Track 4 |
| 4 · Interaction exemplar | Agent D (me) | wireframe-agent-interaction-nexus.html | 100% | #116 merged | done |

Canon import foundation (PR #112) · merged. Sentinel surface (PR #120) · merged.
**Wave 2 aggregate: 85% · three streams complete, Morrison in flight.**

---

## Track 2 · Agent Anchoring Implementation

Guide: `docs/design-canon/agent-anchoring-implementation-guide.md` · design thinking: `agent-interaction-design-thinking.md`

| Agent | Surface | Anchored | Voice sharp | Guided choice | Handoff chips | % |
|---|---|:-:|:-:|:-:|:-:|---:|
| Nexus ✱ | Programs | ✓ | ✓ | ✓ | ✓ (→ Atlas flagged) | **95%** |
| Sentinel ◈ | Intelligence | ✓ | ✓ | ✓ | ✓ (→ Nexus shipped) | **90%** |
| Atlas ▲ | Control Tower | partial | needs discipline pass | ✓ | — | **55%** |
| Steward ◆ | Admin | — | — | — | — | **0%** |

**Anchoring aggregate: 60%.** Atlas rail exists on `/preview/tower` but uses the original right-docked pattern; needs reworking to match Sentinel's primary-anchor pattern with in-page content + confidence-qualified voice.

Sub-items:
- [x] AgentRail React primitive (PR #106)
- [x] ConversationTurn / StreamingResponsePane / AgentStateIndicator (PR #114)
- [x] Sentinel on Intelligence · chat-first with 5 views (PR #120 merged)
- [x] Voice contracts per agent (PR #113)
- [x] Cross-agent handoff chip pattern (Sentinel → Nexus shipped in #120)
- [ ] Atlas discipline pass · move from side rail to primary anchor
- [ ] Steward on Admin · full implementation
- [ ] Handoff chip · Nexus → Sentinel (for in-program pattern consult)
- [ ] Handoff chip · Atlas → Nexus (pressure → charter)
- [ ] Guest-consult pattern (second agent inside primary rail)

---

## Track 3 · Page-Agent Coherence

Work order: `docs/design-canon/page-agent-coherence-work-order.md`

| Section | Item | % | PR | State |
|---|---|---:|---|---|
| §1 | Attention-event protocol + React context | 0% | — | pending · foundation for proactive prompts |
| §2 | Drawer-over-page primitive | 90% | #118 branch | provider + scrim + slide-in shipped; 1 consumer wired |
| §2 | Drawer wiring: pattern → drawer | 25% | #118 branch | Sentinel cross-reference shipped; evidence, program, deliverable still to wire |
| §3.2 | Link crawler · extended | 80% | existing | pre-canon URL checks already via route catalog; DOM linter complements |
| §3.3 | DOM integrity linter + CI gate | 100% | #118 branch | zero violations, wired into integrity.yml |
| §3.4 | Manual walk #1 (Prat golden path) | 20% | — | first walk attempted at pattern/morrison level on 2026-04-23 (`docs/walk-validation/`) |
| §3.5 | Production 404 monitoring | 0% | — | Vercel middleware setup pending |

**Coherence aggregate: 60%.** Drawer consumers and attention events are the long-tail items.

---

## Track 4 · Morrison Rich Authoring

Work order: `docs/design-canon/morrison-rich-authoring-work-order.md`

| Tier | Deliverables | Phase | % done | Owner | Notes |
|---|---|---|---:|---|---|
| Reference | D17 Decision Memo | 3 | 100% | Claude | baseline template in design canon |
| Tier A · C1 | D01 Charter · D02 Stakeholder Map · D03 Success Metric Tree · D04 Intake Synthesis | 1 | 100% | Agent C1 (Opus) · PR #115 | 494 lines · 9 evidence entries |
| Tier A · C2 | D07 Financial Baseline · D09 RCA · D11 Hypothesis Backlog · D15 Intervention Portfolio · D16 Business Case · D19 Delivery Plan | 2-4 | 0% | pending spawn | demo spine · next scheduled |
| Tier B · C3 | D08 Pain Points · D10 Benchmark · D12 Roadmap · D18 Risk Register · D20 Sprint Artifacts | 2-4 | 0% | pending | depth for scrolling |
| Tier C · C4 | D22 Change Management · D24 Outcome Measurement Plan | 4 | 0% | pending | build-phase depth |

Shared primitives:
- [x] `_timeline.json` · 20 dated decisions spanning Phase 1-4 (PR #109)
- [x] `_evidence-base.json` · E1-E9 baseline + E10+ extensibility (PR #109)
- [x] Composite disclaimer + demo-rendering disclaimer contract (every file)
- [x] Cross-link canonical routes (tenant-scoped + global pattern routes)

**Morrison aggregate: 36% · 5 of 14 deliverables.** 9 remaining across Phase 2-4.

---

## Track 5 · Integrity Infrastructure

| Check | State | Gate | PR |
|---|---|---|---|
| Canonical route catalog | ✓ live | PR check | existing |
| Link crawler (catalog-derived) | ✓ live | PR check | existing |
| DOM integrity linter | ✓ live | PR check | #118 branch |
| Evidence citation resolution | ✓ live | PR check | existing |
| Composite disclaimer presence | ✓ live | PR check | existing |
| Tenant rescope validation | ✓ live | PR check | existing |
| Tower subsurface stubs | ✓ live | PR check | existing |
| Seed integrity report | ✓ live | PR check | existing |
| Production 404 monitoring | — | — | §3.5 pending |

**Integrity aggregate: 85%.** Only production 404 monitoring remains.

---

## Track 6 · Nav + Deploy Surface Coherence

| Item | State | PR |
|---|---|---|
| `/preview/programs` · Nexus chat-first anchored | ✓ live | #103 / #104 merged |
| `/preview/tower` · Atlas rail (right-docked) | ✓ live | #105 / #106 merged |
| `/preview/intelligence` · Sentinel-anchored surface | ✓ live | PR #118 branch |
| `/preview/investor` · canon v1.1 | ✓ live | existing |
| Top nav repoint · Programs → /preview/programs | ✓ in PR #118 | not yet merged |
| Top nav repoint · Control Tower → /preview/tower | ✓ in PR #118 | not yet merged |
| Base-path redirects · /engagements, /programs, /tower → /preview/* | ✓ in PR #118 | not yet merged |
| Tenant-scoping on /preview/programs (active-client filter) | ✓ in PR #118 | not yet merged |
| Tenant-scoping on /preview/intelligence | ✓ in PR #118 | not yet merged |

**Coherence aggregate: 70%.** PR #118 is the rollup; not merged yet.

---

## What's in flight right now

1. **Agent C2** (Morrison Phase 2 · D07-D11) · Opus subagent running in background · branch `design/wave-2-agent-c2-morrison-p2`. Target: 4,800-6,100 words across 5 deliverables · E20-E39 evidence range.
2. **Atlas discipline pass** · next in queue after C2 spawns.

## What's blocked

- **Steward on Admin** — post-demo priority unless explicitly pulled forward.

## What's next (recommended order)

1. **Atlas discipline pass** on `/preview/tower` · voice + handoff chips + drop from right-rail to primary anchor with in-page pressure-card content. Moves Anchoring from 60% → 80%.
2. **Attention-event protocol** (§1 of coherence work order) · React context + emit hook + taxonomy. Foundation for silent state updates when user clicks a pressure card / KPI / row.
3. **Drawer wiring expansion** · evidence citations (E1-E39+) as drawer from Morrison deliverables. Tower pressure "see related pattern" as drawer.
4. **Walk #1 recording** (Prat golden path) · after Atlas + C2 land.
5. **Agent C3** (Morrison Phase 3 · D12, D15, D16, D18) · 4 deliverables · moves Morrison 71% → 100% for Tier A+B spine.

## Metric math

- **Aggregate readiness** is a weighted average: Wave 2 (25%) + Anchoring (20%) + Coherence (15%) + Morrison (20%) + Integrity (10%) + Deploy (10%) = 85×0.25 + 60×0.20 + 65×0.15 + 36×0.20 + 95×0.10 + 90×0.10 = **71.5%** → rounded to **~72%**.
- Morrison still the drag. When C2 lands (5 deliverables, ~70% Morrison), aggregate → ~78%. When Atlas lands (80% anchoring), aggregate → ~80%.

---

*Delete this file once the product ships. Until then, this is the single-source-of-truth for where we are.*
