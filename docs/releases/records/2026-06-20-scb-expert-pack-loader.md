# 2026-06-20-scb-expert-pack-loader — SCB ExpertPack Loader

## Release ID

`2026-06-20-scb-expert-pack-loader`

## Status

`candidate`

## Plain-English Summary

Adds the deterministic database read model and loader for Consilium ExpertPacks. Authored expert files remain source-controlled, and the loader admits only packs that pass the ExpertPack quality gate so Ava can later retrieve experts by industry, function, or cross-cutting domain without treating authored files as already live.

## Layer Impact

`global-control-lane`: Adds shared schema, validation, and loader plumbing for all Consilium expert packs.

`client-data-lane`: No client tenant data is migrated or modified. The table stores shared expert/corpus metadata only.

## Client Applicability

- All clients: Shared runtime can use the expert-pack read model after the migration and loader are run.
- Specific clients: None.
- Internal only: Loader is operator-run.
- Public/demo only: No.
- Feature flag: No user-facing surface flips in this release.

## Changes Included

- Migration `supabase/migrations/20260620193000_expert_packs_read_model.sql`
- Validator/serializer `src/lib/intelligence/expert-pack/store.ts`
- Loader `src/scripts/intelligence/load-expert-packs.ts`
- NPM command `npm run intel:expert-packs:load`
- Focused validator test `src/lib/intelligence/expert-pack/store.test.ts`

## QA / Validation

- `npm run intel:expert-packs:load -- --dry-run` — PASS; selected 47, valid 47, invalid 0. Reference pack `xp.healthcare-provider.revenue-cycle` indexed as `industry=healthcare_provider`, `function=revenue-cycle`.
- `npx jest src/lib/intelligence/expert-pack/store.test.ts --runInBand` — PASS; reference pack loads/indexes/passes and a deliberately sub-bar pack is rejected.
- `npx eslint src/lib/intelligence/expert-pack/store.ts src/lib/intelligence/expert-pack/store.test.ts src/scripts/intelligence/load-expert-packs.ts` — PASS.
- `npm run release:check` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.

Live DB proof is explicitly separate and must run inside the private VNet before W2.3 is marked done.

## Rollout Plan

Merge to main, deploy through the repo-owned ACA workflow, apply the migration through the approved migration path, then run the loader inside the private VNet:

```bash
npm run intel:expert-packs:load -- --dry-run
npm run intel:expert-packs:load
```

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime image changes.
- Shared runtime mutators: No manual ACA mutation in this release.
- Approved image digest: Captured by standard ACA deploy evidence after merge.
- ACA runtime invariant: Standard deploy workflow assertion.
- Worker image invariant: Standard deploy workflow assertion.
- Feature/env flag update path: None.
- Live signed-in proof required: No surface flip here; DB/index proof required for W2.3 completion.

## Rollback Plan

Code rollback is a normal revert. The migration is additive; if rollback is required, stop using the loader/read model first. Dropping `public.expert_packs` is safe only after confirming no runtime query depends on it.

## Audit Evidence

PR URL, CI run, migration apply log, loader dry-run output, live loader output, and a read query proving `xp.healthcare-provider.revenue-cycle` is indexed by `industry='healthcare_provider'` and `function_key='revenue-cycle'`.

## Known Gaps

Live VNet migration/load proof is not included in the local candidate and must be captured separately.
