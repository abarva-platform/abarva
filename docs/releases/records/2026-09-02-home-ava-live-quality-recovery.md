# 2026-09-02-home-ava-live-quality-recovery — Home aVa live quality recovery

## Release ID

`2026-09-02-home-ava-live-quality-recovery`

## Status

`candidate`

## Plain-English Summary

Home aVa now keeps answering from the current Home read model when an optional curated advisor context file is unavailable. Before this change, that condition could block otherwise usable signed-in answers even when the live Home read model had current citations, tables, and gaps available.

The Home preview aVa path also gets a safer recovery path for broad executive questions. When the model returns a generic no-data answer but cited chapter claims are available, the server now produces a compact, citation-backed partial answer with explicit evidence limits instead of telling the reader only to rephrase.

## Layer Impact

Release lane: `global-control-lane` — shared Home answer behaviour for signed-in product users.

- Layer 4 (Products — Home): updates answer routing, answer formatting guidance, and server-side no-data recovery for Home aVa.
- Layer 3 (Canonical model): unchanged. The change consumes existing Home read-model packets and chapter claims only.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes, for Home aVa answer behaviour where the relevant route and feature path are enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home KNOW synthesis flags are respected; this change does not add or mutate flags.

## Changes Included

- `src/lib/home/know/home-know-engine.ts` — falls through to the current Home read-model packet when the optional curated advisor context file is unavailable, and surfaces that condition as a reader-visible gap.
- `src/lib/home/know/__tests__/home-know-current-packet-fallback.test.ts` — regression coverage for the current read-model fallback.
- `src/lib/home/know/__tests__/home-know-engine.test.ts` — keeps the loaded-context overview assertion aligned with the current safe tenant display text.
- `src/lib/home/preview/ava-answer.ts` — expands broad executive question planning and adds cited-claim recovery for generic no-data model responses.
- `src/lib/home/preview/__tests__/ava-answer.test.ts` — regression coverage for compact consulting structure and cited-claim recovery.

## QA / Validation

- `npx eslint src/lib/home/preview/ava-answer.ts src/lib/home/preview/__tests__/ava-answer.test.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/__tests__/home-know-current-packet-fallback.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — clean.
- `jest` targeted Home and export suites — 69 passed:
  - `src/lib/home/preview/__tests__/ava-answer.test.ts`
  - `src/lib/home/know/__tests__/home-know-current-packet-fallback.test.ts`
  - `src/lib/home/know/__tests__/home-know-engine.test.ts`
  - `src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`
  - `src/lib/ava-answer/export/__tests__/render-answer-pdf.test.tsx`
  - `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`
- `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json` — pass; 677/705 Home tests passing with 12 baselined suites and no movement away from the baseline.

## Rollout Plan

Merge to main by PR and squash merge. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. No migration, loader, tenant data write, feature-flag change, or manual shared-runtime mutation is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: must be proven from the main deploy workflow evidence before calling the release deployed.
- Worker image invariant: no worker change.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for affected Home aVa routes after deployment.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous Home aVa behaviour. No data rollback is required because this release does not write tenant data, alter schema, or change feature flags.

## Known Gaps

- This does not load or repair missing curated advisor context files; it prevents that optional file from blocking answers when the current Home read model is usable.
- This does not expand the underlying Home read model or source-intelligence corpus.
- Live signed-in proof is required after deployment before this release should be called live-proven.

## Audit Evidence

- PR URL: to be attached on open.
- CI and ACA deployment runs for the merge commit.
- Local validation output recorded in the QA section above.
- Post-deploy signed-in Home aVa smoke output for the affected routes.
