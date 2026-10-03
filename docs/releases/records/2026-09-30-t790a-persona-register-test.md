# 2026-09-30-t790a-persona-register-test — Update a stale persona-count case to the current register

## Release ID

`2026-09-30-t790a-persona-register-test`

## Status

`candidate`

## Plain-English Summary

One test case in `src/lib/lakeshore/__tests__/corpus-activation.test.ts`,
"has matching canonical CXO persona records for Clerk provisioning", expected
exactly two personas for one synthetic fixture tenant in the persona
register. The register holds three: the CIO and CFO logins, plus a tenant-admin
persona added deliberately with the persona
pinning in #3125, after the case was written. The test was stale, not the code.

The case now expects the three-persona register and records why. It keeps the
tenant-key and email-domain assertions over all three, and adds two that the
old count did not make:

- exactly one of the tenant's personas carries a role override, it is
  the tenant-admin persona, and the override is `admin`;
- the tenant's personas without a role override are exactly the activation plan's CXO
  logins, so the admin persona can never be counted as a CXO login and a CXO
  login can never drop out of the register unnoticed.

This is half (a) of backlog item T-790. Half (b) — the load-rehearsal suite in
the same directory, which dry-runs a frozen synthetic fixture that predates the
template's required fields — is data-plane work and is not touched. The
directory stays unwired until both halves are green.

## Layer Impact

**Release lane: `global-control-lane`.** Test-only change.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection, persona or canonical object is touched.
- **Platform tooling / CI:** one test case updated. No workflow step, census or
  baseline changes: the directory is still held by T-788's control because its
  second suite is still red.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test code only, over a synthetic fixture tenant.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/lakeshore/__tests__/corpus-activation.test.ts`: the one stale case
  updated, with the reason recorded in a comment beside it.

## QA / Validation

**Before / after, same scope** (`npx jest --runTestsByPath <the changed file>`): on base `827c18f63f`,
1 failing / 4 passing; on the branch, 0 failing / 5 passing.

**Mutations of the subject** (`src/lib/auth/cxo-personas.ts`), each applied,
confirmed as a real diff, run against the case, and restored:

| Mutation | Result |
|---|---|
| M1: the admin persona's `authRole` removed | fails |
| M2: the admin persona's `tenantKey` changed to another tenant | fails |
| M3: the admin persona's email moved off the tenant domain | fails |
| M4: the CIO persona given `authRole: 'admin'` | fails |
| M5: the CFO persona's email changed so it no longer matches the plan | fails |
| M6: the admin persona's role changed to `maestro` | fails |

6 of 6 caught.

**T-788's hold control** (`src/__tests__/behaviors/t788-stale-suite-wiring.test.ts`):
9 of 9 pass on the branch. The directory's hold is still carried by the
load-rehearsal row, which is genuinely red.

`tsc --noEmit` exited 0, judged by exit code. ESLint on the changed file: 0.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. The case returns to its stale two-persona expectation.
Nothing runs it in CI, so nothing in a running environment changes.

## Audit Evidence

- The before/after run counts and the mutation table above.

## Known Gaps

- T-790 half (b), the load-rehearsal fixture, is lane-D work and still red.
- T-788's control asks the live code each red row's question, but not the test:
  its persona-count row still reads as a valid red hold after this
  change, because the probe compares the code's answer (3) with the count the
  record says the test expects (2), and the test no longer expects 2. The
  directory's hold remains correct because its sibling row is genuinely red;
  the gap is filed separately rather than fixed in this change.
