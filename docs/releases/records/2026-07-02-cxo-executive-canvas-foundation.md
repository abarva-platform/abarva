# 2026-07-02-cxo-executive-canvas-foundation — CXO Executive Canvas Foundation

## Release ID

`2026-07-02-cxo-executive-canvas-foundation`

## Status

`candidate`

## Plain-English Summary

Adds a shared, governed executive canvas renderer so AbarVa can turn model-selected strategic recommendations into native board exhibits without rendering arbitrary model-authored HTML, JSX, SVG, Mermaid, CSS, chart code, or raw JSON. Intelligence v2 now uses that shared path for native canvas payloads, and old Intelligence canvas names remain compatible through normalization.

## Layer Impact

`global-control-lane`: shared application UI and model-output rendering contract for all executive surfaces. No database schema, ingestion path, tenant data, worker, environment variable, or deployment workflow changes.

## Client Applicability

- All clients: yes, this is a shared rendering primitive.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cxo-canvas`: canonical canvas types, Zod schema validation, renderer registry, safe fallback, examples, and README.
- `src/lib/intelligence/executive-canvas-payload.ts`: Intelligence adapter now validates and normalizes through the shared CXO canvas contract.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: native canvas payloads render through `CxoCanvasRenderer`.
- Intelligence prompt/source helpers now emit canonical canvas types.
- `docs/standards/CXO-EXECUTIVE-CANVAS-CONTRACT.md`: platform standard for shared executive canvas rendering.

## QA / Validation

- PASS: `npx jest src/lib/cxo-canvas/__tests__/cxo-canvas-renderer.test.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand`
- PASS: scoped `npx eslint` over changed renderer, parser, prompt, source, and Intelligence v2 files.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge to main through the normal PR path. This change becomes active with the next approved Azure Container Apps release image for the shared app. No manual migration or feature flag rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required for any later production/lab activation; this PR does not deploy.
- Shared runtime mutators: none.
- Approved image digest: not applicable until deployment.
- ACA runtime invariant: must remain the proof lane if deployed later.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any claim that the deployed product is browser-visible; not performed in this PR-ready code change.

## Rollback Plan

Revert the PR. Intelligence will return to its previous local canvas renderer path and old prompt/source behavior.

## Audit Evidence

Inspect this release record, `docs/standards/CXO-EXECUTIVE-CANVAS-CONTRACT.md`, the `src/lib/cxo-canvas/examples` payloads, focused Jest output, scoped ESLint output, TypeScript output, release-check output, and `git diff --check`.

## Known Gaps

Only `executive-canvas-sequencing` is implemented as the first full strategic renderer. The registry includes safe native cards for the existing Intelligence matrix, roadmap, and proof-boundary shapes, while the remaining approved canvas types use generic native cards until product-specific renderers are added.
