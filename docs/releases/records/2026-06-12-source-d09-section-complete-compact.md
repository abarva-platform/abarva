# 2026-06-12-source-d09-section-complete-compact — Keep Source D09 RFP Section-Complete Under Live Budget

## Release ID

`2026-06-12-source-d09-section-complete-compact`

## Status

`candidate`

## Plain-English Summary

Source D09 RFP generation now uses a compact, section-complete authoring contract so the live synchronous generation path does not spend the entire token/time budget on early baseline sections and truncate before commercial, evaluation, risk, source-register, and gap-closure sections. The prompt explicitly protects sections §7–§11, caps section/table size, and requires a final completion line.

## Layer Impact

- `global-control-lane`: Updates Source D09 document-generation prompt settings and structure for all clients using the Source RFP package generator.
- `client-data-lane`: No client data is changed. The generator continues to use existing governed evidence and uploaded artifacts.

## Client Applicability

- All clients: Source D09 RFP package generation.
- Specific clients: SkyHarbor is the live proof tenant for the self-healing Source crawl.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: bumps D09 prompt version to 7, sets a compact board-grade target, adds section/table budgets, protects §7–§11, and requires a final completion line.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: validates the compact completion contract.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` passed.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge to main after green CI, build and push a new Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, smoke `/api/health` and `/`, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR or shift Azure Container Apps traffic back to the prior healthy revision. No migrations or data changes are involved.

## Audit Evidence

- PR and CI checks.
- Live crawl report under `reports/source-golden-event/` after deployment.
- ACA revision/image digest used for the live re-run.

## Known Gaps

This slice does not change the quality validator threshold. If D09 still fails after this, the next fix should target the remaining reviewer dimensions rather than bypassing Gate B.
