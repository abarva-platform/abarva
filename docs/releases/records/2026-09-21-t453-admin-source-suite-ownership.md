# 2026-09-21-t453-admin-source-suite-ownership — Own four admin and Source control suites in CI

## Release ID

`2026-09-21-t453-admin-source-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Four existing automated test files passed when invoked directly but were absent from every
continuous-integration workflow. This release runs those exact files on every pull request and
adds an ownership guard that fails if any of them becomes dark or only partially covered.

The two action suites are safe for unattended CI execution: connector persistence is replaced at
the broker boundary, and invitation delivery plus audit persistence are replaced at their transport
and data boundaries. The authorization suite exercises refusal when financial access is absent.
No runtime application code changes in this release.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 (Products):** no product behavior changes. Existing route and action controls gain CI
  ownership only.
- **Test, validator, and release tooling lane:** one pull-request workflow step, one executable
  ownership guard, and the generated CI-coverage census change.

No client intake, source adapter, canonical model, tenant data, migration, or data-plane job is
read, written, or changed.

## Client Applicability

- All clients: no behavioral change.
- Specific clients: none.
- Internal only: yes, repository CI ownership and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` runs the four measured files by exact path.
- `src/__tests__/behaviors/admin-source-action-route-suite-ci-coverage.test.ts` proves the exact
  workflow ownership and census result.
- `docs/architecture/test-ci-coverage-census.json` is regenerated from the changed workflow.
- This release record documents scope, safety, validation, rollout, and rollback.

No runtime module, dependency, migration, fixture, or tenant-scoped dataset changes.

## QA / Validation

Before wiring at `01bc446db05564db0ccd0e87884efbeaffed41e1`, the four named files measured
`4 loaded / 4 collected / 4 run / 4 green`, with 21 passing tests. They had no workflow owner.
After wiring, the same four files measured `4 loaded / 4 collected / 4 run / 4 green`, with
21 passing tests under the exact command now stored in the pull-request workflow. Quarantines: 0.

Safety classification:

- The connector action suite mocks `createPendingConnector`, the broker function that owns the
  data-plane write. Its refusal cases also prove the broker is not called for unauthenticated or
  unauthorized callers.
- The invitation action suite mocks Clerk authentication, user lookup, and invitation creation,
  and separately mocks the audit writer. Its success case reaches only those mocks; no invitation,
  network call, or database write can occur.
- The financial-access route suite sets `canViewFinancialData` false and asserts that contract,
  opportunity, and evidence readers are not called and no financial payload is serialized.
- The Source New event route suite asserts tenant-context and missing-event refusal before file or
  phase reads. The workspace component is mocked to render nothing, so this suite does not assert
  phase completeness, Story-purpose presentation, or rendered identifier handling. It therefore
  does not duplicate the T-444, T-445, or T-449 behavior guards.

Non-test importer counts for the modules under test: connector action 1; invitation action 1;
Source New event page 0 ordinary importers (framework route entry); Source Optimize page 0 ordinary
importers (framework route entry).

The ownership guard was added before workflow wiring and failed both cases: no exact-path command
was found, and all four directories were in the uncovered census.

Mutation checks: 4 of 4 caught. Bypassing connector administration failed the non-admin refusal;
bypassing invitation administration failed the non-admin refusal; forcing financial visibility
failed the no-read financial control; and bypassing the Source New tenant-context comparison failed
the no-downstream-read control. Runtime sources were restored after each isolated mutation.

Census before and after on the rebased branch: total test files 2,345 -> 2,346; workflow-covered
1,753 -> 1,758; pull-request-covered 1,750 -> 1,755; uncovered 592 -> 588; fully covered
directories 244 -> 248; uncovered directories 208 -> 204; high-band uncovered directories
40 -> 36. The added ownership
test accounts for the extra total and covered file; the four named suites account for the four-file
drop in uncovered coverage.

The rebase retains the previously merged Source and Programs ownership step alongside this release's
four-file exact-path step. The census above is regenerated from the combined workflow.

Validation completed on Node 24:

- Focused suites plus the ownership guard: 5 suites / 23 tests passed.
- Full behavior suite: 87 suites / 752 tests passed after rebasing onto current `origin/main`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: passed.
- ESLint on the changed TypeScript file: passed with no findings.
- `npm run audit:test-ci-coverage:check`: passed; census drift and shape match.
- `npm run release:check`: passed.
- Release-record tenant narrative guard: 11 of 11 checks passed.
- Public-content scan over added tracked lines and untracked files: 0 registry-tenant narrative
  matches.
- `git diff --check`: passed.

## Rollout Plan

Merge through a pull request to `main`. The exact-path workflow step becomes active for pull
requests after merge. No feature flag, environment variable, migration, manual job, or data-plane
operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to `main`.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge; this release does not select an image.
- ACA runtime invariant: not claimed or changed by this branch.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. Runtime code is unchanged, and no signed-in proof is claimed.

## Rollback Plan

Revert the merge commit. This removes the workflow ownership step, ownership guard, census update,
and release record. There is no persisted state, migration, external message, or client data to
repair.

## Audit Evidence

- Pull request and its checks.
- Red-first output from the ownership guard before workflow wiring.
- Focused Jest output for the four owned suites and the ownership guard.
- Mutation runs against the refusal and boundary guards.
- Generated coverage census plus its drift/shape check.
- TypeScript, changed-file ESLint, behavior suite, release control, and public-content checks.

## Known Gaps

- The Source New route suite does not cover phase completeness or rendered identifiers. Those
  concerns remain owned by their dedicated behavior suites; this release does not duplicate them.
- This is local and pull-request evidence only. It includes no merge, deployment, runtime, or
  signed-in product proof.
