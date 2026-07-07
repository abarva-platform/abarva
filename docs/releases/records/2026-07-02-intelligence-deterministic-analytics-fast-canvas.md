# 2026-07-02-intelligence-deterministic-analytics-fast-canvas - Intelligence Deterministic Analytics Fast Canvas

## Release ID

`2026-07-02-intelligence-deterministic-analytics-fast-canvas`

## Status

`candidate`

## Plain-English Summary

This release adds a deterministic analytics layer for Intelligence and wires the Intelligence canvas to show a useful executive decision exhibit immediately for the SkyHarbor airline and Industrial/Morgan Street demo patterns. The left-side advisor answer can stay fast and conversational while the right-side canvas can start with an AbarVa-computed decision frame, then be replaced by the model-grounded canvas when Claude finishes.

## Layer Impact

- `global-control-lane`: Adds shared Intelligence analytics helpers and a fast-canvas composer used by the Intelligence v2 surface.
- Product UI/runtime: The Intelligence canvas can now render deterministic investment sequencing, value/readiness, gate-to-value, and proof-boundary exhibits before the full model response settles.
- Documentation: Adds the two-lane analytics/visual contract so the product boundary is explicit: deterministic AbarVa analytics prepare the exhibit, Claude refines advisory judgment, and the renderer draws governed visuals.

## Client Applicability

- All clients: The analytics module is shared code, but it only activates when the tenant/question matches known demo decision patterns.
- Specific clients: SkyHarbor/Airline Demo and Industrial/Lakeshore/Morgan Street demo patterns receive the fast executive canvas behavior.
- Internal only: None.
- Public/demo only: Demo-specific seed inputs are limited to pending-canvas framing and are not a substitute for tenant evidence.
- Feature flag: None in this slice.

## Changes Included

- `src/lib/intelligence/analytics/portfolio.ts` adds typed portfolio candidate scoring, proof-boundary scoring, posture bucketing, value/readiness quadranting, gate-to-value, outlier flags, sensitivity helpers, and `buildFastCanvasAnalytics`.
- `src/lib/intelligence/analytics/pending-canvas.ts` composes five pending companion tabs and native `abarva-canvas` payloads from deterministic analytics for airline and industrial demo questions.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` calls the pending analytics composer before falling back to the older hardcoded fast canvas.
- `src/lib/intelligence/analytics/__tests__/portfolio.test.ts` adds regression coverage for scoring, payload selection, pending tabs, and analytic helpers.
- `scripts/qa/intelligence-100q-pressure.mjs` adds the signed-in production pressure harness and 100-question Industrial/SkyHarbor bank.
- `package.json` adds `npm run qa:intelligence:pressure100`.
- `docs/architecture/ai/INTELLIGENCE_TWO_LANE_ANALYTICS_VISUAL_CONTRACT_2026-07-02.md` documents the two-lane runtime and pressure-test contract.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/analytics/__tests__/portfolio.test.ts` passed with 13 tests covering deterministic scoring, proof scoring, posture rules, outlier flags, demo fixtures, and UI-safe analytics payloads.
- `npm test -- --runTestsByPath src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- `npx eslint src/lib/intelligence/analytics/portfolio.ts src/lib/intelligence/analytics/pending-canvas.ts src/lib/intelligence/analytics/__tests__/portfolio.test.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed. The default heap typecheck exhausted memory, so this was rerun with an 8 GB heap.
- `npm run release:check` passed.
- Local signed-in browser proof was attempted and blocked by a Clerk session refresh loop in the local dev environment. See `proof/intelligence-fast-canvas-2026-07-02/BROWSER_PROOF_BLOCKED.md`.
- `npm run qa:intelligence:pressure100 -- --dry-run --out-dir /tmp/intelligence-pressure-dry-run` passed, generated the 100-question bank, and captured current ACA/health metadata without claiming signed-in browser execution.

## Rollout Plan

Merge through the normal PR lane. When approved for runtime release, build and deploy through the repo-owned Azure Container Apps process for `app.abarva.ai`, then verify signed-in SkyHarbor and Industrial/Morgan Street Intelligence flows in the browser.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow.
- Shared runtime mutators: None in this release.
- Approved image digest: Not built yet.
- ACA runtime invariant: Production proof must show the active revision and digest before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming deployed product proof.

## Rollback Plan

Revert the PR or remove the analytics composer call from `IntelligenceV2Surface.tsx`. The older hardcoded fast-canvas fallback remains in place, so the runtime has a narrow rollback path if the deterministic analytics composer is disabled.

## Audit Evidence

- Unit and component test output from the commands listed above.
- Architecture contract in `docs/architecture/ai/INTELLIGENCE_TWO_LANE_ANALYTICS_VISUAL_CONTRACT_2026-07-02.md`.
- 100Q pressure harness in `scripts/qa/intelligence-100q-pressure.mjs`.
- Local browser proof blocker note in `proof/intelligence-fast-canvas-2026-07-02/BROWSER_PROOF_BLOCKED.md`.
- No production deployment or browser proof has been performed in this candidate yet.

## Known Gaps

- Browser latency proof is still required after deployment.
- Local signed-in proof is blocked by local Clerk key mismatch; use the known-good production auth path after ACA deployment.
- The deterministic fast-canvas inputs are demo-specific and should later be sourced from tenant evidence packets or precomputed analytics rows.
- The 500-question pressure harness is designed in the architecture contract but not implemented in this slice.
