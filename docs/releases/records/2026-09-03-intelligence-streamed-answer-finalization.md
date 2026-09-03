# 2026-09-03-intelligence-streamed-answer-finalization — Strip governed payloads on every streamed answer

## Release ID

`2026-09-03-intelligence-streamed-answer-finalization`

## Status

`candidate`

## Plain-English Summary

The Intelligence advisory client now applies governed artifact cleanup to every completed streamed answer, not only to answers that also emit a structured answer packet.

The cause was a placement gap in the client stream handler. `resolveAssistantAnswerText` strips governed artifact payloads from visible answer text, but it only ran in the answer-packet branch. When a streamed answer completed without a packet, the terminal message preserved the raw stream accumulation after only label cleanup.

Stream completion now runs every assistant message through a single finalization step that applies the same strip, sets terminal status, and clears the streaming label. Stripping already-clean text changes nothing, so answers that produce a packet are unaffected.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): client-side stream finalization only.
- Layer 3 (Canonical model): unchanged. No value, metric, or read model is touched.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — the rendering path is tenant-agnostic.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — added `finalizeAssistantMessage`, which sets terminal status, clears the streaming label, and strips governed artifact payloads; stream completion now goes through it instead of setting status inline.
- `src/components/intelligence-advisory/__tests__/finalize-assistant-message.test.ts` — new coverage for the transform and for the fact that stream completion actually calls it.

## QA / Validation

- `npx jest src/components/intelligence-advisory/__tests__/finalize-assistant-message.test.ts` — 4 passed.
- Mutation-tested in both directions. Removing the strip from the transform fails the payload assertion; replacing the call site with the previous inline status update fails the wiring assertion.
- `npx jest src/components/intelligence-advisory src/lib/intelligence/answer` — 109 passed, 1 failed. That failure is pre-existing on the base commit, verified by stashing the change and re-running. No suite regressed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — 0 errors repo-wide.
- `npx eslint` on both changed files — clean.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes. An answer that completes without a structured packet must render without governed artifact protocol text, while follow-up suggestions remain available when emitted.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. Client-side rendering change with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. Post-deploy signed-in browser proof is still required before claiming user-visible completion.
- The guard is a unit test over the transform plus a source assertion that stream completion calls it. An end-to-end test driving a mocked answer stream through the rendered component was attempted and abandoned: it passed without the fix because the answer never rendered under the test harness, which made it worthless as evidence. A component-level harness that genuinely exercises the stream is still owed.
- Cleanup now happens at stream completion, so governed artifact protocol text can still appear briefly while text is streaming and disappear when the stream ends. Suppressing mid-stream is a separate change with its own risk of mangling partial output.
- Only the Intelligence advisory surface is covered. Whether other surfaces render streamed answers through a path with the same gap has not been checked.
- The earlier hardening on the server packet path remains in place and is unaffected; this closes the client path it did not reach.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and signed-in browser proof for an answer that completes without a structured packet.
