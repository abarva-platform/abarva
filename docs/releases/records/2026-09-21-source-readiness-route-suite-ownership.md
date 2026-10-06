# 2026-09-21-source-readiness-route-suite-ownership - Source readiness and route suite ownership

## Release ID

`2026-09-21-source-readiness-route-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now owns five previously unrun Source readiness and route suites. Two files remain explicit quarantines: one only scans source text and the other is red while providing no tenant-membership or opposite-tenant refusal proof.

## Layer Impact

- `global-control-lane`: test ownership, coverage census, and release evidence only.
- Layer 4 Products: no product implementation changed; existing Source behavior receives additional pull-request regression coverage.
- No client intake, source adapter, canonical model, schema, migration, data, authentication, or runtime behavior changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: pull-request CI and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add five measured-green Source suites to the pull-request unit workflow.
- Add a behavior contract that holds the exact workflow set and census split.
- Preserve two exact file-level quarantines rather than wiring a broad directory.
- Refresh the generated test-to-CI coverage census.

## QA / Validation

The seven-file baseline is recorded separately at each execution state:

| suite | loaded | collected | run | green | tests | non-test importer audit |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `ams-section-map.test.ts` | yes | yes | yes | yes | 9 | `ams-section-map.ts`: 2 |
| `intake.test.ts` | yes | yes | yes | yes | 8 | `intake-template-registry.ts`: 3; `nexus-intake-queue.ts`: 2; `intake-capture.ts`: 1; `ams-section-map.ts`: 2 |
| `resolver.test.ts` in `rfp-readiness` | yes | yes | yes | yes | 11 | `resolver.ts`: 3 |
| `section-trace.test.ts` | yes | yes | yes | yes | 9 | `section-trace.ts`: 2; `resolver.ts`: 3; `ams-section-map.ts`: 2 |
| `new-route-optimization-redirect.test.ts` | yes | yes | yes | yes | 6 | `new/page.tsx`: 0 direct importers; live Next.js route entry point |
| `not-found-source.test.ts` | yes | yes | yes | yes | 2 | `not-found.tsx`: 0 direct importers; live Next.js route entry point; suite source-scans instead of rendering |
| `tenant-resolution-source-contract.test.ts` | yes | yes | yes | no | 6 | scanned route files: 0, 0, 0, 0, 3, and 3 direct importers; `resolveTenant.ts`: 10 |

Totals: 7 loaded, 7 collected, 7 run, 6 green; 50 of 51 tests passed before ownership wiring. The five owned files account for 43 passing tests.

The tenant-named suite has a specific negative result:

- The Source intake route calls `resolveTenant`, whose production resolver maps through the six-profile `CANONICAL_TENANT_KEYS` exported by `src/lib/tenant/aliases.ts`.
- A separate two-entry `CANONICAL_TENANT_KEYS` exists in `src/config/tenants/CANONICAL_TENANTS.ts`.
- The suite imports neither list and mirrors neither list. It only scans source strings that show the route calls the resolver.
- It does not execute `resolveTenant`, compare either canonical list, or prove refusal for an opposite tenant. Five source-shape assertions pass and one stale loading-copy assertion fails, so it is not tenant-isolation evidence.

The two files with the same basename are distinct: this release measures `src/lib/source/rfp-readiness/__tests__/resolver.test.ts`; it does not classify or wire `src/lib/programs/archetypes/__tests__/resolver.test.ts`.

The pre-change execution census moved since the backlog snapshot: 2,342 total, 1,730 covered, 1,727 pull-request covered, 612 uncovered, 218 uncovered directories, and 7 critical directories. The earlier snapshot recorded 1,723 covered, 1,720 pull-request covered, 619 uncovered, and 220 uncovered directories.

After wiring and adding the ownership behavior test, the refreshed census records 2,343 total, 1,736 covered, 1,733 pull-request covered, 607 uncovered, 239 directories with unrun files, 216 uncovered directories, 7 critical directories, and 44 high-risk directories.

## Rollout Plan

Merge through the protected pull-request path. The unit workflow begins enforcing the five suites on subsequent pull requests. No application or data-plane rollout is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a repository merge may still trigger the standard workflow.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this CI-only candidate.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product behavior change or signed-in claim is included.

## Rollback Plan

Revert the workflow step, ownership behavior test, census refresh, and this release record. No schema, migration, data, or runtime rollback is required.

## Audit Evidence

- Red-first ownership test failed because the workflow command was absent and the readiness directory was uncovered.
- Mutation proof removed `section-trace.test.ts` from the workflow command; the ownership test failed on both the missing literal and the resulting 3-of-4 partial census row.
- The focused seven-file Jest result records one failed suite and six passed suites before wiring.
- The workflow command names five files; neither quarantine is hidden behind a directory exclusion.
- The generated census records the four-file readiness directory as covered and the route directory as one of three files covered.

## Known Gaps

- `not-found-source.test.ts` remains unwired until it exercises rendered behavior instead of matching source text.
- `tenant-resolution-source-contract.test.ts` remains unwired until it is green, derives expectations from the chosen canonical tenant authority, and proves opposite-tenant refusal.
- The production repository still contains two different exports named `CANONICAL_TENANT_KEYS`; this CI-only release records the split but does not change tenant resolution.
- `intake-capture.ts` has one direct non-test importer through the readiness barrel, but that barrel is not reached from a product or operator entry point. The mixed suite remains useful because its other readiness subjects are used by the operator report; production adoption of intake capture is out of scope.
