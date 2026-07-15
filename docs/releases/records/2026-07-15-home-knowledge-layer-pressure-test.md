# 2026-07-15-home-knowledge-layer-pressure-test — Home Knowledge Layer Pressure Test

## Release ID

`2026-07-15-home-knowledge-layer-pressure-test`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Home Knowledge Layer pressure-test audit. The audit compares the hidden Knowledge Layer preview proof against the default Home page/source path and reports whether Home can truthfully be called migrated to the Enterprise Knowledge Layer.

This is a proof/control release, not a Home migration.

## Layer Impact

- global-control-lane: adds an audit script and generated proof bundle for Home Knowledge Layer migration claims.
- internal-admin: uses the hidden Knowledge Layer preview proof as the comparison target, but does not expose new admin navigation or change default runtime behavior.

## Client Applicability

- All clients: benefit from the control report because it prevents overclaiming Home Knowledge Layer readiness.
- Specific clients: none.
- Internal only: the audit and generated reports are internal engineering/operator proof artifacts.
- Public/demo only: none.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_HOME_PREVIEW` remains default false; this release does not enable it.

## Changes Included

- `package.json`: adds `npm run audit:home-knowledge-pressure`.
- `scripts/audit/build-home-knowledge-pressure-proof.ts`: adds the pressure-test proof generator.
- `reports/enterprise-knowledge-layer/home-pressure-proof/`: adds the generated proof bundle.
- `docs/releases/records/2026-07-15-home-knowledge-layer-pressure-test.md`: documents the release truth split and validation.

## QA / Validation

- Pass: `npm run audit:home-knowledge-pressure`
- Pass: `npm run audit:knowledge-layer-live-preview`
- Pass: `npm run audit:home-knowledge-preview`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for the pressure-test script and Knowledge Layer preview dependency
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the standard PR path. The audit is invoked manually or by release validation when a Home Knowledge Layer claim is made. No tenant data build, migration, feature flag flip, or runtime behavior change is required.

## Deployment Authority

- Repo-owned deploy workflow: not required for the audit to run locally; if merged to main, the standard ACA main deploy workflow remains the only approved shared-runtime deployment path.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: not required for this non-runtime proof release unless it is deployed through the main workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: no feature/env flags are changed.
- Live signed-in proof required: no default product behavior changes; browser screenshots are optional proof artifacts, not release blockers.

## Rollback Plan

Revert this release record, the `package.json` script entry, the pressure-test script, and the generated proof bundle. No data rollback is required because this release writes no tenant data, promotes no candidate, changes no Active Tenant Access state, and changes no runtime module behavior.

## Audit Evidence

- `reports/enterprise-knowledge-layer/home-pressure-proof/summary.md`
- `reports/enterprise-knowledge-layer/home-pressure-proof/summary.json`
- `reports/enterprise-knowledge-layer/home-pressure-proof/dimension-readiness.csv`
- `reports/enterprise-knowledge-layer/home-pressure-proof/home-vs-knowledge-preview-diff.json`
- `reports/enterprise-knowledge-layer/home-pressure-proof/home-knowledge-pressure-proof.html`

## Known Gaps

- Default Home remains not migrated to the Knowledge Layer.
- Summary/Data/Relationships/Gaps/Evidence/aVa are not yet proven to consume `HomeKnowledgePack` by default.
- This release does not enable Claude for Home by default.
- This release does not change navigation exposure for the hidden Knowledge Layer preview.
