# 2026-10-02-home-selection-tenant-fence — Home reads the projection its declaration names

## Release ID

`2026-10-02-home-selection-tenant-fence`

## Status

`candidate`

## Plain-English Summary

Home chooses which assessment a tenant reads from a declaration row, and then reads that assessment's projection rows. Three things about that read change.

The read is bound to the declaration. A declaration already records the projection manifest it was made for, but the reader used only its assessment id and then served every row the tenant held under that assessment, including rows written later under another manifest or another projection version. The reader now takes the manifest from the declaration, checks that it belongs to the same tenant and assessment, is a Home projection, and still carries the two hashes the declaration recorded, and serves only rows carrying that manifest and its version. A declaration that fails any of those checks serves nothing rather than something else. A tenant with no declaration is read exactly as before.

A fallback is loud. Every path on which Home serves something other than the projection it selected now writes one error-level structured log line naming the tenant, the reason, and what was served instead. Some of these paths wrote nothing before and the rest wrote a warning with no reason in it. Which record each path serves is not changed.

The tenant fence is tested. Both tenant predicates on this read could be removed without any test failing. A two-tenant suite against a disposable Postgres now fails when either is removed. A separate test fails if a tenant that the tenant input registry does not declare a synthetic demo tenant is added to the Home preview list, because the Home page has no tenancy check of its own.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: the Home projection reader and its assessment selection. No other product reads through this code.
- Layer 3, Canonical model, and the projection tables: read only. No schema change, no migration, no row written.
- Layers 1 and 2, intake and adapters: not touched.
- CI: one new pull-request workflow that runs the two-tenant suite; no existing workflow is edited.

## Client Applicability

- All clients: the reader change and the fallback signal apply to every tenant Home serves. A tenant with no active declaration reads the same rows as before.
- Specific clients: none named or special-cased in code. A tenant with an active declaration is read as the declared projection.
- Internal only: the structured fallback signal, the two-tenant workflow, and the preview-list test.
- Public/demo only: none. Who may open which tenant's Home is unchanged.
- Feature flag: none.

## Changes Included

- `src/lib/home/preview/home-assessment-selection.ts`: the selection returns the assessment and the manifest, version, hashes and row count the declaration is bound to, or refuses.
- `src/lib/home/preview/home-projection-fault.ts` (new): the reasons, the refusal type, and the one structured signal.
- `src/lib/home/preview/ecl-projection-bundle.ts`: the row read filters on the declared manifest and version; the refusals carry a reason; the fallback reports itself.
- `src/app/(maestro)/home/page.tsx`: a comment at the tenant resolution. No behaviour change.
- `scripts/ecl/__tests__/test_home_selection_tenant_fence.ts` (new) and `.github/workflows/home-selection-tenant-fence.yml` (new): the two-tenant suite and the workflow that runs it. The workflow's trigger list is the set of repository files the suite loads and the migrations it applies; the suite fails when the two disagree.
- `src/lib/home/preview/__tests__/home-projection-fault-signals.test.ts` (new), `home-preview-tenant-demo-tripwire.test.ts` (new), `home-assessment-selection.test.ts`, `ecl-projection-bundle.test.ts`, `serving-view-resilience.test.ts`.

## QA / Validation

- pass: Home preview and Home API Jest suites, 16 suites and 169 tests.
- pass: Home surface ratchet, the command the Surface Ratchet Guard workflow runs: 808 of 836 tests passing across 92 suites before, 826 of 854 across 94 suites after, the same 12 baselined suites failing and no new failure.
- pass: the two-tenant suite against a disposable local Postgres 18. The workflow runs it on Postgres 16.
- pass: 33 single-edit mutation checks, each restored. Removing either tenant predicate, asking the selection for a fixed tenant, falling back to another tenant's assessment, dropping the manifest or the version from the row read, dropping any one condition that binds a declaration to its manifest, removing or mislabelling any signal, and adding a tenant the registry does not declare to the preview list each fail a test.
- pass: a projection written by the projection job's own code into a disposable Postgres, after the workflow's load and serving-view steps, and declared with the values the promotion job stores, read back through the changed reader. The declaration binds to its manifest; the 26 serving views return 3,643 rows by tenant and assessment and the same 3,643 by declared manifest and version, which is the manifest's row count; Home serves the projection and no fault signal is written.
- pass: ESLint on every touched file.
- pass: project type-check, `tsc --noEmit`, exit 0. Its first run failed on one comparison in the new suite, which was corrected.
- pass: `npm run audit:test-ci-coverage:check` and `npm run audit:tenancy-fence-coverage:check`; the two new Jest suites are reached by the Surface Ratchet Guard.
- pass: `npm run release:check`.
- not run: the new workflow and the rest of CI on the pull request.
- not run: anything against the lab database, and signed-in browser proof.

## Rollout Plan

Merge by pull request and deploy the merge commit through the repo-owned ACA main workflow. There is no migration, no data-plane job and no flag.

Before the deploy, an operator confirms read-only that each active declaration is bound to its manifest on tenant, assessment, projection key and both hashes, and that the rows carrying that manifest and version are all of the tenant's rows under the assessment and equal the manifest's row count. Where that holds, the tenant is served the same rows after the deploy as before it. Where it does not, the tenant's Home falls back to the reviewed stored record after the deploy and says why in the log.

After the deploy, confirm in a signed-in browser that a tenant with an active declaration still shows live governed rows, and that no `home_projection_fault` line is logged for it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the successful main deploy.
- ACA runtime invariant: required before any live claim.
- Worker image invariant: required before any live claim; no worker job changes.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes, for a tenant with an active declaration and for one without.

## Rollback Plan

Revert the pull request and deploy the revert through the same workflow. There is no schema or data to roll back, and the new workflow file is removed by the revert.

## Audit Evidence

The pull request and its checks, including the first run of the two-tenant workflow; the mutation table in the pull request; the ACA deploy run and runtime-invariant output; the read-only declaration check made before the deploy; the log query for `home_projection_fault` after it; and the signed-in Home proof.

## Known Gaps

- The declarations table still has no tenant-scoped foreign key. The database accepts a declaration that names another tenant's manifest; the reader now refuses to serve it, but nothing refuses to store it.
- Row-level security is not what fences the reader. The runtime role is not subject to it, so tenant isolation on this read rests on the two predicates this change puts under test.
- Who may see which tenant's Home is unchanged and is an open product-owner decision. The Home page still serves any preview tenant to any signed-in user and defaults an unresolved one to the first; this change adds only the test that stops a non-demo tenant joining that list.
- Which record Home falls back to is unchanged and is an open product-owner decision. This change makes each fallback report itself and adds one refusal, for a declaration that is not bound to its manifest.
- A row added, removed or edited under the declared manifest and version after the declaration is still served. A changed row count is reported and not refused; an edit that keeps the count is not detected, because the declared projection hash is not recomputed at read time.
- Source-reference links and the source-file catalog are still read by tenant and assessment, not by manifest. They can only narrow what a served row may cite.
- A narrative layer written into a declared assessment under a different manifest would not be served.
- The two-tenant suite builds its rows by hand. That a projection written by the projection job and declared by the promotion job is read back whole through this reader was checked locally against a disposable database; no CI check holds it yet.
- The two-tenant suite runs on pull requests that touch its trigger paths, not on every pull request and not on `main`, and neither it nor the Surface Ratchet Guard is a required status check.
