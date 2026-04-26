# PROG14 · Program Action / Agent Mission / Resume Strip

**Wave**: wave-18
**Branch**: `wave18/prog14-actions-missions-resume-strip`
**Status**: code_complete

## Intent

Compact, calm strip surfaced on a program detail page that anchors
program-level orientation in four sections:

1. **Resume callout** — the last open work item with a route hint and
   short rationale.
2. **Next actions** — exactly three top actions, each owned by one
   of Nexus / Sentinel / Atlas / Steward, with rationale and stop
   condition.
3. **Agent missions** — one row per canonical agent (Nexus, Sentinel,
   Atlas, Steward) with mission, detail, and state.
4. **Blocked / deferred** — short list of currently blocked items,
   each tagged with the agent that would unblock it.

The strip is **not** a chat feed, **not** a task panel, **not** a live
runtime. It is a deterministic, read-only orientation surface.

## Files

- `src/lib/programs/program-action-mission-strip-view.ts` — view-model
  builder. Pure TypeScript. No DB, no model calls.
- `src/components/programs/ProgramActionMissionStrip.tsx` — `'use
  client'` React component. Calls the builder. Renders all four
  sections plus a footer caveat.
- `src/__tests__/integration/programs/program-action-mission-strip.test.ts`
  — 15 tests covering shape, agent coverage, caveat keywords, banned
  visual tokens.

## Canon

- Surface `#FBFAF7`, card `#FFFFFF`, border `#E8E6E1`.
- Text: ink `#0A0C12`, body `#1F2433`, muted `#525866`.
- Accent: navy `#1B2B5C` only. No teal, no green, no purple, no neon.
- DM Sans body. Calm chip + section-title hierarchy.

## Deferred

- Live action execution (every action stays read-only).
- Live workflow / DB writes.
- Chat feed and large agent avatars (canon explicitly excludes them).
- Real persona-based action attribution (seeded only).

## Tests

`node_modules/.bin/jest src/__tests__/integration/programs/program-action-mission-strip.test.ts`
