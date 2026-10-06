# 2026-09-10-moves-client-language-sanitizer — Moves Client Language Cleanup

## Release ID

`2026-09-10-moves-client-language-sanitizer`

## Status

`candidate`

## Plain-English Summary

Moves generated artifacts now have a stronger cleanup pass for internal delivery vocabulary before the client-facing quality gate runs. The shared generation prompts also avoid asking the model to repeat internal checklist and evidence-register wording in narrative sections.

## Layer Impact

Release lane: `global-control-lane`.

Products: updates Moves artifact generation and artifact cleanup for client-facing deliverables. It does not change canonical enterprise data, tenancy, intake schemas, migrations, or stored source evidence.

## Client Applicability

- All clients: yes, for Moves generated deliverables.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates the Moves client-facing artifact sanitizer to rewrite the full internal machinery vocabulary that the quality gate blocks in client narrative.
- Updates shared Moves generation prompts and phase artifact instructions to use client-safe wording for open inputs and evidence appendices.
- Adds a regression test that sanitizes every banned machinery term and verifies the quality scanner no longer blocks the cleaned narrative.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/quality/__tests__/transformation-gates.test.ts` passed.
- `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts` passed.
- `npm run release:check -- --base origin/main --head HEAD` pending.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. After deploy, rerun the Moves end-to-end smoke from the blocked phase and verify generated artifacts pass the client-facing quality gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned deploy workflow only.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Moves smoke continuation against the affected phase.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending.
- Targeted Jest and ESLint output from the candidate branch.
- ACA main deploy run after merge.
- Moves smoke report after rerun.

## Known Gaps

Live proof is pending until the candidate is merged, deployed, and the blocked Moves smoke phase is rerun.
