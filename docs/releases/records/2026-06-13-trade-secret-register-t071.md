# 2026-06-13-trade-secret-register-t071 — Trade Secret Register And Sample Source Marking

## Release ID

`2026-06-13-trade-secret-register-t071`

## Status

`candidate`

## Plain-English Summary

Adds an internal trade-secret register and sample source-file markings for selected AbarVa knowledge assets. The source-file changes are comment-only banners that label the relevant code as AbarVa confidential trade-secret material.

This PR does not change application behavior, data access, model routing, tenant data, or Azure infrastructure.

## Layer Impact

- Internal admin / IP governance: Adds a trade-secret register and sample marking convention.
- Runtime application: No behavior change; source comments only.
- Data plane: No change.
- Azure infrastructure: No change.

## Client Applicability

- All clients: No runtime effect.
- Specific clients: None.
- Internal only: AbarVa IP/legal/governance documentation and source marking.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/ip/trade-secret-register.md`
- Comment-only confidential/trade-secret banners in:
  - `src/lib/agent-eval/index.ts`
  - `src/lib/corpus/authoring.ts`
  - `src/lib/governance/context-corpus-policy.ts`
  - `src/lib/intelligence/ask/synthesizer.ts`
  - `src/lib/retrieval.ts`

## QA / Validation

- `npm run validate:context-corpus` — pass locally after refreshing the branch onto current `main`.
- `npm run release:check` — pass expected after this release record update.
- Existing CI checks on the PR — rerun required after branch update.

## Rollout Plan

Merge to `main` as internal documentation and source marking only. No Azure Container Apps deployment, database migration, feature flag, or traffic shift is required.

## Rollback Plan

Revert the PR if the marking convention or register is superseded.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3392
- Release record: this file
- Trade-secret register: `docs/ip/trade-secret-register.md`

## Known Gaps

This records a register and sample marking pattern only. Formal legal review of the IP strategy and marking convention remains outside this PR.
