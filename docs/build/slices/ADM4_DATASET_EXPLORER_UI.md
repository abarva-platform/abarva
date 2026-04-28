# ADM4 · Dataset Explorer UI

Slice ID: ADM4
Slice name: Dataset Explorer UI
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

First Admin Dataset Explorer surface using the ADM3 deterministic
inventory. Renders 12 canonical dataset-domain rollups (calm,
drillable cards), a collapsible "show all datasets" detail with the
full ADM3 row schema, and an honest object-inspector placeholder.
**Read-only. No upload, no connector sync, no evidence registry, no
migrations, no model calls.**

## What changed

- New view helper
  [src/lib/admin/dataset-explorer-view.ts](../../../src/lib/admin/dataset-explorer-view.ts):
  - Public types: `DatasetExplorerDomainStatus`,
    `DatasetExplorerDomainRollup`, `DatasetExplorerView`.
  - Public helpers:
    - `buildDatasetExplorerView()` — composes the full deterministic
      view from the ADM3 inventory.
    - `buildDatasetExplorerDomains(inventory)` — pure projection of
      an arbitrary ADM3 inventory into per-domain rollups.

- New component
  [src/components/admin/DatasetExplorerPanel.tsx](../../../src/components/admin/DatasetExplorerPanel.tsx):
  - Server component (no client interactivity).
  - Header: eyebrow + title + 3 calm stats (`loaded`, `available`,
    `usable`).
  - Body: 12 domain rollup cards in canonical ordinal order, each
    with status chip, loaded/avail/usable mini-cells, blocked +
    orphan callouts, top-item hint.
  - Collapsible "Show all datasets · N" detail rendering every
    `DatasetInventoryItem` row with: usability chip, source / parse
    / freshness / scope / owner / connector chips, linked programs
    (links to canonical Programs index), linked patterns,
    missing-metadata callout, Steward guidance, allowed-agents
    chips.
  - Footer: deterministic-source caption.
  - Honest object-inspector placeholder until the inspector slice
    lands.

- Wired into the existing Steward Setup Control Center
  [src/components/admin/StewardSetupControlCenter.tsx](../../../src/components/admin/StewardSetupControlCenter.tsx):
  - Imports `DatasetExplorerPanel`.
  - Mounts `<DatasetExplorerPanel />` in Zone D, above the existing
    `RecommendedActionsBlock`.

- New tests
  [src/__tests__/integration/admin/dataset-explorer-panel.test.ts](../../../src/__tests__/integration/admin/dataset-explorer-panel.test.ts):
  20 deterministic tests covering: view determinism + 12 canonical
  domains in canonical ordinal order; loaded / available / usable
  distinction; per-domain count invariants; honest source
  invariants (no live connector, no production upload claim, no
  fake `E-###` citation, interpretationBasis names deterministic
  source); domain rollups (top item per domain); module hygiene on
  the view helper, the panel, and the StewardSetupControlCenter
  integration.

## What is deterministic today

- View is byte-equal across repeated calls.
- All 12 canonical dataset domains appear in canonical ordinal
  order (test enforced).
- `totalLoadedAcrossDomains` equals `summary.loadedTotal`;
  `totalUsableAcrossDomains` equals `summary.usableTotal` (test
  enforced).
- Per-domain `loadedCount ≥ availableCount ≥ usableCount` (test
  enforced).
- Domains with `loadedCount === 0` report `status: 'not_started'`
  (test enforced).
- Status logic: `not_started` → `blocked` (any blocked items, zero
  usable) → `partial` → `ready` (every loaded item is
  `usable_as_evidence`).
- No item claims a real `connector` or a production URL or a fake
  `E-###` citation (test enforced).
- `interpretationBasis` always names the deterministic source-of-
  truth limit.

## What is NOT yet wired

- No live connector sync — every item still reports `connector:
  null` per ADM3.
- No upload pipeline — every item still reports a non-`connector`
  `sourceType`.
- No real evidence registry binding — `usable_as_evidence` items
  exist by seed assertion, not by E-id resolution.
- No object inspector drawer — Zone E is still an honest empty
  placeholder.
- No filter / search / sort UI — the explorer is calm and read-only
  in this slice.

## What is deferred to ADM5+

- **ADM5 — Users & Access surface** lifts the user-facing posture
  out of the brief.
- **ADM6 — Security & Governance posture** lifts governance gap
  state out of the brief.
- **ADM7 — Agent Readiness Matrix drilldown** drills per-agent
  posture deeper.
- **ADM9 — Audit / Evidence usability drilldown** wires per-item
  drilldown into the evidence-state lifecycle.
- **Connector sync engine + upload pipeline** flips per-item state
  without contract changes here.
- **Object inspector** lands as a side drawer once selection is
  wired.

## Honest fallbacks used

- The "Show all datasets" detail is collapsed by default; the
  domain rollup cards are the calm first impression.
- Every dataset row carries a Steward guidance line; rows without an
  owner surface as `orphan` honestly.
- Every blocked row carries a red callout; orphan rows carry an
  amber callout.
- Object inspector slot renders an explicit "honest and empty"
  placeholder.
- View helper imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, mock.ts, auth, or
  supabase. Component imports are restricted to `next/link`, the
  ADM4 view helper, and the ADM3 inventory types (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/dataset-explorer-panel.test.ts` — 20 passed
- Regression: `npx jest src/__tests__/integration/admin/dataset-domain-inventory.test.ts` — 26 passed
- Regression: `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts` — 31 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
