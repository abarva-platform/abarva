# u661 — The AI-assisted scenario in the ROM workbook and the P4 business case

## Release ID

`2026-10-16-moves-ai-scenario-workbook-p4`

## Status

`candidate`

## Plain-English Summary

The AI-assisted scenario (u660) was priced only on the P3 estimate step. This release carries it into the ROM workbook and the P4 business case. It stays a comparison throughout: P4 is still funded on the approved estimate.

- **ROM workbook:** when the estimate carries a scenario, the workbook gains an **AI-Assisted Scenario** sheet in live formulas. It holds each driver's estimate unit hours, its hours reduction and the reduced unit hours. Each block is priced with the same counts, friction, pod and rates as the estimate, and tool cost is charged per seat per whole month. The sheet ends with the scenario's totals and its plan versus the estimate. Changing a reduction or a seat count recomputes the scenario, and only the scenario, to exactly what the engine prices.
- **Approval:** approving the estimate now also records the scenario's exact settings and figures beside it. This happens only when every register row behind the scenario is confirmed and the scenario approved is exactly the one priced. A provisional scenario stays visible in P3 but is not carried. Editing the scenario after approval never makes the estimate's approval stale; P4 keeps showing the approved scenario until the estimate is approved again. The P3 panel says which of these applies.
- **Recomputes:** P4's approved-estimate read, its workbook download and the deck workbook recompute the scenario from the approved settings. A workbook is refused if the scenario no longer reproduces its approved figures.
- **P4 value case:** the same value model is evaluated a second time against the approved scenario's cost, using the same cost-basis checks. It is returned as `aiAssisted`, with `fundingBasis: false` and a sentence saying the case is funded on the approved estimate. Benefit timing is unchanged: the scenario changes build cost and weeks, and each lever's start month stays its own register input.
- **P4 display:** a labelled "comparison only, not the funding basis" block shows the scenario's NPV and payback next to the funded estimate's, and how much shorter the build is and how much lower (or higher) its cost, including tool cost. A viewer who may not see figures sees only that a comparison exists.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_rom_engine_v1` and value-case flags.

- **Layer 4, products (ROM workbook, P3 estimate step, P4 value step, value-case route, deck workbook):** no schema, migration or data write. Scenario figures are recorded inside the existing `rom_estimate` approval.

## Client Applicability

- **All clients:** yes, where the Moves ROM and value case are enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** the existing ones.

## Changes Included

- `src/lib/pricing/moves-workflow/rom-workbook.ts`: the AI-Assisted Scenario sheet and its layout.
- `src/lib/programs/rom-estimate.ts`: `RomApprovedAiScenario` recorded with an approval; `romAiScenarioCarry`.
- `src/lib/pricing/moves-workflow/approved-rom-snapshot.ts`: the approved structure carries the approved scenario; `previewScenarioMatchesApproval`.
- `src/app/api/v1/programs/[programId]/value-case/route.ts`, `src/lib/programs/value-engine/value-case-view.ts`: the scenario's economics beside the case, withheld by the same figures rule.
- `src/components/strategic-moves/step-page/p4-step-pages.tsx`: `AiScenarioComparison`; workbook download checks the scenario.
- `src/lib/deliverables/orchestrator/reference-deck-workbook.ts`: deck workbook checks the scenario.
- `src/components/strategic-moves/step-page/RomAiScenarioPanel.tsx`: what P4 will show.
- Tests:
  - `rom-workbook` (scenario sheet: every formula evaluates to its cached value, totals equal the engine, and the formulas are live);
  - approval carry and estimate reads;
  - value-case route (scenario evaluated, withheld for restricted viewers, absent without an approval);
  - P4 page (comparison, withheld, none);
  - panel carry sentence.

## QA / Validation

- Affected suites (`src/lib/programs`, `src/lib/pricing`, step pages, program routes, deliverables orchestrator, admin): **10,385 passed / 10,385** before the final type and lint fixes. The suites touched by those fixes then passed 115 / 115.
- Mutation check: 11 hand mutants, all killed.
  - Workbook: the reduction is ignored; tool months are not computed monthly; "versus" is not taken against the estimate.
  - Approval: a provisional scenario is carried; a mismatched scenario is carried.
  - Route: the scenario is priced on the funded cost.
  - View: scenario figures are shown to a restricted viewer; the scenario is claimed as the funding basis.
  - Display: lower and higher are swapped.
  - Estimate reads: the approved scenario is not recomputed; scenario plan drift is ignored.
- `npm run typecheck` clean; ESLint clean on changed files; `audit:lib-orphans` no change; test-coverage census and tenancy-fence census both unchanged.

## Rollout Plan

Merge after u657–u660 (this PR stacks on them), then ship in the next repo-owned ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. On the demo Move, approve the estimate with a confirmed scenario, then confirm the P4 value step shows the comparison beside the funded figures, and that the downloaded workbook includes the scenario sheet.

## Rollback Plan

Revert the squash commit and redeploy. Approvals recorded with a scenario keep the extra field, which older code ignores. No data is lost.

## Known Gaps

- **The P4 investment deck's slides do not yet show the scenario.** The deck workbook already checks it.
- **Benefit timing is deliberately unchanged.** Pulling benefits earlier is a lever start-month change in the register, made and owned by a person.

## Audit Evidence

- PR URL and CI run.
- The mutation table in the PR description.
