# 2026-09-21-t451-source-program-suite-ownership - Own eight Source and Programs suites

## Release ID

`2026-09-21-t451-source-program-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request continuous integration now runs eight existing test suites that previously had no
workflow owner. Two stale setup-route test harnesses were returning at the authentication gate;
they now supply a mocked tenant session and mock the persistence boundary, while adding explicit
unauthenticated and opposite-tenant refusal cases. No application route or data implementation
changed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: no product implementation changes. Existing Programs and Source behavior gains
  pull-request regression coverage.
- Test and release tooling: one unit-workflow step, one ownership behavior test, two route-test
  harness repairs, and the generated coverage census change.
- Layers 1-3: no intake, adapter output, canonical object, schema, migration, tenant data, or
  persisted state changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: pull-request CI and release evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add the four named test directories, containing exactly eight suites, to the pull-request unit
  workflow.
- Add an ownership behavior test that resolves the workflow through the repository census and
  holds the exact eight-file scope.
- Repair the setup GET and POST harnesses for the route's current tenancy gate.
- Fully mock setup read and write persistence functions. The POST suite cannot reach a live data
  target, and refusal cases assert the write mock remains untouched.
- Refresh `docs/architecture/test-ci-coverage-census.json`.

No production source, dependency, migration, database, or deployment configuration changed.

## QA / Validation

The exact eight-suite baseline was measured before workflow wiring:

| suite | loaded | collected | run | green | tests | non-test importers of module under test |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `attachments-download.smoke.test.ts` | yes | yes | yes | yes | 5 | route entry point: 0 |
| `attachments-upload.smoke.test.ts` | yes | yes | yes | yes | 13 | route entry point: 0 |
| setup `route.test.ts` | yes | yes | yes | no | 3 | route entry point: 0 |
| setup `route-post.test.ts` | yes | yes | yes | no | 2 | route entry point: 0 |
| contract-depth `adapter.test.ts` | yes | yes | yes | yes | 2 | `adapter.ts`: 2 |
| contract-depth `projection.test.ts` | yes | yes | yes | yes | 2 | `projection.ts`: 2 |
| `file-cabinet.test.ts` | yes | yes | yes | yes | 5 | `blob-store.ts`: 5; `service.ts`: 2 |
| file-cabinet `repository.test.ts` | yes | yes | yes | yes | 8 | `repository.ts`: 11 |

Before: 8 loaded / 8 collected / 8 run / 6 green; 35 of 40 tests passed. The two setup
suites were individually red because their requests did not provide the route's current tenancy
context. They were not wired while red.

After the harness repair: 8 loaded / 8 collected / 8 run / 8 green; 44 of 44 tests passed. There
are no remaining T-451 quarantines. The three zero-importer modules are Next.js route entry points
owned by the framework, not orphaned library modules.

The attachment suites prove both sides of each transfer: download covers successful byte streaming,
unauthenticated refusal, and tenant/program ownership refusal; upload covers successful mocked
storage and metadata work, unauthenticated refusal, tenant/program refusal, and upload-permission
refusal. Object storage and metadata/evidence writes are mocked.

The setup POST suite imports the route only after the tenancy and persistence mocks are registered.
Successful parsing calls only the mocked persistence function; unauthenticated, opposite-tenant,
and invalid financial-column cases assert that mock was not called. No database connection,
transport, external send, or live data target is available to the suite.

The two File Cabinet suites do not overlap the prior rendered-identifier work. They assert blob
path construction, versioning, mocked durable upload, row serialization/mapping, tenant filters,
and supersession. They do not render a component or assert how an internal identifier is displayed.

Red-first ownership proof: before the workflow edit, the new behavior test passed its exact-file and
census-resolution checks but failed once for each of the four directories because none had a
workflow owner.

Practical mutation proof: 4 of 4 guards were caught. Removing the download tenant-key comparison
failed the opposite-tenant download case; bypassing upload permission failed the access-refusal
case; bypassing the setup GET and POST tenant comparisons failed both opposite-tenant cases and
showed the mocked read/write boundaries were reached. Runtime files were restored after each run.

Census before, at branch point `01bc446db05564db0ccd0e87884efbeaffed41e1`: 2,344 test files,
1,744 covered, 1,741 pull-request covered, 600 uncovered, 240 fully covered directories, 26 partial,
and 212 uncovered directories. The four T-451 directories were 0 of 2 covered each.

Census after: 2,345 test files, 1,753 covered, 1,750 pull-request covered, 592 uncovered, 244 fully
covered directories, 26 partial, and 208 uncovered directories. The added behavior test accounts
for the new test file; the eight existing suites account for the other eight newly covered files.

Local validation results:

- Focused Jest: 8 suites / 44 tests passed.
- Full behavior Jest: 86 suites / 750 tests passed.
- TypeScript: Node 24 with `NODE_OPTIONS=--max-old-space-size=6144`; zero diagnostics.
- ESLint: all three changed TypeScript test files passed with no findings.
- Coverage census check: passed; the committed census matches both count and coverage shape.
- CI-visibility check: 6 of 6 checker tests passed; no changed integration suite is unowned.
- Release control: passed, including release-record and deployment-authority gates.
- Public-disclosure guards: 11 of 11 tenant-narrative guard tests passed and the derived term list
  matches the committed registry-derived list.
- `git diff --check`: passed.

Pull-request CI evidence remains pending until the candidate is pushed.

## Rollout Plan

Merge through the protected pull-request path after review and passing checks. The workflow begins
enforcing the eight suites on subsequent pull requests. No runtime rollout, feature flag, migration,
manual job, data load, or traffic change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a repository merge may still trigger the standard main
  workflow.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this CI-only candidate.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. No product behavior changed, and no signed-in proof is claimed.

## Rollback Plan

Revert the pull request. This restores the prior workflow, test harnesses, behavior test set, and
coverage census. No data, schema, migration, runtime, or client-state rollback is required.

## Audit Evidence

- The pull request and its check run.
- The red-first ownership-test output.
- Focused before/after Jest JSON results for the exact eight suites.
- Four killed guard mutations and the restored runtime diff.
- The generated census and its check mode.
- Local TypeScript, ESLint, behavior, release-control, CI-visibility, diff, and public-content scan
  results.

## Known Gaps

- This is local and pull-request test evidence only. It is not deployed or signed-in product proof.
- The suites do not establish runtime availability of any external data plane or object store.
