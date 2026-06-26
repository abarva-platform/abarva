# 2026-06-26-home-prompt-visible-operator-trace — Home Prompt Boundary Trace

## Release ID

`2026-06-26-home-prompt-visible-operator-trace`

## Status

`candidate`

## Plain-English Summary

Adds operator-only observability to the Home KNOW Claude synthesis path so AbarVa operators can inspect the exact Anthropic request payload and raw response used to create a Home answer. This does not change Home prompts, routing, rendering, scrubbing, or answer behavior; it only makes the real model boundary visible when the existing debug header is present.

## Layer Impact

- `global-control-lane`: Home KNOW API/debug behavior now exposes the real Anthropic boundary to operators behind `x-abarva-debug-home-know`.
- `client-data-lane`: No data-plane writes, migrations, schema changes, or tenant data changes.

## Client Applicability

- All clients: The operator trace capability is available wherever Home KNOW uses the Claude text synthesis path and the operator debug header is enabled.
- Specific clients: Lakeshore is the live proof tenant for this release.
- Internal only: Verbatim prompt/raw capture is operator-only debug output and is not exposed to normal users.
- Public/demo only: None.
- Feature flag: Existing Home/Claude synthesis gates still control whether the model call happens.

## Changes Included

- `src/lib/home/know/home-consultant-text-synthesis.ts` records the literal Anthropic request payload, model params, request byte length, SHA-256 hash, streamed/final raw events, and reassembled raw text at the `client.messages.stream(...)` boundary when `operatorTrace` is true.
- `src/lib/home/know/home-know-contract.ts` adds the debug-only trace shape.
- `src/lib/home/know/home-know-engine.ts` forwards the operator trace flag to synthesis.
- `src/app/api/home/know/ask/route.ts` passes `operatorTrace` only when `x-abarva-debug-home-know` is present and returns `trace.finalPrompt`, `trace.claudeRaw`, `trace.model`, and `trace.params` in the debug response.
- `src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts` adds a focused unit test for the operator trace payload.

## QA / Validation

- PASS: `npx eslint src/app/api/home/know/ask/route.ts src/lib/home/know/home-consultant-text-synthesis.ts src/lib/home/know/home-know-contract.ts src/lib/home/know/home-know-engine.ts`
- PASS: `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand -t "captures the verbatim Anthropic boundary"`
- BLOCKED BY PRE-EXISTING DEPENDENCIES: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` fails only on missing declarations/packages for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no errors remain in the touched Home files.
- Pending post-deploy: signed-in Lakeshore Home debug capture for the six requested questions, proving `trace.finalPrompt` and `trace.claudeRaw` are non-null.

## Rollout Plan

Merge to `main`, build the exact git SHA through Azure Container Registry, update `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then run the Lakeshore signed-in Home prompt capture against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release path for `app.abarva.ai`.
- Shared runtime mutators: `az acr build`, `az containerapp update`, `az containerapp ingress traffic set`.
- Approved image digest: To be recorded after ACR build.
- ACA runtime invariant: `app.abarva.ai` must resolve to the active ACA revision, not Vercel.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: No feature or environment flag changes.
- Live signed-in proof required: Yes, Lakeshore Home prompt capture with operator debug header.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image/revision. No migrations or data changes are involved.

## Audit Evidence

- Focused ESLint output.
- Focused Jest output for the prompt-boundary trace test.
- TypeScript output showing only pre-existing missing dependency errors outside the touched Home path.
- Post-deploy evidence bundle under `~/Downloads/abarva-home-prompt-visible-<timestamp>/`.

## Known Gaps

This release intentionally does not fix prompt quality, leaks, scrubbing, routing, or rendering. It only makes the actual Anthropic request and raw response observable for operator inspection.
