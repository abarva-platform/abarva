# 2026-07-17-home-claude-verbatim-content — Home Claude Verbatim Executive Content Contract

## Release ID

`2026-07-17-home-claude-verbatim-content`

## Status

`candidate`

## Plain-English Summary

This release candidate changes Meridian Home / Knowledge content generation so the executive advisory text, dimension summaries, gaps, evidence summaries, relationships, and visual-ready blocks are authored by Claude under an executive-consultant prompt and stored in the approved Home design-contract pack. The renderer displays those Claude-authored strings and visual block values without prose rewriting. Data table rows remain deterministic projections from canonical tenant input CSVs.

## Layer Impact

- Release lanes: `global-control-lane`, `client-data-lane`.
- Home / Knowledge presentation layer: renders the approved design-contract pack with Claude-authored advisory fields and visual block payloads.
- Approved content artifact layer: updates Meridian's approved Home Knowledge design-contract pack and proof reports.
- Generation/audit tooling: strengthens the generator, evidence-reference validation, lineage, and UI audits to require Claude-authored advisory slots and visual blocks.

## Client Applicability

- All clients: renderer and audit contract improvements apply globally when this Home Knowledge surface consumes a design-contract pack.
- Specific clients: Meridian Health approved content is regenerated in this release candidate.
- Internal only: proof reports under `reports/home-knowledge-design-contract*`.
- Public/demo only: none.
- Feature flag: no new flag.

## Changes Included

- `scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs`
- `scripts/audit/home-knowledge-design-contract-ui.mjs`
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json`
- `datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json`
- `reports/home-knowledge-design-contract/**`
- `reports/home-knowledge-design-contract-ui-wiring/**`

## QA / Validation

- `node scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs` with Claude response replay: pass.
- `npm run audit:home-knowledge-design-contract-ui`: pass.
- `npm run audit:home-dimension-story-claims`: pass.
- `npm run audit:home-dimension-data-tab`: pass.
- `npm run audit:home-dimension-evidence-tab`: pass.
- `npm run audit:approved-content-path-convergence`: pass.
- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx src/lib/home/home-knowledge-design-contract.ts scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs scripts/audit/home-knowledge-design-contract-ui.mjs`: pass.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`: pass.
- `git diff --check`: pass.

## Rollout Plan

Open a PR, merge through the protected main path, then deploy through the repo-owned Azure Container Apps main deployment workflow if accepted. No database migration, production data mutation, candidate promotion, or Active Tenant Access update is included.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Home / Knowledge Meridian review after deploy.

## Rollback Plan

Revert the PR or restore the previous approved Meridian Home Knowledge design-contract pack. Because there are no DB writes or migrations, rollback is a code/content artifact rollback only.

## Audit Evidence

- `reports/home-knowledge-design-contract/actual-claude-prompt.txt`
- `reports/home-knowledge-design-contract/actual-claude-overview-prompt.txt`
- `reports/home-knowledge-design-contract/raw-claude-response.json`
- `reports/home-knowledge-design-contract/raw-claude-response-overview.json`
- `reports/home-knowledge-design-contract/raw-claude-response-dimension-*.json`
- `reports/home-knowledge-design-contract/component-lineage.html`
- `reports/home-knowledge-design-contract-ui-wiring/rendered-component-map.csv`
- `reports/home-knowledge-design-contract-ui-wiring/proof.html`

## Known Gaps

- Not deployed or live signed-in browser-proven until the PR merges and the ACA workflow publishes the new image.
- This release does not change aVa runtime answering or production data promotion.
