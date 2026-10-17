# u690 — P0 and P1 pages name the Move, and aVa's opening reads as a sentence

## Release ID

`2026-10-17-moves-p0-p1-move-name-and-briefing`

## Status

`candidate`

## Plain-English Summary

The live P0 and P1 step pages had two copy defects that the other phases do not have.

- **The header showed the Move's internal code**, not its name. Every other step page shows the Move's name ("Governed data foundation for AI / LLM automation"). The P0 and P1 pages preferred the internal display code, so the live P1 header showed an upper-case code of underscores and hyphens instead of a name. Those pages now use the same name source as the rest of the product, including its demo-safe name mapping.
- **aVa's opening sentence spliced an instruction into a sentence.** It read "Review the saved name success measures answers…", because the step title ("Name success measures") was inserted into "Review the saved … answers". It now reads "Review this step's saved answers and edit each field where needed."

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves P0 and P1 step pages):** header text and one aVa sentence. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes, wherever the P0 and P1 step pages are enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none (step pages keep their own flag).

## Changes Included

- `src/components/strategic-moves/step-page/TextCaptureStep.tsx`: `moveName` comes from `demoSafeClientText(move.name)`, and the briefing is fixed.
- `src/components/strategic-moves/step-page/__tests__/TextCaptureStep.test.tsx`:
  - no P0 or P1 page shows the internal code;
  - no briefing splices a step title;
  - the header shows the name.

## QA / Validation

- TextCaptureStep suite: pass, 34 / 34. Strategic-moves suites: pass, 74 suites, 1454 tests.
- Mutation testing: 2 / 2 killed (internal code restored; spliced briefing restored).
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The post-deploy walk's P0 and P1 screenshots show the header and aVa's opening.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's P0/P1 screenshots.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The briefing is now the same on every P0 and P1 page.** It no longer names the step, because the step's own title above already does.

## Audit Evidence

- PR URL and CI run; the live walk's P1 Step 3 screenshot before the change.
