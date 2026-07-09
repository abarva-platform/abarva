# 2026-07-09-ava-client-demo-hardening-v1 — aVa Client Demo Hardening v1

## Release ID

`2026-07-09-ava-client-demo-hardening-v1`

## Status

`candidate`

## Plain-English Summary

Hardens the aVa answer lifecycle so client-visible answers, suggested follow-up questions, HTML export, and PDF export are governed by the same answer-packet contract. The change adds claim-to-source validation metadata, explicit product-capability truth, stricter suggested-question safety, and export cleanup that prevents raw markdown tables, chart JSON, and escaped entity artifacts from leaking into executive artifacts.

## Layer Impact

- `global-control-lane`: Shared aVa answer validation, product-truth checks, suggested-question safety, and export rendering behavior for all tenants.
- `public-demo`: Improves client-demo answer quality and export fidelity for investor/pilot walkthroughs.

## Client Applicability

- All clients: Yes, all aVa surfaces that use `AvaAnswerPacket` validation/export and the shared product-truth runtime guard.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ava-answer/contract.ts`: Adds claim-validation metadata and chart metadata fields.
- `src/lib/ava-answer/claim-source-validation.ts`: Adds deterministic claim extraction and source-mapping for dollars, percentages, dates, counts, systems/vendors, control statuses, and product-capability claims.
- `src/lib/ava-answer/validateAvaAnswerPacket.ts`: Integrates claim validation into the canonical packet validation path.
- `src/lib/agent/product-truth/*`: Expands product capability registry and classifies suggested questions as safe or risky before display.
- `src/lib/ava-answer/export/*`: Shares HTML/PDF export text cleanup to prevent raw markdown, chart JSON, and entity artifacts.
- `src/lib/intelligence/answer/chart-kind-builders.ts`: Extends controlled chart kind mapping for horizontal bars and 2x2 matrices.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/ava-answer/__tests__/claim-source-validation.test.ts src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- Pass: `npm test -- --runTestsByPath src/lib/ava-answer/__tests__/cxo-quality-gate.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`
- Pass: `npx eslint src/lib/ava-answer/contract.ts src/lib/ava-answer/claim-source-validation.ts src/lib/ava-answer/validateAvaAnswerPacket.ts src/lib/ava-answer/export/render-text.ts src/lib/ava-answer/export/render-answer-html.ts src/lib/ava-answer/export/render-answer-pdf.tsx src/lib/agent/product-truth/runtime-guard.ts src/lib/agent/product-truth/types.ts src/lib/agent/product-truth/capability-registry.ts src/lib/agent/product-truth/capability-claim-guard.ts src/lib/intelligence/answer/chart-kind-builders.ts src/lib/intelligence/expert-pack/quality-gate.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Pass: post-#4639 follow-up local regression for the visual leak: `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`
- Pass: post-#4639 focused dock regression for artifact/body rendering: `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx -t "focused mode|suppresses raw markdown" --runInBand`
- Blocker found before acceptance: post-#4639 live signed-in screenshot still showed a raw orphan markdown table header (`| AI Use Case | ... |`) above the governed visual-boundary table. This follow-up candidate fixes that body/artifact reconciliation path.
- Pending: full CI, ACA deploy, and live signed-in follow-up/export regression after merge.

## Rollout Plan

Open PR from `codex/ava-client-demo-hardening`, squash merge to `main` after CI, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, rerun the live signed-in aVa follow-up/export audit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending post-merge deploy.
- ACA runtime invariant: Pending post-merge deploy.
- Worker image invariant: Pending post-merge deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `https://app.abarva.ai` aVa follow-up/export regression.

## Rollback Plan

Revert the squash merge and redeploy `main` through the repo-owned ACA main deploy workflow. No data migration or environment rollback is required.

## Audit Evidence

- PR: Pending.
- Focused tests and lint commands listed above.
- Post-#4639 failed visual sanity proof: `/Users/anand/Projects/nexus/proof/ava-client-demo-hardening-v1-live-post4639-2026-07-09T16-02-38-446Z/screenshots/01-seed.png` showed the orphan pipe header; the automated runner otherwise produced 4 UI turns, HTML export, PDF export, and 10 API regression streams for the deployed revision.
- Live proof: Pending post-deploy.

## Known Gaps

This PR adds the runtime/packet validation and export/suggestion safety foundations. A full 100-turn client-demo regression and deployed claim-to-source report remain pending until the PR is merged and deployed. Production acceptance remains pending until the post-orphan-header-fix deployed run shows no visible raw pipe-header text in the signed-in chat transcript, HTML export, or PDF export.
