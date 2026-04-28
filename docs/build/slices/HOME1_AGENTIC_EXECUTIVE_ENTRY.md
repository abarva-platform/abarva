# HOME1 · Agentic Executive Home / Entry Surface

Slice ID: HOME1
Slice name: Agentic Executive Home / Entry Surface
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Calm, single-page-fold executive entry surface that orients an
arriving visitor toward the four canonical agent surfaces — Nexus,
Atlas, Sentinel, Steward — and exposes a deterministic "what needs
attention" strip honestly labelled as seed values. **No live runtime,
no model invocation, no telemetry, no client-side state, no
migrations.**

## What changed

- New server component
  [src/components/home/AgenticHomeEntry.tsx](../../../src/components/home/AgenticHomeEntry.tsx):
  - Public type: `AgenticHomeEntryProps` (`tenantSlug?: string`,
    defaults to `acme`).
  - Renders, in order:
    1. AbarVa wordmark (canon §B) + one-line orientation
       ("Calm intelligence layer for AI program execution.").
    2. Four agent surface cards — Programs/Nexus, Control Tower/Atlas,
       Intelligence/Sentinel, Admin Setup/Steward — each with title,
       agent badge, and one-line subline. 2×2 default, 4×1 on wide
       screens, single column on mobile.
    3. "What needs attention" strip with three deterministic-seed
       cards (1 program at Gate G2, 2 dataset domains partially
       loaded, 3 active patterns surfaced by Sentinel).
    4. Honest disclaimer: "Numbers shown above are deterministic
       seed values, not live runtime telemetry."
  - Markers for downstream tooling:
    - Root: `data-agentic-home-entry="home1"`.
    - Per-card: `data-home1-agent-card="<key>"` (`programs`,
      `tower`, `intelligence`, `admin`).
    - Attention strip: `data-home1-attention-strip="true"`.
    - Each attention card: `data-deterministic="true"` +
      `data-source="deterministic_seed"`.
    - Disclaimer: `data-honest-disclaimer="home1"`.
  - Token discipline: reads only from `abarva-theme.ts`. No
    hard-coded colors that bypass the canon. NAVY accent only.
  - Module hygiene: imports only `next/link`, `AgentBadge`,
    `AbarvaWordmark`, and design tokens. No imports from
    `nexus/`, `agent/`, `source/`, `auth/`, or `supabase`. No
    `Date.now`, `Math.random`, `new Date(`, `fetch(`, `useState`,
    `useEffect`, `anthropic`, or `openai`.

- Augmented existing home route
  [src/app/(maestro)/home/page.tsx](../../../src/app/%28maestro%29/home/page.tsx):
  - Mounts `<AgenticHomeEntry />` at the top of the page content
    (above the legacy hero), passing the active seeded tenant's
    `routeSlug` when present, otherwise the canonical placeholder
    `acme`.
  - All existing logic (engagements, mock-program portfolio,
    stakeholder lens, command center, breadth row, briefing
    surface, context footer) is preserved verbatim — no breaking
    changes to upstream tests or fixtures.

- New tests
  [src/__tests__/integration/home/agentic-home-entry.test.ts](../../../src/__tests__/integration/home/agentic-home-entry.test.ts):
  Coverage across 6 describe blocks:
  - Render — component server-renders without throwing on default
    and explicit `tenantSlug`; falls back to `acme`.
  - Agent surfaces — all four agent names, all four route prefixes,
    per-card `data-home1-agent-card` markers.
  - Attention strip — container marker, ≤ 3 deterministic cards,
    every card carries the `deterministic_seed` source, canonical
    seed sentences present.
  - Honest disclaimer — `data-honest-disclaimer="home1"` and the
    canonical disclaimer copy; root marker present; orientation
    copy present.
  - Module hygiene — source-file audit forbids `useState`,
    `useEffect`, `Date.now`, `Math.random`, `new Date(`, `fetch(`;
    forbids imports from `lib/nexus`, `lib/agent`, `lib/source`,
    `lib/auth`, `@supabase/`; forbids `anthropic` / `openai`
    string imports.
  - Page mount — home `page.tsx` imports `AgenticHomeEntry` from
    the canonical path and renders it in the tree.

## What is deterministic today

- The agent-surface card list is a fixed, ordered constant
  (`AGENT_SURFACES`) of length 4.
- The "what needs attention" strip is produced by a pure helper
  (`buildAttentionCards()`) — same call, identical output. Three
  cards in canonical order: Programs / Steward / Sentinel.
- All numeric values in the attention strip are seeded constants,
  not live reads.
- Route hrefs are byte-equal across renders for a given
  `tenantSlug`.
- The root `data-agentic-home-entry="home1"` marker is always
  present.

## What is NOT yet wired

- No live tenant-state binding. The attention numbers do not
  reflect actual portfolio gate state, dataset-domain load progress,
  or Sentinel pattern counts. The honest-disclaimer footer names
  this explicitly.
- No model invocation. There is no Claude / OpenAI / Pinecone call
  on this surface.
- No client-side state, no event handlers beyond the default
  `next/link` navigation.

## Honest fallbacks used

- The attention strip caps at 3 cards by construction; the eyebrow
  reads `3 of 3 · deterministic seed` so the cap and source are
  legible without inspecting markup.
- Each attention card carries both `data-deterministic="true"` and
  `data-source="deterministic_seed"` so any future audit script can
  enforce the seed-only contract on this surface.
- When no seeded tenant is resolvable on the page, the entry surface
  receives the canonical placeholder slug `acme` rather than
  rendering broken hrefs.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/home/agentic-home-entry.test.ts` — pass.
- `npm run build` — pass; existing routes preserved.
- `python3 -c "import json; json.load(open('docs/build/build-slices.json'))"` — valid JSON.

## Status

Code complete. Pending founder review.
