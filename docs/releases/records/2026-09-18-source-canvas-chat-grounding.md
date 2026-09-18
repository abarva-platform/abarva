# Source canvas chat — evidence grounding on the live answer path

## Release ID

`2026-09-18-source-canvas-chat-grounding`

## Status

`candidate`

## Plain-English Summary

The Source canvas chat (`/api/v1/source/[eventId]/nexus/ask`) called Claude with
the Sentinel voice prompt and the deterministic briefing text, and nothing else.
The evidence the route had already assembled for the turn was never put in front
of the model, so the model had no evidence IDs to cite and no instruction to
refuse when it could not answer from loaded evidence. A separate module,
`src/lib/source/sentinel-chat-llm.ts`, contained exactly those rules — the
`[E1]…[E12]` citation requirement, "say what evidence is missing", "never
fabricate vendor names, numbers, contract dates, owners, savings, or tool
names" — but nothing in the application imported it. Its only importer was its
own test.

Separately, the model call was wrapped in `.catch(() => null)`. A denied egress
preflight, a provider outage and an empty model answer all produced the same
response as a deliberate deterministic answer, with no warning and no log line.

This change makes the grounding rules one definition used by both paths, feeds
the turn's loaded evidence into the live system prompt, resolves the evidence a
cited answer points at, and replaces the silent catch with a logged warning that
is also returned to the caller.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Layer 4 (Products — Source) answer composition, plus the shared
  agent-control library under `src/lib/source/`. No schema, no migration, no
  loader, no projection, no adapter change. Layer 3 canonical model is untouched.
- The evidence itself is not newly read: `liveTenantContext.retrievedEvidence`
  was already assembled by this route for the deterministic briefing. This
  change only puts it in the model's system prompt.

## Client Applicability

- **All clients** using the Source canvas chat. The grounding block is composed
  unconditionally; with no loaded evidence it renders the explicit
  missing-evidence instruction rather than being omitted.
- **Feature flag:** none. The behavior is a correction to an ungrounded path,
  not a new capability, so it is not gated.

## Changes Included

- `src/lib/source/sentinel-chat-llm.ts` — modified: the evidence block, the
  grounding posture, the evidence builder, the citation extractor and the
  citation/drift warning builder are now exported
  (`composeSourceSentinelEvidenceBlock`, `SOURCE_SENTINEL_GROUNDING_POSTURE`,
  `buildSourceSentinelPromptEvidence`,
  `extractSourceSentinelEvidenceCitations`,
  `buildSourceSentinelCitationWarnings`). `buildSourceSentinelChatSystemPrompt`
  is recomposed from those exports and its output is unchanged — its existing
  six-test suite passes untouched.
- `src/lib/source/source-canvas-chat.ts` — new: `callSourceCanvasChatModel`,
  moved out of the route file, now composing Sentinel voice + the turn's loaded
  evidence + the grounding posture, and returning resolved evidence citations
  and citation-gap / response-drift warnings alongside the answer text.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — modified: the private
  `callSentinelWithClaude` helper is deleted in favour of the shared function;
  `liveTenantContext` is passed to it; `.catch(() => null)` is replaced by a
  `try/catch` that logs `[source.nexus-ask.canvas-chat-model.failed]` and
  appends a caller-visible warning naming the failure.
- `src/lib/source/__tests__/source-canvas-chat.test.ts` — new: six behavioral
  tests driving the real function the route calls.

## QA / Validation

- **New behavioral suite** `src/lib/source/__tests__/source-canvas-chat.test.ts`
  — authored ahead of the fix. Red: **5 failed, 1 passed**. After the fix:
  **6 passed, 0 failed**. It drives the real `callSourceCanvasChatModel` with
  only the Anthropic egress client faked, and asserts on the system prompt the
  model actually receives — an assertion a composed-but-unsent rule cannot pass.
- **Mutation checks** (the guard must be able to fail):
  - Remove the evidence block and posture from the composed system prompt →
    **3 failed, 3 passed**.
  - Return `warnings: []` instead of the citation-gap/drift warnings →
    **1 failed, 5 passed**.
  - Both reverted; suite back to 6 passed.
- **Regression baseline, same scope** (`src/lib/source/__tests__` and
  `src/app/api/v1/source`, excluding the new file): **16 failing before, 16
  failing after**, 826 passing in both. The 7 red suites are pre-existing and
  unrelated; this change neither fixed nor caused any of them.
- **Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
  --pretty false` — **exit code 0**, zero lines of output. (Exit status judged,
  not grepped: a bare `npx tsc --noEmit` exits 134 on this machine with no
  diagnostics, which reads as a false clean when piped into a filter.)
- **Lint:** `npx eslint` over the four changed files — 0 errors, 0 warnings.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators in this PR: none. No `az containerapp update`, no env
  var change, no flag change, no ACA job.
- Live signed-in proof required: yes, before this is called `live-proven`. It is
  owed, not done; this record stops at `deployed`.

## Rollout Plan

1. Squash-merge to `main`.
2. The repo-owned ACA main deploy workflow builds and deploys on merge.
3. No migration, no data build, no ACA job, no env var, no flag enrolment.

## Rollback Plan

- Straight code revert of this commit. There is no persisted state, no schema
  change and no flag to unwind; the next request reverts to the prior behavior.

## Audit Evidence

- Orphan proof before the change: `grep -rn "sentinel-chat-llm" src/` returned a
  single hit, the module's own test file.
- Silent-failure proof before the change: `callSentinelWithClaude(...)
  .catch(() => null)` at `route.ts:261` on `origin/main`.
- Red/green/mutation numbers recorded above.
- Typecheck exit code recorded above.

## Known Gaps

- The resolved `evidenceCitations` are returned by `callSourceCanvasChatModel`
  but are not yet attached to `sourceAnswer.evidenceCitations` on the JSON
  response; that field is still owned by the deterministic composer, and
  rewiring it changes what the canvas renders. The citation *gap* is reported as
  a warning today. Attaching the citations to the rendered answer is follow-on
  work and has been added to the backlog.
- Not signed-in proven. This record covers up to `deployed`; a signed-in check
  on the deployed SHA is owed before anything here is called `live-proven`.
