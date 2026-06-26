# 2026-06-26-intelligence-trace-no-persona-packs — Simplify Intelligence Answer Path

## Release ID

`2026-06-26-intelligence-trace-no-persona-packs`

## Status

`candidate`

## Plain-English Summary

Intelligence answers now use a simpler contract: tenant evidence, corpus/pattern support, benchmarks, and one Claude synthesis path. Persona expert-pack labels are no longer surfaced in aVa answers, the old structured advisor stitch path is removed from the primary route, and operator-only trace mode can capture the exact prompt and raw model response for debugging.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence ask routing, aVa answer composition, the canonical answer renderer, and tests. This applies to all clients using the shared Intelligence/aVa surface.
- `client-data-lane`: No schema, migration, seed, or tenant data change.

## Client Applicability

- All clients: Shared Intelligence/aVa answer rendering and packet composition.
- Specific clients: None.
- Internal only: Operator trace mode is gated by `x-abarva-debug-intel: 1` plus an AbarVa/operator-style Clerk user. Signed-in synthetic lab personas on `.example.com` are also allowed to request trace output with the debug header so the existing Clerk automation users can prove prompt/raw behavior; real client domains are not granted trace access by this allowance.
- Public/demo only: None.
- Feature flag: Existing synthesis environment flags still govern Claude synthesis; this release does not add a new default exposure flag.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: Adds operator trace events for final prompt/raw output and removes the old structured advisor stitch path from the main response path.
- `src/app/api/intelligence/ask/route.ts`: Follow-up hardens trace proof by allowing signed-in synthetic `.example.com` lab personas to receive trace events only when the debug header is present.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: Tightens the Claude contract around executive answer shape, short paragraphs, comparative tables, and no internal implementation language.
- `src/lib/intelligence/ask/advisor-composer.ts`: Removes persona-pack prompt injection from the special advisor composer.
- `src/lib/ava-answer/composeAvaAnswer.ts`: Accepts legacy expert inputs for compatibility but emits no expert metadata.
- `src/components/agent-answer/AgentAnswerRenderer.tsx` and `src/components/agent-answer/AvaAsk.tsx`: Remove visible consulted-expert UI controls and stale expert event rendering.
- `src/lib/intelligence/answer/structured-exhibits.ts`: Replaces generic evidence-required fallback blocks with a neutral available-context table.
- `src/lib/intelligence/ask/response-policy.ts`: Removes the remaining section-label stitch rewrites that converted good model text into phrases such as `The supporting evidence is that ...` and `That means ...`.

## QA / Validation

- `npx eslint src/app/api/intelligence/ask/route.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/AvaAsk.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/ava-answer/composeAvaAnswer.ts src/lib/ava-answer/__tests__/composeAvaAnswer.test.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/ask/advisor-composer.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/compose-intelligence-answer.ts src/lib/intelligence/dossiers/__tests__/intelligence-dossier.test.ts src/lib/intelligence/dossiers/build-decision-options-dossier.ts src/lib/intelligence/dossiers/build-intelligence-dossier.ts src/lib/intelligence/dossiers/select-expert-council.ts` — passed.
- `npm test -- --runTestsByPath src/lib/ava-answer/__tests__/composeAvaAnswer.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/dossiers/__tests__/intelligence-dossier.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` — passed, 6 suites / 21 tests.
- `npx tsc --noEmit` — attempted, but the process produced no output after roughly five minutes and was interrupted; targeted eslint and Jest are the current local proof.
- Follow-up trace-gate validation: `npx eslint src/app/api/intelligence/ask/route.ts` — passed.
- Follow-up trace-gate validation: `npm test -- --runTestsByPath src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` — passed, 2 suites / 7 tests.
- Follow-up trace-gate validation: `npm run audit:control-plane-purity:check` — passed.
- Render-policy stitch validation: `npm test -- --runTestsByPath src/lib/intelligence/ask/response-policy.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` — passed, 3 suites / 21 tests.
- Render-policy stitch validation: `npx eslint src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts` — passed.

## Rollout Plan

Merge to main, build an ACA image from the exact git SHA, deploy through the approved Azure Container Apps lane, and run signed-in Intelligence trace/browser proof against `https://app.abarva.ai`. PR #3995 has deployed the main simplification release; the follow-up trace-gate candidate must deploy before claiming verbatim prompt/raw proof with the existing Clerk lab personas.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deploy path documented in `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: None.
- Approved image digest: To be recorded after ACA build.
- ACA runtime invariant: `app.abarva.ai` must run from the digest built from the merged SHA.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None required.
- Live signed-in proof required: Yes, Intelligence prompt/raw/render trace plus screenshot proof before claiming released.

## Rollback Plan

Rollback by redeploying the previous ACA revision or reverting this app-code release and redeploying the prior image. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3995
- CI run: PR checks passed on PR #3995; follow-up trace-gate checks to be recorded on the follow-up PR.
- Deployment URL: `https://app.abarva.ai` after ACA rollout.
- Smoke output: ACA deploy run `28218080279` passed for PR #3995 and `/api/health` returned `ok: true` with Postgres checks green. Signed-in Lakeshore CIO proof after that deploy confirmed public output no longer rendered consulted experts, expert-pack labels, or evidence-required fallback blocks, but trace events were withheld because the synthetic Clerk persona was not yet authorized for trace mode.

## Known Gaps

- Full TypeScript check did not complete locally before interruption; GitHub CI typecheck passed for PR #3995.
- Live signed-in prompt/raw trace proof with existing Clerk lab personas is pending the follow-up trace-gate deploy.
