# 2026-09-19-source-integration-quarantine-expiry — Source Integration Quarantine Expiry

## Release ID

`2026-09-19-source-integration-quarantine-expiry`

## Status

`candidate`

## Plain-English Summary

The Source integration quarantine now has an expiry control. Each excluded suite must name its owner,
reason, and stable failure evidence. The checker runs the excluded suites and fails if an exclusion
passes or no longer shows the stated failure evidence. The swept-in sibling ignore list uses the same
shape, so it cannot remain a bare path that nobody re-measures.

## Layer Impact

`global-control-lane`. Layer 4 product test control only. This changes the Source integration CI
control plane and does not change product runtime behavior, canonical data, adapters, schemas,
prompts, routes, or tenant data.

## Client Applicability

- All clients: no runtime client change.
- Specific clients: none.
- Internal only: repository CI and release-control operators.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/check-source-integration-quarantine.mjs` now validates entry shape, owners,
  reasons, expected failure evidence, the primary quarantine, and the swept-in sibling list.
- `scripts/quality/source-integration-quarantine.json` now stores reason-bearing entries and drops
  one suite that already passes.
- `scripts/quality/source-integration-ignore-args.mjs` now reads the structured quarantine entries.

## QA / Validation

- Before fix: `npm run check:source-integration-quarantine` passed while `source-old-surface-archive.test.ts`
  was still excluded even though it passed independently.
- Before fix: the swept-in sibling ignore list was a bare string and the checker did not inspect it.
- After fix: `npm run check:source-integration-quarantine` passes and reports 8 Source-directory
  exclusions plus 1 swept-in sibling exclusion, all re-measured for stated failure evidence.
- After fix: `npx jest src/__tests__/integration/source --no-coverage --ci $(node scripts/quality/source-integration-ignore-args.mjs)`
  passes: 85 suites / 694 tests.
- Mutation checks: invalidate a stated expected failure pattern, convert the swept-in sibling entry
  back to a bare string, or replace a quarantined entry with the passing old-surface suite at the
  same count; the checker fails.

## Rollout Plan

Merge to `main`. No runtime rollout, migration, data-build job, feature flag, or signed-in browser
acceptance is required because this is CI/test-control only.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime effect.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Rollback would restore the weaker quarantine checker and the broader exclusion list;
no data rollback or runtime rollback is required.

## Audit Evidence

- Local checker output after fix: 8 excluded of 93 Source-directory suites; 9 exclusions re-measured;
  1 swept-in sibling path excluded under ceiling 1.
- Local Source integration output after fix: 85 suites / 694 tests passed.
- Release record and diff public-safety scans run before PR.

## Known Gaps

Eight Source-directory suites and one swept-in sibling suite remain excluded by name. They are now
mechanically re-measured, but the underlying test/product questions remain owned by their backlog
items.
