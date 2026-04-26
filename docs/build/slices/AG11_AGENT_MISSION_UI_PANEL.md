# AG11 - Agent Mission UI Strip / Panel

Slice ID: AG11
Slice name: Agent Mission UI Strip / Panel
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward + Builder

## Purpose

AG11 lands the deterministic, server-only UI for AbarVa's Agent Mission
surface as defined in
[experience-system File 16 - Agent Activity UI Pattern](../../platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md).
It gives Nexus, Sentinel, Atlas, and Steward a typed, calm, data-forward
mission panel that can render in five canonical variants without
becoming a noisy chatbot rail.

AG11 is part of Lane B in the parallel build pack. It does not call the
Model Gateway, does not run a live mission queue, does not maintain
client state, and does not resolve any runtime trigger. The view-model
is a frozen seed pack, and the rendered surface is a server component.

## What Changed

- New helper module
  [src/lib/agents/agent-mission-view.ts](../../../src/lib/agents/agent-mission-view.ts):
  - Canonical type partition: `AgentMissionPanelAgent`,
    `AgentMissionPanelType`, `AgentMissionPanelState`,
    `AgentMissionPanelPriority`, `AgentMissionPanelVariant`.
  - View-model: `AgentMissionPanelMission`, `AgentMissionPanelView`.
  - Frozen tuples: `AGENT_MISSION_PANEL_AGENTS` (4 agents in canonical
    order) and `AGENT_MISSION_PANEL_VARIANTS` (5 variants in canonical
    order).
  - Public helpers: `buildAgentMissionPanelSeedView`,
    `summarizeAgentMissionPanelView`, `agentDisplayLabel`,
    `priorityChipLabel`, `stateChipLabel`.
  - Frozen 9-mission seed pack with at least one mission per agent and
    coverage across the canonical mission types
    (`next_action`, `evidence_gap`, `executive_brief`,
    `gate_check`, `data_readiness`, `approval_follow_up`,
    `pattern_signal`, `value_risk`, `artifact_review`).
  - Honest disclaimer:
    `Mission queue is deterministic seed; runtime triggers deferred.`

- New server component
  [src/components/agents/AgentMissionPanel.tsx](../../../src/components/agents/AgentMissionPanel.tsx):
  - Server component only - no `'use client'`, no `useState`, no
    `useEffect`, no `Date.now`, no `Math.random`, no `new Date(`,
    no `fetch(`.
  - Renders five variants based on `view.variant`:
    1. `compact_strip` - horizontal strip <= 60px tall, agent badges,
       count, top mission label.
    2. `right_panel` - vertical card list <= 320px wide, each card
       renders agent badge, type chip, priority chip, state chip,
       work-object label, two-line rationale, recommended-action
       callout, and stop-condition footer.
    3. `inline_recommendation` - single mission inline, agent badge,
       priority chip, one-line rationale, recommended action.
    4. `executive_brief` - card with NAVY top-ring, summary stat row
       (missions queued, critical, high, distinct agents), top three
       missions with executive framing.
    5. `hidden_drawer` - collapsed shell rendering only the
       "X missions queued" affordance with `aria-expanded="false"`.
  - All variants carry the canonical
    `data-agent-mission-panel="ag11"` attribute and a
    `data-agent-mission-panel-variant="<variant>"` attribute.
  - Agent labels render via `agentDisplayLabel`; priority chips via
    `priorityChipLabel` with NAVY for critical/high and MUTED for
    medium/low; state chips via `stateChipLabel`.
  - Reuses the existing `AgentBadge` primitive from
    `@/components/abarva/AgentBadge` and the `COLORS` / `FONT` /
    `SPACING` / `RADIUS` / `BORDER` tokens from
    `@/lib/design/abarva-theme`.
  - The honest disclaimer is rendered as small mono-uppercase text
    at the bottom of every variant.

- New tests
  [src/__tests__/integration/agents/agent-mission-panel.test.ts](../../../src/__tests__/integration/agents/agent-mission-panel.test.ts):
  - Determinism: byte-equal serialized output across repeated
    `buildAgentMissionPanelSeedView` calls per variant.
  - Variant + agent tuple ordering is canonical.
  - Each variant returns at least one mission; right_panel,
    executive_brief, and compact_strip cover all four agents.
  - Display label helpers return canonical strings, including the
    `P1 / P2 / P3 / P4` priority chip prefixes.
  - Component source assertions: literal
    `data-agent-mission-panel="ag11"` and per-variant attribute
    string occurrences.
  - Component source hygiene: no `<img`, no chat / ask me language,
    no emoji, no `Coming soon` / `TBD` / `Lorem ipsum` placeholders.
  - Server-only constraints: no `'use client'`, no `useState`, no
    `useEffect`, no `Date.now`, no `Math.random`, no `new Date(`,
    no `fetch(`, no `anthropic` / `openai` references.
  - Helper module hygiene: no imports from `@/lib/source`,
    `@/lib/nexus`, `@/lib/sentinel`, `@/lib/atlas`, `@/lib/auth`,
    or supabase; canonical honest disclaimer string is present.

- Updated `docs/build/build-slices.json` with AG11 set to
  `code_complete`, depending on no other slice, with `risk: low` and
  the six-file allowlist (the four AG11 build files plus the two
  build manifests).

- Updated `docs/build/production-readiness.json` to acknowledge AG11
  under `agent_runtime`. Live runtime trigger integration (AG10 mission
  queue wiring, gateway routing, audit ledger) is explicitly deferred.
  No status is promoted by this slice.

## Variant Catalog

Per File 16 the five variants partition across surface intent:

1. `compact_strip` - quick sense of active agent work in a single
   horizontal strip. Used at the top of dense product surfaces.
2. `right_panel` - vertical mission panel with several active missions
   and recommended next actions. Default for program / pattern detail
   pages.
3. `inline_recommendation` - one finding, one reason, one next action,
   placed near the exact object the agent is advising on.
4. `executive_brief` - Atlas-style executive synthesis with summary
   stat row and top three missions framed for steering.
5. `hidden_drawer` - collapsed shell for lower-priority or historical
   mission activity; the drawer contents are described in props but
   open / close state is NOT managed (server component).

## Compatibility Note - AG10 Mission Queue

The live mission queue module
(`src/lib/agents/agent-mission-queue.ts`) referenced by AG10 may not
exist on this worktree's base. AG11 therefore defines its own
self-contained, AG10-compatible prop type
(`AgentMissionPanelMission`) so the panel can render without binding
to the runtime queue. When AG10 lands, the `AgentMissionPanelMission`
shape can be widened to accept the AG10 mission record by structural
assignment - no live runtime trigger is invoked by AG11 itself.

This decoupling is intentional: AG11 ships the calm server-side shell;
AG10 ships the live queue; a future slice will wire the two together
through the Model Gateway and audit ledger.

## What Is Deterministic Today

- The seed pack is module-level and frozen by `readonly` arrays.
  Repeated calls to `buildAgentMissionPanelSeedView(variant)` return
  byte-equal JSON.
- `summarizeAgentMissionPanelView` is pure: byAgent and byPriority
  totals reconcile to the total mission count.
- All display label helpers are pure record lookups.
- Variant pickers are pure: `compact_strip`, `inline_recommendation`,
  and `executive_brief` always pick the same four canonical missions
  (one per agent); `right_panel` and `hidden_drawer` always render the
  full nine-mission seed.

## What Is Honest About This Slice

- The mission queue is a deterministic seed pack, not a live runtime.
  The honest disclaimer is rendered on every variant.
- No `'use client'`, `useState`, `useEffect`, `Date.now`, `new Date(`,
  `Math.random`, `fetch(`, `anthropic`, or `openai` is used.
- No avatars (`<img`) or icons larger than 16x16 are rendered.
- No chatbot phrasing (`chat`, `ask me`) appears in the source.
- No imports from `@/lib/source`, `@/lib/nexus`, `@/lib/sentinel`,
  `@/lib/atlas`, `@/lib/auth`, or supabase.

## What Is Deferred

- Live mission queue wiring (AG10 integration) - deferred.
- Drawer open / close state management and animation - deferred until
  a client-side wrapper is introduced separately.
- Live runtime triggers (Sentinel detection, Atlas brief, Nexus next
  action, Steward gate check) - deferred behind the Model Gateway and
  audit ledger.
- Page-level integration into Programs, Intelligence, Tower, and Admin
  surfaces - deferred to follow-on UI slices.
- Three-choices-plus-custom interaction layer - deferred until the
  client-side wrapper lands.

## How AG11 Affects Production Readiness

AG11 is a small, additive UI primitive. It does not promote any
production-readiness status. The `agent_runtime` component in
`production-readiness.json` is annotated with the AG11 mission UI
addition and the deferred AG10 / runtime trigger integration; all
other manifest fields are preserved exactly.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false` - pass
- `npx jest src/__tests__/integration/agents/agent-mission-panel.test.ts` - pass
- `npm run build` - pass
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"` - pass

## Status

Code complete. Pending founder review. AG11 does not push, merge, or
deploy.
