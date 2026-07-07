# 2026-06-21-scb-w5-1-eval-harness — Shared Context Brain golden eval harness

## Release ID

`2026-06-21-scb-w5-1-eval-harness`

## Status

`candidate`

## Plain-English Summary

Adds a CI-safe eval runner for Ava and Consilium. The harness imports the golden questions supplied by W5.2, runs the deterministic routing/grounding eval, captures shaped `AgentAnswer` objects for every golden case, scores the prose with the existing answer-quality scorer, and writes a structured JSON report. This does not call live AI and does not change runtime answering behavior.

## Layer Impact

- **global-control-lane:** Adds reusable eval harness code and an operator script. No API, UI, schema, tenant data, retrieval, feature flag, or model prompt changes.

## Client Applicability

- All clients: Indirectly; this is a quality gate for shared answer behavior before client exposure.
- Specific clients: None.
- Internal only: Yes, evaluation/reporting infrastructure.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/answer/evals/harness.ts` — W5.1 harness that runs golden eval, captures `AgentAnswer`, and scores answer quality.
- `src/lib/intelligence/answer/evals/__tests__/harness.test.ts` — focused tests for full-set pass and failure capture.
- `src/scripts/intelligence/scb-golden-eval-runner.ts` — CLI runner that writes the structured JSON report and exits nonzero on regression.
- `package.json` — `npm run scb:golden-eval`.
- `docs/build/SCB_EXECUTION_TRACKER.md` — W5.1 status/proof notes.

## QA / Validation

- `npx jest src/lib/intelligence/answer/evals/__tests__/harness.test.ts --runInBand` — PASS, 2/2.
- `npm run scb:golden-eval -- --out=/tmp/abarva-scb-w5-1-golden-eval.json` — PASS, 35/35 total, 35/35 golden, 35/35 answer quality.
- `npx eslint src/lib/intelligence/answer/evals/harness.ts src/lib/intelligence/answer/evals/__tests__/harness.test.ts src/scripts/intelligence/scb-golden-eval-runner.ts` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Merge to `main`; repo CI can run `npm run scb:golden-eval` as a deterministic harness. No runtime activation is required.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` may run on merge, but this slice is inert evaluation code.
- Shared runtime mutators: none.
- Approved image digest: built by deploy workflow if merged.
- ACA runtime invariant: no runtime behavior change expected.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: No; this is offline eval infrastructure.

## Rollback Plan

Revert the PR. No data, migration, worker, environment, or feature flag rollback required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3788
- JSON proof artifact path from local run: `/tmp/abarva-scb-w5-1-golden-eval.json`.
- Commands listed in QA / Validation.

## Known Gaps

- Live model-answer scoring remains a later env-gated layer; this PR proves deterministic routing/grounding plus shaped `AgentAnswer` quality without secrets.
- W6.1 parity/readiness gating still needs to consume this harness output.
