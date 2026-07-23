# 2026-07-23-source-evidence-readiness-governed-chat-answer — Source aVa chat: evidence-processing readiness packet

## Release ID

`2026-07-23-source-evidence-readiness-governed-chat-answer`

## Status

`candidate`

## Plain-English Summary

Source already persists uploaded/generated files in the artifact registry, shows evidence readiness
in Files, and has an operator parse-backlog verifier. This release adds the next code-safe aVa chat
answer: an event-scoped evidence-processing readiness view.

When a user asks "which uploaded evidence is parsed?", "which files are search-ready?", or "what is
ready for parser/backfill?", Source event chat can return a rendered chart plus an item table. The
answer reads existing `source_artifacts` parse/search/graph statuses, runs cited rows through the
mandatory context/corpus governance gate, and keeps stored, parsed, search-ready, graph-projected,
enterprise-context-promoted, and `agent_ready` states separate.

This release is read-only. It does not parse file bytes, write rows, run OCR or transcription, build
embeddings, project graph context, promote anything into enterprise context, or claim the event has
learned over time.

## Layer Impact

- `global-control-lane`: extends the Source event-canvas NDJSON route with another opt-in structured
  answer branch. Existing JSON callers are unchanged.
- `source-read-model`: reads existing Source artifact registry rows and their current
  parse/search/graph status fields; no schema or write-path change.
- `agent-answer-rendering`: uses the existing `AvaAnswerPacket` chart/table contract already
  rendered by `AgentAnswerRenderer`.
- `context-corpus-governance`: maps artifact rows into honest `GovernedCandidate` rows and calls
  `buildValidatedAgentContextBundle()` before citations support the answer.

## Client Applicability

- All clients: yes, for Source events with registered artifacts or an honest no-data state.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route branch is gated by `Accept: application/x-ndjson` and the
  evidence-readiness intent heuristic.

## Changes Included

- `src/lib/source/ava/evidence-readiness-governed-answer.ts`
  - Adds `looksLikeEvidenceReadinessQuestion()`.
  - Reads artifacts by event id/code aliases and de-duplicates rows.
  - Reuses the existing read-only artifact parse-backlog reporter.
  - Builds a governed `AvaAnswerPacket` with an evidence-processing chart and item table.
  - Emits honest no-data and governance-blocked answers.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Adds the evidence-readiness branch inside the opt-in NDJSON path, after value ledger and before
    the broader artifact quality branch.
  - Passes live event aliases so route slugs and persisted row ids can both match artifact rows.
  - Logs evidence-readiness failures separately and falls back to the prose summary line.
- Tests:
  - `src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts`
  - `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`
- Docs:
  - `docs/backlog/source-product-backlog.md`

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  - 2 suites, 8 tests passed.
  - Jest printed pre-existing duplicate manual mock warnings for mdast/micromark mocks.
- `pass` — `npx eslint src/lib/source/ava/evidence-readiness-governed-answer.ts src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- `pass` — `npm run release:check -- --base origin/main --head HEAD`.
  - Azure deployment lane, no-legacy-tenant-inputs, release control, deploy authority, and pilot
    data-loader gates passed.
- `not-run` — PR checks pending.
- `not-run` — repo-owned ACA main deploy pending.
- `not-run` — independent ACA runtime invariant pending.
- `not-run` — signed-in production proof pending.

## Rollout Plan

Open a PR and merge by squash after local validation and hosted checks are eligible. The repo-owned
ACA main deploy workflow must build and deploy the digest-pinned image for the merge SHA before this
is claimed live on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest: pending repo-owned ACA main deploy.
- ACA runtime invariant: pending.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, because this is user-facing Source chat behavior.

## Rollback Plan

Revert the squash merge. That removes the evidence-readiness structured-answer branch and builder
module; existing prose chat, vendor coverage, value ledger, and artifact quality answers remain
available according to the reverted code state. No migration rollback is required.

## Audit Evidence

- PR: pending.
- Merge SHA: pending.
- ACA deploy run: pending.
- Runtime invariant: pending.
- Signed-in proof: pending.
- Local evidence: focused test, lint, typecheck, and release-check commands listed above as they
  complete.

## Known Gaps

- This does not add async parse workers, OCR, transcription, vector indexing, data-build jobs, or
  enterprise-context promotion.
- This does not mark artifacts `agent_ready`; it only reports current persisted registry states.
