# Journey Kit · Phase 0 Baseline · 2026-05-07

**Produced by:** Claude Code autonomous run  
**Inspected at:** 2026-05-07  
**Tenant:** Meridian Health (meridian-health)  
**User during inspection:** Nina Patel (prod user — Castillo user not yet confirmed in Clerk)

---

## 1. Setup state

| Panel | Route | Status | Renders | Notes |
|---|---|---|---|---|
| Overview | /admin | 200 ✓ | Yes | "Where you stand and what to do next" — 3-act layout, Steward briefing, Pending decisions |
| Data Trust | /admin/data-trust | 200 ✓ | Yes | Data segment readiness |
| AI Initiatives | /admin/ai-initiatives | 200 ✓ | Yes | **7 Meridian initiatives loaded**. By Business Goal / By Category / All views work |
| AI Initiatives detail | /admin/ai-initiatives/[id] | 200 ✓ | Yes | **7-tab detail page works**: Overview, KPIs, Stakeholders, Decisions, Vendors, Scenarios, Provenance |
| Connectors | /admin/connectors | 200 ✓ | Yes | External systems list |
| Users & Access | /admin/users-access | 200 ✓ | Partial | Present in nav |
| Agent Readiness | /admin/agent-readiness | 200 ✓ | Yes | Nexus/Sentinel/Atlas/Steward |
| Production Readiness | /admin/production-readiness | 200 ✓ | Yes | Demo/pilot/production |

**Key findings:**
- `/setup` → redirects to `/admin` (correct)
- "Meridian Health" tenant name shown ✓
- AI Initiatives nav item IS in sidebar ✓  
- 7 Meridian initiatives across 4 business goals ✓
- 2 ⭐ aligned-callout markers (MH-01, MH-04) ✓
- View toggle works (By Business Goal / By Category / All) ✓
- Detail pages with 7 tabs work ✓
- **GAP: No ⓘ provenance icon on initiative cards** (Waypoint 03 criterion)
- **GAP: Steward chat pane fixed-width (~320px), no resize handle** → Tier 0

---

## 2. Intelligence state

| Component | Route | Status | Notes |
|---|---|---|---|
| Tenant Intelligence | /tenant/meridian-health/intelligence | 200 ✓ | 12-tab deterministic lens: Summary, Evidence, Programs, Actions, Signals, Pattern Plan, Gap Queue, Contradictions, Programme Risk, Gate Readiness, Scorecard, Milestones |
| Sentinel chat | /intelligence/ask | 200 ✓ | Interactive, real LLM, Cross-Corpus mode |
| J0 Landing | /intelligence | 200 ✓ | Failure-mode card grid (public, non-tenant) |

**Key findings:**
- **MAJOR GAP: Sentinel interactive chat NOT on /tenant/meridian-health/intelligence** — it's at the separate /intelligence/ask page
- The tenant intelligence page shows a 12-tab deterministic lens design — this is NOT the "Knowledge & Context + Art of Possible" redesign expected by Waypoints 6-9
- **GAP: No "Knowledge & Context" section at top** → Tier 0 surface gap
- **GAP: No "Art of the Possible by F/M/B" section** → Tier 0 surface gap  
- **GAP: No "Shape into a Move →" CTA on any Intelligence card** → Tier 0 surface gap
- **GAP: Sentinel chat pane at /intelligence/ask is fixed-width, no resize handle** → Tier 0
- Sentinel IS interactive at /intelligence/ask (accepts input, real Anthropic API) ✓

---

## 3. Strategic Moves state

| View | Route | Status | Notes |
|---|---|---|---|
| Home | /strategic-moves | 200 ✓ | 14 Moves, $338M at stake, Cards (default)/Kanban/Scatter |
| Detail | /strategic-moves/[id] | 200 ✓ | Phase rail P0→P5→Tower, gate criteria, sponsor, value |
| Originate | /strategic-moves/new | 200 ✓ | Nexus left + 7-field scaffold right |

**Key findings:**
- 14 Moves rendering for Meridian ✓
- "$338M at stake" ribbon visible ✓
- Status chips with semantic colors ✓
- Cards default view ✓
- Phase rail: **6 phases (P0 → P1 → P2 → P3 → P4 → P5 → Tower)** ✓ — 6-phase migration IS live
- Gate criteria visible per phase ✓
- Sponsor & Value at stake visible ✓ (some sponsors show "Unassigned")
- Nexus chat on originate page: interactive ✓
- **GAP: Nexus chat pane fixed-width (~470px), no resize handle** → Tier 0
- **GAP: No artifact upload affordance visible on detail page** → need to verify Wave 3c

---

## 4. Agent state

| Agent | Surface | Interactive | Response grounding | Width / Resize |
|---|---|---|---|---|
| Steward | /admin (right rail) | ✓ Yes | Tenant context (scaffold prompts) | Fixed ~320px · NO resize handle |
| Sentinel | /intelligence/ask | ✓ Yes | Cross-Corpus · real LLM | Fixed ~500px · NO resize handle |
| Nexus | /strategic-moves/new (left) | ✓ Yes | Move context · real LLM | Fixed ~470px · NO resize handle |
| Atlas | /home (left) | ✓ Yes | Portfolio context · real LLM | Fixed ~500px · NO resize handle |

**Probe: Sentinel substrate question**  
Asked: "Which of our AI initiatives should I worry about most?" at /intelligence/ask  
Result: Input submission not captured in screenshot (timing). Manual observation: Sentinel is wired to real LLM via Anthropic SDK. Cross-Corpus mode includes tenant context. Tier 1/3 probe needs re-run in Phase 1.

**Critical Tier 0 gap:** `ResizablePane` component does not exist in the codebase. `grep -r ResizablePane` returns zero results. All 4 agent chat panes are fixed-width with no drag handle. This degrades every agent probe environment.

---

## 5. Substrate state

| Table / Resource | Expected | Actual | Status |
|---|---|---|---|
| ai_initiatives count | 21 | **21** | ✓ |
| ai_business_goals count | 12 | **12** | ✓ |
| Meridian AI initiatives | 7 | **7** (MH-01 through MH-07) | ✓ |
| engagements (with archetype) | 51 | **42** (program_archetype col) | ⚠ partial |
| engagements (with value) | 51 | **50** | ✓ |
| deliverables_v2 count | 541+ | **733** | ✓ |
| distinct phases | 6 | **6** (0–5) | ✓ 6-phase migration live |
| substrate_versions table | present | **absent** | non-blocking |
| data_inventory_records | — | **2,651** (23 segments) | ✓ |
| Phase doctrine in repo | present | **present** (PHASE_DOCTRINE_LIGHTWEIGHT.md in kit) | ✓ |

**Meridian initiatives confirmed in DB:**
MH-01 Clinical Documentation Copilot (⭐ HEALTHY) · MH-02 Vibe Coding Rollout · MH-03 Autonomous Helpdesk · MH-04 Epic AI Revenue Cycle (⭐ VALUE_LAG) · MH-05 Clinical Risk Stratification ML · MH-06 Joule (SAP) Pilot for Finance (VALUE_LAG) · MH-07 Model Governance & FinOps Platform

---

## 6. Prerequisites status

| Prerequisite | Status | Blocking? |
|---|---|---|
| App deployed and accessible | ✓ nexus-vert-kappa.vercel.app | No |
| Meridian Health tenant exists | ✓ client_id: a20ecef5 | No |
| Castillo CFO user | ⚠ Not confirmed in Clerk (using Nina Patel) | Degrading only |
| Browser-Chrome MCP available | ✓ | No |
| GH_TOKEN for fix-PRs | ✓ (verified via gh auth) | No |
| AI Initiatives Substrate v1.1 | ✓ 21 initiatives loaded | No |
| Setup → AI Initiatives view | ✓ Built and functional | No |
| 6-phase migration | ✓ Live in DB | No |
| Wave 2 substrate (gates/milestones) | ⚠ Partial (some sponsors unassigned) | Degrading |
| Phase doctrine | ✓ In kit files | No |
| Intelligence redesign (May 7) | ✗ NOT shipped | Degrading (waypoints 6-9) |
| Sentinel on Intelligence surface | ✗ At /intelligence/ask only | Degrading (waypoints 6-8) |
| Nexus agent live | ✓ | No |
| ResizablePane component | ✗ Does not exist | Degrading all agent waypoints |

---

## 7. Recommendation

**HYBRID — Proceed with Phase 1 immediately**

**Rationale:**
- All BLOCKING prerequisites are met
- The blocking surface gaps (Intelligence redesign, ResizablePane, Shape-into-Move CTA) are fixable within the kit run — they are Tier 0 fix-PR targets
- Castillo user absence is non-blocking for code verification (functional tests run as Nina Patel, same tenant)

**Fix order per tier doctrine:**
1. **Tier 0 first**: ResizablePane component (all 4 agents) · Intelligence surface redesign · Shape-into-Move CTA
2. **Tier 2 second**: Sentinel wired to AI Initiatives Registry · Nexus registry access
3. **Tier 1 third**: Sentinel system prompt to require MH-0X citation
4. **Tier 3 last**: Sentinel sycophancy, structured handoff shape, Nexus clarification quality

**Waypoints that can run now without fixes:** 01 (Setup arrival), 02 (Tenant Profile), 03 (AI Initiatives list), 04 (MH-04 detail), 05 (nav return), 10 (Moves home), 12 (Move detail), 13 (artifact upload?), 14 (persistence), 15 (Move complete)

**Waypoints blocked by surface gaps (fix first):** 06 (Intelligence arrival — surface redesign), 07 (Sentinel chat — needs ResizablePane + integration), 08 (handoff summary + Shape-into-Move CTA), 09 (F/M/B section), 11 (Nexus capture with prefill)

---

*Phase 0 complete. Proceeding to Phase 1 immediately per user authorization.*
