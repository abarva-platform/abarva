# 2026-06-21-source-streaming-200k — Source generate route: stream + 200k ceiling

## Release ID

`2026-06-21-source-streaming-200k`

## Status

`candidate`

## Plain-English Summary

The Source artifact generate route used `messages.create` (non-streaming) for its
Anthropic API call. The Anthropic SDK blocks `messages.create` calls whose
`max_tokens` value indicates the response may exceed 10 minutes; at 40k tokens on
Opus 4.8 this guard fires immediately and returns `generation_failed: Streaming is
required`. This PR fixes the call to use `client.messages.stream()` (identical
behaviour, no API-level change) so the guard does not apply.

Simultaneously, the d09 RFP Package ceiling is raised from 40,000 to 200,000 output
tokens. The Anthropic API will enforce its own model-level cap; this value tells the
API "do not truncate early" — the document stops when Opus naturally reaches the end
of the RFP, not when an artificial ceiling cuts it short.

## Layer Impact

**Lane:** `global-control-lane` — no schema or data change.

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`:
  `messages.create` replaced with `messages.stream` accumulation; behaviorally
  identical, removes SDK pre-flight guard.
- `src/lib/source/agent-generation/prompt-registry.ts`: d09 `maxTokens` 40k → 200k.

## Client Applicability

All clients: yes — every Source d09 RFP Package generation call.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- `src/lib/source/agent-generation/prompt-registry.ts`
- `docs/releases/records/2026-06-21-source-streaming-200k.md`

## QA / Validation

- TypeScript: `tsc --noEmit` expected PASS (only `await` keyword added; types are
  compatible — `Stream<MessageStreamEvent>` is `AsyncIterable`).
- ESLint: expected PASS (no new imports; change is inside existing `try/catch`).
- Live acceptance: regenerate d09 on Meridian MDR/SOC event
  `3bdb05ef-da5b-48ab-8b08-9f0157005698` with all 8 evidence CSVs loaded; confirm
  quality gate passes with evidence_grounding ≥ 8, artifact_completeness ≥ 8.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys via `aca-main-deploy` workflow; no migration required.
3. Retry d09 generation on the Meridian event to confirm 200k ceiling works.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- No migration; no feature flag; no env var change required.
- Live signed-in proof required: d09 generation post-deploy on at least one event.

## Rollback Plan

Revert the commit. Constant-only + streaming-mode change; no persisted state affected.
Previously-generated RFP bodies are unchanged unless re-run.

## Known Gaps

- At 200k `max_tokens`, d09 on Opus 4.8 is bounded by both the model's actual output
  limit (enforced by the API) and the route's 600s `maxDuration`. A full 200k-token
  response would take ~50 min — longer than the timeout. In practice Opus stops
  naturally at ~20k–40k tokens for a complete RFP; the 200k ceiling prevents any
  artificial truncation. If very long RFPs begin to 504, d09 should move to the
  async `source_artifact_runs` job queue (same pattern as `deliverable_runs`).
- The phi.mrn sensitive-upload guard pattern `patient(?:\s+id)?` still over-matches
  clinical operations terminology ("patient monitoring", "patient safety"). A future
  PR should tighten the regex to require `id` as a non-optional suffix.

## Audit Evidence

- Root cause: `generation_failed` error returned in 8.2s — SDK guard fires before API
  call begins; confirmed by error message "Streaming is required for operations that
  may take longer than 10 minutes."
- Fix mirrors same pattern as PR #3587 (deliverable durable worker streaming fix).
- Branch: `fix/source-streaming-create-to-stream`
