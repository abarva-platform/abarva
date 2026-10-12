# 2026-10-11-intelligence-reasoned-executive-answer — Private draft reasoning for executive briefs

## Release ID

`2026-10-11-intelligence-reasoned-executive-answer`

## Status

`candidate`

## Plain-English Summary

Intelligence executive answers enable Claude adaptive reasoning before emitting the answer. The prompt asks Claude to check brevity, source qualification, literal option counts and exhibit structure during that private drafting step. The original canonical answer text remains unchanged. Brief executive requests use a reasoning-capable model instead of the legacy concise utility model.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: Intelligence generation settings and draft-check prompt. Existing audited Anthropic egress and governed context admission remain in place.
- No intake, adapter, canonical-data, corpus, schema, migration or data-load change.

## Client Applicability

- All signed-in Intelligence executive-answer clients.
- Legacy answer-only contracts retain their existing model selection and generation configuration.
- No client exception, feature flag or environment update.

## Changes Included

- Adaptive reasoning with high effort and omitted thinking display for executive answers.
- A generation token budget that includes private reasoning as well as the short canonical answer; timing metadata reports the actual budget.
- Brief executive requests use the existing reasoning-capable Sonnet model; other executive model routing remains as configured.
- Draft check covers prose length, case-sensitive matrix axis keys, requested row count, source aliases and evidence certainty.
- Provisional investment recommendations fund bounded validation and hold expansion commitments.

## QA / Validation

- PASS: 16 tests across four focused suites for reasoning configuration, input governance, synthesis wiring and canonical-output fidelity.
- PASS: Node 24 TypeScript, changed-file ESLint, refreshed test-coverage census and all eleven release-control gates.
- NOT RUN: new live question quality and native PDF proof require the repo-owned ACA release and a fresh signed-in ten-question review.

## Rollout Plan

Squash merge after local QA. Deploy only through the ACA main workflow. Verify the approved digest across the template, full-traffic revision and required workers. Run the same ten questions and inspect the actual exported PDF and normal conversation follow-ups.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: recorded after the workflow build.
- ACA runtime invariant: template and full-traffic revision match the approved digest.
- Worker image invariant: all required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: clean brief, native visuals, source qualification, follow-ups and actual export.

## Rollback Plan

Revert through a PR and the repo-owned ACA main deploy workflow. No data rollback.

## Audit Evidence

Candidate diff, tests that preserve answer text and omit private reasoning, local QA logs, PR, runtime digest proof and private signed-in review/export evidence. Provider contract: https://platform.claude.com/docs/en/about-claude/models/extended-thinking-models.

## Known Gaps

Reasoning adds latency and billed generation tokens. Prompt compliance must still be observed; the application does not shorten, repair or rewrite successful canonical answers. Numeric and confirmed relationship exhibits still require the corresponding verified evidence.
