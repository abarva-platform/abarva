# 2026-07-14-intelligence-knowledge-pr1 — Intelligence Progressive Context Pack Proof

## Release ID

`2026-07-14-intelligence-knowledge-pr1`

## Status

`candidate`

## Plain-English Summary

This release adds a design-only dry-run proof for the next Intelligence architecture. Intelligence should become progressive enterprise context assembly: build a fast context pack for the first answer, then enrich it with deeper evidence, relationships, gaps, caveats, and audit information. This PR proves that shape without changing the live Intelligence chat path.

## Layer Impact

- Lane: `global-control-lane`
- Enterprise Knowledge Layer: adds an Intelligence dry-run consumer for progressive context packs.
- Intelligence planning layer: adds proof artifacts for fast/deep context assembly; live answer generation is unchanged.
- Release/proof layer: adds an audit command and HTML/JSON/Markdown proof outputs.

## Client Applicability

- All clients: the contract is generic and tenant-scoped.
- Specific clients: the proof fixtures cover Meridian Health and HarborTrust Bank synthetic tenant examples.
- Internal only: proof artifacts and audit command.
- Public/demo only: none.
- Feature flag: not applicable; this is not runtime behavior.

## Changes Included

- `src/lib/enterprise-knowledge/intelligence/intelligence-context-pack-dry-run.ts`
- `src/lib/enterprise-knowledge/intelligence/index.ts`
- `scripts/audit/build-intelligence-context-pack-dry-run-proof.ts`
- `docs/architecture/intelligence-progressive-context-pack.md`
- `reports/enterprise-knowledge-layer/intelligence-pack-proof/*`
- `package.json` audit script `audit:intelligence-context-pack-dry-run`

## QA / Validation

- Pass: `npm run audit:intelligence-context-pack-dry-run`
- Pass: `npm run audit:moves-context-pack-dry-run`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for enterprise knowledge and Intelligence dry-run code
- Pass: `git diff --check`

## Rollout Plan

Merge through PR only. No Azure Container Apps deployment is required because this release does not add or change runtime routes, production answer generation, module behavior, tenant data writes, active data promotion, or feature flags.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: Not used.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no runtime surface changed.

## Rollback Plan

Revert the PR. Because this release is documentation, dry-run code, and generated proof artifacts only, rollback does not require database, candidate, Active Tenant Access, runtime, or feature-flag changes.

## Audit Evidence

- PR URL: to be added after PR creation.
- Audit command output: `reports/enterprise-knowledge-layer/intelligence-pack-proof/summary.md`
- Proof JSON: `reports/enterprise-knowledge-layer/intelligence-pack-proof/summary.json`
- Proof HTML: `reports/enterprise-knowledge-layer/intelligence-pack-proof/intelligence-context-pack-proof.html`

## Known Gaps

- This does not change the runtime Intelligence chat path.
- This does not call Claude.
- This does not implement streaming UI behavior.
- This does not implement cache persistence.
- This does not change Home, Moves, Source, Tower, or default Intelligence behavior.
