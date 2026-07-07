# 2026-07-01-tower-program-visible-name-scrub — Tower Program Name Hygiene

## Release ID

`2026-07-01-tower-program-visible-name-scrub`

## Status

`candidate`

## Plain-English Summary

Tower now scrubs key-shaped loaded program names before placing them in executive-visible ranking answers. If a Tower program fact carries both a raw code and a business label, Tower uses the business label. If only a code is available, Tower falls back to a neutral loaded-program label instead of exposing the code or failing validation.

## Layer Impact

- `global-control-lane`: Updates shared Tower answer behavior used by all signed-in tenants.
- `runtime answer contract`: Keeps the V6 visible-output guardrail strict while preventing false failures from code-shaped source display names.

## Client Applicability

- All clients: yes, for Tower top-program ranking answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`: prefers business-name attributes, strips key-like prefixes, and falls back to safe labels for deterministic Tower program ranking answers.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds a regression proving code-shaped program names are scrubbed and the same visible-answer validation passes.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`
  - Passed: 23 tests.
  - Notes: existing duplicate Jest manual mock warnings and localstorage warning are unrelated to this change.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the new image, shift 100% traffic to the healthy revision, then rerun the signed-in production Tower top-program proof and the 30-question cross-surface smoke gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web app and worker job image update through the approved main deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this commit or roll back ACA traffic to the previous healthy revision. No schema or data migration is included.

## Audit Evidence

- PR URL: pending.
- Local QA command above.
- Post-deploy evidence required: ACA runtime invariant, focused top-program signed-in proof, and cross-surface smoke summary.

## Known Gaps

The broader 30-question production smoke gate is still open until this hotfix is deployed and rerun.
