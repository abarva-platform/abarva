# 2026-07-23-source-evidence-readiness-governed-chat-answer — Source aVa chat: evidence-processing readiness packet

## Release ID

`2026-07-23-source-evidence-readiness-governed-chat-answer`

## Status

`released` — merged in PR #5477, deployed by the repo-owned ACA main workflow, independently
runtime-invariant checked, and signed-in proven on `app.abarva.ai`.

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
- `pass` — hosted PR checks for #5477.
  - AI surface control catalog, agent context broker boundary, no-auto-action boundary, Azure /
    Anthropic rules, backend load, coverage floor, browser smoke, ESLint, Gitleaks, Lighthouse,
    migration drift, bundle budget, production readiness, public axe, release control, routes and
    disclaimers, hygiene, typecheck/reasoning, tenant allowlist, Wave 0, and npm audit passed.
- `pass` — repo-owned ACA main deploy run `30018168714`.
  - Head SHA: `cc74d791d0f3bdcb86b25cda0d82210408efe7a6`.
  - Completed successfully at `2026-07-23T15:03:32Z`.
- `pass` — independent ACA runtime invariant.
  - Checked at `2026-07-23T15:03:58.671Z`.
  - Active revision: `ca-abarva-web-lab-eastus--mcc74d791`.
  - Active/template image:
    `acrabarvalab001.azurecr.io/abarva/web@sha256:b5d5ec75a0a4a1c91c2ad970ea505ab334de1066468711d7b5aa7aeaee5fe47c`.
  - Traffic: 100% to the active revision.
  - Health: `ok=true`, Postgres and direct Postgres checks true, Azure graph on Postgres.
  - Worker jobs `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` use the same digest.
- `pass` — signed-in production proof on `https://app.abarva.ai`.
  - Storage states refreshed with the sanctioned agent-auth harness:
    `npx tsx scripts/auth/prime-agent-client-auth-states.ts --base-url https://app.abarva.ai --client apexretail --refresh`
    and `--client lakeshore --refresh`.
  - Apex page probe:
    `/source/events/apex-retail-ams-outsourcing-2026?stage=files` returned 200 and stayed on the
    signed-in Source route.
  - Apex NDJSON probe:
    `POST /api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask` with `Accept:
    application/x-ndjson`.
  - Apex result: HTTP 200, two NDJSON lines,
    `agent-answer.intent=evidence_processing_readiness`, `status=no_data`, chart present, table
    present, tenant fence passed, and no internal data-layer language in the direct answer.
  - Lakeshore page probe:
    `/source/events/c05872d8-0465-4bc8-8eeb-ff3d42ac6761?stage=files` returned 200 and stayed on
    the signed-in Source route.
  - Lakeshore NDJSON probe:
    `POST /api/v1/source/c05872d8-0465-4bc8-8eeb-ff3d42ac6761/nexus/ask` with `Accept:
    application/x-ndjson`.
  - Lakeshore result: HTTP 200, two NDJSON lines,
    `agent-answer.intent=evidence_processing_readiness`, `status=answered`, chart present, table
    present, 8 citations, tenant fence passed, forbidden-language safety passed, and no internal
    data-layer language in the direct answer.
  - Lakeshore direct answer:
    `9 Source files are stored. 0 are parsed, 0 are search-ready, 9 are parser-ready, and 0 need attention.`
  - The chart separated `Stored`, `Parser-ready`, `Parsed`, `Search-ready`, `Graph-projected`, and
    `Needs attention`; the table showed parser-ready items with the read-only no-parser-run note.

## Rollout Plan

Completed via PR #5477. The repo-owned ACA main deploy workflow built and deployed the digest-
pinned image for merge SHA `cc74d791d0f3bdcb86b25cda0d82210408efe7a6`, shifted 100% traffic to
the new revision, and production proof was captured against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:b5d5ec75a0a4a1c91c2ad970ea505ab334de1066468711d7b5aa7aeaee5fe47c`.
- ACA runtime invariant: passed independently at `2026-07-23T15:03:58.671Z`.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — passed against Apex and Lakeshore Source events.

## Rollback Plan

Revert the squash merge. That removes the evidence-readiness structured-answer branch and builder
module; existing prose chat, vendor coverage, value ledger, and artifact quality answers remain
available according to the reverted code state. No migration rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5477.
- Merge SHA: `cc74d791d0f3bdcb86b25cda0d82210408efe7a6`.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/30018168714.
- Runtime invariant: local evidence under
  `audit-artifacts/source-evidence-readiness-chat-004-aca-invariant/`.
- Signed-in proof: local evidence under
  `audit-artifacts/source-evidence-readiness-chat-004-live-proof/`.
- PR audit comment: https://github.com/abarva-platform/abarva/pull/5477#issuecomment-5060042337.
- Local evidence: focused test, lint, typecheck, and release-check commands listed above as they
  complete.

## Known Gaps

- This does not add async parse workers, OCR, transcription, vector indexing, data-build jobs, or
  enterprise-context promotion.
- This does not mark artifacts `agent_ready`; it only reports current persisted registry states.
