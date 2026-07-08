# 2026-07-08-ava-product-truth-runtime-safety — aVa Product Truth Runtime Safety Guard

## Release ID

`2026-07-08-ava-product-truth-runtime-safety`

## Status

`candidate`

## Plain-English Summary

This release turns the aVa product-truth work from prompt guidance into runtime enforcement on the Intelligence ask path. The prior increment added the Product Truth registry and prompt block; this increment applies deterministic client-safety checks to generated answers, Home KNOW packets, Sentinel stages, structured `agent-answer` packets, and suggested questions before they leave `/api/intelligence/ask`.

The goal is not to make aVa less useful. It is to keep useful executive answers from escaping with unsafe product claims, raw internal guard errors, third-party replacement language, stale/cross-tenant facts, or unsupported suggested questions.

## Layer Impact

- `global-control-lane`: shared aVa/Intelligence answer behavior changes for all tenants using `/api/intelligence/ask`.
- `global-control-lane`: QA harness now recognizes structured `retiredFactFindings` as the block signal so client-safe wording does not blind the retired-fact audit.
- No schema, migration, Azure resource, environment variable, or worker-job changes.

## Client Applicability

- All clients: Yes, for aVa answers that flow through `/api/intelligence/ask`.
- Specific clients: N/A.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/product-truth/runtime-guard.ts` — new deterministic runtime guard and repair layer for:
  - raw internal error leakage,
  - third-party/professional-services replacement language,
  - unsupported capability phrasing,
  - old Moves phase shorthand,
  - obvious out-of-scope prompts,
  - professional-owner boundary language,
  - unsafe suggested questions.
- `src/lib/intelligence/ask/index.ts` — applies runtime guard before emitting answer deltas and followups; replaces retired-fact raw error strings with client-safe fallback text while preserving `retiredFactFindings`.
- `src/app/api/intelligence/ask/route.ts` — applies the same guard to route-level Home KNOW, Sentinel, tabbed, and structured-exhibit `agent-answer` packets.
- `src/lib/intelligence/ask/synthesizer.ts` — injects the Product Truth system-prompt block into the Intelligence synthesizer prompt.
- `src/lib/intelligence/ask/retired-fact-gate.ts` — adds client-safe retired-fact fallback message.
- `src/lib/agent/product-truth/third-party-replacement-guard.ts` — expands banned replacement/professional boundary coverage to ISG, UpperEdge, legal counsel, procurement advisors, credit desks, analyst reports, auditors, FP&A, and clinicians.
- `scripts/qa/intelligence-extensive-api-audit.mjs` — treats structured `retiredFactFindings` as a retired-fact block signal.
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts` — regression tests for the runtime guard.

## QA / Validation

- `npx jest src/lib/agent/product-truth/__tests__ --runInBand` — Pass, 6 suites / 30 tests.
- `npx jest src/lib/agent/product-truth/__tests__ src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts --runInBand` — Pass, 7 suites / 35 tests.
- `npx eslint src/lib/agent/product-truth src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/app/api/intelligence/ask/route.ts scripts/qa/intelligence-extensive-api-audit.mjs` — Pass, 0 errors / 0 warnings after cleanup.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — Pass, 0 errors. A first run without the larger heap hit Node heap OOM before diagnostics, so the larger heap setting is the reliable local command for this repo.
- Baseline evidence for this release: `reports/ava-product-truth-100q-baseline-2026-07-08.md` and `proof/ava-product-truth-100q-baseline-2026-07-08/` were generated before implementation as the defect corpus.

## Rollout Plan

Open PR → squash-merge to `main` → repo-owned ACA deploy workflow builds and deploys the new image. After deployment, rerun the same 100-question baseline as regression against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: produced by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: must be confirmed after deploy before claiming live acceptance.
- Worker image invariant: N/A.
- Feature/env flag update path: N/A.
- Live signed-in proof required: Yes. Rerun the 100Q corpus after deploy and verify critical/fail reductions plus no raw internal error strings in client-visible answers.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA deploy workflow. No migrations or data changes are involved.

## Audit Evidence

- Baseline report: `reports/ava-product-truth-100q-baseline-2026-07-08.md`.
- Baseline JSON/CSV/worst-20: `proof/ava-product-truth-100q-baseline-2026-07-08/`.
- Unit and typecheck commands listed in QA / Validation.
- PR URL and deploy evidence to be added after PR/deploy.

## Known Gaps

- This is the safety-blocker runtime guard, not the complete Product Capability Registry expansion. PR 2 should deepen capability registry coverage and claim-risk validation.
- This does not fully implement the Moves canonical phase contract everywhere outside `/api/intelligence/ask`. PR 3 should enforce P0-P5 + Tower across Moves-specific chat/export paths.
- Live regression has not yet been run after deploy. The same 100-question corpus must be rerun on `https://app.abarva.ai` before claiming production acceptance.
