# 2026-09-03-intelligence-streamed-answer-finalization — Strip governed payloads on every streamed answer

## Release ID

`2026-09-03-intelligence-streamed-answer-finalization`

## Status

`candidate`

## Plain-English Summary

A governed follow-up payload was rendering as a raw code block inside answers on the Intelligence surface, showing the reader a JSON array of questions in the middle of an executive answer. The same questions also appeared correctly in the suggested-questions rail, so it read as the answer duplicating itself in an unfinished-looking way.

The cause was a gap in where cleanup runs, not in the cleanup itself. Governed artifact payloads are stripped from the visible answer by `resolveAssistantAnswerText`, and that function is only called in the answer-packet branch of the stream handler. An answer that carries tables, charts, or citations always produces a packet, so those answers were always cleaned. A prose-only answer can finish without one, and in that case the text on screen is the raw streamed accumulation, which had passed through nothing but label cleanup. That is why the defect looked intermittent: it tracked the shape of the answer rather than anything random.

Stream completion now runs every assistant message through a single finalization step that applies the same strip, so no path can leave a governed payload on screen. Stripping already-clean text changes nothing, so answers that produce a packet are unaffected.

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
- Mutation-tested in both directions. Removing the strip from the transform fails the payload assertion; replacing the call site with the previous inline status update fails the wiring assertion. The guard is therefore capable of failing, which an earlier guard in this area was not.
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
- Live signed-in proof required: yes, and it is the point of this change. A prose-only answer must render with no code block and no raw array, while the suggested-questions rail still populates.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. Client-side rendering change with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. The defect was found by signed-in observation on a deployed revision, and only the same kind of observation can confirm the fix.
- The guard is a unit test over the transform plus a source assertion that stream completion calls it. An end-to-end test driving a mocked answer stream through the rendered component was attempted and abandoned: it passed without the fix because the answer never rendered under the test harness, which made it worthless as evidence. A component-level harness that genuinely exercises the stream is still owed.
- Cleanup now happens at stream completion, so a governed payload can still appear briefly while text is streaming and disappear when the stream ends. Suppressing mid-stream is a separate change with its own risk of mangling partial output.
- Only the Intelligence advisory surface is covered. Whether other surfaces render streamed answers through a path with the same gap has not been checked.
- The earlier hardening on the server packet path remains in place and is unaffected; this closes the client path it did not reach.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and a signed-in prose-only answer read.
