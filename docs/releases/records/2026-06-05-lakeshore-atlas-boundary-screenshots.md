# 2026-06-05-lakeshore-atlas-boundary-screenshots — Lakeshore Atlas Boundary And Demo Screenshots

## Release ID

`2026-06-05-lakeshore-atlas-boundary-screenshots`

## Status

`candidate`

## Plain-English Summary

This release makes the Lakeshore Tower answer to an L0/L1 federated visibility question deterministic and CXO-shaped. It also upgrades the Lakeshore demo-readiness crawler so every checked Admin, Setup, Source, Moves, Tower, and Intelligence page saves a screenshot for demo walkthrough and audit reuse.

## Layer Impact

- `global-control-lane`: Atlas intent routing gains a governed Tower answer for federated visibility-boundary questions.
- `public-demo`: Lakeshore demo QA now produces screenshot artifacts and an HTML gallery for real-life walkthrough capture.

## Client Applicability

- All clients: Atlas gains the deterministic federated-visibility intent when a Tower-scoped L0/sibling-HoldCo visibility question is asked.
- Specific clients: Lakeshore Holdings benefits immediately because the QA blocker came from its federated Tower demo prompt.
- Internal only: The screenshot capture script is an internal QA/demo evidence tool.
- Public/demo only: The generated screenshots are demo artifacts, not runtime UI.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/types.ts`
- `src/lib/atlas/classifier.ts`
- `src/lib/atlas/scripted-engine.ts`
- `src/lib/atlas/classifier.test.ts`
- `scripts/lakeshore/app-demo-readiness-qa.mjs`

## QA / Validation

Current validation status:

- `node --check scripts/lakeshore/app-demo-readiness-qa.mjs` — pass.
- `npx jest src/lib/atlas/classifier.test.ts --runInBand` — pass, 5 tests passed.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `npx tsc --noEmit --pretty false --incremental false` — blocked by missing ambient packages in this worktree: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. No TypeScript failure was observed from the edited Atlas files before the dependency errors stopped the run.
- `LAKESHORE_DEMO_QA_BASE_URL=https://app.abarva.ai LAKESHORE_DEMO_QA_OUT=reports/2026-06-05-final-lakeshore-app-demo-readiness-screens node scripts/lakeshore/app-demo-readiness-qa.mjs` — pass, 26/26 checks passed, 0 watches, 0 failures; produced 26 screenshots plus `screenshots.json` and `report.html`.
- `LAKESHORE_TOWER_QA_BASE_URL=https://app.abarva.ai node scripts/lakeshore/tower-atlas-federated-qa.mjs` — blocked pre-deploy, as expected, because production still runs the old LLM path for `atlas-federated-l0-l1-boundary`. This is the blocker this release fixes and must be rerun after production deployment.

## Rollout Plan

Merge to `main`, allow Vercel production deployment, then rerun the Lakeshore Tower and app demo QA scripts against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR. Atlas will fall back to the prior LLM path for this federated visibility question, and the QA crawler will stop saving screenshot artifacts.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Production deploy URL after merge.
- Lakeshore Tower QA packet under `audit-artifacts/lakeshore-tower-atlas-federated-qa/`.
- Lakeshore app demo QA packet with `screenshots/`, `screenshots.json`, and `report.html`.

## Known Gaps

The formal L0/L1 visibility grant matrix is still a data/governance artifact to load later; this change makes Atlas name that evidence gap instead of implying the matrix already exists.
