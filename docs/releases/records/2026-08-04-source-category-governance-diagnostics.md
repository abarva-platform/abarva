# 2026-08-04-source-category-governance-diagnostics — Source category governance and data-layer diagnostics

## Release ID

`2026-08-04-source-category-governance-diagnostics`

## Status

`candidate`

## Plain-English Summary

Source Workspace now distinguishes the active Source V4 semantic snapshot from the legacy Explore projection, shows dataset/provider/count diagnostics in the product, defaults Explore charts to selected-only behavior, and withholds category-based conclusions when category assignments conflict with contract evidence.

## Layer Impact

- **global-control-lane / Canonical model:** adds an append-only governance review ledger for contract category decisions. It preserves source-system categories and records reviewed effective-category overrides.
- **global-control-lane / Products:** updates the Source Workspace UI and aVa surface context so category quality, provider identity, and count reconciliation are visible to operators and advisors.
- **client-data-lane / Source adapters:** no destructive data change. The current validator runs as an app-tier semantic projection until the Source V4/Cube feed exposes the same fields directly.

## Client Applicability

- All clients: Source Workspace behavior and semantic contract pattern.
- Specific clients: none.
- Internal only: migration and diagnostics are intended for lab/operator validation before any primary Source promotion.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-category-quality.ts`
- `src/lib/source/data-model/source-v4-workspace-snapshot.ts`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx`
- `supabase/migrations/20260804173000_source_contract_category_review_semantic.sql`

## QA / Validation

- Pass - `npx eslint` on changed Source workspace and category-quality files.
- Pass - `npx jest --runInBand src/lib/source/data-model/__tests__/contract-category-quality.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts`.
- Pass - `npx jest --runInBand --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`.
- Pass - `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Fail unrelated - broader `npx jest --runInBand src/app/(maestro)/source src/lib/source` surfaced existing Source-suite failures outside this change area.
- Pass - `npm run release:check`.

## Rollout Plan

Merge to main after validation. The migration can be applied in lab as part of the governed data-plane release path. Use lab preview for Source Workspace proof. Do not promote category-based Source conclusions to the primary experience until the active Source V4/Cube feed emits the shared category quality fields.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared web deployment.
- Shared runtime mutators: none in this candidate.
- Approved image digest: not applicable until main deployment workflow builds an image.
- ACA runtime invariant: required before calling a deployment live.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/source/preview/workspace` after any lab deployment.

## Rollback Plan

Revert the application changes to restore the prior Explore behavior. If the migration has been applied in lab and no category review rows have been written, drop `governance.contract_category_review`; if rows exist, export them before rollback because the table is append-only governance evidence.

## Audit Evidence

Inspect the PR diff, validation output, release-check output, and signed-in Source Workspace proof. The product should visibly report Source V4 dataset/provider/as-of/counts and the Explore projection counts.

## Known Gaps

The Source V4/Cube feed still needs to emit `source_category`, `suggested_category`, `effective_category`, `category_quality_state`, `category_quality_reason`, `category_review_status`, `category_reviewed_by_role`, `category_reviewed_at`, and `category_rule_version` directly. Until then, category recommendations remain withheld.
