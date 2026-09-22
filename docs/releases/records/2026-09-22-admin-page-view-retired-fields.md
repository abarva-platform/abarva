# 2026-09-22-admin-page-view-retired-fields — Remove admin page-view fields whose rendering props were retired

## Release ID

`2026-09-22-admin-page-view-retired-fields`

## Status

`candidate`

## Plain-English Summary

Some time ago the internal provenance chips on the Admin pages were removed from
the interface on purpose. A later change removed the three now-unused inputs from
the two components that had rendered them.

What that change did not remove was the other end of the wire. Six Admin
page-view builders still declared and filled in the three values those inputs
used to receive, so every Admin page load computed three values that nothing
could read. This release removes them.

Nothing visible changes. The point is that a reader of the code can no longer
mistake a dead field for a live one, and a guard now makes the dead-field state
fail a test rather than sit quietly.

## Layer Impact

Release lane: `internal-admin`. The affected surfaces are the AbarVa-only Admin
workspace; no client-facing product route changes.

- **Layer 4 — Products (Admin surfaces):** the six Admin page-view shapes lose
  three fields that no component reads. No rendered output changes.
- **Layers 1–3 (intake, adapters, canonical model):** untouched. No schema, no
  loader, no adapter, no tenant data.

The shared agent editorial keeps its `contextUsed` field: surfaces outside
Admin read it, and the new guard suite fails if a future change removes it.

## Client Applicability

- All clients: yes, in the sense that the Admin surfaces are shared — but there
  is no behavioral or visual change for anyone.
- Specific clients: none.
- Internal only: the affected routes are the internal Admin workspace.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/admin/architecture-page-view.ts`
- `src/lib/admin/build-progress-page-view.ts`
- `src/lib/admin/connectors-page-view.ts`
- `src/lib/admin/overview-page-view.ts`
- `src/lib/admin/production-readiness-page-view.ts`
- `src/lib/admin/users-access-page-view.ts`

  Each loses the same three entries from its view shape and from the object it
  returns.

- `src/__tests__/integration/admin/admin-page-view-retired-fields.test.ts` (new)

  Builds all six views and asserts, on the built objects rather than on file
  text, that the retired keys are absent, that the keys the surviving components
  still destructure are present, and that the shared agent editorial still
  produces a non-empty `contextUsed`.

- `src/__tests__/integration/admin/production-readiness-page-view.test.ts`

  Two assertions pinned the removed fields. Neither is dropped. The agent-name
  assertion moves to the field that actually reaches a rendered surface; the
  `contextUsed` assertion moves, at the same strength, to the shared builder
  that still owns the field. Both carry the reason inline.

## QA / Validation

Measured on the same scope, `src/__tests__/integration/admin`, against a clean
baseline on the exact merge base.

- **Baseline, before any edit:** 2 failed / 1748 passed / 1750 total;
  2 suites failing (`admin-visible-vocabulary`, `admin7-visual-lock`). Both
  pre-existing, both unrelated to these fields, both untouched here.
- **Red first:** the new suite on unmodified code — 3 failed / 10 passed / 13.
  Each failure names all six views.
- **After:** the new suite 13 / 13. Same scope — 2 failed / 1761 passed /
  1763 total. The same two pre-existing suites, and no others.
- **Mutations, applied one at a time against the committed fix, each caught:**
  1. re-add the retired `context.agent` to one view — 1 of 13 failed.
  2. re-add the retired `editorial.contextUsed` to one view — 1 of 13 failed.
  3. over-reach: empty `contextUsed` on the shared agent editorial — 1 of 13
     failed, which is the case that protects the non-Admin readers.
  4. over-reach: drop a field the surviving component still reads — 1 of 13
     failed.
  Tree restored to 13 / 13 and a clean `git status` after each.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit 0, zero diagnostics.
- `npx eslint` over the eight changed files — exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the
image as it does for any merge. No migration, no flag, no environment variable,
no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No manual Azure command is run by this change.
- Shared runtime mutators: none. This change does not touch env vars, flags,
  scale, secrets, revision weights or the Container App template.
- Approved image digest: whatever that workflow builds from the merge SHA.
- ACA runtime invariant: to be proven from the deploy run's own
  `check-aca-runtime-invariant.mjs` output after merge.
- Worker image invariant: unchanged; no worker job input changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and here is the reason rather than an
  implication.** The change removes three object fields that no component
  destructures, so there is no rendered difference a signed-in session could
  observe. A signed-in check would return the same page before and after and
  would therefore prove nothing about this change. The claim for this release is
  `deployed` with the runtime invariant proven; it is not `live-proven`.

## Rollback Plan

Revert the squash commit. There is no data, schema or flag state to unwind, and
the revert restores three unread fields, which cannot break a consumer because
no consumer exists.

## Audit Evidence

- The pull request and its check run.
- The new guard suite, which is the durable evidence: it fails if the fields
  return, and it fails if the removal reaches into the shared builder.
- The deploy run and its runtime-invariant proof, after merge.

## Known Gaps

The two pre-existing failures in this scope — `admin-visible-vocabulary` and
`admin7-visual-lock` — are untouched and remain failing. They are not caused by
this change and are not repaired by it.
