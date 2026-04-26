# AbarVa Page Experience Blueprint Standard
**Authority: PX1 · Wave 20**
**Status: Active Standard**

## Purpose

This standard defines the mandatory structure every AbarVa page blueprint must follow before any UI implementation begins. Codex/Code agents must not invent page layouts. Every new route or redesigned route must have a blueprint that satisfies this standard.

## Mandatory Blueprint Sections

Every page blueprint must contain all ten sections below.

### Section 1 — Page Identity
- Route
- Surface (programs / source / intelligence / control_tower / admin / home)
- Primary user (procurement lead / executive / steward admin)
- Primary question answered (one sentence, user's perspective)
- Primary agent anchor (nexus / sentinel / steward / atlas)
- Supporting agents
- Demo data readiness level (rich / partial / thin / shell_only)

### Section 2 — Page Job-to-be-Done
- Why the page exists
- What decision or workflow it moves forward
- What the user should understand in the first 10 seconds

### Section 3 — Data Contract
- Data required for full experience
- Data available today (seeded/deterministic)
- Missing data (what is not yet available)
- Evidence/source basis
- What must not be claimed (false data guard)

### Section 4 — Layout / Wireframe
Text, ASCII, or structured description showing:
- Top shell/nav region
- Page header / agent brief
- Primary workflow canvas
- Side rail / context panel (if applicable)
- Tabs / drawers / drilldowns
- Next action area

### Section 5 — Workflow Sequence
- Step 1 through Step N
- What unlocks the next step
- What blocks progress

### Section 6 — Agent-Centric Requirements
- Agent role on this page
- Context consumed by the agent
- Confidence/evidence state the agent discloses
- Missing inputs the agent surfaces
- Recommended next action the agent provides
- When to show 3 choices + custom
- Low-context disclosure behavior

### Section 7 — Visual Canon
- Approved shell / palette / spacing
- What must be above the fold
- What must be hidden by default (tabs/drawers)
- Banned visual patterns (no teal, no dark full-page, no sparkles, no generic chat-first)

### Section 8 — Interaction Model
- Tabs used for (name them)
- Drawers used for (name them)
- Same-canvas updates
- Drilldowns (where they go)
- Empty state behavior
- Blocked/deferred state behavior

### Section 9 — Acceptance Criteria
- What must be visible (checklist)
- What must be testable
- What must not appear
- What causes design review failure (reference AGENTX enforcement rules)

### Section 10 — Route Ownership
- Active route file (if known)
- Expected shell component
- Expected canonical page components
- Legacy route/shell risk

## Enforcement Cadence

- No UI implementation may begin without a blueprint satisfying this standard.
- Missing blueprint → create blueprint first.
- UI PR final report must include: blueprint followed (yes/no), deviations, design canon (yes/no), agent enforcement (yes/no).
- QA tests must verify blueprint doc exists and includes all 10 sections.

## Acceptance Criteria for a Valid Blueprint

A blueprint satisfies this standard when all ten mandatory sections are present and non-empty.
Each section must include: a primary agent anchor (nexus / sentinel / steward / atlas), a data contract specifying what is seeded vs missing, and an acceptance criteria checklist.

## Agent Anchors

Every blueprint must name a primary agent. Agents: Nexus, Sentinel, Steward, Atlas.
No page blueprint may leave the primary agent field blank.

## Data Contract Requirements

Every blueprint data contract must state:
- What data is required for the full experience
- What data is available today (seeded/deterministic)
- What data is missing
- What must not be claimed (false data guard / caveat)
