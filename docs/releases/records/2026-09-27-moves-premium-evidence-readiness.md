# 2026-09-27-moves-premium-evidence-readiness — Moves Premium Evidence Readiness

## Release ID

`2026-09-27-moves-premium-evidence-readiness`

## Status

`candidate`

## Plain-English Summary

Moves premium artifact generation now passes approved evidence packets into the model-facing artifact prompt and records the generated run's evidence readiness from governed Move context, not from rendered visual counts. This keeps the review surface honest: diagrams/tables are presentation quality signals, while evidence readiness is based on approved evidence, structured metrics, taxonomy, and carried-forward evidence maps.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates the Moves premium artifact worker and prompt context used by generated review artifacts.
- Governance/presentation boundary: keeps the quality gate strict while correcting the run metadata that feeds evidence-readiness messaging.

## Client Applicability

- All clients: applies to tenants using Moves premium artifact generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves generation flags continue to control availability; this change does not promote or flip a flag.

## Changes Included

- `src/lib/deliverables/solution-prompt-factory.ts`
- `src/lib/programs/solution-context.ts`
- `src/scripts/process-deliverable-queue.ts`
- Focused regression coverage for prompt evidence binding, governed-context evidence counting, and premium worker run completion.

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/programs/__tests__/solution-context.test.ts --runInBand`
- Pass: `npx eslint src/scripts/process-deliverable-queue.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/deliverables/solution-prompt-factory.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/programs/solution-context.ts src/lib/programs/__tests__/solution-context.test.ts`
- Pass: `npm run typecheck`
- Mutation proof: temporarily mapping premium run `retrievedEvidence` back to `goldenBar.svgCount` fails the worker tests.
- Mutation proof: temporarily removing the governed source register from the premium prompt fails the prompt test.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data backfill, traffic mutation, or feature flag promotion is included.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: to be captured by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the affected Moves artifact generation path in the signed-in product.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this changes prompt composition and run metadata only, no database rollback is required.

## Audit Evidence

- PR URL: pending.
- Deploy workflow: pending.
- ACA runtime invariant: pending.
- Signed-in smoke proof: pending.

## Known Gaps

This does not weaken premium artifact quality gates. If generated content still fails the golden bar for missing exhibits or unsupported claims, that remains a separate artifact-quality defect to fix rather than bypass.
