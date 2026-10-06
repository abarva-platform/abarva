# 2026-09-11-source-ava-command-lever-context — Source aVa Command Lever Context

## Release ID

`2026-09-11-source-ava-command-lever-context`

## Status

`candidate`

## Plain-English Summary

Source aVa can now answer a contract-specific optimization export prompt when the current Source Command Center page is already scoped to that contract through governed lever/action rows. Before this change, the page could show contract-specific levers while the aVa answer path refused because no Contract 360 selected-contract record was present in the answer packet.

## Layer Impact

- `global-control-lane`: Layer 4 product/read path. Updates deterministic Source aVa context selection and export-answer routing. It does not change canonical data, migrations, tenant data, or ingestion.

## Client Applicability

- All clients: yes, for Source pages that expose governed contract-specific lever/action rows.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand` passed.
- `npx eslint 'src/lib/source/ava/source-workspace-visual-answer.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts'` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run release:check` must pass before merge.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. No migration, data reload, or data-build job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for Product/Lab runtime update.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Source Command Center contract-scoped aVa optimization export prompt.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to roll the web and worker images back to the reverted digest. No data rollback is required because this is a Layer 4 read-path change only.

## Audit Evidence

- Pull request and merge commit.
- Targeted Jest output.
- ESLint output.
- TypeScript output.
- Release check output.
- ACA deploy workflow run.
- Direct ACA runtime invariant readback.
- Signed-in Source/aVa proof after deploy.

## Known Gaps

This does not run a fresh VNet-attached data reload or enrich contract records. It only ensures aVa can use contract-specific lever/action rows already present in the Source page context.
