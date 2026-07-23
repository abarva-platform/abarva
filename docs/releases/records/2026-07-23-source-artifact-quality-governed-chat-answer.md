# 2026-07-23-source-artifact-quality-governed-chat-answer — Source aVa chat: artifact quality/lifecycle packet

## Release ID

`2026-07-23-source-artifact-quality-governed-chat-answer`

## Status

`candidate` — implementation and focused validation complete locally; PR, merge, ACA deploy,
runtime invariant, and live signed-in proof still pending.

## Plain-English Summary

Source aVa chat already had one structured answer type for vendor response coverage. This
release adds the next code-safe structured answer: artifact quality and lifecycle posture.
When a user asks questions such as "which files are missing?", "how is artifact quality?", or
"are the client finals ready?", the Source event chat can now return the same deterministic
artifact lifecycle matrix used by the Files workspace as a rendered chart plus an actionable
table.

The answer is read-only. It lists existing `source_artifacts` registry rows, maps those rows
through the mandatory context/corpus governance gate, and then projects canonical Source
artifact standards plus current registry state into the packet. It does not upload, parse,
repair, regenerate, index, OCR, transcribe, or promote anything into enterprise context.

## Layer Impact

- `global-control-lane`: extends the Source event-canvas NDJSON route with a second opt-in
  structured answer branch. Existing JSON callers are unchanged.
- `source-read-model`: reads existing Source artifact registry rows through the existing
  repository and lifecycle matrix; no schema or write-path change.
- `agent-answer-rendering`: uses the existing `AvaAnswerPacket` table/chart contract already
  rendered by `AgentAnswerRenderer`.

## Client Applicability

- All clients: yes, for Source events with artifact registry rows or canonical missing-artifact
  standards.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route branch is gated by `Accept: application/x-ndjson` and the
  artifact-quality intent heuristic.

## Changes Included

- `src/lib/source/ava/artifact-quality-governed-answer.ts`
  - Adds `looksLikeArtifactQualityQuestion()`.
  - Maps Source artifact registry data classifications to governance classifications.
  - Maps artifact rows to `GovernedCandidate` objects using honest readiness/retrievability
    states.
  - Builds a governed `AvaAnswerPacket` with a horizontal-bar artifact posture chart and an
    action table from `buildSourceArtifactLifecycleSummary()`.
  - Preserves honest zero state when no artifacts are registered.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Adds the artifact-quality branch after the existing vendor-coverage branch inside the
    opt-in NDJSON path.
  - Logs structured-answer failures separately and falls back to the prose summary line.
- Tests:
  - `src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts`
  - `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  - 2 suites, 10 tests passed.
  - Jest printed pre-existing duplicate manual mock warnings for mdast/micromark mocks.
- `pass` — `npx eslint src/lib/source/ava/artifact-quality-governed-answer.ts src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
- `blocked by unrelated main issue` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  - Remaining errors are outside this Source slice:
    - `src/lib/programs/mutations.ts(1150,9): TS1117 duplicate property`
    - `src/lib/programs/mutations.ts(1175,9): TS1117 duplicate property`

## Rollout Plan

Open a PR, squash-merge to `main` after hosted checks pass, let the repo-owned ACA main deploy
workflow build and deploy the digest-pinned image, run an independent ACA runtime invariant,
then capture signed-in `app.abarva.ai` proof on a Source event Files/chat workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest: to be recorded after merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge. That removes the artifact-quality structured-answer branch and the
new builder module; existing prose chat and the already-shipped vendor-coverage branch remain
available according to the reverted code state. No migration rollback is required.

## Audit Evidence

- PR: pending.
- ACA deploy run: pending.
- Runtime invariant: pending.
- Signed-in proof: pending.
- Local evidence: focused test and lint commands listed above.

## Known Gaps

- Full typecheck is blocked by the unrelated duplicate-property error in
  `src/lib/programs/mutations.ts` on current `main`.
- This does not add OCR, transcription, async parse workers, vector indexing, or enterprise
  context promotion. It reports existing artifact parse/index statuses honestly.
- Value-waterfall chat answers remain a separate follow-on.
