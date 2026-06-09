# 2026-06-09-origination-user-named-people — Origination User-Named Sponsor Handling

## Release ID

`2026-06-09-origination-user-named-people`

## Status

`candidate`

## Plain-English Summary

Strategic Move origination no longer blocks when a tenant admin names a real sponsor who is not yet in the tenant people table. The submit flow now parses compound sponsor labels, resolves the primary sponsor and co-sponsor separately, and creates tenant-scoped placeholder person records only for human-looking user-named people that are missing from the roster.

## Layer Impact

- `global-control-lane`: Shared Strategic Move origination behavior changes for all tenant-pinned clients.
- `client-data-lane`: Adds tenant-scoped placeholder `persons` records only when a user-provided human name cannot be resolved.

## Client Applicability

- All clients: Yes, for Strategic Move origination.
- Specific clients: The reported failure was SkyHarbor Air, but the fix is generic.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/person-label.ts`: new parser for primary and co-sponsor person labels.
- `src/lib/programs/origination-submit.ts`: resolves parsed people separately, creates pending placeholders when needed, persists `co_sponsor_person_id`, and adds co-sponsor participants.
- `src/lib/programs/__tests__/person-label.test.ts`: parser coverage for the reported compound SkyHarbor label and a role-only guard.

## QA / Validation

- `npx jest src/lib/programs/__tests__/person-label.test.ts --runInBand` passed.
- `npx eslint src/lib/programs/person-label.ts src/lib/programs/origination-submit.ts src/lib/programs/__tests__/person-label.test.ts` passed.
- `npx tsc --noEmit --pretty false --incremental false --skipLibCheck` passed.
- `git diff --check` passed.

## Rollout Plan

Merge to `main`, then build and deploy the Azure Container Apps image through the standard ACR-to-ACA path.

## Rollback Plan

Revert the PR. Existing placeholder `persons` rows are marked with `personal_threads = ['origination_placeholder']` and can be reviewed or removed by admin if needed.

## Audit Evidence

- PR URL and CI checks after opening the PR.
- Release record.
- Focused parser test and TypeScript/lint output.

## Known Gaps

Live browser creation of the exact SkyHarbor Move still needs to be rerun after deployment to prove the end-to-end workflow.
