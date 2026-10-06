# 2026-09-21-point-the-synthesis-suites-at-headers-that-exist

## Release ID

`2026-09-21-point-the-synthesis-suites-at-headers-that-exist`

## Status

`candidate`

## Plain-English Summary

Two synthesis route suites asserted a response header **no route has ever
emitted**, so every case carrying that assertion was comparing `null` to a
string. Both suites were also fenced out by tenant rules written after their
fixtures.

| | before | after |
|---|---|---|
| `api/source/synthesis` suite | **0 of 4** | **4 of 4** |
| `api/programs/synthesis` suite | **1 of 4** | **4 of 4** |
| Production change | — | **none** |

**This is not a deleted control.** The routes do attribute their surface — under
different names. `x-abarva-v6-surface` was wrong the day it was written, and
the assertions now point at `X-AbarVa-Source-Layer: source-current` and
`X-AbarVa-Moves-Layer: moves-current`, which the routes actually set.

## Three stale expectations, each with its reason

**Source, case 1 — expected 200, receives 403.** Its tenant key joined
`FOUNDATION_TENANT_KEYS`, and the route refuses legacy V6 synthesis packs for
foundation tenants so Source renders from governed operational state instead.
The 403 is the control working. The case is kept rather than folded into the
existing foundation-tenant case beside it, because the two exercise different
keys in that set, and this is the key the route previously served — it is the
case that would notice if the refusal were relaxed for that key specifically.

What it can no longer assert is the prompt body: the old version checked that
the tenant's own pack, not the default fixture, reached the model, and a
refused request never reaches the model. That proof now lives only in the
remaining 200 case.

**Moves, cases 1 and 2 — expected 200, receive 404.** The V6 packs they read
were retired on purpose. `buildV6ProgramInstanceForTenant` resolves a dataset
root from `TENANT_DATASET_BY_KEY`, which has exactly two entries. Neither
directory is in the repository: both were deleted by `4a7ebcd85` — *"Establish
canonical tenant input standard"* (#4767). So "No V6 Moves program is loaded
for the active tenant" is exactly true.

Each case keeps the half of its original purpose that survives: a tenant with
no pack of its own must still not be served another tenant's fixture instead.

## The fencing is now actually proven

Before this change the header assertion could never catch anything — it
compared `null` to a string on every path, pass or fail. Measured:

| Mutation | Result |
|---|---|
| foundation-tenant fence disabled | **2 cases fail** |
| `X-AbarVa-Source-Layer` value changed | **4 cases fail** |

The first is the point: the tenant fencing these suites exist to prove is
proven by them for the first time.

## Layer Impact

- `global-control-lane`. Two test files. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour. Both
  route files are byte-identical to `origin/main`.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/app/api/source/synthesis/__tests__/route.test.ts`
- `src/app/api/programs/synthesis/__tests__/route.test.ts`

## QA / Validation

| What | Result |
|---|---|
| Source synthesis suite | 0 of 4 → **4 of 4** |
| Programs synthesis suite | 1 of 4 → **4 of 4** |
| Both route files vs `origin/main` | **byte-identical** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. Test-only. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. Seven of eight cases return to red, and the header assertion
returns to one that cannot fail for the right reason.

## Audit Evidence

- The header constants in both routes, against the name the suites asserted.
- `4a7ebcd85` as the commit that removed both dataset roots.
- Both mutation results.

## Known Gaps

- **A dead branch is now visible and is not removed here.** Because both
  dataset roots are gone, `buildV6ProgramInstanceForTenant` cannot return
  non-null for any tenant it knows, so the Moves route's `v6Instance` path is
  unreachable and that route can only serve its one code-resident fixture
  tenant. Whether the branch should be deleted, or the packs restored under the
  canonical standard, is a product decision. **Recorded, not taken.**
- **No case now proves a successful Moves synthesis from a tenant pack**,
  because none is currently possible.
- **The Source suite lost its prompt-body assertion** for that tenant's pack,
  as described above.
