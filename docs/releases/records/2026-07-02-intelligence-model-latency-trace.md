# 2026-07-02-intelligence-model-latency-trace — Intelligence Model Latency Proof

## Release ID

`2026-07-02-intelligence-model-latency-trace`

## Status

`candidate`

## Plain-English Summary

This release adds operator-only latency instrumentation to the Intelligence ask path so the team can measure why final Claude-backed answers can take roughly 100 seconds to replace the fast executive canvas. It preserves the fast canvas and does not change the CXO-facing answer contract; it adds timing evidence for route setup, tenant/auth resolution, context retrieval, prompt size, Claude first token, Claude stream duration, repair calls, canvas parsing, answer composition, and response close.

## Layer Impact

- `global-control-lane`: Adds shared Intelligence observability in the `/api/intelligence/ask` route and synthesis libraries. The normal UI remains unchanged unless an operator enables latency trace events.

## Client Applicability

- All clients: The instrumentation code is available in the shared Intelligence route.
- Specific clients: The first proof run is targeted at SkyHarbor/Airline Demo and Industrial/Lakeshore/Morgan Street demo prompts.
- Internal only: Latency trace events are for operators and proof harnesses.
- Public/demo only: None.
- Feature flag: `INTELLIGENCE_LATENCY_TRACE=1`, `?latency=1`, or `x-abarva-intelligence-latency: 1` enables timing-only NDJSON events. Full prompt/output trace remains under the stricter existing operator trace gate.

## Changes Included

- `src/lib/intelligence/latency-trace.ts`: reusable timing helper and prompt/response size summary.
- `src/app/api/intelligence/ask/route.ts`: route-level timing events for auth, tenant resolution, session memory, stream start, canvas parsing, answer composition, and close.
- `src/lib/intelligence/ask/index.ts`: timings for classification, retrieval families, source selection, and advisory packet assembly.
- `src/lib/intelligence/ask/synthesizer.ts`: timings for prompt construction, audited Claude client setup, primary Claude stream first-token and completion, repair calls, and parser/canvas fallback.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: timings for consultant prompt size, primary Claude call, output size, and repair calls.
- `src/lib/intelligence/__tests__/latency-trace.test.ts`: unit coverage for compact timing event shape.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/__tests__/latency-trace.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` passed: 2 suites, 25 tests.
- `npx eslint src/lib/intelligence/latency-trace.ts src/lib/intelligence/__tests__/latency-trace.test.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/app/api/intelligence/ask/route.ts` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through the normal PR path, build the exact SHA through ACR, deploy with the approved Azure Container Apps lane, assign 100% traffic after the revision is healthy, then run signed-in latency proof for the four required prompts.

## Deployment Authority

- Repo-owned deploy workflow: Required before production proof.
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: `INTELLIGENCE_LATENCY_TRACE=1` can enable timings globally for proof, or proof harness can call the route with `?latency=1` / `x-abarva-intelligence-latency: 1`.
- Live signed-in proof required: Yes, against SkyHarbor/Airline Demo and Industrial/Lakeshore/Morgan Street.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision. The change is additive observability only and has no migration or data-plane rollback requirement.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy revision/digest: pending.
- Four-prompt latency report: pending.
- Signed-in screenshots / stream timing captures: pending.

## Known Gaps

- This release instruments latency; it does not yet claim final-answer latency is under 35 seconds.
- The four-prompt production-equivalent latency report still needs to be run after deployment or against a signed-in production-equivalent environment.
