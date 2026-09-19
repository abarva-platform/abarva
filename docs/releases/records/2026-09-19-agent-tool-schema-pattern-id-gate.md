# 2026-09-19-agent-tool-schema-pattern-id-gate - Agent Tool Schema Pattern ID Gate

## Release ID

`2026-09-19-agent-tool-schema-pattern-id-gate`

## Status

`candidate`

## Plain-English Summary

This change removes a retired pattern identifier from model-facing tool instructions. It adds a
repository behavior check that rejects hardcoded corpus pattern identifiers in agent-tool
description fields, so future corpus re-keying cannot leave the model following a stale example.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: model-facing instructions for one program tool.
- Test governance: one static behavior gate over agent-tool descriptions.
- Layers 1-3: unchanged.

## Client Applicability

- All clients: shared agent-tool instruction quality.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/tools/program/commitProgram.ts`
- `src/__tests__/behaviors/agent-tool-schema-pattern-ids.test.ts`

## QA / Validation

- Confirmed the removed example does not resolve in the current pattern manifest.
- Confirmed it is passed verbatim to the model through the tool definition.
- PASS - focused tool and behavior tests, 2 suites / 13 tests.
- PASS - full behavior suite, 30 suites / 291 tests.
- PASS - restoring the retired identifier failed the new behavior gate.
- PASS - TypeScript with an 8 GB heap.
- PASS - scoped ESLint.
- PASS - `npm run release:check`.

## Rollout Plan

Merge through a pull request. The repository-owned ACA deploy workflow may carry the instruction
change in a later web image. No data build, migration, or flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None.
- Approved image digest: established by the deploy workflow after merge.
- ACA runtime invariant: required before calling the instruction change deployed.
- Worker image invariant: required if a worker is updated.
- Feature/env flag update path: None.
- Live signed-in proof required: No; the change is model-facing schema guidance, not rendered UI.

## Rollback Plan

Revert the pull request. No data or schema state needs reversal.

## Audit Evidence

- Local validation and mutation commands will be recorded in the pull request.

## Known Gaps

This gate covers corpus pattern identifiers. Route, tenant, and enum literals require separate
source-of-truth checks rather than being treated as pattern identifiers.
