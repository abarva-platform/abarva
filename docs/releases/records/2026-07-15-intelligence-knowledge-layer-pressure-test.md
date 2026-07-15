# 2026-07-15-intelligence-knowledge-layer-pressure-test — Intelligence Knowledge Layer Pressure Test

## Release ID

`2026-07-15-intelligence-knowledge-layer-pressure-test`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Intelligence pressure-test audit. The audit checks whether the default Intelligence page/API can truthfully be called migrated to the Enterprise Knowledge Layer, while separately proving the explicit flag-enabled Knowledge runtime path can assemble FastContextPack, DeepContextPack, ProgressiveClaudePayload, evidence refs, gaps, confidence, and active/candidate guardrails.

This is an audit/control release, not an Intelligence migration.

## Layer Impact

- global-control-lane: adds an audit command and proof bundle for Intelligence Knowledge Layer migration claims.
- internal-admin: produces internal proof artifacts for operators and reviewers; no new client-facing navigation is exposed.

## Client Applicability

- All clients: benefit from the control because it prevents unsupported Intelligence migration claims.
- Specific clients: Meridian Health and HarborTrust Bank are used as synthetic proof scenarios.
- Internal only: the audit and proof reports are internal operator artifacts.
- Public/demo only: none.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_RUNTIME` remains default false.

## Changes Included

- `package.json`: adds `npm run audit:intelligence-knowledge-pressure`.
- `scripts/audit/build-intelligence-knowledge-pressure-proof.ts`: adds the Intelligence pressure-test proof generator.
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/`: generated proof bundle.
- `docs/releases/records/2026-07-15-intelligence-knowledge-layer-pressure-test.md`: release truth split and validation record.

## QA / Validation

- Pass: `npm run audit:intelligence-knowledge-pressure`
- Pass: `npm run audit:intelligence-knowledge-runtime`
- Pass: `npm run audit:knowledge-layer-live-preview`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for touched Intelligence pressure files
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the standard PR path. The audit is invoked manually or by release validation when Intelligence Knowledge Layer readiness is claimed. No tenant data build, migration, feature flag flip, or runtime behavior change is required.

## Deployment Authority

- Repo-owned deploy workflow: if merged to main, the standard ACA main deploy workflow remains the only approved shared-runtime deployment path.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: not required for the audit itself unless deployed by the main workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: no feature/env flags are changed.
- Live signed-in proof required: no default product behavior changes; signed-in crawl is useful but not required to prove this deterministic audit.

## Rollback Plan

Revert this release record, the `package.json` script entry, the pressure-test script, and generated proof bundle. No data rollback is required because this release writes no tenant data, promotes no candidate, changes no Active Tenant Access state, and changes no runtime module behavior.

## Audit Evidence

- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/summary.md`
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/summary.json`
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/question-readiness.csv`
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/default-vs-knowledge-path-diff.json`
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/timing.json`
- `reports/enterprise-knowledge-layer/intelligence-pressure-proof/intelligence-knowledge-pressure-proof.html`

## Known Gaps

- Default Intelligence remains not migrated to the Knowledge Layer.
- Default Intelligence page/API is not yet proven to render evidence, gaps, confidence, excluded context, or next evidence from the Knowledge runtime.
- This release does not enable Claude through the Knowledge runtime by default.
