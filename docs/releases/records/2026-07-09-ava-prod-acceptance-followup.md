# 2026-07-09-ava-prod-acceptance-followup — aVa Demo Hardening Production Acceptance Follow-Up

## Release ID

`2026-07-09-ava-prod-acceptance-followup`

## Status

`candidate`

## Plain-English Summary

Production acceptance for aVa Client Demo Hardening v1 found two real gaps after PR #4633 deployed: answer-only Intelligence turns exported as text-only sessions with zero governed answer packets, and a Moves/Tower regression prompt could still expose a raw Markdown phase table. This follow-up keeps the fast streaming chat behavior, but also emits and stores the governed answer packet so the dock, HTML export, and PDF export can render typed tables/charts. It also changes the deterministic Moves fallback from pipe-table text to client-safe phase-plan prose while the product assembles the canonical P0-P5 plus Tower table as a governed artifact.

## Layer Impact

- `global-control-lane`: Shared aVa/Intelligence answer lifecycle, product-truth repair, typed exhibit assembly, dock rendering, and export behavior change for all clients using the shared Intelligence aVa dock.

## Client Applicability

- All clients: Yes, for Intelligence answers using the shared answer-only streaming dock and chat session export.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: emits the governed `agent-answer` event after answer-only streaming instead of suppressing it.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: stores the packet for export and prefers validated packet body when typed artifacts are present.
- `src/components/agent/AgentDock.tsx`: renders typed Ava artifacts in Intelligence, not only in non-Intelligence surfaces.
- `src/lib/intelligence/ask/answer-mode-registry.ts`: removes the raw GFM pipe-table deterministic fallback for Moves execution mode.
- `src/lib/intelligence/answer/structured-exhibits.ts`: assembles the canonical Moves phase table artifact when the user asks for Moves/Tower execution structure.
- `src/lib/agent/product-truth/runtime-guard.ts`: repairs wording that makes Tower sound like the certifying authority.
- Regression tests for Moves fallback, structured exhibit assembly, product-truth repair, and Intelligence artifact rendering.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts --runInBand`
- Pass: `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx --runInBand --testNamePattern "renders Intelligence structured artifacts"`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npx eslint src/app/api/intelligence/ask/route.ts src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/agent/AgentDock.tsx src/lib/intelligence/ask/answer-mode-registry.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/agent/product-truth/runtime-guard.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent/__tests__/AgentDock.test.tsx src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- Note: Full `npx tsc --noEmit` without an increased heap OOMed locally before diagnostics; rerun with `NODE_OPTIONS=--max-old-space-size=8192` passed.
- Pending: GitHub CI, ACA deploy, and live signed-in production proof after merge.

## Rollout Plan

Open a PR from this candidate branch, squash merge to `main` after checks pass, then allow the repo-owned Azure Container Apps main deploy workflow to build the digest-pinned image and shift `app.abarva.ai` traffic. After deploy, rerun the aVa Client Demo Hardening v1 production acceptance proof on the signed-in app, including seed prompt, three generated follow-up clicks, HTML export, PDF export, and the focused bad-transcript regression.

## Deployment Authority

- Repo-owned deploy workflow: Required, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow when applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the follow-up merge commit and let the repo-owned ACA main deploy workflow ship the reverted image. The rollback returns Intelligence answer-only turns to the previous text-only export behavior, so do not call the original #4633 release complete until this follow-up passes live proof or an equivalent fix supersedes it.

## Audit Evidence

- Prior failed live proof bundle: `/Users/anand/Projects/nexus/proof/ava-client-demo-hardening-v1-live-2026-07-09T13-45-54-633Z`
- Follow-up PR URL: Pending.
- GitHub CI: Pending.
- ACA deploy evidence: Pending.
- Live signed-in proof bundle: Pending.

## Known Gaps

Live production acceptance is still pending. This candidate should not be described as `live-proven` until the deployed app passes the seed prompt, follow-up clicks, HTML/PDF export inspection, suggested-question safety, claim validation, and focused bad-transcript regression.
