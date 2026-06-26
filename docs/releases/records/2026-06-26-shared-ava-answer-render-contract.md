# 2026-06-26-shared-ava-answer-render-contract — Shared aVa Public Answer Render Contract

## Release ID

`2026-06-26-shared-ava-answer-render-contract`

## Status

`candidate`

## Plain-English Summary

aVa answers now pass through one shared public-language scrub and render contract before they appear in Home, Intelligence, and shared agent surfaces. The immediate fix removes Intelligence page leaks such as internal version names, row/evidence-count language, raw expert stacks, and stitched phrases like "The supporting evidence is that..." while preserving deterministic tables and source citations.

## Layer Impact

`global-control-lane`: updates shared answer rendering, fallback prose scrubbing, and Intelligence v2 context handoff. This is presentation and answer-quality behavior only; it does not change tenant data, schemas, RLS, ingestion, or retrieval.

## Client Applicability

- All clients: yes, for shared aVa/AgentDock answer rendering and Intelligence v2.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added shared public answer scrub and paragraph-cap utility in `src/lib/ava-answer/public-answer-scrub.ts`.
- Repointed Home public scrub compatibility exports to the shared scrub.
- Updated Intelligence answer safety to use the shared scrub and public citation labels.
- Updated `AgentAnswerRenderer` to collapse expert details and remove raw source-class labels from visible citation chips.
- Updated `AgentDock` and `AvaAsk` fallback answer paths so raw prose also goes through the shared scrub.
- Updated `IntelligenceV2Surface` so its posted surface context and rendered latest answer use business-safe language and the canonical answer renderer.
- Added focused regressions for stitched phrases, internal count language, expert-chip rendering, and Intelligence v2 public rendering.

## QA / Validation

- Focused Jest passed: `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`, `src/components/agent-answer/__tests__/AvaAsk.test.tsx`, `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`, `src/lib/home/know/__tests__/home-public-answer-scrub.test.ts`, and `src/lib/intelligence/answer/__tests__/answer-safety.test.ts` — 5 suites passed, 18 tests passed.
- Focused ESLint passed for all touched source and test files.
- Jest emitted pre-existing duplicate manual mock warnings for markdown/GFM test mocks; no test failure was caused by this change.
- Live signed-in browser proof is still required before marking this released.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the exact merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new healthy revision, then verify signed-in Intelligence and Home aVa answers for Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: only the approved Azure Container Apps main deploy path.
- Approved image digest: pending deploy.
- ACA runtime invariant: active revision, traffic revision, and template image must match the approved main image.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback the ACA web app to the previous approved main image digest/revision. No migration rollback is needed because this release has no data-plane change.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local focused test output: captured in the Codex run and mirrored in the Downloads proof folder.
- Browser proof: pending.

## Known Gaps

Some product pages may still have bespoke renderers outside `AgentDock`, `AvaAsk`, or `AgentAnswerRenderer`. Those paths must be migrated if discovered, but the primary shared aVa answer lane and Intelligence v2 visible answer path are covered by this release.
