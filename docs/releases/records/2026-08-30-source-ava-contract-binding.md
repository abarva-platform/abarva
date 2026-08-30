# 2026-08-30-source-ava-contract-binding — Source aVa Named Contract Binding

## Release ID

`2026-08-30-source-ava-contract-binding`

## Status

`candidate`

## Plain-English Summary

Source workspace aVa now carries a compact contract directory in its surface context and binds contract-specific questions to the named contract ID when one is present in the question. If the named contract is not in the current Source packet, aVa must say that instead of answering from a different selected or higher-ranked contract.

## Layer Impact

Layer 4 Products, `global-control-lane`: Source workspace context assembly and deterministic aVa answer generation are updated for the shared product runtime. No canonical data, adapter, ingestion, schema, or tenant data is changed.

## Client Applicability

- All clients: Source workspace aVa users receive the safer contract-binding behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace route behavior; no new flag.

## Changes Included

- Source workspace surface context adds contract and action-candidate directories.
- Source aVa deterministic answer path resolves named contract IDs from that directory.
- Source aVa withholds named-contract answers when the current packet cannot prove the requested contract.
- Focused regression tests cover Source context payload shape and named-contract binding.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`
- Pass: `npx eslint 'src/lib/source/ava/source-workspace-visual-answer.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`

## Rollout Plan

Merge by pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. After deploy, run a signed-in Source workspace aVa proof for a named contract question and a cross-tenant refusal question.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace aVa.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required because this release changes only Source presentation/context behavior.

## Audit Evidence

- Pull request for this release.
- Focused Jest, ESLint, TypeScript, and release-control output.
- Post-deploy Source workspace aVa transcript proof.

## Known Gaps

This release does not add new Source evidence, change tenant data, or create finance-confirmed outcomes. It only prevents named-contract questions from drifting to another contract's facts.
