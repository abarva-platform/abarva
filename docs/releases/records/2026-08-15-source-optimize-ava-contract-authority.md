# 2026-08-15-source-optimize-ava-contract-authority — Source Optimize aVa Contract Authority

## Release ID

`2026-08-15-source-optimize-ava-contract-authority`

## Status

`candidate`

## Plain-English Summary

Source aVa can receive both a single-contract grounding block and an older
event-level contract-optimization grounding block on the same Optimize Contract
turn. This release makes the single-contract block authoritative when a contract
ID is present, so aVa reads the governed Contract Optimize read model instead of
mixing it with event/archetype wording that can be less specific.

The change does not calculate value, approve value, create workflow rows, or
change tenant data. It only controls which already-built grounding block is
allowed into the prompt for contract-grain Optimize questions.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 Canonical Enterprise Model: no schema or data mutation.
- Layer 4 Products: Source aVa prompt composition now prefers the governed
  single-contract read model when the user is asking from a contract-scoped
  Optimize surface.

## Client Applicability

- All clients: yes, for tenants using Source Optimize Contract and Source aVa.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`
- `src/lib/source/ava/answer-quality-gate.ts`
- `src/lib/source/ava/__tests__/answer-quality-gate.test.ts`

## QA / Validation

- PASS: `npx jest src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts --runInBand` — 2 suites, 44 tests.
- PASS: `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/ava/answer-quality-gate.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts`.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pending before merge: release check.
- Pending after merge: repo-owned ACA deploy and runtime invariant proof.

## Rollout Plan

Open a PR and merge through the protected repository lane. The repo-owned Azure
Container Apps main deploy workflow builds and deploys the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming signed-in aVa behavior; local
  tests prove prompt composition and quality-gate behavior only.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No data rollback
is required because this release changes only prompt composition and telemetry
quality-gate checks.

## Audit Evidence

- Pull request URL after publication.
- Focused test, lint, TypeScript, and release-check output.
- ACA deploy run and runtime-invariant proof after merge.
- Signed-in aVa transcript proof remains a separate proof item.

## Known Gaps

This release does not run the hard 25-question aVa suite and does not provide a
signed-in browser transcript. It removes one prompt-authority conflict so that
later browser/aVa QA tests the governed single-contract state, not a mixed prompt.
