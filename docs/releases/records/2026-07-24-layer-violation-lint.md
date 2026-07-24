# 2026-07-24 Layer Violation Lint

## Release ID

`2026-07-24-layer-violation-lint`

## Status

`candidate`

## Plain-English Summary

Adds a static architecture guard for the Enterprise Information Architecture. New product or Tower projection code may not directly read tenant intake, generated tenant-inputs, derived module-context artifacts, `tower-standardized-v1`, or the Tower-standardized adapter path.

This prevents the exact class of mistakes that produced wrong Tower numbers: treating source or adapter/projection artifacts as canonical product truth.

## Layer Impact

- Release lane: `global-control-lane`
- Control/CI layer: extends the existing architecture-rules audit.
- Product layer: no runtime behavior change.
- Data layer: no data mutation, no schema change, no loader execution.

## Client Applicability

- All clients: yes, because the guard applies to shared product/projection code.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: not applicable.

## Changes Included

- `scripts/audit/architecture-rules.mjs`
- `package.json`
- `docs/releases/records/2026-07-24-layer-violation-lint.md`

## QA / Validation

- PASS: `npm run audit:architecture-rules:self-test`
- PASS: `npm run audit:layer-boundaries`
- PASS: `npm run audit:architecture-rules -- --base=origin/main --head=origin/feat/tower-tfamily-mart` fails as expected against PR #5561-style violations, naming `src/scripts/tower/project-tower-mart.ts`.
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The existing Architecture Rules workflow will then enforce the new guard on future PRs. No ACA deploy, data load, or signed-in browser proof is required because this is CI/control-plane only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert this PR or temporarily remove the `NO_PRODUCT_LAYER_SOURCE_READ` rule from `scripts/audit/architecture-rules.mjs`.

## Audit Evidence

- PR URL and CI check output.
- Local proof that the rule self-test passes.
- Local proof that the rule blocks the current PR #5561 layer violation.

## Known Gaps

This is a changed-code guard, not a full historical cleanup. Existing transitional layer violations remain visible and should be retired through separate canonical-model work.
