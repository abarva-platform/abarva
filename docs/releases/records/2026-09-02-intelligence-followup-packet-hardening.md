# 2026-09-02-intelligence-followup-packet-hardening — Intelligence follow-up packet hardening

## Release ID

`2026-09-02-intelligence-followup-packet-hardening`

## Status

`candidate`

## Plain-English Summary

Intelligence aVa now treats governed follow-up payloads as protocol data even when the answer has no table, chart, graph, or citation. The route emits a validated answer packet for clean prose-only responses, carries follow-up suggestions through typed `nextSteps`, keeps protocol fences out of the visible streamed answer, uses server-resolved tenant identity for the early tenant fence, and keeps tenant-fence refusal copy grounded in server-resolved identity.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Layer 4 (products):** updates the Intelligence answer route and chat rendering guard. No canonical data, source adapter, intake, migration, loader, or write path changes.

## Client Applicability

- All clients: yes, for the Intelligence ask surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/app/api/intelligence/ask/route.ts` — packetizes prose-only Intelligence answers, preserves typed follow-up suggestions, applies the governed artifact sanitizer to visible deltas when protocol payloads are present, and keeps tenant-fence alias matching on resolved identity rather than raw request fields.
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — adds NDJSON route regressions for prose-only answers with follow-up protocol and tenant-fence hardening.
- `src/lib/intelligence/ask/__tests__/tenant-safety-policy.test.ts` — adds a code-derived invariant that every canonical tenant has a safety policy and every canonical tenant pair is covered by cross-tenant blocking terms.
- `src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts` — adds a client fallback regression for packetless streamed follow-up protocol.

## QA / Validation

- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/lib/intelligence/answer/__tests__/followups-leak-repro.test.ts src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/lib/intelligence/ask/__tests__/tenant-safety-policy.test.ts --runInBand` — passed.
- `npx eslint src/app/api/intelligence/ask/route.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/lib/intelligence/ask/__tests__/tenant-safety-policy.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting web image. No migration, data load, feature flag update, or manual data-plane operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for shared Product/Lab web runtime.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deployment before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before claiming the fix live on `app.abarva.ai`.

## Rollback Plan

Revert the PR. The previous route behavior returns without schema or data migration rollback.

## Audit Evidence

- Focused Jest output for the three commands listed under QA / Validation.
- Future PR and CI run for this candidate.
- Future ACA runtime invariant and signed-in browser proof before any live claim.

## Known Gaps

Live signed-in browser proof is pending; this record is candidate validation only.
