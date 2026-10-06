# 2026-09-24-moves-ava-scoped-context-gate — Moves aVa scoped-context gate

## Release ID

`2026-09-24-moves-ava-scoped-context-gate`

## Status

`candidate`

## Plain-English Summary

Moves aVa answers on a scoped Move workspace now suppress generic tenant-wide context blocks once the deterministic Moves grounding packet is available. This keeps phase guidance tied to the active Move rather than blending unrelated tenant, broker, or archetype guidance into the response.

## Layer Impact

- `global-control-lane`: Layer 4 product behavior for Moves chat prompt assembly.
- No tenant intake, source adapter, canonical data, data-plane write, registry activation, routing, or runtime policy change is included.

## Client Applicability

- All clients: applies to Moves workspace aVa answers where scoped Moves grounding is available.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: uses the existing Moves aVa grounding path; no new flag.

## Changes Included

- `src/app/api/chat/agent/route.ts` suppresses generic context-bundle, tenant broker, tenant system, and cross-program-signal prompt inputs when scoped Moves aVa grounding is present.
- `src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts` pins the prompt-assembly contract so future changes do not reintroduce generic context blocks into scoped Moves answers.

## QA / Validation

- `npm run test -- --runTestsByPath src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts --runInBand` — passed, 5/5 tests.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No manual data mutation, migration, registry activation, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured by the ACA deploy workflow after merge.
- ACA runtime invariant: verify web template image, 100% traffic revision image, and worker job images after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: a scoped Moves aVa guidance response should not include unrelated tenant-wide/archetype evidence needs.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. Rollback restores the previous broader context prompt assembly for Moves aVa answers.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/8384
- Unit test output: focused route prompt-assembly test listed above.
- Post-merge ACA workflow run and runtime invariant proof.

## Known Gaps

- This does not change deterministic Move state, artifact generation, evidence parsing, or File Cabinet classification.
- Browser proof remains required after deploy because prompt-scoping defects are visible only in generated aVa answers.
