# 2026-07-23-source-early-mid-artifact-prompts — Source Early/Mid Artifact Prompts

## Release ID

`2026-07-23-source-early-mid-artifact-prompts`

## Status

`deployed — runtime and signed-in proven`

## Plain-English Summary

Source now has dedicated prompt/workflow contracts for the remaining early/mid artifact gaps in item #9: Exclusion Log (`d06`), Scope Risk Pre-mortem (`d08`), RFI Summary (`d10`), and Vendor Shortlist (`d12`). These prompts bind the scope/RFP evidence chain and block unsupported jumps, so Source cannot make up exclusions, workshop decisions, vendor market signals, shortlisted vendors, approvals, disqualifications, or invitation status.

## Layer Impact

- `global-control-lane`: generation registry and lifecycle/standards projection behavior changes for all Source tenants.
- `client-data-lane`: no schema, migration, seed, ingestion, or production data mutation is included.

## Client Applicability

- All clients: receive the prompt registry and lifecycle matrix projection.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: adds d06/d08/d10/d12 prompt templates, field contracts, upstream blocking, and evidence binding.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: adds coverage for availability, upstream blocking, evidence binding, and no invented exclusions/workshop decisions/vendor signals/shortlist approvals.
- `src/lib/source/artifact-lifecycle-matrix.ts`: adds guideline labels for d06/d10/d12; d08 already had a guideline and now becomes prompt-backed.
- `src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`: asserts d06/d08/d10/d12 render as prompt-backed with Claude model/token labels in the standards CSV.
- `docs/backlog/source-product-backlog.md`: records the early/mid d06/d08/d10/d12 slice as
  closed and removes the stale active-item pointer.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — 2 suites, 55 tests.
- Pass: focused ESLint reported in PR #5420.
- Pass: `npm run release:check` reported in PR #5420.
- Pass: hosted PR checks for PR #5420.
- Pass: ACA main deploy run `29978081452` completed successfully for merge
  `0a516cabf76717676cf7dada274e839b2cfdcf49`.
- Pass: independent ACA runtime invariant at `2026-07-23T04:00:34.446Z`:
  active revision `ca-abarva-web-lab-eastus--m0a516cab`, active image digest
  `sha256:cdbbd5ccde58e50abbb277405dc7ec57563fe86339795f5767c54db7df0415a9`,
  traffic 100%, health `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`.
- Pass: signed-in `app.abarva.ai` Apex Retail SRC-004 proof confirmed d06/d08/d10/d12
  prompt-backed Files labels, expected Claude model markers, and standards CSV rows with
  Prompt-backed = `Yes`.

## Rollout Plan

Completed through PR #5420, repo-owned ACA main deploy run `29978081452`, independent ACA
runtime invariant, and signed-in Source Files/CSV proof for Apex SRC-004.

## Deployment Authority

- Repo-owned deploy workflow: required after merge (`aca-main-deploy.yml`).
- Shared runtime mutators: none from this PR.
- Approved image digest:
  `sha256:cdbbd5ccde58e50abbb277405dc7ec57563fe86339795f5767c54db7df0415a9`.
- ACA runtime invariant: passed at `2026-07-23T04:00:34.446Z`.
- Worker image invariant: not applicable to this web-only prompt/lifecycle projection change.
- Feature/env flag update path: none.
- Live signed-in proof required: complete for Source Files matrix / CSV export d06/d08/d10/d12
  prompt-backed labels.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the repo-owned main deploy workflow. No data rollback is required because this release changes prompt configuration, tests, docs, and lifecycle projection only.

## Audit Evidence

- PR: #5420 (`0a516cabf76717676cf7dada274e839b2cfdcf49`).
- Local focused tests: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`.
- ACA deploy proof: run `29978081452`.
- Signed-in live proof: PR #5420 post-merge proof comment; local proof paths recorded there:
  `/private/tmp/source-early-mid-prompts-001p-proof/scope-files-production.png`,
  `/private/tmp/source-early-mid-prompts-001p-proof/rfp-files-production.png`, and
  `/private/tmp/source-early-mid-prompts-001p-proof/artifact-standards-early-mid-rows.csv`.

## Known Gaps

This release does not generate or mutate any production artifacts. It does not address separate artifact-quality, guidebook, analytics/chat, or ingestion/data-layer backlog items.
