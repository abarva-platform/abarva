# 2026-06-09-agent-context-bundle-verification — Record production Azure context-bundle verification

## Release ID

`2026-06-09-agent-context-bundle-verification`

## Status

`candidate`

## Plain-English Summary

Adds the capstone of the agent validation framework: a verification runner that
drives the golden suites (PR-2) and the expert matrix (PR-6) through the real
agent, applies golden assertions, claim/citation + namespace + leakage
validation (PR-4) and the wisdom rubric (PR-3) on top of each context-bundle
trace (PR-1), and aggregates a verification summary + remediation backlog. The
runner takes an injected agent driver so it is pure and testable in lab mode; a
run script performs a lab structural export and, on Azure Container Apps with a
live data plane, drives the questions for real. It ships the production
verification report, which honestly records framework readiness and a lab
structural run and documents the exact command to produce live results — no
tenant pass/fail is fabricated, because the private Azure DB is unreachable from
a workstation.

## Layer Impact

- `global-control-lane`: new pure verification library `src/lib/agent-verification/`,
  a run script, a behavior test, and governance docs. No runtime/answer-path
  change.

## Client Applicability

- All clients: Yes — verification spans all canonical tenants.
- Specific clients: n/a
- Internal only: Reports + results are operations/QA-facing.
- Public/demo only: n/a
- Feature flag: `AGENT_VERIFY_LIVE=1` selects the live ACA run.

## Changes Included

- `src/lib/agent-verification/{types,runner,report,index}.ts`
- `src/__tests__/behaviors/agent-verification.test.ts` — 3 cases.
- `scripts/agent-verification/run.ts` — lab structural / live ACA run.
- `docs/governance/AGENT_CONTEXT_BUNDLE_PRODUCTION_VERIFICATION_2026-06-09.md`
- `docs/build/agent-context-bundle-verification-2026-06-09/verification-summary.json`
- Final tracker consolidation in `KNOWLEDGE_CORPUS_REMEDIATION_TRACKER_2026-06-09.md`.

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-verification.test.ts` → 3/3 pass.
- `npx tsx scripts/agent-verification/run.ts` → lab structural summary
  (6 tenants, 66 golden + 4,700 matrix questions).
- `npx tsc --noEmit` → clean on touched files.
- `npx eslint` on touched files → 0 errors.
- `npm run audit:architecture-rules` and `npm run release:check` → green.
- Live pass/fail, wisdom distributions, and results/failures CSV rows are
  produced only by the live ACA run (`AGENT_VERIFY_LIVE=1`) — not faked here.

## Rollout Plan

Merge to `main` after CI is green (depends on PR-1/2/3/4/6, all merged). No
migration, no flag for the request path. The live verification run is an
operator action on Azure Container Apps.

## Rollback Plan

Revert the PR. No runtime callers on the request path; zero answer-path impact.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- Report: `docs/governance/AGENT_CONTEXT_BUNDLE_PRODUCTION_VERIFICATION_2026-06-09.md`.
- Lab summary: `docs/build/agent-context-bundle-verification-2026-06-09/verification-summary.json`.
- Test log: 3/3 behavior cases pass; 59 framework tests green across all slices.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit of tenant
context/corpus. The harness observes answers and aggregates verdicts.

## Known Gaps

- The live Azure run on ACA is the one outstanding action; this PR ships the
  harness + report, not live results.
- The live HTTP agent driver is described but not wired in this PR (it belongs to
  the ACA operator step); the runner accepts it via the `AgentDriver` interface.
- Nexus-route payload surfacing of validation findings and instrumentation of the
  `it_productivity` Sentinel sub-path + Source/Tower surfaces remain follow-ups.
