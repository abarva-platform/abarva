# 2026-07-23-source-value-ledger-governed-chat-answer — Source aVa chat: value ledger / waterfall packet

## Release ID

`2026-07-23-source-value-ledger-governed-chat-answer`

## Status

`candidate` — implementation and local validation are complete; PR, merge, ACA deploy, runtime
invariant, and live signed-in proof are still pending.

## Plain-English Summary

Source aVa chat already has governed structured answers for vendor response coverage and artifact
quality/lifecycle. This release adds the next code-safe structured answer: an event-scoped value
ledger / value-waterfall answer.

When a user asks "show the value waterfall", "what value is at stake?", or "what savings are
projected vs realized?", the Source event chat can return a rendered waterfall chart plus a
line-item ledger table. The answer uses the existing Source value ledger read model and the
mandatory context/corpus governance gate. It keeps projected, committed, measurement-pending, and
realized value separate.

This release is read-only. It does not create or mutate ledger rows, calculate new savings, run a
parse worker, OCR/transcribe/index content, promote anything into enterprise context, or claim that
Tower has ingested the value.

## Layer Impact

- `global-control-lane`: extends the Source event-canvas NDJSON route with a third opt-in
  structured answer branch. Existing JSON callers are unchanged.
- `source-read-model`: reads the existing Source value ledger snapshot; no schema or write-path
  change.
- `agent-answer-rendering`: uses the existing `AvaAnswerPacket` chart/table contract already
  rendered by `AgentAnswerRenderer`.
- `context-corpus-governance`: maps ledger line items into honest `GovernedCandidate` rows and
  calls `buildValidatedAgentContextBundle()` with the same explicit not-agent-ready limitation used
  by prior Source structured answers.

## Client Applicability

- All clients: yes, for Source events with event-scoped value ledger rows or an honest no-data
  state.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route branch is gated by `Accept: application/x-ndjson` and the
  value-ledger intent heuristic.

## Changes Included

- `src/lib/source/ava/value-ledger-governed-answer.ts`
  - Adds `looksLikeValueLedgerQuestion()`.
  - Maps Source value ledger rows to governed financial candidates.
  - Builds a governed `AvaAnswerPacket` with a waterfall chart and line-item table.
  - Keeps projected, committed/evidence-backed, measurement-pending, and realized value separate.
  - Emits an honest no-data packet when no event-scoped ledger rows exist.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Adds the value-ledger branch inside the opt-in NDJSON path, after vendor coverage and before
    artifact quality.
  - Passes live event aliases so route slugs and persisted row ids can both match ledger rows.
  - Logs value-answer failures separately and falls back to the prose summary line.
- Tests:
  - `src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts`
  - `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  - 2 suites, 11 tests passed.
  - Jest printed pre-existing duplicate manual mock warnings for mdast/micromark mocks.
- `pass` — `npx eslint src/lib/source/ava/value-ledger-governed-answer.ts src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- `blocked` — first `npm run release:check -- --base origin/main --head HEAD`
  - The gate rejected this release record because the original QA bullets said `Pending` instead
    of explicit pass/fail/not-run/blocked statuses.
- `pass` — rerun `npm run release:check -- --base origin/main --head HEAD` after correcting the
  QA status language.
  - Azure deployment lane, no-legacy-tenant-inputs, release control, deploy authority, and pilot
    data-loader gates passed.

## Rollout Plan

Open a PR, squash-merge to `main` after hosted checks pass, let the repo-owned ACA main deploy
workflow build and deploy the digest-pinned image, run an independent ACA runtime invariant, then
capture signed-in `app.abarva.ai` proof against a Source event chat NDJSON request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest: to be recorded after merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge. That removes the value-ledger structured-answer branch and builder module;
existing prose chat, vendor coverage, and artifact quality answers remain available according to the
reverted code state. No migration rollback is required.

## Audit Evidence

- PR: pending.
- ACA deploy run: pending.
- Runtime invariant: pending.
- Signed-in proof: pending.
- Local evidence: focused test, lint, typecheck, and release-check commands listed above.

## Known Gaps

- This does not add async parse workers, OCR, transcription, vector indexing, data-build jobs, or
  enterprise-context promotion.
- This does not claim realized savings unless realized rows are already present; even then it
  caveats that governance state still controls external claimability.
