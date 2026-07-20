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

- PR #5139: initial Tower visual contract, adaptive stream labels, prompt/trace wiring, and renderer chart-kind mapping.
- PR #5142: prioritizes explicit trend/risk questions over broad portfolio/value hints and keeps deterministic fallbacks inside the visible-answer validator.
- Second follow-up corrective PR: prioritizes explicit value-bridge and vendor/spend-exposure wording over generic portfolio/risk wording found during post-#5142 live proof.
- `src/lib/cio-tower/visual-contract.ts` defines the Tower visual contract, question-intent classifier, renderer chart-kind mapping, and adaptive stream progress labels.
- `src/lib/cio-tower/answer.ts` adds the visual contract to the Tower prompt context, required JSON shape, deterministic fallback answers, trace packet, and parsed model output.
- `src/lib/cio-tower/tower-chat-artifacts.ts` uses the visual contract to choose chart kind, subtitle, and source note before falling back to question-keyword inference.
- `src/app/api/tower/cio-chat/route.ts` emits adaptive business-readable NDJSON progress events.
- `src/components/tower/TowerIndexPage.tsx` uses a business-readable initial pending label for Tower chat.
- Tests cover visual-contract selection, parser preservation, fallback propagation, stream labels, and contract-driven chart selection.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/visual-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` — passed. Jest reports existing duplicate manual mock warnings.
- Follow-up corrective PR: `npx jest src/lib/cio-tower/__tests__/visual-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand` — passed. Covers the live-found trend/risk classifier cases and fallback validator compliance.
- Second follow-up corrective PR: `npx jest src/lib/cio-tower/__tests__/visual-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand` — passed. Covers explicit value-bridge and vendor/spend-exposure precedence regressions.
- `npx eslint src/lib/cio-tower/visual-contract.ts src/lib/cio-tower/answer.ts src/lib/cio-tower/tower-chat-artifacts.ts src/app/api/tower/cio-chat/route.ts src/components/tower/TowerIndexPage.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts src/lib/cio-tower/__tests__/visual-contract.test.ts` — passed with existing `TowerIndexPage.tsx` unused-symbol warnings only.
- Follow-up corrective PR: `npx eslint src/lib/cio-tower/visual-contract.ts src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/visual-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts` — passed.
- Second follow-up corrective PR: `npx eslint src/lib/cio-tower/visual-contract.ts src/lib/cio-tower/__tests__/visual-contract.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed.
- `npm run release:check` — passed for PR #5139 and PR #5142; pending rerun for the second follow-up corrective PR after this record update.
- PR #5139 ACA deploy — passed for SHA `226109da661810c8b9e5c37e4f4e1d76b8e8eb90`, revision `ca-abarva-web-lab-eastus--m226109da`, image digest `sha256:5e5c95df2e8c69c7d35454fc770562869e017ddf0506efe5f41c61aa27612107`, 100% traffic, health ok, runtime invariant passed.
- PR #5139 live signed-in five-question Tower visual proof — stream labels and visual contracts were live, but follow-up correction required because two prompts misclassified visual intent and deterministic fallback output violated visible-answer validation.
- PR #5142 ACA deploy — passed for SHA `4f51ccb8775a23ff654cbfb36e80f723e1a3ba0b`, revision `ca-abarva-web-lab-eastus--m4f51ccb8`, image digest `sha256:58e9c89a765c670db8b7f9483c2c42258dc4f2d3dcb9affd4106c37b75a72168`, 100% traffic, health ok, runtime invariant passed.
- PR #5142 post-deploy live signed-in five-question Tower visual proof — not accepted; value-bridge prompt selected 2x2 and vendor/spend-exposure prompt selected heatmap. This second follow-up PR addresses those two classifier misses before final live acceptance.

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

- PR URL: https://github.com/abarva-platform/abarva/pull/5139
- CI run: pending.
- ACA deployment evidence for PR #5139: `/tmp/nexus-tower-visual-intelligence/out/gh-run-29745781614-aca/runtime-invariant/runtime-invariant-proof.json`
- Live signed-in proof for PR #5139: `/tmp/nexus-tower-visual-intelligence/out/tower-visual-live-2026-07-20/live-api-visual-contract-proof.json`
- Follow-up corrective PR URL: https://github.com/abarva-platform/abarva/pull/5142
- Follow-up corrective PR deploy evidence: `/tmp/nexus-tower-visual-intelligence/out/gh-run-29747373061-aca/runtime-invariant/runtime-invariant-proof.json`
- Second follow-up corrective PR URL: pending.
- Follow-up live signed-in proof: pending.

## Known Gaps

This PR maps advanced visual intents such as waterfall, heatmap, treemap, and sankey to the existing shared chart renderer’s supported chart shapes where necessary. Native visual renderers for those specialized chart types remain future enhancement work.
