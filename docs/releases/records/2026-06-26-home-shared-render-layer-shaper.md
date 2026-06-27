# 2026-06-26-home-shared-render-layer-shaper — Home Shared Render-Layer Shaper

## Release ID

`2026-06-26-home-shared-render-layer-shaper`

## Status

`candidate`

## Plain-English Summary

Home/aVa answers now shape the full rendered answer, not only Claude prose. The shared shaper cleans source chips, tables, charts, graphs, tooltips, and fallback text so client-facing answers do not expose placeholders such as `tenant excerpt`, raw IDs, snake_case dimension keys, zero-coverage rows, or mechanical source-support phrasing.

## Layer Impact

`global-control-lane`: updates shared aVa answer rendering and Home KNOW rendering. This changes presentation, answer stability, and public-language shaping only; it does not change tenant data, ingestion, RLS, schema, or retrieval.

## Client Applicability

- All clients: yes, for shared aVa answer packets and Home KNOW rendered answers.
- Specific clients: no client-specific code.
- Internal only: no.
- Public/demo only: no.
- Feature flag: Home Claude synthesis still follows the existing `home_know_claude_synthesis` policy; Home synthesis cache defaults on in production and can be disabled with `HOME_KNOW_SYNTHESIS_CACHE_ENABLED=false`.

## Changes Included

- Added `src/lib/ava-answer/render-layer-shaper.ts` as the shared rendered-answer shaper for prose, citations, tables, charts, graphs, labels, and leak detection.
- Added `src/lib/home/know/home-render-layer-shaper.ts` to route the full Home KNOW response through the shared shaper before browser rendering.
- Updated `AgentAnswerRenderer`, `HomeKnowAnswerRenderer`, `HomeSurface`, and `answer-safety` to use shared shaping for visible sources, artifacts, and fallback text.
- Added Home synthesis caching keyed by tenant, normalized question, model, prompt version, and prompt-packet SHA so Home context-browser answers remain stable unless the dossier/prompt changes.
- Added focused tests for rendered shaper behavior, citation compaction, zero-row dropping, graph label cleanup, Home renderer cleanup, Home surface labels, answer safety, and synthesis cache compatibility.

## QA / Validation

- Focused Jest passed: `src/lib/ava-answer/__tests__/render-layer-shaper.test.ts`, `src/lib/intelligence/answer/__tests__/answer-safety.test.ts`, `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`, `src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx`, `src/components/home/__tests__/HomeSurface.test.tsx`, and `src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts` — 6 suites passed, 41 tests passed.
- Focused ESLint passed for touched source and test files.
- Full TypeScript was run with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`; it failed only on pre-existing missing dependency declarations/modules outside this change: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Live signed-in browser crawl is still required before marking this release `released`.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the exact merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new healthy revision, then verify rendered Home answers in a signed-in Lakeshore session across prose, source chips, tables, charts, graphs, hover text, and screenshots.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: only the approved Azure Container Apps main deploy path.
- Approved image digest: pending deploy.
- ACA runtime invariant: active revision, traffic revision, and template image must match the approved main image.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: optional `HOME_KNOW_SYNTHESIS_CACHE_ENABLED`; default behavior requires no env update in production.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback the ACA web app to the previous approved main image digest/revision. No migration rollback is needed because this release has no data-plane change.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local focused test output: captured in the Codex run.
- Browser proof bundle: pending.

## Known Gaps

This release wires Home and the shared aVa answer renderer. It does not claim Tower, Intelligence, Source, or Moves bespoke renderers are fully migrated; those surfaces should adopt the same shared shaper at their rendered assembly boundary.
