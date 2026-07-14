# 2026-07-14-knowledge-layer-moves-pr3 — Moves Context Pack Dry-Run Proof

## Release ID

`2026-07-14-knowledge-layer-moves-pr3`

## Status

`candidate`

## Plain-English Summary

This release adds a non-default Moves dry-run proof that asks the Enterprise Knowledge Layer for a governed, phase-scoped context pack. The proof shows how Moves can receive source-backed profiles, relationship candidates, evidence references, gaps, unsupported claims, phase-specific next evidence, and a Claude-ready payload before any production Move generation or evidence attachment happens.

## Layer Impact

- Lane: `global-control-lane`
- Enterprise Knowledge Layer: adds a Moves consumer wrapper around the shared context pack assembler.
- Moves planning layer: adds dry-run proof artifacts only; default Moves workflow and generation behavior are unchanged.
- Release/proof layer: adds an audit command and HTML/JSON/Markdown proof outputs.

## Client Applicability

- All clients: the contract is generic and tenant-scoped.
- Specific clients: the proof fixtures cover Meridian Health and HarborTrust Bank synthetic tenant examples.
- Internal only: proof artifacts and audit command.
- Public/demo only: none.
- Feature flag: not applicable; this is not runtime behavior.

## Changes Included

- `src/lib/enterprise-knowledge/moves/moves-context-pack-dry-run.ts`
- `src/lib/enterprise-knowledge/moves/index.ts`
- `scripts/audit/build-moves-context-pack-dry-run-proof.ts`
- `docs/architecture/moves-context-pack-dry-run.md`
- `reports/enterprise-knowledge-layer/moves-pack-proof/*`
- `package.json` audit script `audit:moves-context-pack-dry-run`

## QA / Validation

- Pass: `npm run audit:moves-context-pack-dry-run`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for enterprise knowledge and Moves dry-run code
- Pass: `git diff --check`

## Rollout Plan

Merge through PR only. No Azure Container Apps deployment is required because this release does not add or change runtime routes, production answer generation, module behavior, tenant data writes, or active data promotion.

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
- Audit command output: `reports/enterprise-knowledge-layer/moves-pack-proof/summary.md`
- Proof JSON: `reports/enterprise-knowledge-layer/moves-pack-proof/summary.json`
- Proof HTML: `reports/enterprise-knowledge-layer/moves-pack-proof/moves-context-pack-proof.html`

## Known Gaps

- This does not implement runtime Moves Context Extract integration.
- This does not attach Move evidence.
- This does not call Claude.
- This does not change Intelligence, Home, Source, Tower, or default Moves behavior.
