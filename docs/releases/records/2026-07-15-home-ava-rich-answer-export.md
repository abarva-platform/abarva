# 2026-07-15-home-ava-rich-answer-export — Home aVa Rich Answer Export Contract

## Release ID

`2026-07-15-home-ava-rich-answer-export`

## Status

`candidate`

## Plain-English Summary

Home aVa now has an explicit rich-answer and export contract aligned to the shared aVa answer packet used by Intelligence. Home remains scoped to active Knowledge/Home context, but when it answers with tables, charts, or relationship graphs, those artifacts render through the shared aVa renderer and export with preserved structure in HTML and PDF.

## Layer Impact

- `global-control-lane`: Updates the shared aVa answer export renderer used by Home and Intelligence answer packets.
- `home/knowledge`: Documents that Home aVa is narrower than Intelligence but must preserve the same board-grade tables, charts, graphs, citations, caveats, and next steps.
- `quality/audit`: Extends the Home aVa context-contract audit to fail if Home drops the shared renderer or if export fidelity regresses.

## Client Applicability

- All clients: yes, wherever Home aVa produces a shared `AvaAnswerPacket`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `docs/home-know/HOME_AVA_CONTEXT_CONTRACT.md`
- `scripts/knowledge/audit-home-ava-context-contract.ts`
- `src/lib/ava-answer/export/render-answer-html.ts`
- `src/lib/ava-answer/export/render-answer-pdf.tsx`
- `src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`

## QA / Validation

- Pass: `npm run audit:home-ava-context-contract`
- Pass: `npx jest src/lib/ava-answer/export/__tests__/render-answer-html.test.ts --runInBand`
- Pass: `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit --pretty false --project tsconfig.json`

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main workflow, then verify a signed-in Home aVa answer can render and export a rich answer packet without losing table/chart/graph formatting.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy if the main workflow updates workers.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home aVa rich answer/export smoke on the deployed runtime.

## Rollback Plan

Revert this PR. The previous export renderer can still produce prose/tables and quadrant charts, but graph visuals and non-quadrant PDF chart exhibits would lose fidelity again.

## Audit Evidence

- `reports/home-cxo-story-quality/home-ava-contract-results.json`
- Focused Jest output for `src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`
- TypeScript project check output

## Known Gaps

This PR preserves chart and graph structure in PDF as governed PDF-native exhibits. It does not make PDF output pixel-identical to the browser SVG chart engine.
