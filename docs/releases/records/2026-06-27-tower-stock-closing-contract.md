# 2026-06-27-tower-stock-closing-contract — Block Tower Stock Closings

## Release ID

`2026-06-27-tower-stock-closing-contract`

## Status

`candidate`

## Plain-English Summary

Tower and shared aVa answers no longer append the old generic “ask aVa to inspect supporting evidence, compare options, or shape the next action” ending. The shared visible-answer gate now blocks plain `Next:` scaffolding, read-model jargon, and the exact stock Tower closing that appeared in live testing after the first visible-answer-contract deploy.

## Layer Impact

- `global-control-lane`: tightens shared answer shaping and visible-answer validation used by Home/Tower agent paths.
- `global-control-lane`: removes user-visible Tower page copy that described internal read models instead of business-facing portfolio data.

## Client Applicability

- All clients: yes, for shared aVa/Tower answer rendering paths.
- Specific clients: no tenant-specific behavior.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/visible-answer-contract.ts`: blocks `Next:` scaffolding, read-model jargon, and Tower stock closing phrases.
- `src/lib/answer/shared-response-shaper.ts`: stops manufacturing fallback next-step endings and filters stock instruction sentences.
- `src/lib/atlas/orchestrator.ts`: stops forcing a generic Tower next step.
- `src/lib/atlas/tower-factual-spine.ts`: removes `Next: ask aVa...` wording from deterministic Tower answers.
- `src/components/tower/TowerIndexPage.tsx`: removes stock opener and read-model wording from visible Tower copy.
- `src/components/tower/ProgramPressureCards.tsx`: removes read-model wording from visible Tower empty/provenance copy.
- `src/lib/atlas/llm.ts`: removes read-model language from deterministic debug prompt text.
- Focused regression tests updated for the new contract.

## QA / Validation

- `npx jest src/lib/agent/__tests__/visible-answer-contract.test.ts src/lib/answer/__tests__/shared-response-shaper.test.ts src/app/api/tower/synthesis/route.test.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` passed, 26/26 tests.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds the image and deploys it to `ca-abarva-web-lab-eastus`. After deploy, run signed-in Home/Tower browser checks on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no manual shared-runtime mutation in this release.
- Approved image digest: recorded by the ACA deploy workflow after merge.
- ACA runtime invariant: deployed revision image, template image, and 100% traffic must match the main deploy digest.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home and Tower browser-authenticated checks.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow restore the previous main image, or shift ACA traffic back to the prior healthy main revision if an urgent rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI: focused tests above plus PR checks.
- Live proof: signed-in Home/Tower probes after ACA deployment.

## Known Gaps

This release fixes the stock closing leak found in the first live Tower probe. It does not redesign Tower metrics, dossiers, or dashboard data semantics.
