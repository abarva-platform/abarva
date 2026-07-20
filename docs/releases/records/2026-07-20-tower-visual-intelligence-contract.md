# 2026-07-20-tower-visual-intelligence-contract — Tower Visual Intelligence Contract

## Release ID

`2026-07-20-tower-visual-intelligence-contract`

## Status

`candidate`

## Plain-English Summary

Tower aVa now treats visuals as part of the governed answer contract. For executive questions such as portfolio prioritization, value leakage, trend inspection, vendor exposure, and risk heatmaps, Tower selects a business visual contract before Claude answers. Claude explains the recommended visual, axes, annotations, and evidence boundary, while AbarVa renders the chart from supported table rows instead of accepting model-authored chart JSON.

## Layer Impact

- Global control lane: updates the Tower answer lifecycle, stream progress labels, and Tower-to-aVa artifact adapter for all tenants using Tower chat.
- Model/prompt path: asks Claude for visual intent and executive explanation, but continues to block raw chart JSON, code fences, markdown tables, and unsupported outcome-proof language.
- Product UI: replaces implementation-flavored progress labels with adaptive business labels such as loading AI portfolio, comparing value and readiness, preparing 2x2 decision view, and checking finance confirmation.
- Data plane: no schema, migration, ingestion, retrieval, or client-data mutation.

## Client Applicability

- All clients: tenants using the Tower aVa chat surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/visual-contract.ts` defines the Tower visual contract, question-intent classifier, renderer chart-kind mapping, and adaptive stream progress labels.
- `src/lib/cio-tower/answer.ts` adds the visual contract to the Tower prompt context, required JSON shape, deterministic fallback answers, trace packet, and parsed model output.
- `src/lib/cio-tower/tower-chat-artifacts.ts` uses the visual contract to choose chart kind, subtitle, and source note before falling back to question-keyword inference.
- `src/app/api/tower/cio-chat/route.ts` emits adaptive business-readable NDJSON progress events.
- `src/components/tower/TowerIndexPage.tsx` uses a business-readable initial pending label for Tower chat.
- Tests cover visual-contract selection, parser preservation, fallback propagation, stream labels, and contract-driven chart selection.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/visual-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` — passed. Jest reports existing duplicate manual mock warnings.
- `npx eslint src/lib/cio-tower/visual-contract.ts src/lib/cio-tower/answer.ts src/lib/cio-tower/tower-chat-artifacts.ts src/app/api/tower/cio-chat/route.ts src/components/tower/TowerIndexPage.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts src/lib/cio-tower/__tests__/visual-contract.test.ts` — passed with existing `TowerIndexPage.tsx` unused-symbol warnings only.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed.
- `npm run release:check` — pending.
- ACA deploy and live signed-in Tower visual proof — pending merge/deploy.

## Rollout Plan

Merge the PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deploy, run signed-in Tower chat proof on `https://app.abarva.ai` for portfolio 2x2, value bridge, trend, vendor exposure, and risk/evidence questions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy `main` image through the ACA main lane. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deployment evidence: pending.
- Live signed-in proof: pending.

## Known Gaps

This PR maps advanced visual intents such as waterfall, heatmap, treemap, and sankey to the existing shared chart renderer’s supported chart shapes where necessary. Native visual renderers for those specialized chart types remain future enhancement work.
