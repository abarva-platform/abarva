# SRC30 - Source Commercial Action Queue

Slice ID: SRC30
Slice name: Source Commercial Action Queue
Status: code_complete
Authored: 2026-04-26
Wave: Wave 16 (Source Commercial Route Mount + Demo Scenario)
Primary agent: SRC30 lane agent
Depends on: SRC26, SRC27, SRC28, SRC29

## Purpose

SRC30 lands a deterministic next-action tracker for commercial sourcing events.
It provides an 8-action queue with a 5-item cap, show-more toggle, state chips,
priority dots, stop condition expand, and agent owner badges — all in AbarVa
design canon.

## What Changed

- `src/lib/source/source-commercial-action-queue.ts` — pure TypeScript view
  model exporting `ActionState`, `ActionCategory`, `CommercialAction`,
  `SourceCommercialActionQueueViewModel`, and `buildCommercialActionQueue`.
  Generates 8 deterministic actions covering vendor-follow-up,
  pricing-clarification, bafo-prep, risk-review, scorecard-governance,
  executive-decision, evidence-request, and readiness-blocker categories.
- `src/components/source/SourceCommercialActionQueue.tsx` — `'use client'`
  React component rendering a header stats row, up to 5 visible actions
  (show-more reveals remaining 3), per-row stop condition expand/collapse,
  and a caveat footer. Inline styles use AbarVa design tokens only.
- `src/__tests__/integration/source/source-commercial-action-queue.test.ts` —
  12 type-shape tests (no jsdom): total count, visible count, hasMore,
  deterministicSeed, valid states, valid categories, valid agentOwners,
  blockedCount match, highPriorityCount match, generatedAt, caveat, and
  component export.
- `docs/build/slices/SRC30_SOURCE_COMMERCIAL_ACTION_QUEUE.md` — this slice doc.
- Appended to `docs/build/build-slices.json`.
- wave-16 entry created in `docs/build/build-waves.json`.
- Source component notes updated in `docs/build/production-readiness.json`.

## Design

AbarVa design tokens applied via inline styles:

| Token | Value |
|---|---|
| Background | `#FAFAF9` |
| White bg (rows) | `#FFFFFF` |
| Near-black text | `#171412` |
| Muted text | `#6B6560` |
| Border | `#E8E6E3` |
| Accent (dark blue) | `#1E3A5F` |
| Accent (link blue) | `#2E6FD8` |

No teal, no network icons, no AI sparkles, no Sanskrit symbols.

## Action State Chips

| State | Background |
|---|---|
| proposed | `#DCFCE7` (green-tint) |
| waiting | `#FEF9C3` (yellow-tint) |
| blocked | `#FEE2E2` (red-tint) |
| completed | `#F1F5F9` (gray) |
| deferred | `#F1F5F9` (gray) |

## Priority Dots

| Priority | Colour |
|---|---|
| high | `#DC2626` (red) |
| medium | `#D97706` (amber) |
| low | `#9CA3AF` (gray) |

## The 8 Actions

| ID | Category | Agent | State | Priority |
|---|---|---|---|---|
| action-001 | vendor-follow-up | Nexus | proposed | high |
| action-002 | pricing-clarification | Sentinel | proposed | high |
| action-003 | bafo-prep | Atlas | waiting | medium |
| action-004 | risk-review | Steward | proposed | medium |
| action-005 | scorecard-governance | Steward | blocked | medium |
| action-006 | executive-decision | Nexus | deferred | low |
| action-007 | evidence-request | Nexus | proposed | low |
| action-008 | readiness-blocker | Atlas | proposed | medium |

## Validation

```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/jest src/__tests__/integration/source/source-commercial-action-queue.test.ts --no-coverage
```

Both pass: 0 TypeScript errors, 12 tests green.

## What This Slice Does NOT Do

- Does not call any model provider or make network requests.
- Does not write to any database.
- Does not modify auth, migrations, or runtime configuration.
- Does not use third-party UI libraries.
- Does not constitute live workflow assignments.
