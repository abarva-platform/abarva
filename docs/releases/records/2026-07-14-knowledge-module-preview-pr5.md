# 2026-07-14-knowledge-module-preview-pr5 — Knowledge Module Preview

## Release ID

`2026-07-14-knowledge-module-preview-pr5`

## Status

`candidate`

## Plain-English Summary

This release candidate adds a default-off preview contract for Moves and
Intelligence to inspect enterprise knowledge cache packets. It proves explicit
feature-flag enablement, disabled defaults, flag isolation, and cache-backed
preview packets. It does not wire the preview into live module runtime behavior.

## Layer Impact

- `global-control-lane`: adds a shared preview helper, preview flags, audit
  proof, documentation, and report bundle.
- Module behavior: unchanged by default. Moves generation and Intelligence chat
  paths do not read the preview unless future work explicitly wires them.
- Data behavior: no tenant data writes, no Active Tenant Access update, no
  candidate promotion, no active promotion.
- AI egress: no Claude call.

## Client Applicability

- All clients: yes, as dormant shared foundation.
- Specific clients: proof fixtures use Meridian Health and HarborTrust-style
  synthetic contexts.
- Internal only: audit command and proof bundle.
- Public/demo only: no.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_MOVES_PREVIEW=false` and
  `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_PREVIEW=false` by default.

## Changes Included

- `src/lib/enterprise-knowledge/module-preview/*`
- `scripts/audit/build-knowledge-module-preview-proof.ts`
- `docs/architecture/knowledge-module-preview.md`
- `reports/enterprise-knowledge-layer/module-preview-proof/*`
- `package.json` script: `audit:knowledge-module-preview`

## QA / Validation

- Pass: `npm run audit:knowledge-module-preview`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:moves-context-pack-dry-run`
- Pass: `npm run audit:intelligence-context-pack-dry-run`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for module preview and cache contracts
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge by PR only. No ACA deployment is required because this release candidate
adds no runtime route, no module call site, no environment variable flip, and no
production data mutation.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not required for this proof-only release.
- Worker image invariant: not applicable.
- Feature/env flag update path: no flag update in this PR; future rollout must use the approved deployment path.
- Live signed-in proof required: no, because no runtime route or module behavior changed.

## Rollback Plan

Revert the PR. Since no data is written and no runtime call site uses the
preview by default, rollback is code-only.

## Audit Evidence

- `reports/enterprise-knowledge-layer/module-preview-proof/summary.md`
- `reports/enterprise-knowledge-layer/module-preview-proof/summary.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/knowledge-module-preview-proof.html`
- Scenario JSON files under `reports/enterprise-knowledge-layer/module-preview-proof/`

## Known Gaps

This is preview proof only. It does not implement runtime Moves context extract,
does not change Intelligence chat, and does not call Claude.
