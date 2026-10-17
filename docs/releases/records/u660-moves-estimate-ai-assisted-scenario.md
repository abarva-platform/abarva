# u660 — Moves estimate: an AI-assisted delivery scenario priced beside the estimate

## Release ID

`2026-10-16-moves-rom-ai-assisted-scenario`

## Status

`candidate`

## Plain-English Summary

The Moves estimate applied no AI productivity credit anywhere, so a team that delivers data pipelines with AI coding agents (for example on a managed model platform) could not see what that changes. P3 Step 4 can now price an **AI-assisted scenario beside the estimate**. The estimate itself, its approval and everything P4 reads stay unchanged.

How the scenario works:

- **Speed-ups per work type.** A speed-up is an hours reduction on one kind of work (design rows, validation rows, data entities and so on), linked to a register assumption that holds the share removed, e.g. 0.35. It is applied to that driver's unit hours, so every formula stays traceable to its source. There are no defaults: a driver with no linked assumption is not assumed to speed up.
- **Tool costs.** A tool is a monthly per-seat cost from a register assumption, times the team's seat count. It is charged per whole month of every priced block.
- **Open assumptions.** An open register row prices a provisional scenario from its working figure, and the step says so.
- **Invalid assumptions are left out with a reason, never guessed.** This covers a percent recorded as a whole number (35 instead of 0.35), a reduction above 80% (evidence a lower unit hour instead), a proposed or unreadable row, and a driver nothing counts.
- **The step shows a comparison.** Estimate vs scenario vs difference for hours, weeks, tool cost and cost at plan, labelled "Scenario only". It appears as a table on wide layouts and as cards on narrow ones, and amounts are withheld when the viewer may not see figures.
- **Approval is unaffected.** Editing or removing the scenario never makes an approved estimate stale: the scenario is excluded from the inputs fingerprint and from the approval and delivery-option comparisons.

The engine prices the scenario as a second, separate result (`aiAssisted`) whose `productivityCreditApplied` is `true`. The estimate's own result keeps `false`, and its figures are identical with or without a scenario. Tool costs enter the portfolio roll-up as non-labour cost, so the roll-up still equals the block sum.

## Layer Impact

Release lane: `global-control-lane`. Shared Moves estimate behaviour, behind the existing `moves_rom_engine_v1` flag.

- **Layer 4, products (P3 Step 4, ROM preview route, ROM engine):** new scenario pricing and panel. No schema, migration or data write; the plan is saved in the existing `rom_estimate` step record.

## Client Applicability

- **All clients:** yes, where `moves_rom_engine_v1` is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_rom_engine_v1` (existing).

## Changes Included

- `src/lib/pricing/moves-workflow/rom-service.ts`:
  - `aiAssist` spec and its validation (`invalid_ai_assist`);
  - the scenario priced via reduced unit hours plus monthly tool licences;
  - `aiAssisted` result with `versusEstimate`;
  - tool licence lines in the roll-up.
- `src/lib/programs/rom-estimate.ts`:
  - `RomAiAssistPlan` (register references only), its parsing and `setRomAiAssistPlan`;
  - `buildRomAiAssist` (resolution, provisional state, stated problems);
  - preview body;
  - fingerprint and approval comparisons exclude the scenario.
- `src/components/strategic-moves/step-page/RomAiScenarioPanel.tsx` (new), mounted in the estimate row of `RomEstimateStep.tsx`.
- Tests:
  - engine scenario suite;
  - plan and resolution suite;
  - `RomAiScenarioPanel.test.tsx` (new).
- `docs/architecture/test-ci-coverage-census.json` regenerated (+1 covered test file).

## QA / Validation

- Affected suites (step pages, `src/lib/programs`, `src/lib/pricing`, ROM, deck and value-case routes, reference deck, admin components and routes): **8,750 passed / 8,750**.
- Mutation check: 19 hand mutants, 18 killed, and 1 behaviour-neutral survivor that is reported rather than claimed.
  - Engine (7, all killed): the scenario replaces the estimate; the cap is removed; tools are not charged; confidence is not lowered; credit is claimed on the estimate; the reduction source is dropped; a driver without unit hours is accepted.
  - Plan and panel (12, 11 killed): the scenario is in the approval fingerprint; the approval comparison keeps the scenario; a percent written as a whole number is accepted; the cap is not enforced; an open row is not marked provisional; an uncounted driver is priced; dollars are not converted to cents; seats are unbounded; the narrow cards are hidden; money is not withheld; the provisional line is hidden.
  - The survivor: an incomplete plan adds an `aiAssist` key whose value is `undefined`, which serialisation drops.
- Visual check: the real panel rendered with the step page's stylesheet inside its layout container at 940px (table) and 390px (cards), with no horizontal overflow.
- `tsc` clean; ESLint clean; `audit:lib-orphans` no change.

## Rollout Plan

Merge after u657, u658 and u659 (this PR stacks on them), then ship in the next repo-owned ACA main deploy. No migration or flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming live-proven. On the demo Move, link a synthetic register assumption as a reduction and another as a tool cost, then confirm the comparison and that the approved estimate stays current.

## Rollback Plan

Revert the squash commit and redeploy. Saved plans remain in the step record and older code ignores them; no data is lost.

## Known Gaps

- **The scenario is not yet in the ROM workbook or the P4 business case.** Funding on the AI-assisted figures, and starting benefits earlier in the value model, is the next step.
- **Each block is charged whole months of tool cost**, so a program of several short blocks is charged slightly more than one continuous subscription would be. This is stated in the engine and is conservative.

## Audit Evidence

- PR URL and CI run.
- The mutation table and rendered-state screenshots described in the PR.
