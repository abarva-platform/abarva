# Demo Readiness Tracker

**Last updated:** 2026-04-23 · end of session
**Owner:** Claude Opus 4.7 (1M context)
**Rule:** Update at the end of every working session. Never claim above actual.

---

## Top-level rollup

| Track | % complete | State | Notes |
|---|---:|---|---|
| **Wave 2 Multi-Agent Coordination** | **80%** | on track | 4 streams shipped; only Morrison C2-C4 (13 deliverables) + nav repoint rebase remain |
| **Agent Anchoring · 4 surfaces** | **55%** | on track | Nexus/Programs ✓ · Sentinel/Intelligence ✓ · Atlas/Tower partial · Steward/Admin pending |
| **Page-Agent Coherence** | **60%** | on track | DOM linter + drawer shipped; attention events + walks deferred |
| **Morrison Rich Authoring** | **36%** | slipping | 5 of 14 deliverables landed (D01-D04, D17); C2/C3/C4 not started |
| **Integrity infrastructure** | **85%** | on track | link crawler + DOM linter + tenant rescope + evidence + canonical routes all live |
| **Nav + deploy surface coherence** | **70%** | in flight | nav repoint + base-path redirects shipped on PR #118; not yet merged to main |

**Overall demo readiness: ~65%.** Gating items for Prat walkthrough: Atlas voice discipline, Morrison C2 Phase 2 content, three walks. Gating items for Anthology investor: investor page polish + investor-audience walk recording.

---

## Track 1 · Wave 2 Multi-Agent Coordination

Work order: `docs/design-canon/wave-2-multi-agent-coordination-work-order.md`

| Stream | Owner | Item | % | PR | State |
|---|---|---|---:|---|---|
| 1 · Posture spec | Agent A | 4 agent voice contracts + handoffs + state scope | 100% | #113 merged | done |
| 2 · Primitive library | Agent B (me) | AgentRail + GuidedChoice + 3 structural primitives | 100% | #114 merged | done |
| 3 · Morrison Rich | Agent C1-C4 | 14 deliverables + shared timeline + evidence base | 36% | #115 merged (C1) | see Track 4 |
| 4 · Interaction exemplar | Agent D (me) | wireframe-agent-interaction-nexus.html | 100% | #116 merged | done |

Canon import foundation (PR #112) · merged.
**Wave 2 aggregate: 80% · three of four streams complete.**

---

## Track 2 · Agent Anchoring Implementation

Guide: `docs/design-canon/agent-anchoring-implementation-guide.md` · design thinking: `agent-interaction-design-thinking.md`

| Agent | Surface | Anchored | Voice sharp | Guided choice | Handoff chips | % |
|---|---|:-:|:-:|:-:|:-:|---:|
| Nexus ✱ | Programs | ✓ | ✓ | ✓ | ✓ (→ Atlas flagged) | **95%** |
| Sentinel ◈ | Intelligence | ✓ | ✓ | ✓ | ✓ (→ Nexus shipped) | **90%** |
| Atlas ▲ | Control Tower | partial | needs discipline pass | ✓ | — | **55%** |
| Steward ◆ | Admin | — | — | — | — | **0%** |

**Anchoring aggregate: 55%.** Atlas rail exists on `/preview/tower` but uses the original right-docked pattern; needs reworking to match Sentinel's primary-anchor pattern with in-page content + confidence-qualified voice.

Sub-items:
- [x] AgentRail React primitive (PR #106)
- [x] ConversationTurn / StreamingResponsePane / AgentStateIndicator (PR #114)
- [x] Sentinel on Intelligence · chat-first with 5 views (PRs landed in #118 branch)
- [x] Voice contracts per agent (PR #113)
- [x] Cross-agent handoff chip pattern (Sentinel → Nexus shipped)
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

1. **PR #118** (`fix/repoint-nav-to-new-surfaces`) · stacked commits for nav repoint + redirects + tenant scoping + Sentinel shell + Sentinel iteration + DOM linter + drawer primitive. Awaiting user merge call.
2. **PR #117** (`fix/programs-shell-post-merge`) · initialPhase + useEffect fix. Should merge before #118 rebase.

## What's blocked

- **Atlas discipline pass** on `/preview/tower` — blocked on design decision: move Atlas from right-rail to primary anchor like Sentinel, or keep the pressure-card-first layout and lean Atlas into a "supporting agent" role?
- **Steward on Admin** — blocked on posture priority vs. demo criticality (likely post-demo)

## What's next (recommended order)

1. Merge PR #117 → rebase PR #118 → merge PR #118. (Unblocks the nav repoint on prod.)
2. **Spawn Agent C2** (Morrison Phase 2 · D07-D11) · parallel to everything else; +5 deliverables lands ~40% of Morrison in one pass.
3. **Atlas discipline pass** on `/preview/tower` · voice + handoff chips + drop confidence qualifiers.
4. **Attention-event protocol** (§1 of coherence work order) · foundation for next-level rail prompting.
5. **Drawer wiring expansion** · evidence citations as drawer (E1-E9 chips open the evidence detail inline, not a page nav).
6. **Walk #1 recording** (Prat golden path) · T-7 before demo.

## Metric math

- **Aggregate readiness** is a weighted average: Wave 2 (25%) + Anchoring (20%) + Coherence (15%) + Morrison (20%) + Integrity (10%) + Deploy (10%) = 80×0.25 + 55×0.20 + 60×0.15 + 36×0.20 + 85×0.10 + 70×0.10 = **63.3%** → rounded to **~65%**.
- Morrison is the drag. Moving Morrison from 36% → 70% alone would lift aggregate to ~72%.

---

*Delete this file once the product ships. Until then, this is the single-source-of-truth for where we are.*
