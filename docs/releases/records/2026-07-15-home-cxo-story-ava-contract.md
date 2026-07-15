# 2026-07-15-home-cxo-story-ava-contract — Home CXO Story and aVa Context Contract

## Release ID

`2026-07-15-home-cxo-story-ava-contract`

## Status

`candidate`

## Plain-English Summary

This release candidate tightens Home / Knowledge around the CXO storytelling bar. Home now treats the enterprise context layer as the main story, uses Claude-approved Meridian narrative artifacts for the executive brief and dimension framing, keeps diagnostics collapsed, and adds explicit audits that fail if Home reads like a user guide, audit report, data dictionary, or record-count dashboard. It also documents and audits the Home aVa contract: Home aVa is a minimized context concierge for active Knowledge context, not unrestricted Intelligence chat.

## Layer Impact

- `global-control-lane`: Updates shared Home / Knowledge rendering behavior and the Home aVa contract for all tenants using the Home surface.
- `module UI`: Home copy and section behavior are tightened so the primary surface tells the enterprise context story before drill-down tables and diagnostics.
- `enterprise knowledge`: Meridian Home and dimension narratives are generated from the governed context prompt and stored as approved Claude-derived artifacts with prompt, response, validation, and rendered-review evidence.
- `quality/audit`: new story-quality and Home aVa contract audits produce a proof bundle under `reports/home-cxo-story-quality/`.
- `documentation`: Home aVa has an explicit answering and visual contract under `docs/home-know/HOME_AVA_CONTEXT_CONTRACT.md`.

## Client Applicability

- All clients: Home aVa minimization and the Home-vs-Intelligence contract are global design rules.
- Specific clients: Claude-approved runtime narrative artifacts in this slice are Meridian Health / Healthcare Demo focused.
- Internal only: proof reports and audit artifacts.
- Public/demo only: none.
- Feature flag: none added by this release candidate.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts`
- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts`
- `scripts/knowledge/generate-home-knowledge-claude-narratives.ts`
- `scripts/knowledge/audit-home-knowledge-story-quality.ts`
- `scripts/knowledge/audit-home-cxo-story-quality.ts`
- `scripts/knowledge/audit-home-ava-context-contract.ts`
- `scripts/knowledge/audit-knowledge-home-insights.ts`
- `scripts/knowledge/audit-knowledge-dimension-narratives.ts`
- `docs/home-know/HOME_AVA_CONTEXT_CONTRACT.md`
- `reports/home-knowledge-story-quality/`
- `reports/home-cxo-story-quality/`

## QA / Validation

- Pass: `HOME_KNOWLEDGE_STORY_REUSE_RESPONSES=1 npm run generate:home-knowledge-claude-narratives`
- Pass: `npm run audit:home-knowledge-story-quality`
- Pass: `npm run audit:home-cxo-story-quality`
- Pass: `npm run audit:home-ava-context-contract`
- Pass: `npm run audit:knowledge-home-insights`
- Pass: `npm run audit:knowledge-dimension-narratives`
- Pass: `npm run audit:control-plane-purity:check`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: targeted ESLint for Home / Knowledge narrative scripts and HomeSurface.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npx jest --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand` (12/12; Jest emitted pre-existing duplicate manual mock warnings).
- Pass: `git diff --check`
- Not run: `npm run audit:meridian-data-state-reconciliation` is not defined in `package.json`.

## Rollout Plan

Open a PR from this branch and merge through the protected repository path. The approved main branch deploy workflow builds and deploys the ACA image. No data-plane promotion, candidate promotion, schema migration, environment flag, or manual Azure runtime mutation is included.

## Deployment Authority

- Repo-owned deploy workflow: required for live ACA rollout after merge.
- Shared runtime mutators: none in this release candidate.
- Approved image digest: to be supplied by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live proof.
- Worker image invariant: no worker changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deploy, for Home / Knowledge Meridian route and Home aVa launcher behavior.

## Rollback Plan

Revert the PR or roll the ACA web app back to the previously approved digest. Because this release candidate does not write production tenant data, promote candidates, or run migrations, rollback is limited to code/report artifacts.

## Audit Evidence

- `reports/home-knowledge-story-quality/summary.md`
- `reports/home-knowledge-story-quality/rendered-review-table.html`
- `reports/home-knowledge-story-quality/home-story-quality-proof.html`
- `reports/home-cxo-story-quality/summary.md`
- `reports/home-cxo-story-quality/home-cxo-story-proof.html`
- `reports/home-cxo-story-quality/cxo-story-score.csv`
- `reports/home-cxo-story-quality/visual-quality-score.csv`
- `reports/home-cxo-story-quality/home-ava-contract-results.csv`

## Known Gaps

- Not yet deployed or live signed-in browser-proven in this release record.
- The static screenshot directory is a placeholder until the signed-in post-deploy crawl captures screenshots.
- Runtime Home aVa still needs a signed-in interaction proof to verify actual answer text follows the documented contract.
