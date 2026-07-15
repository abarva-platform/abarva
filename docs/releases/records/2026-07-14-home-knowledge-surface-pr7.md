# 2026-07-14-home-knowledge-surface-pr7 — Home Knowledge Surface Preview

## Release ID

`2026-07-14-home-knowledge-surface-pr7`

## Status

`candidate`

## Plain-English Summary

This release candidate adds a default-off Home Knowledge Surface preview powered by Enterprise Knowledge Layer entity profiles, relationships, evidence, confidence, and gaps. It proves Home can become a client-facing enterprise knowledge experience without changing the current Home route or writing tenant data.

## Layer Impact

- `global-control-lane`: adds a shared Home preview helper, audit proof, documentation, and report bundle.
- Home runtime: unchanged by default. No product route, navigation item, or live Home behavior is changed in this PR.
- Data behavior: no tenant data writes, no Active Tenant Access update, no candidate promotion, and no active promotion.
- AI egress: no Claude call.

## Client Applicability

- All clients: yes, as dormant shared foundation.
- Specific clients: proof fixtures exercise Meridian Health and HarborTrust-style synthetic contexts.
- Internal only: audit command and proof bundle.
- Public/demo only: no.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_HOME_PREVIEW=false` by default.

## Changes Included

- `src/lib/enterprise-knowledge/home/*`
- `scripts/audit/build-home-knowledge-preview-proof.ts`
- `docs/architecture/home-knowledge-surface-preview.md`
- `reports/enterprise-knowledge-layer/home-preview-proof/*`
- `package.json` script: `audit:home-knowledge-preview`

## QA / Validation

- Pass: `npm run audit:home-knowledge-preview`
- Pass: `npm run audit:moves-knowledge-runtime`
- Pass: `npm run audit:knowledge-module-preview`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for Home preview and Enterprise Knowledge contracts
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge by PR only. No ACA deployment is required because this PR adds no product route, no navigation exposure, no environment flip, and no production data mutation. A future UI route or flag enablement must use the approved ACA deployment path and signed-in proof.

## Deployment Authority

- Repo-owned deploy workflow: not required for this proof-only preview.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not required.
- Worker image invariant: not applicable.
- Feature/env flag update path: no flag update in this PR; future enablement must use the approved deployment path.
- Live signed-in proof required: no, because no route or default module behavior changed.

## Rollback Plan

Revert the PR. Since no data is written and no runtime route uses the preview by default, rollback is code-only.

## Audit Evidence

- `reports/enterprise-knowledge-layer/home-preview-proof/summary.md`
- `reports/enterprise-knowledge-layer/home-preview-proof/summary.json`
- `reports/enterprise-knowledge-layer/home-preview-proof/meridian-enterprise-overview.json`
- `reports/enterprise-knowledge-layer/home-preview-proof/meridian-finance-profile.json`
- `reports/enterprise-knowledge-layer/home-preview-proof/meridian-agent-assist-profile.json`
- `reports/enterprise-knowledge-layer/home-preview-proof/harbortrust-fraud-profile.json`
- `reports/enterprise-knowledge-layer/home-preview-proof/home-knowledge-surface-proof.html`

## Known Gaps

This is rendered proof only. It does not add the Home product route, does not expose navigation, does not call Claude, and does not replace the current Home page.
