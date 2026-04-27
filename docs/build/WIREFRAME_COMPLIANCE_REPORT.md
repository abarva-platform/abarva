# WIRE2 — Wireframe Compliance Report
Generated: 2026-04-27
Auditor: WIRE2 autonomous agent

## Summary

| Page | Route | Score | Status |
|---|---|---|---|
| Admin | /platform/admin | 62/100 | PARTIAL |
| Production Readiness | /platform/admin/production-readiness | 74/100 | PARTIAL |
| Architecture | /platform/admin/architecture | 58/100 | PARTIAL |
| Programs Index | /tenant/[slug]/programs | 68/100 | PARTIAL |
| Program Detail | /tenant/[slug]/programs/[slug] | 72/100 | PARTIAL |
| Source Event | /source/events/[eventId] | 71/100 | PARTIAL |
| Intelligence | /tenant/[slug]/intelligence | 76/100 | PARTIAL |
| Control Tower | /tenant/[slug]/tower | 75/100 | PARTIAL |

## Executive Summary

All 8 audited pages are functional and use appropriate agent shells with deterministic seed caveats, but none reach full PASS status because they share three systemic gaps: (1) the Admin page has an active banned token (`#14B8A6` / teal) used for action link coloring; (2) the Architecture page declares `steward` as the primary agent when the blueprint mandates `atlas`; and (3) the Programs Index surface uses `#0E9F8C` (a teal-adjacent accent not in the canonical AbarVa palette) for phase indicators and the Nexus guidance panel border. Structural zone coverage is strongest on Intelligence and Control Tower (Zone A–D complete) and weakest on Admin (missing Zone B agent anchor as a named panel, Zone E action strip absent). All pages pass the deterministic caveat requirement and none fabricate live data claims.

---

## Page-by-Page Audit

---

### Page 1: Admin (/platform/admin)

**Overall score: 62/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 55 | Zone A present (eyebrow + title). Zone B: workflow strip shows agent label but no dedicated named agent panel — Steward identity is embedded in AdminCanonShell workflow metadata only, not visually prominent. Zone C: content is a sidebar-nav + main-panel; default view (StewardSetupControlCenter) is correct. Zone D: data cards present for datasets/evidence/agents. Zone E: no action strip; next actions are buried in the StewardSetupControlCenter recommended actions. |
| Five-question test | 55 | Where am I: yes (eyebrow "Platform · Admin"). What matters most: partially (Steward brief in StewardSetupControlCenter). What is blocked: partially (readiness cards). What does agent recommend: present in workflow strip but not in a named Steward panel above-fold. What is my next action: no single clear CTA — ProductionReadinessJumpView is in a sub-nav section, not a primary action strip. |
| Agent behavior | 60 | Correct agent (Steward) assigned in AdminCanonShell workflow prop. StewardSetupControlCenter renders a proper brief. However: AdminCanonShell renders agent identity purely as a metadata label ("Anchor: Steward"), not as a visible named agent panel with identity badge. |
| Interaction | 65 | Sidebar nav items have click handlers. Tab/active state correct. Several PlaceholderView sections ("No items to display") are dead panels — no TODO comment on the dead buttons (Approve/Reject in MaestrosView have cursor:pointer but no onClick handler beyond visual). |
| Data contract | 70 | Maestros table uses deterministic seed (3 rows with correct roles). Sensitive Data Approvals uses seed data. No fabricated live data. Caveat present in workflow strip. TEAL color constant defined but used (see Design canon). |
| Workflow | 60 | Setup tabs (5 groups) present. Control Center is default. Blueprint calls for 5 admin section tabs (Data/Users/Agents/Connectors/Governance) — the actual sidebar groups differ (Setup/Users&Access/ClientGovernance/DataGovernance/Platform). Connectors tab is missing entirely from the sidebar; blueprint requires honest "deferred" connector status. Architecture tab is also missing from this page (no sub-nav link). |
| Design canon | 55 | AdminCanonShell background `#FBFAF7` — correct (close to spec #F8F7F4). DM Sans used. **BANNED TOKEN: `const TEAL = '#14B8A6'` defined and used on line 182 for action link color (`color: TEAL`).** No AbarVaLogo component (admin pages don't use standalone logo — acceptable since AppShell wraps it at layout level). `StewardSetupControlCenter` defines `teal: '#1f7a8c'` in COLORS object (different hex, not the exact banned #14B8A6, but teal-category color still concerns design canon). |

**Passing:**
- AdminCanonShell shell mounted with eyebrow, title, description
- Steward identified as primary agent in workflow strip
- Deterministic caveat present: "Deterministic operator shell. No fake live readiness claims."
- StewardSetupControlCenter implements all 5 canonical zones (A–E) correctly
- Sidebar navigation with active state
- No fabricated live data
- PlaceholderView correctly shows "No items" rather than fabricated data
- StewardBrief visible in control-center tab

**Failing:**
- **BANNED TOKEN: `const TEAL = '#14B8A6'` used at line 182 for action text color** — Severity: HIGH — Safe to auto-fix: YES — Recommendation: Replace `color: TEAL` with `color: NAVY` on the Manage/Assign link column
- Connectors tab absent from sidebar (blueprint requires honest "deferred" connector status) — Severity: MEDIUM — Safe to auto-fix: NO (requires new view component)
- Architecture sub-nav link absent from admin portal sidebar — Severity: MEDIUM — Safe to auto-fix: NO (routing concern)
- "Approve" / "Reject" buttons have no onClick handlers (dead buttons) — Severity: LOW — Safe to auto-fix: YES — Recommendation: Add `// TODO: wire Approve/Reject click behavior (governance enforcement deferred)` comment
- Zone E action strip absent — next recommended action not surfaced as a single CTA — Severity: MEDIUM — Safe to auto-fix: NO

---

### Page 2: Production Readiness (/platform/admin/production-readiness)

**Overall score: 74/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 75 | Zone A: eyebrow "Platform · Production" + title present. Zone B: workflow strip shows Steward, page question, and known/missing. Zone C: ProductionReadinessDecisionFlow renders ordered sections (demo/pilot/production decisions). Zone D: ProductionReadinessLivePanel renders component table. Zone E: next 5 actions present in the decision flow. |
| Five-question test | 75 | Where am I: yes. What matters most: Steward brief states demo-ready / pilot-partial / production-blocked. What is blocked: blocker list present. What agent recommends: workflow strip has recommendedNextAction. What is my next action: next 5 actions in decision flow. Missing: no single prominent "top action" CTA button above-fold. |
| Agent behavior | 75 | Steward correctly assigned. Decision flow uses manifest-backed data. Caveat "Deterministic no-store read model, not an automated runtime monitor" is correct. Missing: no explicit Steward identity badge as a visual component — agent identity is in the workflow strip metadata, not a standalone named Steward panel. |
| Interaction | 70 | Blocker detail drawer mentioned in blueprint but not visible in code (no drawer implementation found). Drilldown to Architecture page not present. |
| Data contract | 85 | PROD8 manifest-backed. Demo READY, pilot partial, production blocked — honest status. Caveat visible. No fabricated live monitoring claim. |
| Workflow | 75 | Ordered sections match blueprint sequence (demo → pilot → production → evidence → next actions). Component readiness table present. |
| Design canon | 65 | AdminCanonShell background `#FBFAF7` correct. DM Sans. However: `ProductionReadinessDecisionFlow` imports from `@/lib/design/abarva-theme` — need to verify no teal tokens there. No banned token found in the page or AdminCanonShell. |

**Passing:**
- Steward as primary agent
- All three readiness tiers (demo/pilot/production) present
- Deterministic manifest caveat visible
- No `production_ready: true` claim when blockers exist
- Component readiness table
- Next actions present
- AdminCanonShell with correct background

**Failing:**
- Blocker detail drawer not implemented (blueprint requires click-blocker → detail drawer) — Severity: MEDIUM — Safe to auto-fix: NO
- No drilldown link to Architecture page from deployment plane — Severity: LOW — Safe to auto-fix: NO
- Steward identity not surfaced as a named visual panel (just workflow strip metadata) — Severity: LOW — Safe to auto-fix: YES — Recommendation: Add `STEWARD · PRODUCTION READINESS` label to orientation strip

---

### Page 3: Architecture (/platform/admin/architecture)

**Overall score: 58/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 60 | Zone A: eyebrow "Platform · Architecture" + title present. Zone B: **primaryAgent is `steward` in the page file but blueprint mandates `atlas` as primary agent** — this is a direct spec violation. Zone C: ArchitectureCanvas + ArchitectureOverviewPage render planes and built-vs-deferred table. Zone D: supporting data present. Zone E: next architecture actions visible in ArchitectureCanvas (if present in view-model). |
| Five-question test | 55 | Where am I: yes. What matters most: unclear — page question is about "integration planes" not the blueprint's specific Atlas frame ("how does AbarVa work end to end"). What is blocked: deferred items in built/deferred table. What agent recommends: workflow strip shows recommendation but it's from Steward, not Atlas. What is my next action: next actions in the page, but not as a prominent CTA. |
| Agent behavior | 40 | **CRITICAL: Primary agent declared as `steward` in page.tsx workflow prop, but blueprint specifies `atlas` as the correct primary agent for the architecture surface.** Atlas is the platform/architecture oversight agent. Using Steward here violates the agent-to-surface assignment rules. |
| Interaction | 65 | ArchitectureCanvas renders 5 section tabs per the ARCH5 spec. Component detail drawers mentioned in blueprint but drawer implementation not visible. |
| Data contract | 75 | ARCH5 manifest-backed. Built vs deferred explicit. Azure reference target named. Caveat "Deterministic architecture brief; not a runtime monitoring surface." |
| Workflow | 65 | 5 section tabs correspond to blueprint (Overview / Request Flow / Data Flow / SaaS vs Private / Built vs Deferred). Next architecture actions present. |
| Design canon | 65 | AdminCanonShell `#FBFAF7` correct. DM Sans. ARCH5 design tokens use AbarVa canon (NAVY, SURFACE, CARD). No teal. |

**Passing:**
- AdminCanonShell shell mounted correctly
- ARCH5 manifest-backed data
- Built vs deferred table present
- Deterministic caveat visible
- Azure reference target named
- 5 section tabs present

**Failing:**
- **CRITICAL: `primaryAgent: 'steward'` in page.tsx but blueprint mandates `atlas`** — Severity: HIGH — Safe to auto-fix: YES — Recommendation: Change `primaryAgent: 'steward'` to `primaryAgent: 'atlas'` in the workflow prop, and update page question + known/missing/next to Atlas-framing
- Atlas identity not displayed — the orientation strip shows "Anchor: Steward" instead of "ATLAS · ARCHITECTURE BRIEF" — Severity: HIGH — Safe to auto-fix: YES (as part of the primaryAgent fix)
- Component detail drawer not implemented — Severity: LOW — Safe to auto-fix: NO

---

### Page 4: Programs Index (/tenant/[slug]/programs)

**Overall score: 68/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 75 | Zone A: tenant name + "Programs" h1 present. Zone B: Context strip (counts, phase distribution). Zone C: Program card grid. Zone D: Nexus portfolio guidance panel (bottom aside). Zone E: "Open recommended program" CTA link present. |
| Five-question test | 65 | Where am I: yes (tenant name + "canonical programs surface"). What matters most: Nexus guidance panel present but at the bottom (below card grid) — not above-fold. What is blocked: not disclosed explicitly (no gate-blocker summary). What agent recommends: Nexus guidance text present. What is my next action: "Open recommended program" link. |
| Agent behavior | 65 | Nexus correctly identified in eyebrow ("Program workflow · Nexus-led") and in guidance panel label ("Nexus · portfolio guidance · deterministic"). However: ProgramCanonShell orientation strip says "Workflow orientation" not "NEXUS · ORCHESTRATION LEAD" — the agent identity label is generic rather than named per spec. No confidence/evidence count. |
| Interaction | 70 | Program cards are Links (correct). Phase filter bar not implemented (blueprint requires phase filter — only phase distribution band exists but it's display-only). Active state: n/a (no filter tabs). |
| Data contract | 75 | Apex Retail seed data visible. Program count, active count, deliverable totals in context strip. Deterministic caveat in ProgramCanonShell workflow strip. No fake live data. |
| Workflow | 60 | Program cards link to detail pages. Phase distribution displayed. Missing: phase filter bar (All / P1–P6 filter to narrow cards) — the phase band is display-only, not interactive. Blueprint explicitly requires phase filter. |
| Design canon | 55 | ProgramsCanonicalIndex uses `#0E9F8C` as accent color (defined as `accentTeal` in design-system.ts) — **this is a teal-adjacent color not in the canonical AbarVa palette** (#0A0C12 ink, #1B2B5C navy, #F8F7F4 surface). ProgramCanonShell background `#FBFAF7` correct. Georgia serif used for h1. DM Sans for body. JetBrains Mono for labels (acceptable pattern elsewhere but not in design canon spec). |

**Passing:**
- Zone A–D present
- Nexus identified as lead agent
- Portfolio count metrics visible
- Program cards with phase badges, deliverable counts
- Deterministic caveat present
- Georgia serif for headings
- Program detail links correct

**Failing:**
- **Banned color: `#0E9F8C` (teal-adjacent accent) used for phase indicators, card borders, and Nexus guidance panel border** — Severity: HIGH — Safe to auto-fix: YES — Recommendation: Replace `#0E9F8C` accent with `#1B2B5C` (navy) in ProgramsCanonicalIndex
- Phase filter bar not implemented (display-only phase band) — Severity: MEDIUM — Safe to auto-fix: NO (requires new client component)
- Nexus brief not above-fold (it renders below all program cards) — Severity: MEDIUM — Safe to auto-fix: NO (layout restructuring)
- No gate-blocker summary visible at portfolio level — Severity: MEDIUM — Safe to auto-fix: NO

---

### Page 5: Program Detail (/tenant/[slug]/programs/[slug])

**Overall score: 72/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 75 | Zone A: breadcrumb + program header (code, name, eyebrow). Zone B: Context strip (phase, status, deliverable counts). Zone C: Primary workspace with Nexus editorial lead, phase timeline, hard gate strip, deliverables. Zone D: NexusProgramRail + AgentMissionPanel. Zone E: partial — "Open recommended program" CTA not present; no single explicit next-action strip. |
| Five-question test | 70 | Where am I: yes (breadcrumb + code + program name). What matters most: Nexus editorial lead present. What is blocked: hard gate strip shows pending gates. What agent recommends: AgentMissionPanel with Nexus/Sentinel/Steward missions. What is my next action: no single prominent CTA — missions are in the panel but not a top-level action strip. |
| Agent behavior | 75 | Nexus correctly identified. AgentMissionPanel shows missions from Nexus/Sentinel/Steward (correct surface agents). Deterministic disclaimer: "Mission queue is deterministic seed; runtime triggers deferred." Evidence count and confidence not explicitly stated (blueprint requires evidence coverage 36%). |
| Interaction | 65 | ProgramArtifactCanvas and ProgramWorkshopMode provide content. Phase timeline is informational (clicking doesn't navigate to phase — deferred). SourceEventChip linking to AMS event — need to verify present. |
| Data contract | 75 | APX-CDP-2026 seed. Phase state, deliverable tiers, workshop data present. No fake gate approvals. Honest fallback labels used where data is absent. Deterministic caveat in ProgramCanonShell. |
| Workflow | 70 | Six-phase canonical timeline present. Hard gate strip present (4 gates). Deliverable summary. AgentMissionPanel present. Missing: evidence coverage percentage (36%) not shown — blueprint requires this to be visible. |
| Design canon | 70 | Background `#F8F7F4` correct. Georgia serif for program title (h1). DM Sans for body. `#0E9F8C` accent used in ProgramCanonicalDetail COLORS (same issue as Programs Index). |

**Passing:**
- Zone A–D present
- Breadcrumb navigation
- Nexus editorial lead
- Phase timeline (6 phases)
- Hard gate strip
- AgentMissionPanel with correct agents
- Honest fallback labels
- Deterministic caveat

**Failing:**
- **Banned color: `#0E9F8C` used as accent in ProgramCanonicalDetail** — Severity: HIGH — Safe to auto-fix: YES — Recommendation: Replace `accent: '#0E9F8C'` with `'#1B2B5C'` (navy) in COLORS object
- Evidence coverage percentage (36%) not visible in context strip — Severity: MEDIUM — Safe to auto-fix: NO (view-model change needed)
- No single above-fold CTA action strip — Severity: MEDIUM — Safe to auto-fix: NO
- SourceEventChip link to AMS event: present in ProgramCanonicalDetail (via NexusProgramRail / ProgramArtifactCanvas) but not prominently visible as a chip in Zone E — Severity: LOW — Safe to auto-fix: NO

---

### Page 6: Source Event (/source/events/[eventId])

**Overall score: 71/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 75 | Zone A: SourceRouteShell orientation strip with event name and tenant name. SourceCanonShell provides title and summary. Zone B: EventContextStrip in NexusEngagementCanvas. Zone C: SourceJourneyTracker + SourceActiveStageWorkspace. Zone D: SourceStageGatePanel + SourceArtifactStatusStrip + SourceAlertPanel. Zone E: PersistentNexusPanel provides next action. |
| Five-question test | 75 | Where am I: yes (SourceRouteShell strip shows "SOURCE · COMMERCIAL EVENT DETAIL · [tenant]·[eventName]"). What matters most: SourceStageGatePanel. What is blocked: SourceAlertPanel "Event pressure signals". What agent recommends: PersistentNexusPanel. What is my next action: mission strip present. |
| Agent behavior | 75 | Nexus correctly identified via SourceRouteShell ("SOURCE · COMMERCIAL EVENT DETAIL" with NEXUS implied). PersistentNexusPanel present. Evidence basis from stageGateReadiness and artifactStatusStrip. Caveat "Deterministic seed data. No live sourcing signals." |
| Interaction | 65 | Stage journey tracker present. SourceStageGatePanel. Artifact status strip. Missing: SourceCommercialEventSection is mounted separately but its content is unknown without reading it. No tab active state issues visible. |
| Data contract | 70 | DESIGN SYSTEM CONCERN: NexusEngagementCanvas imports from `@/lib/design-system` which contains `teal: '#14B8A6'` and `tealDim`, `tealBorder` tokens. This does not necessarily mean the page renders teal, but it is a dependency risk. Data is from getSourcingEvent (live DB query) not deterministic seed — this is correct for source events but means the page behavior depends on DB seed applied. |
| Workflow | 75 | Stage journey tracker. Stage gate panel. Artifact status. Alert panel. Mission report. Workflow sequence broadly correct. |
| Design canon | 65 | SourceRouteShell background `#FBFAF7` correct. NexusEngagementCanvas uses `EXPERIENCE_COLORS` from design-system.ts which **contains `teal: '#14B8A6'`**. The `EXPERIENCE_COLORS` export includes `accentTeal: '#0E9F8C'`. Direct examination shows the source canvas uses `EXPERIENCE_COLORS.surface`, `EXPERIENCE_COLORS.surfaceWarm`, `EXPERIENCE_COLORS.borderSoft`, `EXPERIENCE_COLORS.textPrimary` — none of these are teal. However the import creates a dependency risk. |

**Passing:**
- Zone A–E present
- Nexus as primary agent
- SourceRouteShell orientation strip with correct labels
- Stage journey tracker
- Stage gate panel with readiness indicators
- Pressure/alert signals panel
- PersistentNexusPanel
- Deterministic caveat present
- No fabricated live procurement claims

**Failing:**
- NexusEngagementCanvas imports from `@/lib/design-system` which contains the banned `teal: '#14B8A6'` token — dependency risk, though direct rendering audit shows no direct teal usage — Severity: MEDIUM — Safe to auto-fix: NO (would require design-system.ts refactor)
- SourceCommercialEventSection content not audited (separate concern) — Severity: LOW — Safe to auto-fix: NO
- No visible deterministic seed caveat on source event page itself (caveat is "Deterministic seed data" in SourceRouteShell but source events are DB-backed, so caveat text is misleading) — Severity: LOW — Safe to auto-fix: YES — Recommendation: Update SourceRouteShell default caveat to clarify data basis

---

### Page 7: Intelligence (/tenant/[slug]/intelligence)

**Overall score: 76/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 80 | Zone A: IntelligenceRouteShell orientation strip ("INTELLIGENCE · PATTERN DETECTION · SENTINEL"). Zone B: OverviewPanel Sentinel brief card (dark navy background). Zone C: IntelligenceLensTabs canvas. Zone D: EvidencePanel and PatternsPanel. Zone E: recommended action section in OverviewPanel. |
| Five-question test | 80 | Where am I: yes (strip shows Intelligence · Sentinel · tenant name). What matters most: Sentinel brief with top pattern and confidence. What is blocked: missing inputs disclosed in PatternsPanel. What agent recommends: "Sentinel recommends" action present in OverviewPanel and EvidencePanel. What is my next action: recommended action strip present. |
| Agent behavior | 80 | Sentinel correctly identified. Deterministic caveat tier-appropriate. Evidence confidence level, interpretation basis, context used — all present in EvidencePanel. Missing inputs disclosed per pattern card. "Ask Sentinel" is NOT the primary affordance — correct per blueprint. |
| Interaction | 75 | 4 tabs present (Overview / Patterns / Evidence / Signals). Blueprint calls for 5 tabs (Summary / Evidence / Programs / Actions / Signals) — **the live tabs differ from the blueprint: "Programs" and "Actions" mode tabs are missing**. URL-param driven tab switching is correct. |
| Data contract | 80 | Deterministic Wave 2 seed. Pattern count, confidence, affected programmes, evidence gaps — all present. Unsupported claims section present. Caveats throughout. |
| Workflow | 75 | Overview → Patterns → Evidence → Signals workflow present. Missing: Programs tab (no cross-reference to programme detail from intelligence) and Actions tab (priority-ordered action list) — blueprint requires both. |
| Design canon | 70 | IntelligenceRouteShell background `#F8F7F4` correct. DM Sans. NavSoft `#1B2B5C` navy. The OverviewPanel Sentinel brief uses `#0F1E3F` dark navy background — this is acceptable (dark navy, not teal, not full-page dark). PatternsPanel uses `C.navy = '#1B2B5C'` — correct. |

**Passing:**
- Sentinel correctly assigned
- Orientation strip with agent identity
- Sentinel brief visible above fold
- Pattern detections visible
- Evidence manifest with confirmed/missing evidence
- Unsupported claims section
- Recommended action present
- Deterministic caveat present and tier-appropriate
- "Ask Sentinel" is NOT the primary affordance (correct)
- No fabricated live analysis claims

**Failing:**
- 4 tabs present (Overview/Patterns/Evidence/Signals) vs 5 required by blueprint (Summary/Evidence/Programs/Actions/Signals) — "Programs" and "Actions" tabs missing — Severity: MEDIUM — Safe to auto-fix: NO (requires new tab panels)
- No cross-reference from intelligence patterns to programme detail — Severity: MEDIUM — Safe to auto-fix: NO
- Patterns mode tab uses "tenantSlug" stub for TenantSeedPlan (workaround with stub plan) — minor correctness concern — Severity: LOW — Safe to auto-fix: NO

---

### Page 8: Control Tower (/tenant/[slug]/tower)

**Overall score: 75/100**

| Dimension | Score | Notes |
|---|---|---|
| Structure (A–E) | 80 | Zone A: TowerRouteShell orientation strip ("ATLAS CONTROL TOWER · SIGNAL INTELLIGENCE · ATLAS"). Zone B: PortfolioPanel Atlas brief (dark navy card). Zone C: TowerLensTabs canvas. Zone D: Scorecard/Pressure signals. Zone E: Per-signal recommended actions from Atlas. |
| Five-question test | 80 | Where am I: yes (strip shows Atlas · Control Tower · tenant name). What matters most: Atlas brief with top pressure. What is blocked: pressure signals with severity. What agent recommends: "Atlas recommends:" present per signal in PressurePanel. What is my next action: recommended action on each pressure card. |
| Agent behavior | 85 | Atlas correctly identified with badge ("ATLAS" in navy). Deterministic caveat present. "Ask Atlas" is not the primary affordance (drawer per blueprint — correct). Evidence basis and interpretation basis present. Signal count, severity, affected programmes — all visible. |
| Interaction | 70 | 4 tabs present (Portfolio / Scorecards / Pressure / Executive Brief). Blueprint calls for 7 lens tabs (Portfolio / Adoption / Value / Risk / Cost / Productivity / Tech/Data Readiness) — **only 4 of 7 lens tabs implemented**. |
| Data contract | 80 | Deterministic Wave 2 seed. Programme signals, pressure cards, scorecard data — all present. No fake live AI ROI claims. Caveat visible. |
| Workflow | 70 | Portfolio → Scorecards → Pressure → Executive Brief flow present. Missing: Adoption, Value, Risk, Cost, Productivity, Tech/Data Readiness lens tabs. |
| Design canon | 75 | TowerRouteShell background `#F8F7F4` correct. DM Sans. Atlas badge in navy (`#1B2B5C`). No teal. Georgia serif in SectionMeta h2 headings. |

**Passing:**
- Atlas correctly assigned with visual badge
- Orientation strip with agent identity
- Atlas portfolio brief above fold
- Pressure signals with per-signal Atlas recommendations
- Scorecard data present
- Executive brief tab
- Deterministic caveat present
- "Ask Atlas" is NOT primary affordance (correct)
- No fabricated live AI ROI claims
- No fake "all green" scorecards

**Failing:**
- Only 4 of 7 blueprint-required lens tabs implemented — missing Adoption, Value, Risk, Cost, Productivity, Tech/Data Readiness — Severity: MEDIUM — Safe to auto-fix: NO (requires new tab panels)
- Tech/Data Readiness tab absent (blueprint requires link to Admin Architecture page) — Severity: MEDIUM — Safe to auto-fix: NO
- Scorecard strip (5 horizontal scorecards per blueprint) not visible above-fold — Scorecards are in a tab, not a persistent strip — Severity: MEDIUM — Safe to auto-fix: NO (layout change)

---

## Auto-fix Plan

| Fix | File | Safe? | Applied? |
|---|---|---|---|
| Replace `color: TEAL` with `color: NAVY` on action column (Admin page line 182) | src/app/(maestro)/platform/admin/page.tsx | YES | PENDING |
| Add `// TODO: wire Approve/Reject click behavior` comment to dead buttons | src/app/(maestro)/platform/admin/page.tsx | YES | PENDING |
| Change `primaryAgent: 'steward'` to `primaryAgent: 'atlas'` in Architecture page + update framing | src/app/(maestro)/platform/admin/architecture/page.tsx | YES | PENDING |
| Replace `#0E9F8C` accent with `#1B2B5C` (navy) in ProgramsCanonicalIndex | src/components/programs/ProgramsCanonicalIndex.tsx | YES | PENDING |
| Replace `accent: '#0E9F8C'` with `'#1B2B5C'` (navy) in ProgramCanonicalDetail | src/components/programs/ProgramCanonicalDetail.tsx | YES | PENDING |
| Add `STEWARD · PRODUCTION READINESS` agent label to orientation area | src/app/(maestro)/platform/admin/production-readiness/page.tsx | YES | PENDING |

---

## Remaining Deviations (not auto-fixed)

| Page | Deviation | Severity | Why not auto-fixed | Recommended wave |
|---|---|---|---|---|
| Admin | Connectors tab absent (blueprint requires deferred connector status) | MEDIUM | Requires new ConnectorRegistryPanel component | Wave 32 |
| Admin | Architecture sub-nav link missing from admin sidebar | MEDIUM | Route navigation change | Wave 32 |
| Admin | Zone E action strip absent (no single top CTA) | MEDIUM | Layout restructuring | Wave 32 |
| Production Readiness | Blocker detail drawer not implemented | MEDIUM | Requires new drawer component | Wave 32 |
| Production Readiness | No drilldown link to Architecture from deployment plane | LOW | Route addition needed | Wave 32 |
| Architecture | Component detail drawer not implemented | LOW | Requires drawer component | Wave 33 |
| Programs Index | Phase filter bar not interactive (display-only phase band) | MEDIUM | Requires new client filter component | Wave 32 |
| Programs Index | Nexus brief not above-fold | MEDIUM | Layout restructuring | Wave 32 |
| Programs Index | No gate-blocker summary at portfolio level | MEDIUM | View-model addition needed | Wave 32 |
| Program Detail | Evidence coverage percentage (36%) not shown | MEDIUM | View-model addition | Wave 32 |
| Program Detail | No above-fold CTA action strip | MEDIUM | Layout restructuring | Wave 32 |
| Source Event | design-system.ts contains banned teal token (dependency risk) | MEDIUM | Design-system refactor needed | Wave 33 |
| Intelligence | Programs and Actions mode tabs absent (4 of 5 tabs) | MEDIUM | New tab panels required | Wave 32 |
| Intelligence | No cross-reference from patterns to programme detail | MEDIUM | Navigation wiring needed | Wave 32 |
| Control Tower | Only 4 of 7 lens tabs implemented | MEDIUM | New tab panels required | Wave 32 |
| Control Tower | Tech/Data Readiness tab and Architecture link absent | MEDIUM | New tab panel required | Wave 32 |
| Control Tower | Scorecard strip not persistent above-fold | MEDIUM | Layout restructuring | Wave 33 |

---

## Next Recommended Wave

**Wave 32 — Agent Surface Completion** should address the medium-severity structural gaps in this order:

1. Programs Index: add interactive phase filter bar (client component)
2. Intelligence: add Programs and Actions lens tabs
3. Control Tower: add Adoption, Value, Risk, Cost, Productivity, Tech/Data Readiness tabs
4. Admin: add Connectors panel with honest deferred status
5. Programs: surface evidence coverage percentage in context strip
6. Production Readiness: wire blocker detail drawer

This wave should be preceded by the auto-fixes applied in WIRE2 (teal token removal, Architecture agent correction).
