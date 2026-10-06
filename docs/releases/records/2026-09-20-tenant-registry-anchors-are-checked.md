# 2026-09-20-tenant-registry-anchors-are-checked — Tenant onboarding checks its registry anchors before it writes

## Release ID

`2026-09-20-tenant-registry-anchors-are-checked`

## Status

`candidate`

## Plain-English Summary

Onboarding a new pilot tenant is done by a script that edits four TypeScript
registry files by searching them for literal strings and inserting text just
before whatever it finds. Those search strings were spelled out separately at
each place they were used. Nothing connected a search string to the
declaration it was supposed to find, so an ordinary type-level edit to a
registry could break the script, and nothing would say so until somebody ran
it. That has already happened once: an earlier release record notes the script
failing because a registry constant had been renamed.

This change gives the script one table of anchors that both the editing code
and a new pre-flight check read, so the two cannot drift apart. Before the
script writes anything, it now resolves every anchor in every registry and
refuses the whole run if any of them no longer matches, naming the file and the
literal that failed. A test resolves the same anchors against this
repository's own registry files, so an edit that moves one turns the suite red
instead of waiting for the next onboarding.

Two further defects were found while writing the tests and are fixed here.
Neither had produced a wrong result yet.

- The script wrote each registry as it went, so a broken anchor on the third
  registry threw only after the first two were already on disk — leaving a
  tenant present in one registry and absent from three, which is the exact
  half-configured state the script was written to prevent.
- An anchor resolved to the first place its name appeared in the file, and its
  closing marker to the first match anywhere after that. Either could land
  outside the declaration meant — on a mention of the name in a comment or an
  object literal above it, or on the closing marker of the _next_ declaration
  when this one had drifted. In both cases the text was inserted in the wrong
  place and the run reported success. Anchors now resolve to a declaration,
  and a closing marker must fall inside that declaration.

## Layer Impact

Release lane: `internal-admin`. `add-tenant.ts` is an AbarVa-only operator
script run by hand during tenant onboarding; it is not reachable from any
product route and is imported only by its own test.

Operator tooling only. No product layer changes.

- Layer 1 (client intake): unchanged.
- Layer 2 (source adapters): unchanged.
- Layer 3 (canonical model): unchanged. The registry files this script edits
  are not modified by this change; only the code that edits them is.
- Layer 4 (products): unchanged. No route, surface, query or rendered value
  moves.

## Client Applicability

- All clients: no behavior change. No tenant data, registry content, or
  rendered surface is touched.
- Specific clients: none.
- Internal only: yes — `src/scripts/tenants/add-tenant.ts` is an operator
  script run by hand during tenant onboarding.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/scripts/tenants/add-tenant.ts`
  - Adds `REGISTRY_RELATIVE_PATHS`, `RegistryName`, and `REGISTRY_ANCHORS` —
    one declaration of every anchor, read by both the patch functions and the
    check. `resolveRegistryPaths` is derived from the same path map.
  - Adds `resolveAnchor`, which finds the declaration of a binding (line
    anchored, `const`/`export const`) and then its closing literal, requiring
    that literal to fall before the next top-level declaration. Errors name the
    registry file, the binding and the literal.
  - Adds `verifyRegistryAnchors` (reports every failure) and
    `assertRegistryAnchors` (throws listing all of them).
  - `executeAddTenant` asserts all anchors before reading or writing any
    registry, so a drifted anchor leaves every file untouched.
  - The five insertion helpers take a registry name and navigate by
    `resolveAnchor` instead of by inline literals.
- `src/__tests__/behaviors/tenant-onboarding.test.ts` — seven cases added,
  covering the all-or-nothing write, the error naming its file, declaration
  anchoring, per-declaration close resolution, the anchors resolving against
  the repository's real registry files, and every registry having an anchor.

## QA / Validation

Measured on `origin/main` at `cf4a14448313989f5f339026e9e161d4f3ea2604`, same
scope (`npx jest --runTestsByPath src/__tests__/behaviors/tenant-onboarding.test.ts`).

- Clean baseline before any edit: **28 passed, 0 failed.**
- With the new cases added and no fix: **3 failed, 28 passed.** Each failed for
  its own reason, not a shared import error — a half-written registry
  (`client-config.ts` differed after the run threw), an error message reading
  `ALL_CLIENTS close marker not found` with no file in it, and an entry
  inserted at offset 7580 when the declaration it belonged to began at 7607.
- After the fix: **35 passed, 0 failed.**
- Whole suite: `npm run test:behaviors` — **63 suites, 641 tests, 0 failed.**
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit code **0**, no diagnostics.
- `npx eslint` on both changed files — exit code 0. `npx prettier --check` —
  clean.

Mutation pass — the fix was broken six ways and the suite caught all six; no
survivors:

| #   | mutation                                                             | result                                                                               |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| M1  | remove `assertRegistryAnchors` from `executeAddTenant`               | 2 failed                                                                             |
| M2  | drop the `closeIdx >= regionEnd` bound                               | 2 failed                                                                             |
| M3  | resolve the declaration by first textual mention                     | 1 failed                                                                             |
| M4  | make `verifyRegistryAnchors` always return no failures               | 3 failed                                                                             |
| M5  | change one anchor in the table so it no longer matches the real file | 8 failed, including "every declared anchor resolves against the real registry files" |
| M6  | drop the file name from the error message                            | 3 failed                                                                             |

M4 and M5 are the pair that keeps the repository-level case honest. On its own
that case asserts an empty list, which a stubbed checker would also satisfy —
M4 shows the negative control fails when the checker is stubbed, and M5 shows
the case itself fails when the table and the real files disagree.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys as
usual. No runtime behavior depends on this file — it is an operator script that
is not imported by any product code path (the only importer is its own test) —
so there is nothing to verify on the deployed surface beyond the deploy
succeeding.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No deploy is initiated by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic,
  revision, env var, flag, scale or secret change.
- Approved image digest: whatever the main deploy workflow builds from the
  merge SHA; this change does not pin or override an image.
- ACA runtime invariant: to be verified after merge — Container App template
  image, 100%-traffic revision image and worker job images equal.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. Nothing rendered to a signed-in user
  changes, and the script is not reachable from any route.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write and no
runtime state, so the revert is complete on merge. The registry files are not
modified by this change, so a revert cannot leave them inconsistent.

## Audit Evidence

- The PR, its CI run, and the merge SHA.
- The before/after and mutation numbers in QA / Validation above, all from
  `npx jest --runTestsByPath src/__tests__/behaviors/tenant-onboarding.test.ts`
  over the same scope.
- `src/__tests__/behaviors/tenant-onboarding.test.ts`, describe block
  "add-tenant — anchors against this repository's registries" — the case that
  goes red when a registry declaration moves.

## Known Gaps

- The larger question the item raised is not answered here and remains an
  owner's call: whether editing TypeScript source by string surgery is still
  the right mechanism now that four registries depend on it. A generated
  registry, or a codemod over a parsed AST, would remove the anchor problem
  rather than check it. This change takes the stated minimum — make the anchors
  declared, checked before any write, and covered against the real files — and
  leaves the mechanism decision open.
- The check runs when the script runs and when its suite runs. It is not a
  standalone CI gate; the behavior suite is where a drifted registry surfaces.
- `resolveAnchor` recognises a top-level declaration by line-anchored regular
  expression, not by parsing. It is a text reader over text the patcher already
  reads as text, and it inherits that limit.
