# C17 · Program Detail Page · 5-Phase Visualization

**The single most demo-critical logged-in page. Where *"the engagement is the product"* becomes concrete. When Prat clicks into an active program on Apex, this is what he sees — the 5-phase framework with hard gates, active deliverables, agent choreography, and stakeholder orchestration — all in one coherent surface.**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- `c11-composite-home-template.md` — home page that links into program detail
- Existing 5-phase framework specification in BUILD_v2.md and platform architecture v4
- Per-tenant intelligence overlays for realistic program content

---

## Part 1 · What this page is

### 1.1 · The core Nexus experience

Every engagement on AbarVa is a program. Every program runs through the 5-phase framework (Intake, Situation, Strategy, Decision, Execution). Every phase has gates, deliverables, agent work, and executive touchpoints. This page is where all of that becomes visible in one coherent view.

This is the page Prat spends the most time on during the demo. It must feel:
- **Visually structured** — the 5 phases laid out clearly, not a generic task list
- **Informationally dense** — enough signal to understand program health without drowning
- **Action-oriented** — what happens next is clear
- **Intellectually serious** — gates aren't arbitrary checkboxes, they represent actual decision points

### 1.2 · The three views on this page

The program detail page supports three conceptual views, accessed as tabs or scroll sections:

**View A · Journey.** The 5-phase visualization with current phase highlighted, gates status, and phase-by-phase deliverable preview. This is the default view.

**View B · Stream.** A chronological stream of program activity — deliverables completed, decisions made, commitments landed, interventions surfaced. For users who want time-ordered context.

**View C · Stakeholders.** Who's involved in this program, what their current engagement looks like, what commitments sit with whom. For program managers and sponsors.

---

## Part 2 · Page header

### 2.1 · Structure

**Top row.**
- Breadcrumb: `Portfolio / [Program Name]` (DM Sans 12px teal, breadcrumb style)
- Program health indicator (subtle: "On track" / "Attention" / "At risk" in teal/amber/soft-red, JetBrains Mono 11px uppercase)

**Title row.**
- Program name (Georgia 32-36px white)
- Archetype label (JetBrains Mono 11px teal uppercase): "STRATEGIC TRANSFORMATION" or "WORKFLOW AUTOMATION" etc.

**Meta row (compact, DM Sans 13px warm off-white 70% opacity).**
- Sponsor: [Name] (linked to executive profile)
- Started: [Date]
- Current phase: [Phase N · Name]
- Target completion: [Date]

**Quick actions (right side).**
- "Generate briefing for sponsor"
- "Schedule next review"
- "Export status" (drops lower priority)

### 2.2 · View tabs

Horizontal tab bar below header:
- Journey (default)
- Stream
- Stakeholders

Active tab: white text, teal underline
Inactive tabs: warm off-white 70% opacity, no underline
Click switches view without full page reload

---

## Part 3 · View A · Journey

The primary visualization. The 5 phases rendered as a horizontal sequence (or vertical on mobile).

### 3.1 · Phase rendering

Each phase as a card in sequence:

**Phase card structure (when desktop):**
- Card width: ~20% of row, with gaps
- Vertical orientation within card
- Top: phase number + name
- Middle: phase status indicator
- Lower middle: deliverable summary
- Bottom: gate status

**Phase card states:**
- **Completed:** teal accent, checkmark indicator, reduced opacity text
- **Current:** teal highlight border, full opacity, "In progress" indicator
- **Upcoming:** muted (lower opacity), dashed border, "Upcoming" indicator
- **Blocked:** amber accent, "Blocked at gate" indicator (rare)

**Per-phase card content:**
- Phase number (JetBrains Mono 11px teal: "PHASE 1")
- Phase name (DM Sans 14px 700 white): "Intake" / "Situation" / "Strategy" / "Decision" / "Execution"
- Phase description (DM Sans 12px warm off-white, 1 line): brief summary of what this phase does
- Status indicator (text or icon)
- Deliverable count ("3 of 3 complete" or "1 of 4 in progress")
- Gate status ("Gate open" / "Gate pending review" / "Gate passed")

### 3.2 · Phase connection indicators

Between phases, subtle arrow or line indicator showing direction of flow. Hard gates shown with distinct treatment (small gate icon or label).

### 3.3 · Current phase expansion

When a phase is current (in progress), it expands to show:
- List of deliverables in this phase (each as a row)
  - Deliverable name
  - Status ("Draft" / "In review" / "Complete")
  - Owner (executive or agent)
  - Last updated timestamp
- Next gate requirements
- What's blocking (if anything)

**Per-deliverable interaction:**
- Click row → open deliverable viewer (C19, future)
- Inline preview on hover (optional)

### 3.4 · Mobile layout

On mobile, phases render as a vertical sequence. Each phase is a full-width card. Current phase expands; others collapsed by default. Tap to expand any phase.

### 3.5 · Agent choreography indicator

Subtle indicator showing which agents are currently active on this program:
- Nexus (always present — Programs)
- Sentinel (active during Situation phase)
- Atlas (active during Strategy phase)
- Steward (always present — platform orchestration)

Rendered as a compact row: agent name badges with activity indicator (solid when active, dimmed when idle).

---

## Part 4 · View B · Stream

Time-ordered activity feed.

### 4.1 · Structure

Single-column chronological stream (newest first). Each event as a row:

**Per-event structure:**
- Timestamp (JetBrains Mono 11px teal: "APR 21 · 9:42 AM")
- Event type (small label: "DELIVERABLE" / "DECISION" / "COMMITMENT" / "INTERVENTION" / "GATE")
- Event headline (DM Sans 14px 500 white)
- Event description (DM Sans 13px warm off-white, 1-2 lines)
- Entity links (clickable, navigate to related entities)

### 4.2 · Event types

- **Deliverable completed:** "[Deliverable name] completed by [Agent/Person]"
- **Decision made:** "[Decision summary] decided · [Owner]"
- **Commitment landed:** "[Commitment] set · [Owner] by [Date]"
- **Intervention surfaced:** "Pattern match: [Pattern name] · [Confidence]"
- **Gate transitioned:** "Passed Gate [N] · [Phase name]"
- **Stakeholder joined:** "[Person] added as [role]"
- **Sponsor interaction:** "[Sponsor] reviewed [artifact] · [Duration]"

### 4.3 · Filtering

Above stream:
- Filter by event type (multi-select)
- Filter by date range
- Search within stream

### 4.4 · Infinite scroll

Load ~30 events initially; scroll loads more. Streams can be long for mature programs.

---

## Part 5 · View C · Stakeholders

Who's involved, what's their engagement.

### 5.1 · Structure

Grid of stakeholder cards (larger than home page stakeholder lens):

**Per-stakeholder card:**
- Avatar / initials
- Name (DM Sans 15px 700 white)
- Role in program (DM Sans 12px teal: "SPONSOR" / "EXECUTIVE LEAD" / "ADVISORY" / "PROGRAM MANAGER")
- Title and org (DM Sans 13px warm off-white)
- Engagement indicator (DM Sans 12px):
  - "Actively engaged · 5 touchpoints this week"
  - "Light engagement · 1 touchpoint this week"
  - "Dormant · 14 days since last touch"
- Current commitments (small list of 1-3 most relevant)
- Next expected interaction

**Click card:** navigate to executive profile (C12)

### 5.2 · Sort and filter

- Sort by role, engagement level, last touch
- Filter by role type

### 5.3 · Add stakeholder affordance

Small "Add stakeholder" button (for program managers). Opens a flow to select from existing executives in the tenant.

---

## Part 6 · Gate detail modal (accessible from journey view)

Clicking on a gate (especially a current or upcoming one) opens a modal with gate-specific detail:

### 6.1 · Modal structure

- Gate name (Georgia 22px white)
- Phase context (JetBrains Mono 11px teal)
- Gate description (DM Sans 14px warm off-white)
- Gate requirements (checklist style — each requirement as a row with status)
- Evidence supporting each requirement
- Decision maker (executive responsible for passing gate)
- Timeline (when gate expected to transition)

### 6.2 · Interactions

- Mark requirement as met (for authorized users)
- Add evidence to requirement
- Comment / discussion thread (future)

---

## Part 7 · Design system

Matches the rest of the logged-in surface (C11, C12, C21). Same typography, color, motion discipline.

**Specific discipline for this page:**
- Gate indicators must be visually distinct from ordinary state changes — they're structurally important
- Phase cards use subtle elevation to distinguish current from completed/upcoming
- The 5-phase horizontal arrangement on desktop is the page's visual signature — make it striking
- Mobile adaptation shouldn't feel like a compromised view; the vertical sequence should feel natural

---

## Part 8 · Data dependencies

### 8.1 · Program data

- **Source:** programs/initiatives schema from existing AbarVa data model
- **Fields used:** program metadata, phase state, deliverables, gates, stakeholders, activity log

### 8.2 · Deliverable data

- **Source:** deliverables table linked to programs
- **Fields used:** name, status, owner, completion timestamp, evidence references

### 8.3 · Stakeholder data

- **Source:** program-stakeholder relationship table joined with executive profiles (C12)
- **Fields used:** role, engagement metrics, commitments, interaction log

### 8.4 · Activity stream

- **Source:** program activity log (writes from nexus, sentinel, atlas, steward agents + user actions)
- **Aggregation:** composited into stream view

---

## Part 9 · Implementation specs

### 9.1 · Routing

- `/app/t/[tenant-id]/programs/[program-id]` — primary route
- Tab state: `?view=journey|stream|stakeholders` (default journey)
- Gate modal: `?gate=[gate-id]` appended to URL for shareability

### 9.2 · Component hierarchy

```
<ProgramDetailPage>
  <ProgramHeader program={program} />
  <ViewTabs currentView={view} onChange={setView} />
  {view === "journey" && <JourneyView phases={program.phases} currentPhase={program.currentPhase} />}
  {view === "stream" && <StreamView events={program.events} />}
  {view === "stakeholders" && <StakeholdersView stakeholders={program.stakeholders} />}
  {gateModalOpen && <GateDetailModal gate={selectedGate} />}
</ProgramDetailPage>
```

### 9.3 · Performance

- Server-render program header and default journey view
- Lazy-load stream and stakeholders when tab is selected
- Stream pagination for long programs

### 9.4 · Interactions

- Deliverable rows clickable (navigate to deliverable viewer when C19 lands; placeholder for now)
- Stakeholder cards clickable (navigate to C12 executive profile)
- Gate clickable (opens modal)
- Entity mentions throughout clickable (navigate to respective entity detail pages)

---

## Part 10 · Edge cases

### 10.1 · Program in phase 1 (just started)

Only phase 1 populated; others upcoming. Visual treatment handles this gracefully — phases 2-5 muted but visible.

### 10.2 · Program completed (all 5 phases done)

All phases completed. Header shows "Program complete" status. Journey view shows completion state; stream shows full history.

### 10.3 · Program blocked at a gate

Phase 3 current, gate requirements not met, Phase 4 not started. Visual indicator shows block clearly.

### 10.4 · Program with many deliverables

Some phases have 10+ deliverables. List should scroll within the expanded phase card or paginate.

### 10.5 · Sparse stream

Early-stage program with few events. Empty state in stream with helper text.

---

## Part 11 · Testing

### 11.1 · Visual regression

- All three view modes at desktop/tablet/mobile
- Program in each phase (1 through 5)
- Completed, blocked, normal states

### 11.2 · Interaction tests

- View tab switching
- Phase card expansion
- Deliverable row click
- Stakeholder card click
- Gate modal open/close
- Stream filtering

### 11.3 · Data loading tests

- Full program with all data
- Sparse program
- Long stream (infinite scroll)

---

## Part 12 · Non-goals

- No inline editing of program structure (done elsewhere by program manager)
- No real-time collaborative cursors (future if needed)
- No program creation wizard (intake flow is separate — handled via Maestro conversational surface)
- No custom phase frameworks (5-phase is the opinionated framework; other archetypes share gate structure)
- No Gantt chart visualization (deliberately not a PM tool)

---

## Part 13 · Ingestion notes for Codex

### 13.1 · Existing 5-phase specification

The 5-phase framework is already specified in `BUILD_v2.md` and platform architecture v4. This page makes that specification visible. Reference the existing framework for phase definitions, gate requirements, and deliverable types.

### 13.2 · Demo-critical page

This is one of the highest-value pages for the Prat demo. Design execution must be meticulous. The 5-phase visualization is AbarVa's visual signature in the product — it should feel distinctive, not generic.

### 13.3 · Agent work visibility

The agent choreography indicator (Part 3.5) makes visible what's happening behind the scenes. Keep it subtle but present — don't hide the agents, but don't anthropomorphize them either.

### 13.4 · Coordination with other wave 3 pages

- Deliverable click → C19 deliverable viewer (future)
- Stakeholder click → C12 executive profile (this wave)
- Sponsor click → C12 executive profile
- Gate modal accessible from this page; not a separate route

---

**END C17 · PROGRAM DETAIL PAGE · 5-PHASE VISUALIZATION**

*The core Nexus experience. Where "the engagement is the product" becomes visible in one coherent surface. Most demo-critical logged-in page.*
