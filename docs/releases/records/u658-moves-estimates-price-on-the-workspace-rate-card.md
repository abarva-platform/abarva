# u658 — Moves estimates price on the workspace's approved rate card, locked at approval

## Release ID

`2026-10-16-moves-rom-client-rate-card`

## Status

`candidate`

## Plain-English Summary

A workspace can load and approve its own rate card once, before any Move, through the existing rate-card import and approval API. Until now the Moves estimate (P3 Step 4, the ROM preview route and the P4 investment deck's companion workbook) priced only from the committed reference rates, so a loaded card changed nothing.

The estimate now uses the workspace's approved rate card, and every approval records the card version it used:

- **Before approval, the estimate prices on the workspace's current approved card.** It falls back to reference rates when the workspace has none. The step says which: "Rates: your rate card v3" or "Rates: AbarVa reference rates. No client rate card is loaded."
- **Every approval records the exact card version it was priced on.** Every recompute of that approval re-reads that version, so approving a newer card never moves an approved number. This covers the P3 step, the P4 estimate check and the deck workbook. Card versions are immutable.
- **When a newer card exists, the step says so.** Re-pricing on the new card is a deliberate reopen-and-approve; nothing re-prices silently.
- **An approval made before this change has no recorded card**, so it recomputes on reference rates, exactly as before.
- **A card that cannot be read refuses with an explanation and prices nothing.** It never falls back to reference rates. A recorded card that is not an approved card of this workspace is refused the same way. Card reads are scoped to the signed-in workspace's canonical tenant key.
- **Two delivery options priced on different cards cannot be compared**, so option A and option B are always priced on the same rates.

## Layer Impact

Release lane: `global-control-lane`. Shared Moves pricing behaviour for every workspace, behind the existing `moves_rom_engine_v1` flag.

- **Layer 4, products (Moves estimate step, ROM preview route, P4 estimate check, deck workbook):** read the canonical rate-card tables (layer 3) through the existing repository. No schema, migration or data write.

## Client Applicability

- **All clients:** yes, where `moves_rom_engine_v1` is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_rom_engine_v1` (existing).

Workspaces with no approved rate card see no change in figures.

## Changes Included

- `src/lib/pricing/moves-workflow/rom-service.ts`: the `rateCard` pin on the ROM structure, its validation, `loadClientRateCard` on the loaders, and refusals `invalid_rate_card_pin`, `rate_card_unresolved` and `rate_card_unavailable`.
- `src/lib/pricing/moves-workflow/rom-rate-card.ts` (new): resolves a pin for one tenant (current approved card, pinned version, or reference) and serves the pre-loaded card to the engine.
- `src/lib/pricing/moves-workflow/rom-reference.ts`: `loadCommittedRomRoles` for band-grain card lines.
- `src/app/api/v1/programs/[programId]/rom/preview/route.ts`: resolves the pin, prices on it, and returns `rateCards { used, current, currentKnown }`.
- `src/lib/programs/rom-estimate.ts`: approvals record `rateCard`; approval and option selection compare inputs without the pin; `romPreviewRateCardPin` / `romPreviewBody`.
- `src/lib/pricing/moves-workflow/approved-rom-snapshot.ts`: the approved structure carries the approval's pin.
- `src/lib/deliverables/orchestrator/reference-deck-workbook.ts` and the deck workbook route recompute on the approval's pinned card.
- `src/components/strategic-moves/step-page/RomEstimateStep.tsx`: the rates line and the newer-card notice.

## QA / Validation

- Targeted suites (pricing, ROM preview route, deck routes, ROM estimate, ROM step, P4/P5 step pages, reference deck edition): 913 passed / 913. The value-case route: 26 / 26. The wider `src/lib/programs` and step-page suites: 7,718 / 7,718.
- Mutation check, 12 hand mutants: a card read error falling back to reference rates; a draft current card used; a draft pinned version accepted; a missing card priced on reference; the pin not recorded at approval; an approved estimate previewed on the current card; a legacy approval previewed on the current card; the approved structure unpinned; the deck workbook ignoring the pin; options on different cards accepted; the newer-card notice suppressed; a `client_current` pricing approvable. All 12 killed; 1 survived the first round (deck workbook) and was closed with direct tests of its loader.
- ESLint clean on changed files; `tsc --noEmit` clean; `audit:lib-orphans` no change; `audit:test-ci-coverage:check` matches.

## Rollout Plan

Merge after u657 (provider-aware rate cards), then ship in the next repo-owned ACA main deploy. No migration and no flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming live-proven. Load a synthetic rate card for the demo workspace through the governed approval path, then confirm in the P3 estimate step that the rates line names the card and that an existing approval's figures are unchanged.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow. Approvals recorded while this was live carry a `rateCard` field that older code ignores. A client-card approval would then recompute on reference rates and read as stale in P4 until it is re-approved; no data is lost.

## Known Gaps

- **No screen for loading a card**; it is API-only.
- **The ROM workbook's README does not yet name the card used.** Each rate row carries its source (`client_rate_card:<version>`).

## Audit Evidence

- PR URL and CI run.
- The mutation table in the PR description.
