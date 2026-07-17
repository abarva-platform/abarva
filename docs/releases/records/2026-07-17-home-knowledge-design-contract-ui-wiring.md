# 2026-07-17-home-knowledge-design-contract-ui-wiring — Home Knowledge Design Contract UI Wiring

## Release ID

`2026-07-17-home-knowledge-design-contract-ui-wiring`

## Status

`candidate`

## Plain-English Summary

This release candidate wires Meridian Home / Knowledge to an approved Nexus Home Knowledge design-contract render pack. The page can render the contract shell with Meridian-specific executive briefing content, 19 enterprise dimensions, deterministic data tabs, evidence cards, relationship narratives, and gaps. It does not mutate Postgres, promote candidate data, change Active Tenant Access, or deploy anything by itself.

## Layer Impact

- `global-control-lane`: Adds the shared UI component, route switch, and audit commands for contract-backed Home / Knowledge rendering.
- `client-data-lane`: Consumes the Meridian-approved Home Knowledge render pack at `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json` when validation status is `pass`.
- `internal-admin`: Adds deterministic proof reports that map rendered components to source files, generation method, evidence lineage, and refresh time.

## Client Applicability

- All clients: No default change.
- Specific clients: Meridian Health uses the contract-backed Home / Knowledge surface when the approved pack is present and valid.
- Internal only: Audit reports and proof files.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-knowledge-design-contract.ts`
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `src/app/(maestro)/home/page.tsx`
- `scripts/audit/home-knowledge-design-contract-ui.mjs`
- `scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs`
- `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json`
- `datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json`
- `reports/home-knowledge-design-contract-ui-wiring/*`
- `package.json` audit command wiring

## QA / Validation

- `HOME_KNOWLEDGE_REUSE_RESPONSE=1 node scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs` — pass.
- `npm run audit:home-knowledge-design-contract-ui` — pass.
- `npm run audit:home-dimension-data-tab` — pass.
- `npm run audit:home-dimension-evidence-tab` — pass.
- `npm run audit:home-dimension-story-claims` — pass.
- `npm run audit:approved-content-path-convergence` — pass.
- `npm run audit:tenant-v3-data -- --tenant meridian-health` — pass.
- `npm run audit:enterprise-naming` — pass.
- `npx eslint src/app/'(maestro)'/home/page.tsx src/components/home/HomeKnowledgeDesignContractSurface.tsx src/lib/home/home-knowledge-design-contract.ts scripts/audit/home-knowledge-design-contract-ui.mjs scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.

Full repository TypeScript check currently fails in an unrelated Moves upload route test file outside this release scope: `src/app/api/v1/programs/[programId]/artifacts/upload/__tests__/route.test.ts`.

## Rollout Plan

Merge through the normal PR path. A future ACA main deploy can carry the change to lab/production. After deploy, run signed-in Meridian browser proof for `/home`, including Overview, Evidence Gaps, Use Cases, Proof, and a sample set of dimension tabs.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable until ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming browser-visible or live-proven.

## Rollback Plan

Revert the UI wiring commit or remove the approved design-contract pack to fall back to the existing Home surface for Meridian. No database rollback is required because this release does not write tenant data or promote candidate data.

## Audit Evidence

- `reports/home-knowledge-design-contract-ui-wiring/summary.md`
- `reports/home-knowledge-design-contract-ui-wiring/proof.html`
- `reports/home-knowledge-design-contract-ui-wiring/rendered-component-map.csv`
- `reports/home-knowledge-design-contract-ui-wiring/data-tab-proof.csv`
- `reports/home-knowledge-design-contract-ui-wiring/evidence-tab-proof.csv`
- `reports/home-knowledge-design-contract-ui-wiring/relationship-tab-proof.csv`
- `reports/home-knowledge-design-contract-ui-wiring/gaps-tab-proof.csv`
- `reports/home-knowledge-design-contract-ui-wiring/blocked-content-audit.csv`
- `reports/home-knowledge-design-contract-ui-wiring/generation-method-audit.csv`

## Known Gaps

- Not deployed.
- Not signed-in browser-proven.
- Local browser proof is blocked by Clerk auth/session state on this machine.
- Full repo TypeScript has unrelated existing test-file errors in the Moves artifact upload test.
