# 2026-09-21-t517b-restore-dropped-synthesis-guards — Re-home four prompt guards a green suite stopped carrying

## Release ID

`2026-09-21-t517b-restore-dropped-synthesis-guards`

## Status

`candidate`

## Plain-English Summary

The previous change on these two test files repointed their header assertions at
headers the routes actually emit, which was correct and is kept in full. In doing
so it retired three cases whose expectations had gone stale, and four prompt
assertions went with them. A comment left behind says one pair of those
assertions now lives only in the neighbouring success case. It did not: they
were dropped and re-homed nowhere, so nothing asserted them at all.

This change makes that comment true and restores what the other two proved. It
deletes nothing that landed and loosens no matcher.

Specifically:

- The two dropped Source assertions — that the prompt carries the data-thin
  instruction, and that one tenant is never served another tenant's fixture id —
  are added to the one case on that route that still returns a success response,
  which is where the existing comment already says they are.
- On the Moves route, both success cases became assertions of a not-found
  response. Those are correct about today's behavior and are kept untouched. But
  they left the route's pack branch asserted-unreachable *and* tested by nothing:
  the packet type it builds, the tenant domain phrase it injects and its
  no-fallback guard all stopped being proved. The pack reader is now mocked — as
  the sibling suite already does — and two cases prove that branch again. The
  mock's default is null, exactly what the real reader returns today, so the
  not-found cases still exercise real current behavior.
- The Source refusal case gains the property a status-code assertion cannot
  carry on its own: the refusal happens *before* the pack is consulted. It also
  asserts the two attribution headers the error response carries beyond the
  layer.

One characterisation is corrected rather than repeated. The merged comment reads
the dataset deletion as a deliberate retirement of the reader. The commit that
removed those files removed 43 of them and left the reader untouched; whether
that was intended for this reader is an inference, and it is now pointed at the
open item that exists to have it decided.

## Layer Impact

- **Layer 4 (Products — Source, Moves):** no behavior change. Both route files
  are byte-identical to `origin/main`; the diff is two test files and this
  record.
- **Layer 3 (Canonical model):** unchanged.
- Release lane: `global-control-lane`.

## Client Applicability

- All clients: no functional change.
- Specific clients: none.
- Internal only: yes — test expectations and this record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/source/synthesis/__tests__/route.test.ts` — two prompt guards
  re-homed to the surviving success case; the refusal case gains an ordering
  assertion and two header assertions.
- `src/app/api/programs/synthesis/__tests__/route.test.ts` — the pack reader
  mocked with a null default; two cases restored for the pack branch, carrying
  the packet-type, domain-phrase and no-fallback guards.
- This record.

No route, library, workflow, migration or dataset file is in the diff.

## QA / Validation

Baseline over the same two-file scope. The starting point is **already green**,
so this change fixes no red; what it restores is coverage, and each restored
assertion is proved live by a mutation rather than asserted to be useful.

| scope | before (`03f9fa8fa`) | after |
|---|---|---|
| the two suites | 0 failed, 8 passed, 8 total | 0 failed, 10 passed, 10 total |

No case was deleted and no matcher loosened; the two added cases are the whole
difference.

**Six deliberate mutations, six caught, zero escapes.** Each was applied to the
route under test, the suite run, and the route restored:

1. Moved the foundation refusal to run *after* the pack is built — status code
   and response body byte-identical — 1 failed / 4, on the ordering assertion.
   This is the mutation a bare status-code expectation survives.
2. Removed the contract header from the Source header object — 1 failed / 4, on
   the refusal case's new header assertion.
3. Changed the data-thin instruction in the Source prompt — 1 failed / 4. This
   is the proof that a re-homed guard is live rather than decorative.
4. Changed the Moves packet type — 2 failed / 6.
5. Removed the airline branch of the domain-phrase lookup — 1 failed / 6.
6. Removed the Moves tenant fence — 1 failed / 6. The fence still fences.

- `npx tsc --noEmit --pretty false` — exit code judged.
- `npx eslint` over both changed files.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow deploys the
resulting SHA as for any merge. No runtime behavior depends on this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: whatever the main deploy workflow produces for the merge
  SHA; this release pins nothing and changes no image reference.
- ACA runtime invariant: to be asserted from the deploy run's own proof artifact
  after merge, as for any merge.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**, and none is claimed or owed. No file
  under `src/` outside two test directories is in the diff.

## Rollback Plan

Revert the squash commit. No migration, no data write, no runtime state.

## Audit Evidence

- The PR and its CI checks.
- The before/after counts and six mutation results above, each reproducible by
  applying the named mutation to the named route file and running the named
  suite with `--runTestsByPath`.

## Known Gaps

- **The underlying defect is still not fixed, and is not fixed here.** The pack
  reader returns null for every tenant, in the deployed image as well as
  locally, so both routes serve a not-found to the affected tenants today. It is
  filed as its own item with a recommendation and is a product decision, not an
  engineering one.
- **Neither suite is run by any workflow.** Both remain unrun by CI; wiring them
  by exact path means editing a workflow file held by another item's claim.
  Their green is local, not CI-proven.
