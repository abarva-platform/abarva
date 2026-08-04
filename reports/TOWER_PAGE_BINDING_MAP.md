# Tower Page Binding Map

Date: 2026-08-02

Scope: `/tower` route and local command-center read path.

## Current Route

The Tower app surface is:

- `src/app/(maestro)/tower/page.tsx`
- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/views/ValueProofView.tsx`
- `src/components/tower/command-center/views/DecisionLanesView.tsx`
- `src/components/tower/command-center/views/EvidenceView.tsx`

The prior memory note referenced `TowerIndexPage.tsx`, but the current route is the command-center surface above.

## Old Binding

The page previously used:

- `src/lib/cio-tower/loadTowerMartCommandView.ts`
- Old read contract: `cio_tower.mart_*`

That is now retired for `/tower`.

## New Binding

The page now imports:

- `src/lib/tower/readTowerCommandCenter.ts`

The reader queries:

- `tower.value_claim_current`
- `tower.tracked_subject`
- `tower.metric_observation`
- `tower.metric_provenance_current`

It assembles the existing command-center view model without querying `cio_tower`.

## Tenant Binding

Tenant resolution is explicit and fail-closed:

- `skyharbor-air` and `skyharbor_global` can resolve to local tenant key `skyharbor_global`.
- Other tenants do not fall back to SkyHarbor data.
- If no matching tenant has `tower.value_claim_current` rows, `/tower` returns the empty state instead of showing another tenant's data.

## Value Display Binding

Financial values are withheld when the model has unknown value amounts:

- Command overview shows an unknown value posture instead of a dollar total.
- Value proof withholds the waterfall chart when all claim values are unknown.
- Decision lanes and evidence views label unknown values as unknown, not `$0`.
- Evidence gaps are still generated for amount-unknown claims.

## Handoffs

The command-center action model keeps handoff labels to Moves and Source, but this branch does not implement new cross-product writes or promotion. Home, Source, Moves, Intelligence, and Tower remain projections of canonical data; no product owns the source of truth.
