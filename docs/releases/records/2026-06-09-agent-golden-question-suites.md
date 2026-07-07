# 2026-06-09-agent-golden-question-suites — Add golden tenant question suites for governed agents

## Release ID

`2026-06-09-agent-golden-question-suites`

## Status

`candidate`

## Plain-English Summary

Adds executable golden question suites for every active canonical tenant. The
suites are built from the canonical tenant registry in code (never a hand-typed
list), so they automatically cover Apex, Meridian, Northstar, First Capital,
SkyHarbor, and Lakeshore. Each tenant gets 11 questions (one per category:
leadership, scale, industry corpus, Move context, artifacts/evidence, KPI/value,
vendor/source, systems landscape, IT/data/cloud/ERP, risk/failure-mode, and a
missing/unsupported negative test) — 66 questions total. Each question is tagged
with an answerability hypothesis, required source types, and the assertions a
run must satisfy (correct tenant, no cross-tenant context, expected tenant /
pattern retrieval, excluded-row checks, missing-context warning, citations,
cited-id existence, namespace correctness). Expected answers are not fabricated;
ground truth comes from each tenant's Azure-loaded data in the PR-5 live run.

## Layer Impact

- `global-control-lane`: new pure suite library `src/lib/agent-golden/` plus a
  behavior test and a JSON export. No runtime/answer-path change — this is test
  + governance tooling consumed by the verification harness (PR-5).

## Client Applicability

- All clients: Yes — one suite per canonical tenant, derived from code.
- Specific clients: n/a
- Internal only: Suites + results are operations/QA-facing.
- Public/demo only: n/a
- Feature flag: none.

## Changes Included

- `src/lib/agent-golden/{types,suites,assertions,index}.ts`
- `src/__tests__/behaviors/agent-golden.test.ts` — 10 cases.
- `scripts/agent-golden/export-suites.ts` — JSON exporter.
- `docs/governance/AGENT_GOLDEN_QUESTION_SUITES_2026-06-09.md`
- `docs/build/agent-context-bundle-verification-2026-06-09/golden-question-bank.json`
  (6 tenants, 66 questions).

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-golden.test.ts` → 10/10 pass.
- `npx tsx scripts/agent-golden/export-suites.ts` → 6 tenants / 66 questions.
- `npx tsc --noEmit` → clean on touched files.
- `npx eslint` on touched files → 0 errors.
- `npm run audit:architecture-rules` and `npm run release:check` → green.
- Live per-tenant pass/fail requires the PR-5 harness on Azure Container Apps
  (private DB unreachable from localhost) — the suites + assertions are the
  deliverable here, not live results.

## Rollout Plan

Merge to `main` after CI is green (depends only on PR-1 `agent-trace`). No
migration, no flag, no answer-path rollout — the library is consumed by tests
and the PR-5 harness.

## Rollback Plan

Revert the PR. No runtime callers on the request path; zero answer-path impact.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- JSON bank: `docs/build/agent-context-bundle-verification-2026-06-09/golden-question-bank.json`.
- Test log: 10/10 behavior cases pass.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit of tenant
context/corpus. The suites are questions + assertion metadata derived from the
canonical tenant registry.

## Known Gaps

- `expectedAnswerability` tags are hypotheses; the PR-5 Azure run reconciles them
  against each tenant's actual loaded data and classifies gaps
  (ingestion/retrieval/module-binding).
- Question text is templated per category; tenant-specific depth (named systems,
  named executives) is added as corpus depth grows.
- Live assertions (cited-id existence, namespace) require the PR-5 ACA harness.
