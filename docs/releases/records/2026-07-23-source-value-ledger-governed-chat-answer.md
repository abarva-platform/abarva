# 2026-07-23-source-value-ledger-governed-chat-answer — Source aVa chat: value ledger / waterfall packet

## Release ID

`2026-07-23-source-value-ledger-governed-chat-answer`

## Status

`released` — merged in PR #5462, deployed by the repo-owned ACA main workflow, independently
runtime-invariant checked, and signed-in proven on `app.abarva.ai`.

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
- `pass` — hosted PR checks for #5462.
  - AI surface control catalog, agent context broker boundary, no-auto-action boundary, Azure /
    Anthropic rules, backend load, coverage floor, browser smoke, ESLint, Gitleaks, Lighthouse,
    migration drift, bundle budget, production readiness, public axe, release control, routes and
    disclaimers, hygiene, typecheck/reasoning, tenant allowlist, Wave 0, and npm audit passed.
- `pass` — repo-owned ACA main deploy run `30006567762`.
  - Head SHA: `34c39e35135e64e991a9474f396ab1d3a0c9c36a`.
  - Completed successfully at `2026-07-23T12:33:35Z`.
- `pass` — independent ACA runtime invariant.
  - Checked at `2026-07-23T12:34:15.279Z`.
  - Active revision: `ca-abarva-web-lab-eastus--m34c39e35`.
  - Active/template image: `acrabarvalab001.azurecr.io/abarva/web@sha256:7538160b45632ad9460f7c3ae381c58a0d69f929859c1e28804575c2288112a5`.
  - Traffic: 100% to the active revision.
  - Health: `ok=true`, Postgres and direct Postgres checks true, Azure graph on Postgres.
  - Worker jobs `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` use the same digest.
- `pass` — signed-in production proof on `https://app.abarva.ai`.
  - Storage state: local Apex Retail agent state (`.auth/agent-apexretail.json`, not committed).
  - Page probe: `/source/events/apex-retail-ams-outsourcing-2026?stage=value` returned 200 and
    stayed on the signed-in Source route.
  - NDJSON probe:
    `POST /api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask` with `Accept:
    application/x-ndjson`.
  - Prompt: `Show the value waterfall for this Source event. Keep projected and realized value separate.`
  - Result: HTTP 200, two NDJSON lines, `agent-answer.intent=value_ledger_waterfall`,
    `status=answered`, waterfall chart present, ledger table present, tenant fence passed, two
    citations present.
  - Direct answer: `AMS Outsourcing 2026 carries $35.0M of projected Source value. $0 is
    high-confidence with evidence, $35.0M still needs measurement or stronger evidence, and No
    realized value is registered for this event yet.`
  - Safety assertion: no `realized savings` claim appeared in the direct answer.

## Rollout Plan

Completed via PR #5462. The repo-owned ACA main deploy workflow built and deployed the digest-
pinned image for merge SHA `34c39e35135e64e991a9474f396ab1d3a0c9c36a`, shifted 100% traffic to
the new revision, and production proof was captured against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:7538160b45632ad9460f7c3ae381c58a0d69f929859c1e28804575c2288112a5`.
- ACA runtime invariant: passed independently at `2026-07-23T12:34:15.279Z`.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — passed against the Apex AMS Source event.

## Rollback Plan

Revert the squash merge. That removes the value-ledger structured-answer branch and builder module;
existing prose chat, vendor coverage, and artifact quality answers remain available according to the
reverted code state. No migration rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5462.
- Merge SHA: `34c39e35135e64e991a9474f396ab1d3a0c9c36a`.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/30006567762.
- Runtime invariant: local evidence under
  `audit-artifacts/source-value-ledger-chat-003-aca-invariant/`.
- Signed-in proof: local evidence under
  `audit-artifacts/source-value-ledger-chat-003-live-proof/`.
- Local evidence: focused test, lint, typecheck, and release-check commands listed above.

## Known Gaps

- This does not add async parse workers, OCR, transcription, vector indexing, data-build jobs, or
  enterprise-context promotion.
- This does not claim realized savings unless realized rows are already present; even then it
  caveats that governance state still controls external claimability.
