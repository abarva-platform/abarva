# AG12 - Agent Mission Surface Wiring

Slice ID: AG12
Slice name: Agent Mission Surface Wiring
Status: code_complete
Authored: 2026-04-25
Primary agent: Builder
Parallel build pack: Lane B (mission surface wiring)

## Purpose

AG12 mounts the [AG11 Agent Mission UI Panel](./AG11_AGENT_MISSION_UI_PANEL.md)
into the four canonical AbarVa product surfaces - Programs, AI Control
Tower, Intelligence, and Admin Setup - and projects the
[AG10 deterministic mission queue](./AG10_AGENT_MISSION_QUEUE_READ_MODEL.md)
into each mount. Until AG12 lands, AG11 ships the panel primitive but
no surface mounts it; AG10 ships the queue read model but no surface
consumes it. AG12 closes the seam without changing either dependency.

AG12 is server-component-only, calls no live runtime, and changes no
auth, persistence, or model code paths. It introduces no new lib
modules; it adds inline view helpers at each mount site that map the
AG10 `AgentMission` shape onto the AG11 `AgentMissionPanelMission`
shape. The mission queue continues to be a frozen deterministic seed.

## Why AG12 exists as its own slice

AG10 (queue) and AG11 (panel) were authored as parallel lanes of the
batch precisely so a single slice could not balloon: AG10 owns the
type partition and the seed; AG11 owns the visual canon and five
variants; AG12 owns the integration. Splitting integration off keeps
the queue and panel reviewable as small contract slices and keeps the
review of "what got mounted where" in one place.

## Wiring matrix

Each row is a single mount. The variant per surface is set per the
[AbarVa Agent Activity UI Pattern (File 16)](../../platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md)
recommendation for that surface.

| Surface       | Component file                                           | AG11 variant            | Surface label       | Allowed agents (filter)         |
|---------------|----------------------------------------------------------|-------------------------|---------------------|----------------------------------|
| Programs      | `src/components/programs/ProgramCanonicalDetail.tsx`     | `right_panel`           | `Program detail`    | `nexus`, `sentinel`, `steward`   |
| Tower         | `src/components/tower/ProgramPressureCards.tsx`          | `executive_brief`       | `AI Control Tower`  | `atlas`, `steward`               |
| Intelligence  | `src/components/intelligence/SentinelActivePatterns.tsx` | `inline_recommendation` | `Sentinel Brief`    | `sentinel`, `nexus`              |
| Admin         | `src/components/admin/StewardSetupControlCenter.tsx`     | `compact_strip`         | `Admin Setup`       | `steward`                        |

The four files were chosen by inspection on this worktree at
`HEAD = bfab2f6`; no surface was missing. No fallback discovery was
required.

## Cap-at-3 rule

Every surface caps the visible mission list at three missions. The
rule is enforced in two ways at each call site:

1. `getTopAgentMissions(filtered, 3)` from AG10 sorts by priority
   (`critical` < `high` < `medium` < `low`) and breaks ties by
   ascending mission id, then truncates to three.
2. `.slice(0, 3)` on the result, as a defensive belt-and-suspenders
   so the integration test can grep a literal cap on every file.

The cap exists because each surface already carries a primary brief
or pressure rail; the mission panel is meant to surface the next
deterministic action, not flood the surface with every queued item.
File 16 explicitly calls out calm, data-forward density.

## Per-surface decisions

### Programs - `right_panel`

The Programs canonical detail page (`ProgramCanonicalDetail.tsx`)
already mounts the Nexus editorial lead, the six-phase timeline, the
four hard-gate strip, the Steward readiness note, and the PW1 / PDEL5
shells. The mission panel is mounted **immediately before** the PW1
Program Workshop Mode shell so the "what to do next" frame is visible
above the workshop and artifact mounts. `right_panel` is the right
variant here because the Programs surface is detail-dense and the
panel renders as a vertical card list with agent badges, type and
priority chips, two-line rationales, and recommended-action callouts.

The agent filter is `{ nexus, sentinel, steward }`: Atlas missions are
intentionally suppressed on the Programs detail page because Atlas
operates at the portfolio level, not the per-program level.

### Tower - `executive_brief`

`ProgramPressureCards.tsx` already mounts an Atlas executive brief and
a strip of pressure metrics. The mission panel is mounted
**immediately before** the Atlas brief so the deterministic mission
list anchors the executive frame. `executive_brief` is the correct
variant here: it renders a NAVY-topped card with a summary stat row
(missions queued, critical, high, distinct agents) and the top three
missions with full executive framing.

The agent filter is `{ atlas, steward }`: Atlas owns the portfolio
brief and Steward owns governance escalations. Nexus and Sentinel
missions belong on Programs and Intelligence respectively and are
suppressed here.

### Intelligence - `inline_recommendation`

`SentinelActivePatterns.tsx` already mounts a Sentinel brief and a
grid of active pattern cards. The mission panel is mounted
**immediately before** the Sentinel brief so the deterministic
recommendation lands at the top of the surface. `inline_recommendation`
is the correct variant here: it renders a single, NAVY-edged inline
mission with an agent badge, priority chip, one-line rationale, and a
recommended action - the right density for a brief surface.

The agent filter is `{ sentinel, nexus }`: Sentinel owns the pattern
detection mission and Nexus owns the next-action recommendation that
follows once a pattern is confirmed.

### Admin - `compact_strip`

`StewardSetupControlCenter.tsx` already mounts the Steward brief, the
readiness cards, the dataset explorer, and the recommended actions.
The mission panel is mounted **immediately before** the Steward brief
as a horizontal strip. `compact_strip` is the right variant here: it
renders a <= 60 px tall row with the mission count, an agent badge per
mission, the top mission label, and the honest disclaimer - perfect
for an admin home that already carries dense readiness signals.

The agent filter is `{ steward }`: only Steward missions surface on
the admin setup home. Nexus / Sentinel / Atlas data-readiness asks
remain visible through their own surfaces; the admin strip stays
narrow.

## View-helper pattern

Each surface defines an inline `build<Surface>AgentMissionView()` and
a small mapper `map<Surface>MissionToPanel(mission)` next to the
component. The mapper is field-by-field on purpose: AG10's
`AgentMission` and AG11's `AgentMissionPanelMission` are *aligned*
shapes (the type partitions match) but not the same type, so the
inline mapper makes the projection explicit and lets either side
evolve without breaking the other. The mapper:

- Copies `id`, `agent`, `type`, `state`, `priority` directly.
- Projects `workObject.label` -> `workObjectLabel`.
- Copies `rationale`, `recommendedAction`, `stopCondition` directly.
- Collapses `handoff` (object or null) -> `handoffTo` (agent or null).

The projection contains no `Date.now`, `Math.random`, `new Date(`,
or `fetch(`; no `'use client'`; no client hooks; no anthropic / openai
imports.

## Files touched

```
src/components/programs/ProgramCanonicalDetail.tsx
src/components/tower/ProgramPressureCards.tsx
src/components/intelligence/SentinelActivePatterns.tsx
src/components/admin/StewardSetupControlCenter.tsx
src/__tests__/integration/agents/agent-mission-surface-wiring.test.ts
docs/build/slices/AG12_AGENT_MISSION_SURFACE_WIRING.md
docs/build/build-slices.json
docs/build/production-readiness.json
```

## Tests

[src/__tests__/integration/agents/agent-mission-surface-wiring.test.ts](../../../src/__tests__/integration/agents/agent-mission-surface-wiring.test.ts)
covers:

- Each of the four surface files imports `AgentMissionPanel` from
  `@/components/agents/AgentMissionPanel`.
- Each surface file references `buildAgentMissionsForSurface` from
  `@/lib/agents/agent-mission-queue`.
- Each surface file caps the visible list at three missions
  (literal `.slice(0, 3)` or `getTopAgentMissions(..., 3)`).
- Each surface file declares the AG11 `variant` literal that matches
  the wiring matrix above (`right_panel`, `executive_brief`,
  `inline_recommendation`, `compact_strip`).
- Each surface file declares the AG12 surface label string verbatim
  (`Program detail`, `AI Control Tower`, `Sentinel Brief`,
  `Admin Setup`).
- Each surface file mounts `<AgentMissionPanel ... />` exactly once.
- Runtime sanity: AG10 returns at least one mission for each
  agent-filtered surface, every mission's `workObject.surface`
  matches the expected surface, and the cap-3 invariant holds.
- Module hygiene: no `'use client'`, no `useState` / `useEffect`,
  no `Date.now` / `new Date(` / `Math.random` / `fetch(` in
  executable code (comments and string literals are stripped before
  the regex check), no anthropic / openai imports, no `Coming soon`
  / `TBD` / `Lorem ipsum`.

## Validation

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/agents/agent-mission-surface-wiring.test.ts
npx jest src/__tests__/integration/agents/agent-mission-queue.test.ts
npx jest src/__tests__/integration/agents/agent-mission-panel.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Acceptance criteria mapping

- AG12 mounts AG11 in all four canonical surfaces with the variants
  defined in the wiring matrix - asserted by the surface-grep tests
  for `<AgentMissionPanel`, the `variant` literal, and the surface
  label.
- AG12 projects the AG10 deterministic queue into each mount via
  `buildAgentMissionsForSurface(<surface>)`, filters to the spec
  agents, and caps at 3 - asserted by the import grep, the cap grep,
  and the AG10 runtime sanity tests.
- AG12 introduces no new lib module - the mappers are inline at each
  mount site; the integration test imports only AG10 and reads the
  four surface files via `fs.readFileSync`.
- AG12 introduces no `'use client'`, no client hooks, no
  `Date.now` / `new Date(` / `Math.random` / `fetch(` in executable
  code, no anthropic / openai imports, no banned placeholder
  language - asserted by the module hygiene block.
- AG12 production readiness manifest update appends notes to
  `agent_runtime`, `programs`, `ai_control_tower`, `intelligence`,
  and `admin_setup` and bumps `lastUpdated`; no component status is
  promoted - asserted via `python3 -c "import json; ..."`.

## What is intentionally not in AG12

- No new lib module. The view helpers are inline at each mount site.
- No live agent runtime. The panel still renders a frozen seed.
- No model call. The Model Gateway boundary is unchanged.
- No persistence. No mission state is written to any database.
- No auth change. No tenant scoping is introduced or modified.
- No client interactivity. The panel remains a server component.
- No mounting on the Source surface. AG10 has Source missions and
  AG11 has the variants for them; the Source UI mount is left to a
  future slice that pairs with the sourcing event canon.
- No CI gating. The hygiene asserts are local-jest only.

## Future slices

- AG13 (suggested name): Source surface mount of the mission panel
  paired with vendor-response and sourcing-event work objects.
- AG14 (suggested name): Live mission queue trigger wiring once the
  Model Gateway and audit ledger land - replaces the deterministic
  seed with real evidence-driven missions.
- AG15 (suggested name): Mission persistence and state transitions
  (proposed -> active -> completed / dismissed / escalated /
  deferred) routed through the audit ledger.
