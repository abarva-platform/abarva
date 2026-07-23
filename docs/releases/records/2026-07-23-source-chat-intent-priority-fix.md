# 2026-07-23-source-chat-intent-priority-fix — Source aVa chat intent priority fix

## Release ID

`2026-07-23-source-chat-intent-priority-fix`

## Status

`released` — merged in PR #5498, deployed by the repo-owned ACA main workflow, independently
runtime-invariant checked, and signed-in proven on `app.abarva.ai`.

## Plain-English Summary

Source aVa now has several structured answer families: vendor coverage, value waterfall,
artifact quality/lifecycle, and evidence-processing readiness. During proof closure, a live
signed-in probe found two intent-priority edge cases:

- Broad artifact lifecycle/readiness wording could be captured by the evidence-processing
  branch before artifact-quality had a chance to render the lifecycle packet.
- Evidence questions that included `graph-projected` could be misread as value questions
  because the value intent treated bare `projected` as enough signal.

This release fixes those routing edges without changing any data, permissions, prompts, or
shared chat transport. Artifact-quality now wins over evidence-processing for explicit
artifact quality/lifecycle prompts, and value-ledger detection now requires a strong value /
financial / waterfall signal rather than standalone projected-state wording.

## Layer Impact

- `global-control-lane`: narrows Source event-chat NDJSON intent routing.
- `agent-answer-rendering`: preserves existing `AvaAnswerPacket` rendering; only the selected
  answer family changes for overlapping prompts.
- Data layer: no schema change, no reads beyond existing routes, no writes, no migration, no
  parser/indexer/OCR/transcription/promotion job.

## Client Applicability

- All clients: yes, for Source event aVa chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route remains gated by `Accept: application/x-ndjson`.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: evaluates artifact-quality before
  evidence-processing readiness so lifecycle questions render the lifecycle packet.
- `src/lib/source/ava/evidence-readiness-governed-answer.ts`: refuses explicit artifact
  quality/lifecycle prompts in the evidence-readiness heuristic.
- `src/lib/source/ava/value-ledger-governed-answer.ts`: requires a strong value/financial
  signal before treating projected/committed/measured wording as a value-ledger question.
- Tests add regression coverage for the route order, artifact-quality prompt ownership, and
  graph-projected evidence wording.

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  passed 4 suites / 23 tests. Jest printed pre-existing duplicate manual mock warnings for
  mdast/micromark helpers.
- `pass` — `npx eslint src/lib/source/ava/artifact-quality-governed-answer.ts src/lib/source/ava/evidence-readiness-governed-answer.ts src/lib/source/ava/value-ledger-governed-answer.ts src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`.
- `pass` — pre-fix signed-in proof reproduced the problem honestly on `app.abarva.ai`: a broad
  artifact lifecycle/readiness prompt returned `intent=evidence_processing_readiness`, and a
  graph-projected evidence prompt returned `intent=value_ledger_waterfall`. No mutation was
  performed.
- `pass` — current production baseline ACA runtime invariant passed before this PR was opened:
  revision `ca-abarva-web-lab-eastus--mae18fa02`, digest
  `sha256:74fcdaaa5ad393f545ea20b6be5192a51074611bc664ec5149e6fd8948ac52cc`, 100%
  traffic, health OK, and both worker jobs on the same digest.
- `pass` — hosted PR checks for #5498: AI surface control catalog, agent context broker
  boundary, no-auto-action boundary, Azure / Anthropic rules, backend load, behavior coverage,
  browser smoke, ESLint, Gitleaks, Lighthouse, migration drift, bundle budget, production
  readiness, public axe, release record, routes/disclaimers, hygiene, typecheck/reasoning,
  tenant allowlist, Wave 0, and npm audit all passed.
- `pass` — repo-owned ACA main deploy run `30031601221` completed successfully for merge SHA
  `3956858600e4ffce115a917e8d4a5bee06a2c4a9`.
- `pass` — independent ACA runtime invariant passed at `2026-07-23T18:04:12.067Z`: active
  revision `ca-abarva-web-lab-eastus--m39568586`, digest
  `sha256:430632ffe2408ad2a31ca8adf016d875d6e8e6a68df69e4788f70b3583718819`, 100% traffic,
  health OK, and both worker jobs on the same digest.
- `pass` — signed-in production proof on the Lakeshore Source event:
  `POST /api/v1/source/c05872d8-0465-4bc8-8eeb-ff3d42ac6761/nexus/ask` with `Accept:
  application/x-ndjson` returned `intent=artifact_quality_lifecycle`, status `answered`, one
  chart, one table, 8 citations, tenant fence passed, and forbidden-language safety passed for
  the artifact lifecycle prompt.
- `pass` — signed-in production proof on the same event returned
  `intent=evidence_processing_readiness`, status `answered`, one chart, one table, 8 citations,
  tenant fence passed, and forbidden-language safety passed for the evidence-processing prompt.

## Rollout Plan

Completed via PR #5498. The repo-owned ACA main workflow deployed merge SHA
`3956858600e4ffce115a917e8d4a5bee06a2c4a9`, shifted 100% traffic to the new revision, and
post-deploy signed-in production proof confirmed both corrected chat intents.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:430632ffe2408ad2a31ca8adf016d875d6e8e6a68df69e4788f70b3583718819`.
- ACA runtime invariant: passed independently at `2026-07-23T18:04:12.067Z`.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge and redeploy through the repo-owned ACA main workflow. That restores the
prior intent order/heuristics. No data rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5498.
- Merge SHA: `3956858600e4ffce115a917e8d4a5bee06a2c4a9`.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/30031601221.
- Approved digest:
  `sha256:430632ffe2408ad2a31ca8adf016d875d6e8e6a68df69e4788f70b3583718819`.
- Pre-fix signed-in proof: local proof bundle under
  `audit-artifacts/source-proof-closure-live-proof-20260723-rerun/`.
- Current production baseline invariant: local proof bundle under
  `audit-artifacts/source-chat-intent-priority-current-invariant-20260723/`.
- Post-deploy invariant: local proof bundle under
  `audit-artifacts/source-chat-intent-priority-post-deploy-invariant-20260723/`.
- Post-deploy signed-in proof: local proof bundle under
  `audit-artifacts/source-chat-intent-priority-post-deploy-live-proof-20260723/`.

## Known Gaps

- This does not add new aVa answer families.
- This does not add OCR, transcription, async parse workers, vector indexing, graph projection,
  enterprise-context promotion, or `agent_ready` promotion.
- The artifact-quality packet remains bounded by existing `source_artifacts` rows and canonical
  Source artifact standards.
