# 2026-09-06-nexus-manual-corpus-promotion - Nexus Manual Corpus Promotion Path

## Release ID

`2026-09-06-nexus-manual-corpus-promotion`

## Status

`candidate`

## Plain-English Summary

This release turns the generated Nexus manual into governed product-documentation corpus candidates and adds a fail-closed Ask retriever for those candidates. The manual remains generated from executable product contracts, and the new corpus path will not feed aVa until each record has earned indexing and cite-render proof under the context/corpus policy. It also makes the active Tower workspace identity visible in the Tower command-center chrome and repairs a stale ECL predeploy assertion.

## Layer Impact

Layer 4 products, `global-control-lane`: Intelligence Ask gains a product-document retriever, but it returns no sources until governed readiness is complete.

Context/corpus governance, `global-control-lane`: `product_docs` becomes a dedicated source layer, with the same shared-corpus sensitivity block as industry corpus. A dataset manifest declares the manual corpus before any load or promotion.

Documentation, `global-control-lane`: the Nexus manual generator now writes both the Markdown manual and governed JSONL corpus candidates, and the freshness check covers both outputs.

Tower UI, `global-control-lane`: the command-center shell renders a stable active-workspace identity strip above the tablist.

Product proof, `global-control-lane`: the ECL predeploy gate now checks the current Source DB workspace read contract and the restored Source serving-surface marker.

## Client Applicability

- All clients: governed product-document retrieval path is available after deploy, but no manual sources are agent-visible without future readiness promotion.
- Specific clients: none.
- Internal only: dataset manifest and generated corpus candidate records.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/docs/build-nexus-manual.ts` emits `docs/product/generated/nexus-product-manual-corpus.jsonl` and checks it in `--check` mode.
- `docs/governance/dataset-manifests/nexus-product-manual-v1.json` declares the manual corpus candidate.
- `src/lib/governance/context-corpus-policy.ts` adds the `product_docs` source layer and blocks sensitive shared product docs.
- `src/lib/intelligence/ask/retrievers/nexus-product-manual.ts` adds the fail-closed product manual retriever.
- `src/lib/intelligence/ask/index.ts` calls the retriever and places any future product-doc sources after tenant/current evidence.
- `src/components/tower/command-center/TowerCommandCenter.tsx` renders the active Tower workspace identity in the shell chrome.
- `src/components/tower/command-center/TowerCommandCenter.module.css` styles the identity strip.
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx` restores the Source ECL serving-surface marker for the DB provider.
- `src/app/(maestro)/source/preview/workspace/workspace.css` keeps the restored marker outside the scrollable workspace body.
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs` replaces a stale Source event-view assertion with the current DB workspace read contract.

## QA / Validation

- PASS: `npm run docs:nexus-manual`
- PASS: `npm run docs:nexus-manual:check`
- PASS: `npm run validate:context-corpus:manifests`
- PASS: `npx jest src/lib/governance/__tests__/context-corpus-policy.test.ts src/lib/governance/__tests__/agent-context-bundle.test.ts src/lib/intelligence/ask/retrievers/nexus-product-manual.test.ts --runInBand`
- PASS: `npx eslint scripts/docs/build-nexus-manual.ts src/lib/governance/context-corpus-policy.ts src/lib/governance/__tests__/context-corpus-policy.test.ts src/lib/governance/__tests__/agent-context-bundle.test.ts src/lib/intelligence/ask/types.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retrievers/nexus-product-manual.ts src/lib/intelligence/ask/retrievers/nexus-product-manual.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: mutation check by weakening the product-doc retriever from `requireAgentReady: true` to `false` and confirming the retriever test fails by leaking an unindexed manual chunk.
- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- PASS: `npm run ecl:product-browser:predeploy-gate`
- PASS: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/lib/ecl/__tests__/product-provider.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' --runInBand`
- PASS: `npx eslint scripts/ecl/run_product_ecl_predeploy_gate.mjs src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`

## Rollout Plan

Merge through PR review. The repository-owned Azure Container Apps main deploy workflow can deploy the change after merge. No data-plane write, index load, feature-flag change, traffic mutation, or worker job mutation is included in this release.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime deployment.
- Shared runtime mutators: none.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming product-doc retrieval is live-visible; not required to merge the fail-closed path.

## Rollback Plan

Revert the release commit. The rollback removes the `product_docs` source layer, the generated manual corpus candidate artifact, the fail-closed retriever, and the Ask call site.

## Audit Evidence

- Local manual freshness check output.
- Local context/corpus manifest validation output.
- Local focused Jest output.
- Local eslint output.
- Local TypeScript output.
- Mutation output showing the fail-closed retriever guard can fail.

## Known Gaps

The generated manual is still not agent-readable in production because the manifest, local policy validation, generated candidates, retriever, and cite-ready runtime path are only the initial portion of promotion. Azure/Postgres indexing, retrieval readback, cite-render proof, and any `agent_ready` promotion remain separate operator-gated work.
