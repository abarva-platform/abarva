# Journey Kit · Phase 1 Run Report · 2026-05-07

**Produced by:** Claude Code autonomous run  
**Tenant:** Meridian Health (meridian-health)  
**Persona:** M. Castillo — CFO / Value Office (executed as Nina Patel, same tenant)  
**Authorization:** Full — user pre-approved all fixes, PRs, merges  
**PRs shipped this run:** #1690 (Shape-into-Move CTA), #1691 (E2E test)

---

## Waypoint Results

| WP | Name | Result | Probe | Notes |
|----|------|--------|-------|-------|
| WP01 | Setup / Admin arrival | ✅ PASS | — | "Where you stand and what to do next" · Meridian Health · 139% readiness · Steward active · 5 pending decisions |
| WP02 | Tenant profile | ✅ PASS | — | decision-grade agents · 5 categories loaded · partial data caveat visible |
| WP03 | AI Initiatives list | ✅ PASS | — | 7 initiatives · By Business Goal / By Category / All views work · MH-01 HEALTHY ⭐ · MH-04 VALUE\_LAG ⭐ · MH-06 VALUE\_LAG all visible |
| WP04 | MH-04 detail | ✅ PASS | 8-3 alt | Epic AI for Revenue Cycle · VALUE\_LAG · "Shape into a Move →" CTA visible and wired |
| WP05 | Nav return | ✅ PASS | — | Breadcrumb "← AI Initiatives" works · sidebar nav state preserved |
| WP06 | Intelligence arrival | ⚠️ GAP | — | 12-tab deterministic lens renders. **No interactive Sentinel pane. No Knowledge & Context section. No Art of the Possible (F/M/B). No "Shape into a Move →" on cards.** Intelligence redesign not shipped. |
| WP07 | Sentinel chat | ⚠️ PARTIAL | 7-1 | Interactive at /intelligence/ask · Cross-Corpus · correctly identified MH-06 (stalled RPA / Joule) as highest risk. **FAIL: no MH-0X display ID cited — narrative only.** |
| WP08 | Shape into a Move → | ✅ PASS | 8-3, 8-4, 8-5 | CTA fixed in PR #1690 · fromInitiative/fromId/fromGapUsd params wired · Nexus 2D context message: "MH-06 · $1.8M Value Lag" |
| WP09 | F/M/B section | ⛔ BLOCKED | — | Requires Intelligence surface redesign (pattern-to-Move funnel). Substrate blockers on segments 15–23. Deferred. |
| WP10 | Moves home | ✅ PASS | — | 15 moves · $338M at stake · HEALTHCARE\_IDN-STALLED-2026 pinned top · Cards / Kanban / Scatter all functional |
| WP11 | Nexus originate | ✅ PASS | 8-6, 8-7, 8-8 | Full 4/4 scaffold via chat (hypothesis → sponsor → scope → archetype WA) · "Promote to P1 Charter →" active · Move created in DB |
| WP12 | Move detail | ✅ PASS | — | UUID 18d2d990 · HEALTHCARE\_IDN-STALLED-2026 · P0 Originate · gate criteria · Sponsor Nina Patel · Archetype WORKFLOW AUTOMATION · audit event `program_approval_submitted` |
| WP13 | Artifact upload | ⚠️ GAP | — | No upload affordance on Move detail page. Wave 3c not shipped. |
| WP14 | Persistence | ✅ PASS | — | Navigate home → back to UUID. Move loads identically, full state preserved. |
| WP15 | Move complete | ✅ PASS | — | "Resolve decision →" routes to Program Approvals queue · Move shows as **1 pending** · Nina Patel · workflow\_automation |

**Score: 10 PASS · 3 GAP/PARTIAL · 2 BLOCKED**

---

## Probe Results

| Probe | Description | Result |
|-------|-------------|--------|
| PROBE 7-1 | Sentinel cites MH-XX display IDs in AI initiative responses | ❌ FAIL — narrative only, no structured ID |
| PROBE 8-3 | "Shape into a Move →" CTA on initiative detail page | ✅ PASS — shipped in PR #1690 |
| PROBE 8-4 | CTA href contains fromInitiative, fromId, fromGapUsd params | ✅ PASS |
| PROBE 8-5 | /strategic-moves/new shows Nexus 2D context from initiative | ✅ PASS — "MH-06 · $1.8M Value Lag · Workflow Automation" |
| PROBE 8-6 | Scaffold fills 4/4 via chat turns | ✅ PASS |
| PROBE 8-7 | Promote button activates at 4/4 | ✅ PASS |
| PROBE 8-8 | Promote creates Move and redirects to detail | ✅ PASS — UUID 18d2d990 live in DB |

---

## Gaps by Tier

### Tier 0 — Affordance broken (fix before next run)

| Gap | Surface | Fix scope |
|-----|---------|-----------|
| ResizablePane component does not exist | All 4 agent panes (Steward/Sentinel/Nexus/Atlas) fixed-width, no drag handle | Build `ResizablePane` wrapper, wire to all 4 panes |
| Interactive Sentinel not on Intelligence surface | Sentinel chat is at /intelligence/ask only; /tenant/meridian-health/intelligence has no chat pane | Wire Sentinel into Intelligence surface as collapsible right rail |
| Intelligence surface redesign not shipped | WP06 / WP09 blocked — no Knowledge & Context section, no Art of the Possible F/M/B, no Shape-into-Move on cards | Ship Intelligence redesign per INTELLIGENCE\_DESIGN\_INTENT\_2026-05-07.md |

### Tier 1 — Quality degraded (fix this wave)

| Gap | Evidence | Fix |
|-----|---------|-----|
| Sentinel citation discipline — no MH-XX IDs | WP07: asked about AI initiative risk, response described MH-06 narratively without citing "MH-06" | Add system prompt rule: when discussing AI initiatives by tenant, always cite the MH-XX / AP-XX display ID |

### Tier 2 — Deferred (next wave)

| Gap | Evidence |
|-----|---------|
| Artifact upload on Move detail page | No upload affordance visible at WP13; Wave 3c not shipped |
| Nexus registry access (MH-06 KPI history) | PROBE 11-1 not reached; Nexus did not spontaneously cite MH-06 metrics when scoped to the Move |
| Gate criteria checkboxes manual | Scope / Archetype / Evidence request gate items not auto-populated from scaffold conversation data |

---

## Move Created This Run

| Field | Value |
|-------|-------|
| **Title** | Stalled RPA pipeline migration blocking Joule automation — Finance on manual SAP extraction |
| **Slug** | HEALTHCARE\_IDN-STALLED-2026 |
| **UUID** | 18d2d990-2d89-45d2-8700-9660a8fce691 |
| **Phase** | P0 Originate · Awaiting Decision |
| **Archetype** | Workflow Automation (WA) |
| **Sponsor** | Nina Patel · Director, IT Procurement |
| **Value** | USD 3–3 projected (pending verification) |
| **Audit** | program\_approval\_submitted · 1h ago |
| **URL** | /strategic-moves/18d2d990-2d89-45d2-8700-9660a8fce691 |

**Full lifecycle confirmed:** MH-06 detail page → "Shape into a Move →" CTA → /strategic-moves/new with 2D context → 4/4 scaffold via Nexus chat → Promote to P1 Charter → DB record created → Program Approvals queue.

---

## PRs Shipped

| PR | Title | Status |
|----|-------|--------|
| #1690 | feat: "Shape into a Move →" CTA on AI initiative detail pages | ✅ Merged |
| #1691 | test(e2e): Castillo journey kit — 4 Playwright probes | ✅ Merged |

---

## Next Actions

1. **Fix ResizablePane** — build once, wire to all 4 agent panes
2. **Sentinel citation discipline** — system prompt patch: require MH-XX / AP-XX IDs when answering about tenant AI initiatives
3. **Intelligence surface** — ship interactive Sentinel rail on /tenant/{slug}/intelligence
4. **Gate criteria auto-fill** — wire scaffold field values to gate checkboxes on Move detail
5. **Artifact upload (Wave 3c)** — file upload on Move detail page
