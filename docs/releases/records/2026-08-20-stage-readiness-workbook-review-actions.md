# 2026-08-20-stage-readiness-workbook-review-actions — Stage Readiness Workbook Review Actions

## Release ID

`2026-08-20-stage-readiness-workbook-review-actions`

## Status

`candidate`

## Plain-English Summary

This change adds the human review step after a stage-readiness workbook is parsed. Uploading a workbook still creates only pending proposals. A reviewer must explicitly accept, reject, or mark proposals as needing validation before any workbook response can become structured context for the next phase.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Strategic Moves gains a governed review API for workbook proposal decisions. The change does not load tenant data, write canonical records, or refresh product projections.

## Client Applicability

- All clients: Strategic Moves phase-readiness workbook review behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add review-decision and accepted-response structures for stage-readiness workbook proposal sets.
- Add a `PATCH` handler to the stage-readiness workbook API for accept, reject, and needs-validation decisions.
- Enforce tenant-scoped artifact lookup, proposal-set type checks, and proposal-set version conflict handling before review.
- Persist review decisions as approval artifacts and emit accepted structured responses separately from pending, rejected, or needs-validation proposals.
- Add compact workbook review controls to the Strategic Moves phase page so reviewers can accept selected responses, reject them, or mark them as needing validation.
- Use the current workbook review artifact metadata in the phase route guard so P2 can open only when accepted structured responses exist and no proposal remains pending or needing validation.

## QA / Validation

- Pass: `npx jest src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts --runInBand`
- Pass: `npx jest src/lib/programs/__tests__/phase-navigation-status.test.ts --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' --runInBand`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/lib/programs/stage-readiness-workbooks/proposals.ts 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts' 'src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts' 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts'`
- Pass: `npm run release:check`

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow may rebuild the web image after merge. No migration, data-plane load, tenant data mutation, registry activation, or runtime configuration change is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required if a deploy runs after merge.
- Worker image invariant: Required if the deploy workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming live behavior.

## Rollback Plan

Revert the PR. Existing proposal-set artifacts remain review-required and no accepted response artifact is required for rollback.

## Audit Evidence

- PR URL: to be added when opened.
- Local tests listed in QA / Validation.
- CI and deploy evidence to be added by the PR and deploy workflow.

## Known Gaps

This does not yet wire accepted workbook responses into P2 prompt assembly. That is the next slice in the same governed workbook sequence.
