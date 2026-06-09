# 2026-06-08-context-corpus-governance-pr7b — Nexus citation-gap honesty

## Release ID

`2026-06-08-context-corpus-governance-pr7b`

## Status

`candidate`

## Plain-English Summary

PR-7b of the Context & Corpus Governance Framework: mirrors the #3322 Sentinel
citation hardening onto the Nexus surface. Nexus already rendered its sources (as
`SourcePill` chips), so the gap was the honesty signal: when a Nexus answer comes
back with NO grounded sources, the surface now shows a "citation gap" notice
telling the reader to treat the answer as reasoning, not evidence — instead of
silently presenting an ungrounded answer as if it were sourced. Clarification and
"I don't know" formats are exempt (grounding isn't expected there), and user
turns never show it.

## Layer Impact

**global-control-lane**: UI-only change to one component
(`src/components/intelligence/NexusTurn.tsx`). No schema, migration, data, or
server change. Uses existing locked design-system classes
(`intel-pushback` / `intel-chip mono amber` / `intel-subtle`) — no color/font/
layout redesign.

## Client Applicability

- All clients on the Nexus surface: ungrounded answers are now flagged for every
  tenant uniformly.
- Feature flag: none.

## Changes Included

- `src/components/intelligence/NexusTurn.tsx` — citation-gap notice when an
  assistant answer has zero sources (exempting clarification/idk).
- `src/components/intelligence/__tests__/NexusTurn.test.tsx` — 4 tests
  (sources render, gap notice when empty, no nag on clarification, none on user turns).

## QA / Validation

- `jest NexusTurn.test.tsx` — **4/4 passed**.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.
- `npm run validate:context-corpus` — governance gate green.

## Rollout Plan

Merge to `main`. UI takes effect immediately on the Nexus surface; no rollout
steps.

## Rollback Plan

Revert this PR — single-component UI change.

## Audit Evidence

- PR URL + CI run. Mirrors #3322 (Sentinel citation binding). Brief + PR-0..PR-8.

## Known Gaps

The notice is presence-based (zero sources). A future enhancement could render the
richer grouped `EvidenceBasis` panel on Nexus and drive the gap signal from the
PR-5 validated bundle's `agentReadyCount` rather than raw source count.
