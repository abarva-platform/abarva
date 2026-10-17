# u662 — The AI-assisted scenario on the P4 investment deck

## Release ID

`2026-10-16-moves-ai-scenario-investment-deck`

## Status

`candidate`

## Plain-English Summary

u661 carried the approved AI-assisted scenario into the ROM workbook and the P4 value step. The investment deck's slides still showed only the estimate. This release puts the scenario on the deck's delivery-hours slide, as a comparison beside the estimate. It is never the funding basis.

- **What the slide shows:** under the unit-hour drivers, a three-row table:
  1. the approved estimate, labelled the funding basis and set in bold;
  2. the AI-assisted scenario, labelled a comparison;
  3. the signed difference.

  Its columns are effort, duration, cost at plan, AI tool licences, NPV and payback.
- **Where the figures come from:** every figure is bound to its source and listed in the deck's figure ledger and workbook.
  - Effort, duration, cost and tool cost come from the scenario recorded with the approval.
  - NPV and payback come from the value case's second evaluation against that same scenario.
  - The estimate's cost cell is the same ledger figure the summary slide shows as the delivery estimate.
- **When the return is compared:** NPV and payback appear only when the value case is costed on this approved estimate. The scenario's own NPV and payback appear only when the value case evaluated this same scenario, matched by its cost-basis source, as a comparison that was evaluated successfully. Otherwise the cells say "Not measured" or "Not comparable", and the speaker notes give the cause: value case unavailable, not costed on this estimate, no calculated return yet, or not measured against this scenario. A payback outside the horizon is stated in words and not differenced.
- **Fitting the slide:** the comparison keeps every cell. If the figures are long enough to crowd the body, the driver table gives up rows instead. Only the drivers shown are bound to the ledger. Fit is measured with the same table layout the renderer uses, so the slide cannot overflow.
- **Speaker notes:** they name the scenario and repeat the value step's sentence that the case is funded on the approved estimate and that benefit timing is unchanged. They point to the deck workbook for each reduction and its source; the deck workbook already refuses to build if the scenario no longer reproduces its approved figures (u661).
- **Slide words:** the slide's answer may now cite the scenario's savings through four investment-only governed slots: weeks saved, hours saved, cost saved and AI tool cost. Each slot is present only when the scenario actually saves that much; a scenario that costs more or takes as long offers nothing to cite. The model is told which slide carries the scenario. The words are refused when:
  - a scenario figure appears on any other slide, or in the title;
  - a sentence uses a scenario figure without calling it a scenario or comparison;
  - a slot cites a saving that does not exist;
  - a sentence claims an AI-assisted saving when none was approved.

  Values stay server-side; only slot names and meanings reach the model.
- **Unchanged:** every other slide, the validation edition, and a deck whose approval has no scenario.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (P4 investment deck):** deck assembly and layout constants only. No schema, migration, route or data write.

## Client Applicability

- **All clients:** yes, where the reference deck is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: the scenario comparison on the delivery-hours slide, the fit-to-body choice of driver rows, and the scenario's speaker notes.
- `src/lib/deliverables/orchestrator/reference-deck-layout.ts`: the slide body's top, bottom and table gap, exported.
- `src/lib/deliverables/orchestrator/reference-deck-renderer.ts`: uses those constants instead of its own literals; no behaviour change.
- `src/lib/deliverables/orchestrator/reference-deck-slots.ts`: the `rom.ai.*` slots and the delivery-hours slide's `aiScenarioAvailable` evidence flag.
- `src/lib/deliverables/orchestrator/reference-deck-words.ts`, `reference-deck-model.ts`: the scenario word rules and the prompt sentence.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-words.test.ts`: seven cases for the rules and the prompt.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`: eight cases.
  - The comparison's figures, sources and ledger entries, and the estimate shared with the summary slide.
  - A render passes the layout, source, edition and client-copy checks.
  - Crowded figures shrink the driver table, not the comparison.
  - A funded figure still to confirm reads "To confirm" beside the scenario.
  - No scenario leaves the slide unchanged.
  - Each cause for not comparing the return.
  - A scenario measured on another estimate, as the funding basis, or not evaluated is not used.
  - A payback outside the horizon.
  - The validation edition.
  - The slot values: savings only, sign and zero handled.
  - An answer citing a saving binds it and renders clean.

## QA / Validation

- `src/lib/deliverables/orchestrator`: **1,079 passed / 1,079**.
- `npm run typecheck` clean; ESLint clean on changed files.
- Rendered the slide to an image and reviewed it: both tables fit inside the body above the answer bar.
- Slide words: 14 more hand mutants, all killed. They covered each rule (including the title rule), the evidence flag's slide and edition, the slot sign, zero and gap source, and the prompt sentence.
- Mutation check (comparison table): 16 hand mutants, 14 killed. Two survivors are behaviour-neutral.
  - The edition gate survives because the validation sequence has no delivery-hours slide.
  - Measuring raw gap wording instead of the client wording survives because every row that can hold a gap already wraps to two lines either way.
- `audit:lib-orphans`: no new module. Test-coverage census: no new test file.

## Rollout Plan

Merge after u657–u661 (this PR stacks on them), then ship in the next repo-owned ACA main deploy. The deck stays behind its existing flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. On the demo Move with an approved estimate and a confirmed scenario, generate the investment deck and confirm the delivery-hours slide shows the comparison with the estimate as the funding basis.

## Rollback Plan

Revert the squash commit and redeploy. Nothing is stored; decks generated afterwards simply omit the comparison.

## Known Gaps

- **The title stays on the estimate.** The delivery-hours title must carry the estimate figure; the scenario may appear only in the answer and notes, which keeps the funding basis the headline.
- **The drop-the-comparison fallback is unreachable today.** It applies only when not even one driver row fits above the comparison. No numeric input up to 1e14 reaches it. It exists so a future, longer measure degrades the slide rather than failing the whole deck.

## Audit Evidence

- PR URL and CI run.
- The mutation table in the PR description.
