# 2026-06-09-domain-subdomain-expert-matrix — Domain/subdomain expert consultant question matrix

## Release ID

`2026-06-09-domain-subdomain-expert-matrix`

## Status

`candidate`

## Plain-English Summary

Adds a generated domain × subdomain × archetype question matrix that proves
Nexus/Sentinel can answer like an expert consultant across a tenant's whole
operating surface — not just a few generic questions. For every canonical tenant
(code-derived) it spans 16 business/technology domains, five subdomains each,
and ten question archetypes per subdomain (simple factual, current-state
architecture, org/ownership, systems/platforms, KPI/metric, vendor/contract,
risk/control, improvement opportunity, benchmark/pattern, and a missing-evidence
negative test) — 4,700 questions across the six tenants. Each question is tagged
with an answerability hypothesis and the source/citation types it should be
grounded in; expected answers are not fabricated. The live PR-5 run on Azure
derives ground truth, scores consultant quality via the PR-3 rubric plus an
Anthropic judge, and writes the results/failures CSVs.

## Layer Impact

- `global-control-lane`: new pure matrix library `src/lib/agent-domain-matrix/`,
  a behavior test, and a generated JSON/CSV artifact. No runtime/answer-path
  change — this is governance/QA tooling consumed by the PR-5 harness.

## Client Applicability

- All clients: Yes — one matrix per canonical tenant, derived from code.
- Specific clients: n/a
- Internal only: Matrix + results are operations/QA-facing.
- Public/demo only: n/a
- Feature flag: none.

## Changes Included

- `src/lib/agent-domain-matrix/{types,matrix,index}.ts`
- `src/__tests__/behaviors/agent-domain-matrix.test.ts` — 8 cases.
- `scripts/agent-domain-matrix/export.ts` — bank + CSV-template exporter.
- `docs/governance/DOMAIN_SUBDOMAIN_EXPERT_QA_MATRIX_2026-06-09.md`
- `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-question-bank.json`
  (6 tenants, 4,700 questions) + `domain-subdomain-results.csv` /
  `domain-subdomain-failures.csv` (header-only templates).

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-domain-matrix.test.ts` → 8/8 pass.
- `npx tsx scripts/agent-domain-matrix/export.ts` → 6 tenants / 4,700 questions.
- `npx tsc --noEmit` → clean on touched files.
- `npx eslint` on touched files → 0 errors.
- `npm run audit:architecture-rules` and `npm run release:check` → green.
- Results/failures CSVs are header-only here; rows come from the PR-5 live ACA
  run (private DB unreachable from localhost). No rows are faked.

## Rollout Plan

Merge to `main` after CI is green (depends on PR-1 `agent-trace` and PR-3
`agent-eval`, both on `main`). No migration, no flag, no answer-path rollout.

## Rollback Plan

Revert the PR. No runtime callers on the request path; zero answer-path impact.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- Bank: `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-question-bank.json`.
- Test log: 8/8 behavior cases pass.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit of tenant
context/corpus. The matrix is generated questions + assertion metadata derived
from the canonical tenant registry.

## Known Gaps

- `expectedAnswerability` tags are hypotheses reconciled by the PR-5 live run.
- Question text is templated per archetype; named-entity depth grows with the
  corpus.
- Consultant scoring + results/failures CSVs require the PR-5 ACA harness.
