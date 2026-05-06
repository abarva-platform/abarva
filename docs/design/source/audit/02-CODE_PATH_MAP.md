# Mode 2 · Code-Path Map
**Audit mode:** 2 of 6  
**Question:** Does the code path that renders Source match the design?  
**Baselines:** `SOURCE_DOSSIER_DIGESTION.md` §§5–6; `SOURCE_DESIGN_V03_RECONCILIATION.md` §§3, 5  
**Output:** This file + gap entries in `SOURCE_GAP_REGISTER.md`  
**Status:** Complete

---

## 1 · Methodology

Investigated:
1. All route handlers in `src/app/(maestro)/source/` and `src/app/api/**/source/**`
2. Core components: `SourceEventDetailPage.tsx`, `SourcePortfolioPage.tsx`, `SourceOriginatePage.tsx`, `SourceValueLedger.tsx`, `ScorecardGovernancePanel.tsx`, `GateCriteriaPanel.tsx`, `SourceDataReadinessPanel.tsx`
3. Data queries in `src/lib/source/queries.ts`
4. Agent route at `src/app/api/chat/agent/route.ts`
5. Nexus ask stub at `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
6. Grep-based searches for: three-choices pattern, context bundle strip, StageTrackerStrip usage, vendor detail routes

---

## 2 · Route inventory

| URL pattern | Handler | Page component | Data queries | Notes |
|---|---|---|---|---|
| `/source` | `source/page.tsx` | `SourcePortfolioPage` | `listSourcingEvents()`, `loadUserSourceAccessPolicy()` | Portfolio with filter strip |
| `/source/new` | `source/new/page.tsx` | `SourceOriginatePage` | `getActiveClientRow()` | Intake form |
| `/source/events` | `source/events/page.tsx` | `SourceIndexPage` | Unknown | Separate events list |
| `/source/events/[eventId]` | `source/events/[eventId]/page.tsx` | `SourceEventDetailPage` | `getSourcingEvent(eventId)`, gate eval | Main canvas (348 lines) |
| `/source/events/[eventId]/scorecard` | `…/scorecard/page.tsx` | `ScorecardGovernancePanel` via `SourceWorkingPane` | `getSourcingEvent(eventId)`, `buildSourceStageGateReadiness()` | Scorecard |
| `/source/events/[eventId]/artifacts/[artifactId]` | `…/artifacts/[artifactId]/page.tsx` | `SourceArtifactDrawer` via `SourceWorkingPane` | `getSourcingEvent()`, `getSourcingEventArtifact()` | Artifact detail |
| `/source/events/[eventId]/report` | `…/report/page.tsx` | Unknown | Unknown | Not in design |
| `/source/compare` | `source/compare/page.tsx` | Unknown | Unknown | Not in design |
| `/source/patterns` | `source/patterns/page.tsx` | Unknown | Unknown | Not in design |
| `/source/patterns/[patternId]` | `source/patterns/[patternId]/page.tsx` | Unknown | Unknown | Not in design |
| `/source/value` | `source/value/page.tsx` | `SourceValueLedger` via `SourceWorkingPane` | `getSourceValueLedger()` | Value ledger |
| `/source/events/[eventId]/vendors/[vendorId]` | **MISSING** | **MISSING** | **MISSING** | **Gap: T10 vendor detail** |

**Finding C-01 (P1):** Vendor detail route (`/source/events/[eventId]/vendors/[vendorId]`) does not exist. Template T10 is entirely unimplemented at the route level. Three routes exist that are not in the v0.3 design: `/report`, `/compare`, `/patterns/[patternId]`.

---

## 3 · Universal Canvas shell audit

### Design requirement (v0.3 T03, reconciliation §3.1)

7 of 11 steps share ONE Universal Canvas shell with:
- ID strip + 11-step rail
- Left chat lane (~360px): agent header + context-bundle strip + chat thread + 3 choices + input
- Right canvas: stage frame + gate panel + artifact shelf + bottom grid

### Code reality

`SourceEventDetailPage.tsx` (main event canvas) uses:
```typescript
const STAGES = [
  'Plan', 'RFI', 'Shortlist', 'RFP', 'Q&A',
  'Initial Bid', 'BAFO', 'Selection', 'Award', 'Onboard',
];
const CURRENT_STAGE = 'BAFO'; // hardcoded
type TabKey = 'summary' | 'pricing' | 'bafo' | 'risk' | 'readiness' | 'missions' | 'signals' | 'program' | 'transition' | 'award';
const TABS = [10 tab definitions];
```

The component renders a **tab-based layout** (10 tabs), not the two-column canvas-shell.

**Finding C-02 (Critical):** Universal Canvas shell does not exist. The design's defining architectural pattern — left chat lane + right canvas — is not implemented. The codebase uses a 10-tab layout in `SourceEventDetailPage.tsx`. This is not a styling gap; it is a structural architecture difference requiring a full component rebuild.

**Finding C-03 (Critical):** Stage names in `SourceEventDetailPage.tsx` are legacy names (Plan, RFI, Shortlist, RFP, Q&A, Initial Bid, BAFO, Selection, Award, Onboard — 10 stages). The canonical 11-stage model (strategy, scope, rfp, responses, evaluation, pricing, bafo, executive_decision, selection, transition, value) from `constants.ts` is NOT used in the event detail component. The `StageTrackerStrip` on this page renders legacy names.

**Finding C-04 (P1):** The current_stage is hardcoded as `'BAFO'` in `SourceEventDetailPage.tsx` line 60. The component does not derive active stage from the event data. Every event detail page will show BAFO as current regardless of the actual event stage.

---

## 4 · Chat lane audit

### Design requirement

Left lane chat with:
- Agent avatar + name + scope status
- Context-bundle strip: "EVENT · STEP N · DATA READINESS X/Y · ARTIFACTS N · VENDORS N · EVIDENCE N"
- Chat thread (agent + user bubbles)
- 3 contextual choices
- Free-text input + send

### Code reality

**Context-bundle strip:** `buildSourceAgentContextBundle()` exists in `SentinelEngagementCanvas.tsx` and creates a bundle string. However, this is used as context data for the agent, not as a visible UI strip in the chat lane. No standalone `ContextBundleStrip` component exists.

**Three-choices pattern:** Grep found this in `NexusProgramWorkbench.tsx` (Strategic Moves) but NOT in any Source component. No `StepChoices` component exists in `src/components/source/`. The dossier's §13.1 #4 requires "three choices plus custom appears where the user needs to move workflow forward" — this is absent in Source.

**Chat input:** `SourceOriginatePage.tsx` has a form-based input (for event creation). The event canvas (`SourceEventDetailPage.tsx`) does not have a persistent chat input in the left lane. `SentinelAgentColumn.tsx` is a right-rail component with predefined A/B/C actions, not a chat lane.

**Finding C-05 (P1):** No context-bundle strip UI exists in Source. The build bundle logic exists in code but is never rendered as a visible strip showing "EVENT · STEP N · DATA READINESS 3/6 · ARTIFACTS 2 · 0 VENDORS · 0 EVIDENCE."

**Finding C-06 (P1):** Three-choices input pattern absent from Source. This is a universal design requirement (§13.1 criterion #4) that every step must have contextual action chips. The Strategic Moves surface has implemented this; Source has not.

---

## 5 · Query layer audit

### `queries.ts` data access pattern

Four seed functions identified at the top of `queries.ts`:
- `getSourceArtifactSeed()` — mock artifact data
- `getSourceEventSeed()` — seeded event
- `getSourceDashboardSeed()` — dashboard
- `getSourceValueSeed()` — value ledger snapshot

All four return deterministic TypeScript fixture data. Live DB query functions also exist:
- `listSourcingEvents(clientKey)` — queries `source_events` table ✓
- `getSourcingEvent(eventId)` — queries by ID ✓
- `createSourcingEvent(input)` — inserts to `source_events` with `current_stage_key='strategy'`

**Finding C-07 (P2):** `createSourcingEvent()` in `queries.ts` sets `current_stage_key='strategy'` on insert. This correctly uses the canonical key, not the legacy 'intake' default that the migration sets. However, events created before this code was written (with 'intake' default from DB) are not normalized on read. The normalization gap (S-07 from Mode 1) is mitigated for new events but not for existing ones.

---

## 6 · Scorecard governance code-path

### Route: `/source/events/[eventId]/scorecard`

Handler calls:
- `getSourcingEvent(eventId)` — loads event with scorecard data
- `buildSourceStageGateReadiness({ event })` — evaluates gate readiness

Renders:
- `SentinelAgentColumn` (right rail, predefined A/B/C actions) — NOT a chat lane
- `ScorecardGovernancePanel` — 7-lifecycle-state panel

### `ScorecardGovernancePanel` capability

The panel tracks a 7-state scorecard lifecycle: `default_generated → client_edited → rationale_added → reviewed → approved → locked → used_for_vendor_evaluation`

It renders:
- Lifecycle strip with state progression
- Criteria table (criterion, status, evidence confidence, owner, rationale)
- Blockers section
- Gate impact card

### Gap vs. design T08

Design T08 shows:
- **Weight set governance table** per criterion (v1 weight → v2 weight → EA council status → Sponsor status → Steward status → state: Locked/Open)
- **Audit trail** (who changed what weight, when, why — e.g., "2H AGO EA council proposed security weight 25% → 30%")
- **Action buttons**: Lock weights · Escalate to sponsor · Run sensitivity report

Current panel has:
- No per-criterion weight display
- No weight change history
- No EA council / Sponsor / Steward sign-off columns
- No sensitivity report CTA

**Finding C-08 (P1):** `ScorecardGovernancePanel` exists but covers the wrong governance model. Current: 7-state lifecycle for the overall scorecard document. Design: per-criterion weight versioning with multi-stakeholder sign-off. These are fundamentally different governance models. The existing panel cannot be extended to match T08 — it would require a new data model and new component.

---

## 7 · Artifact detail code-path

### Route: `/source/events/[eventId]/artifacts/[artifactId]`

Renders `SourceArtifactDrawer` (a drawer component) inside `SourceWorkingPane`. Same layout as scorecard: `SentinelAgentColumn` (right rail) + `SourceWorkingPane` > `SourceArtifactDrawer`.

### Gap vs. design T09

Design T09 specifies a **full-page two-column layout**: left column = document body with section-level completeness tiers (green/amber/gray border indicators) + version history; right rail = metadata (artifact code, step, tier, required, gate-defining) + evidence cited + sign-offs.

Current code uses `SourceArtifactDrawer` — a drawer component rendered as a full-page, not a two-column document + metadata layout.

**Finding C-09 (P1):** Artifact detail page renders a drawer component in a working pane, not the two-column document-body + metadata-rail layout. Document sections with tier indicators, version history, and sign-off panels do not exist. This is a pre-disclosed partial/gap item from dossier §12.

---

## 8 · Value ledger code-path

### Route: `/source/value`

Renders `SourceValueLedger` which shows:
- 4 metric cards (Projected, Committed, Measuring, Realized)
- Table: Perspective · Event · Label · Stage · Amount · Evidence · Confidence
- Assumptions & variance notes
- Evidence confidence summary

### Gap vs. design T11

Design T11 shows:
- Header with aggregate h1: "$44.2M projected · $5.6M committed · $2.07M realized across 4 events"
- 4-stat bar (Projected/Committed/Measuring/Realized) with Fraunces large serif numbers
- Cross-event ledger: Event · Value line · Projected · Committed · Measured · State (with event links)
- Atlas note amber banner

Current implementation:
- `SentinelAgentColumn` (not Atlas) is the agent column — wrong agent for Value step
- Hardcoded quote: "$2.1M sourcing-attributed value confirmed" suggests value figures are fixture
- Column structure differs: current has "Perspective · Event · Label · Stage · Amount · Evidence · Confidence"; design has "Event · Value line · Projected · Committed · Measured · State"
- No 4-stat bar with aggregate header h1

**Finding C-10 (P1):** Value ledger renders with Sentinel as agent (wrong; Atlas is the T11 lead per dossier §2.2 step 11). The column model diverges from design T11. Pre-disclosed partial/gap item, now confirmed gap still open.

---

## 9 · Data readiness code-path

### Component: `SourceDataReadinessPanel`

The component uses 4 evidence usability categories:
- `usable` — usable evidence
- `loaded_not_usable` — loaded but not parsed
- `available_not_validated` — available but not sample-checked
- `low_confidence` — flagged by Sentinel

This is a 4-state internal model, which is not the same as:
- Dossier's 13-state model
- v0.3 design's 7-state ramp (T12)

**Finding C-11 (P2):** `SourceDataReadinessPanel` uses a 4-state model that does not align with either the dossier (13 states) or the v0.3 design (7 states). The T12 drawer specification cannot be satisfied by this component without a state model expansion.

---

## 10 · Gate criteria code-path

### Component: `GateCriteriaPanel`

Uses:
- `GateEvaluation[]` from lifecycle evaluator
- Criterion states: met, partial, unmet, waived
- Renders in "Readiness" tab of `SourceEventDetailPage.tsx`

### Gap vs. design T03/T14

Design:
- Gate panel sits in the RIGHT CANVAS of the universal canvas shell (not in a tab)
- "Open gate detail ↗" link invokes T14 gate detail drawer
- Promote button (disabled until all hard criteria met) is in the gate panel
- T14 drawer shows: criteria list + waiver path + action buttons (Promote / Request waiver / Notify sponsor)

Current code:
- Gate panel is in the "Readiness" tab — one of 10 tabs, not prominently placed
- No "Open gate detail ↗" link to a drawer
- No waiver request flow
- No "Notify sponsor" action
- No gate detail drawer (T14)

**Finding C-12 (P1):** Gate panel is buried in a tab ("Readiness"). Design requires it to be in the always-visible right canvas rail. No T14 gate detail drawer exists. No waiver request flow.

---

## 11 · Portfolio page code-path

### `SourcePortfolioPage`

Stage filters: BAFO, Pricing, Evaluation, Responses (4 of 11)

The `STAGE_FILTERS` array in `SourcePortfolioPage.tsx`:
```typescript
const STAGE_FILTERS = [
  { key: 'bafo', label: 'BAFO' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'responses', label: 'Responses' },
];
```

Missing from design T01: strategy, scope, rfp, executive_decision, selection, transition, value (7 missing).

The portfolio table uses `SourcingEventTable` — column structure not fully confirmed but does NOT include the 11-step mini-rail, blocker text, or value-at-stake columns from T01.

**Finding C-13 (P1):** Portfolio filter row has 4 stage filters vs. design's 11. Missing 7 stage filter pills.

---

## 12 · Dead code inventory

Files that appear to be legacy or unused:
- `SourceIndexPage.tsx` — `/source/events` route; separate from portfolio, purpose unclear vs. `/source` portfolio
- `SourceEventsPortfolio.tsx` — mentioned in `SourcePortfolioPage` as "legacy grid"; appears to be a superseded component
- `SourceCommercialHub.tsx`, `SourceCommercialWorkflowCanvas.tsx` — may be superseded by current tab layout

**Finding C-14 (P3):** Several legacy components exist alongside current components. `SourceEventsPortfolio.tsx` is referenced as "legacy grid in collapsed details" in `SourcePortfolioPage.tsx`. Not blocking but adds maintenance overhead.

---

## 13 · Agent route Source scoping

### `src/app/api/chat/agent/route.ts`

Loads:
- `AGENT_DEMO_SYSTEM_BLOCK` (AbarVa 7-phase model, 6 programs, phases, patterns, Tower pressures)
- `buildTenantContextBlock()` — persisted tenant context
- `buildTenantTechnologyContextBlock()` — tech stack
- User access policies (program + source)
- Phase packs + stage packs
- Voice doctrines: Sentinel, Nexus, Atlas, Steward
- Tool registry

The agent route does load Source-specific context (`source access policy`, `stage packs`) and all four agent voice doctrines. This is positive — the agent route is not Source-ignorant.

However, the `AGENT_DEMO_SYSTEM_BLOCK` injects "AbarVa 7-phase model, 6 programs, phases, patterns, Tower pressures" — this is a Programs surface block, not Source-specific. Source-specific step context (current step, gate state, data readiness) must come through `surfaceContext` which is passed from the page component to `AppShell` to the agent route.

**Finding C-15 (P2):** The agent chat route loads a Programs-context system block (`AGENT_DEMO_SYSTEM_BLOCK`) that contains Programs surface doctrine. Source-specific step/gate/evidence context is secondary, injected via `surfaceContext` props. Whether the current step, gate state, data readiness, and artifact count reach the agent in a Source conversation is uncertain without Mode 4 investigation.

---

## 14 · Nexus ask stub

### `POST /api/v1/source/[eventId]/nexus/ask`

Returns a deterministic stub response via `createSourceNexusApiStubResponse()`. No live model inference. This is correct behavior per the dossier's §15.2 #10 ("do not make model calls until model gateway, context builder, evidence ledger, and safety posture are ready").

**Finding C-16 ✓ (Compliant):** Nexus ask endpoint is correctly a stub. No forbidden live model calls.

---

## 15 · Summary: Universal Canvas shell consistency

The audit prompt requires verification that "the Universal Canvas shell is implemented as ONE shell consumed by 7 step contexts (NOT 7 near-copies)." The finding is starker:

**The Universal Canvas shell does not exist at all.** There is no `UniversalCanvasShell.tsx` or equivalent. The 7 steps that should use it all hit `SourceEventDetailPage.tsx` which is a tab-based layout. Steps 5/6/8/11 (bespoke variants) also hit the same tab layout — there are no bespoke variants implemented.

---

## 16 · Gap register entries (Mode 2)

| Gap ID | Severity | Layer | Description | Recommendation |
|---|---|---|---|---|
| C-01 | P1 | Code | Vendor detail route `/vendors/[vendorId]` entirely missing | Create route + page when T10 is implemented |
| C-02 | Critical | Code | Universal Canvas shell absent — tab layout used instead of chat-lane + canvas | Rebuild `SourceEventDetailPage.tsx` per T03 architecture |
| C-03 | Critical | Code | Stage names in event detail: legacy 10-stage names, not canonical 11 | Replace hardcoded `STAGES` array with `SOURCE_STAGE_ORDER` from constants |
| C-04 | P1 | Code | `CURRENT_STAGE = 'BAFO'` hardcoded — all events show BAFO regardless of actual stage | Derive from `event.currentStageKey` via `normalizeSourceStageKey()` |
| C-05 | P1 | Code | No context-bundle strip rendered in any Source component | Build `ContextBundleStrip` component for chat lane head |
| C-06 | P1 | Code | Three-choices input pattern absent | Build `StepChoices` component that resolves to step-specific choices per `STEP_CHOICES_MAP` |
| C-07 | P2 | Code | Existing events with legacy `current_stage_key='intake'` not normalized on read | Add normalization call in `getSourcingEvent()` or `listSourcingEvents()` |
| C-08 | P1 | Code | `ScorecardGovernancePanel` tracks wrong governance model (lifecycle state vs. per-criterion weight versioning) | Rebuild panel for T08: weight table + change audit trail |
| C-09 | P1 | Code | Artifact detail renders drawer in working pane; design requires full-page 2-col layout | Rebuild artifact detail page per T09 |
| C-10 | P1 | Code | Value ledger uses Sentinel as agent; design requires Atlas for Step 11. Column model diverges from T11 | Change agent to Atlas; update column structure |
| C-11 | P2 | Code | Data readiness panel: 4-state model, not 7 (design) or 13 (dossier) | Align state model with dossier 13-state vocabulary; update T12 drawer |
| C-12 | P1 | Code | Gate panel in Readiness tab; design requires it in always-visible right canvas rail | Move gate panel to canvas rail; build T14 gate detail drawer + waiver flow |
| C-13 | P1 | Code | Portfolio: 4 stage filter pills vs. 11 required | Add 7 missing stage filter pills |
| C-14 | P3 | Code | Legacy components (`SourceEventsPortfolio`, `SourceIndexPage`, `SourceCommercialHub`) coexist with current | Audit and remove dead code post-implementation |
| C-15 | P2 | Code | Agent route injects Programs-context system block; Source step context may not reach agent | Verify in Mode 4 that Source-specific step/gate/evidence data reaches agent context |
| C-16 | ✓ | Code | Nexus ask endpoint is correctly a stub | No action needed |

---

## 17 · Mode 2 sign-off

- [x] All Source route handlers mapped
- [x] Core page components analyzed
- [x] Universal Canvas shell consistency verified (finding: does not exist)
- [x] Bespoke step variants verified (finding: none implemented)
- [x] Chat-lane position verified (finding: no chat lane)
- [x] Three-choices pattern verified (finding: absent)
- [x] Context bundle strip verified (finding: absent)
- [x] Drawer infrastructure verified (finding: no T12/T13/T14 drawers)
- [x] Agent route verified for Source scoping
- [x] Dead code inventoried
- [x] All findings logged to gap register
- [x] No `src/` files modified
