# ADMIN12 — Agent Readiness Depth

## Metadata
- ID: ADMIN12
- Title: Agent Readiness depth — per-agent expandable cards + capability matrix + reasoning trace drawer
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, AGENT1
- Estimated complexity: M

## Purpose
Make `/admin/agent-readiness` the inspection surface for AGENT1's pure read-model. Render Steward / Nexus / Sentinel / Atlas as expandable cards with posture + context coverage % + evidence-strength heatmap, plus a capability matrix (agents × surfaces) and a reasoning-trace drawer.

## Context
AGENT1 ships posture / editorial / choices for 4 agents across 5 surfaces. There is no current way to see at a glance which agent is wired where, what the most recent reasoning trace was, or which context-bundle keys are populated for a given page. ADMIN12 surfaces this without invoking any live model — pure deterministic inspection of AGENT1's read-model output.

## Target state
- `/admin/agent-readiness` has 3 sub-tabs: Postures (default) / Capability Matrix / Reasoning Traces.
- Posture tab: 4 expandable cards (Steward/Nexus/Sentinel/Atlas), each showing posture status, context coverage %, evidence-strength heatmap.
- Capability Matrix tab: rows = 4 agents, columns = 5 surfaces (Programs / Source / Intelligence / Tower / Admin); cells = wired / partial / not wired.
- Reasoning Traces tab: list of last 5 editorial outputs per agent; click row → drawer with full template-generated copy + which context-bundle keys fed it.
- Run readiness check button rendered as STUB (disabled).

## Allowed files
- `src/app/(maestro)/admin/agent-readiness/page.tsx`
- `src/lib/admin/agent-readiness-page-view.ts` (new view-model)
- `src/components/admin/agent-readiness/AgentPostureCard.tsx` (new)
- `src/components/admin/agent-readiness/CapabilityMatrix.tsx` (new)
- `src/components/admin/agent-readiness/ReasoningTraceList.tsx` (new)
- `src/components/admin/agent-readiness/ReasoningTraceDrawer.tsx` (new)
- `src/__tests__/integration/admin/admin12-agent-readiness-depth.test.ts` (new)
- `docs/build/slices/ADMIN12_AGENT_READINESS_DEPTH.md`

## Forbidden files
- `src/lib/agent/**` — AGENT1 foundation untouched (we read, not modify)
- Other admin pages
- Any live model call

## Implementation scope
1. View-model reads AGENT1's `computeAllPostures` output for current tenant + surface set + page set.
2. Posture card: expand-collapse on click, shows posture color + context coverage bar + heatmap of evidence categories.
3. Capability matrix renders as a 4×5 grid with color-coded cells.
4. Reasoning trace list deterministic-seeds last 5 traces per agent (NOT a real audit log — Wave 27).
5. Trace drawer: shows full editorial template output + which context-bundle keys were referenced.

## Tests
- Posture cards render for all 4 agents.
- Capability matrix shows correct wired-state for each (agent, surface) pair.
- Trace drawer opens on row click, closes on backdrop.
- Run readiness check button disabled with reason.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/agent-readiness src/app/\(maestro\)/admin/agent-readiness
npx jest src/__tests__/integration/admin/admin12-agent-readiness-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 3 tabs render.
2. 4 posture cards show real AGENT1 read-model output.
3. Capability matrix is honest (no fabricated "wired" states).
4. Trace drawer shows actual editorial template output (not random text).
5. ADMIN7 visual-lock passes.

## Risks
- Capability matrix risks lying about wired state if it doesn't read from a single source of truth; ground each cell on `whichSurfacesUseAgent(agent)` from the AGENT1 module.

## Founder review
Visit `/admin/agent-readiness`. Expand a posture card → see context coverage and heatmap. Switch to Capability Matrix → see 4×5 grid. Open a trace → drawer shows the editorial template.
