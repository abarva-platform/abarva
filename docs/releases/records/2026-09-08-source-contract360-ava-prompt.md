# 2026-09-08-source-contract360-ava-prompt - Source Contract 360 aVa Prompt Grounding

## Release ID

`2026-09-08-source-contract360-ava-prompt`

## Status

`candidate`

## Plain-English Summary

This candidate makes Source aVa treat a selected Contract 360 record as an
authoritative page-local contract context before Claude answers. The route now
adds selected-contract facts, loaded contract-book coverage, cube summaries, and
the required consulting answer shape to the prompt, so contract questions can be
answered with a strategic read, diagnosis, and recommended next move when the
data supports it.

The Source answer quality gate remains telemetry-only and no longer keeps a
separate held response path. Answer shaping happens in the prompt and grounding
contract before generation; the visible Claude response is not replaced by a
post-generation repair.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Updates Source aVa prompt construction and fallback behavior
  for Source workspace and selected Contract 360 contexts.
- Layer 4 Agent runtime: Adds prompt-only selected-contract grounding and keeps
  quality checks as logging telemetry. No Layer 1 intake, Layer 2 adapter, Layer
  3 canonical model, schema, migration, or data-build job changes are included.

## Client Applicability

- All clients: Yes, for Source workspace/contract contexts that pass selected
  contract facts through `surfaceContext`.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source aVa route behavior; no new flag.

## Changes Included

- Adds a Source aVa fallback/prompt helper that reads selected Contract 360
  context from direct contract surfaces or the Source workspace `sourceV4`
  selected-contract packet.
- Injects the selected-contract prompt block before Claude generation.
- Keeps no-event Source portfolio fallbacks for unsupported portfolio-only
  savings, pricing, BAFO, chart, and supplier-recommendation asks, but does not
  intercept selected Contract 360 turns.
- Updates Source answer guidance for executive consulting style, including a
  three-paragraph analytical shape and compact table/Recharts-backed chart
  support when grounded figures exist.
- Removes the route's held-answer mirror so quality checks run only against the
  streamed output for telemetry and never replace the visible answer.
- Adds focused unit/static tests for fallback scoping, selected-contract prompt
  construction, route prompt injection, and telemetry-only output discipline.

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/ava/__tests__/portfolio-fallback-answer.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand` - pass, 31 tests.
- `npx eslint src/lib/source/ava/portfolio-fallback-answer.ts src/lib/source/ava/__tests__/portfolio-fallback-answer.test.ts src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts` - pass.

## Rollout Plan

Merge through the protected repository PR path. The route becomes active after
the repo-owned Azure Container Apps main deploy workflow builds and deploys the
resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime deployment.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required before claiming live deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, run a Source aVa selected-contract
  transcript proof after deployment.

## Rollback Plan

Revert the prompt helper and route wiring, then redeploy through the repo-owned
ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Focused unit/static test output for Source selected-contract prompt grounding.
- Scoped ESLint output for touched files.
- Pending: release gate output and deployed signed-in transcript proof.

## Known Gaps

This candidate does not ingest new contract data, alter contract-book read
models, change graph visuals, or claim live deployment. It depends on existing
Source workspace and Contract 360 `surfaceContext` data being present.
