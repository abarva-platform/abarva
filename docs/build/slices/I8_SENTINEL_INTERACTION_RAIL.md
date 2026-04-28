# I8 · Intelligence · Sentinel Interaction Rail

Slice ID: I8
Slice name: Intelligence · Sentinel Interaction Rail
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Wave4 Lane H

Adds a deterministic Sentinel Interaction Rail that mounts on
intelligence pages and answers "what is Sentinel actually surfacing
right now, with what confidence, and what would it want me to do
next?" with structured seed entries. The rail is canon-compliant and
honest by construction: **no live runtime, no live retrieval, no
model invocation, no fabricated dollar amounts, no fabricated
citations.**

## What changed

- New module
  [src/lib/intelligence/sentinel-interaction-rail-view.ts](../../../src/lib/intelligence/sentinel-interaction-rail-view.ts):
  - Public types: `SentinelInteractionSignalSeverity`,
    `SentinelInteractionConfidenceLabel`,
    `SentinelInteractionRecentSignal`,
    `SentinelInteractionActivePattern`,
    `SentinelInteractionEvidenceConfidence`,
    `SentinelInteractionRecommendedAction`,
    `SentinelInteractionRailInput`,
    `SentinelInteractionRailView`.
  - Public helper: `buildSentinelInteractionRailView(input)`.
  - Pure deterministic: same input → byte-equal view; no `Date.now`,
    no `Math.random`, no `new Date`, no `fetch`.
  - Anchor-aware framing: with an anchor pattern, active patterns and
    recommended actions are framed around it; without an anchor, the
    rail carries portfolio-wide framing (`portfolio_context`).
  - Recommended actions are emitted with `enabled: false` and surface
    a "deferred" chip — wiring to live handoff lands in a later
    slice.

- New component
  [src/components/intelligence/SentinelInteractionRail.tsx](../../../src/components/intelligence/SentinelInteractionRail.tsx):
  - Server component (no `use client`, no React hooks).
  - Renders rail header (eyebrow + AgentBadge + title), recent
    signals with severity chips, active patterns with pattern-key
    monogram, evidence-confidence chip + basis, recommended actions
    list, and footer disclaimer — separated by hairline dividers.
  - Reads tokens from `@/lib/design/abarva-theme` only — no local
    hex literals, no DM Sans literals.
  - Imports the AbarVa `AgentBadge` primitive for the Sentinel chip.
  - Root carries `data-sentinel-interaction-rail="i8"`.

- New tests
  [src/__tests__/integration/intelligence/sentinel-interaction-rail.test.ts](../../../src/__tests__/integration/intelligence/sentinel-interaction-rail.test.ts):
  26 deterministic tests covering view determinism (byte-equal across
  calls for both portfolio and anchor inputs), section presence
  (eyebrow, title, recent signals capped at 3, active patterns,
  evidence confidence label + basis, recommended actions all deferred,
  disclaimer), anchor vs portfolio framing, honest-framing invariants
  (no fabricated dollar amounts, no live-runtime/retrieval/model
  claims), module hygiene on the view-model (.ts), and canon hygiene
  on the server component (.tsx) — theme import, AgentBadge import,
  no `use client`, no hooks, no hex literals, no DM Sans literals,
  no Sentinel/Atlas/Nexus/agent runtime imports, no Source UI / legacy
  /programs / mock / auth imports.

## What is deterministic today

- Same input → byte-equal view (test enforced).
- `createdFrom: 'deterministic_sentinel_interaction_rail_seed'`.
- Recent signals capped at 3; active patterns capped at 3;
  recommended actions capped at 3.
- Anchor pattern surfaces as the single active pattern when supplied;
  otherwise `portfolio_context` is the active read.
- Evidence confidence is observed-program-count driven (≥3 → medium,
  ≥1 → low, 0 → low) with explicit basis text naming what would
  lift the read.

## What is NOT yet live

- No Claude / OpenAI / Pinecone invocation.
- No live Sentinel runtime, no live persistence, no live retrieval.
- Recommended actions are visibly deferred; no handoff is wired.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/intelligence/sentinel-interaction-rail.test.ts`
  — 26 passed.

## Status

Code complete. Pending founder review.
