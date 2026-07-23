# 2026-07-23-source-artifact-quality-governed-chat-answer — Source aVa chat: artifact quality/lifecycle packet

## Release ID

`2026-07-23-source-artifact-quality-governed-chat-answer`

## Status

`released with follow-up fix pending` — base implementation merged in PR #5441 and deployed
by ACA main run `29985449807`; event-id routing was fixed in PR #5444. A proof-closure pass
found a remaining overlapping-intent priority bug, tracked and fixed in
`2026-07-23-source-chat-intent-priority-fix`.

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
- `pass` — proof-closure regression rerun on current `main`: artifact-quality, evidence-readiness,
  value-ledger, and route-intent tests passed 4 suites / 23 tests after adding the intent-priority
  fix. Jest printed pre-existing duplicate manual mock warnings.
- `pass` — proof-closure lint rerun on the touched aVa builders, tests, and Source nexus/ask route.
- `blocked until follow-up deploy` — pre-fix signed-in proof reproduced an overlapping-intent
  bug: broad artifact lifecycle/readiness wording returned the evidence-processing packet instead
  of the artifact-quality packet. The follow-up fix is recorded in
  `2026-07-23-source-chat-intent-priority-fix`.

## Rollout Plan

Base rollout completed via PR #5441 and PR #5444. Complete the remaining proof by merging and
deploying `2026-07-23-source-chat-intent-priority-fix`, then rerun signed-in artifact-quality
chat proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest: assigned by ACA main deploy run `29985449807`; follow-up fix digest to
  be recorded in `2026-07-23-source-chat-intent-priority-fix`.
- ACA runtime invariant: required after the follow-up fix deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge. That removes the artifact-quality structured-answer branch and the
new builder module; existing prose chat and the already-shipped vendor-coverage branch remain
available according to the reverted code state. No migration rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5441.
- Hotfix PR: https://github.com/abarva-platform/abarva/pull/5444.
- Merge SHA: `ae3f20568e6ea576a8e5cd3f1d32b7490b9eb58d`.
- Hotfix merge SHA: `467936122bd462610339dcc1e1e502d61e368dcf`.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29985449807.
- Event-id hotfix deploy run: https://github.com/abarva-platform/abarva/actions/runs/29986365431.
- Intent-priority follow-up: `2026-07-23-source-chat-intent-priority-fix`.
- Local evidence: focused test, lint, and pre-fix signed-in proof commands listed above.

## Known Gaps

- Full typecheck is blocked by the unrelated duplicate-property error in
  `src/lib/programs/mutations.ts` on current `main`.
- This does not add OCR, transcription, async parse workers, vector indexing, or enterprise
  context promotion. It reports existing artifact parse/index statuses honestly.
- Value-waterfall chat answers remain a separate follow-on.
