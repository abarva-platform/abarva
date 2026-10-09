# 2026-10-07-moves-job-written-evidence-review-queue — Job-written discovery evidence stays reviewable

## Release ID

`2026-10-07-moves-job-written-evidence-review-queue`

## Status

`candidate`

## Plain-English Summary

A governed operator data-build job can write discovery evidence for a Move directly into the
canonical tables, instead of a person uploading a file through the product. When it does, there is
no uploaded attachment and no row in the Move's document vault — only the evidence record and a
pending review record.

That is a different shape from an uploaded file in every field the Files & Evidence cabinet reads.
This release adds regression coverage proving the cabinet still lists job-written evidence as
awaiting review when the document vault is empty, and that the draft extraction the cabinet offers
the reviewer is one the approval endpoint will actually accept.

Both matter because a reviewer can only approve what the cabinet shows them, and approval is the
only way loaded discovery evidence becomes usable by the next phase. If either half regressed, the
screen would read as though nothing had been loaded, or the Approve action would be offered and
then refused — and the discovery phase could never close.

No product behavior changes. This is test-only coverage of behavior already on `main`.

## Layer Impact

Release lane: `global-control-lane` — shared Moves review behavior, not gated to any
client and not client-scoped data.

- **Layer 4 (Products — Moves):** the Files & Evidence review queue and its approval contract are
  pinned against regression. No runtime code changed, so no projection changes.
- **Layer 3 (Canonical model):** unchanged. The tests read the canonical evidence and review
  records through the existing route; they add no new reader, writer, or schema.

## Client Applicability

- All clients: yes — the coverage guards shared Moves review behavior for every client.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The guarded code path is not flag-gated.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts` — one new `describe`
  block with two cases, covering a job-written pending review (no vault artifact, citation nested
  under `flexible`, none of the top-level structured lists the upload parser produces):
  1. it is queued for review even when the document vault is empty;
  2. the extraction offered with it normalizes under the approval contract.

No source, route, migration, script, or dependency changed.

## QA / Validation

- **PASS** — `npx jest src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`:
  18 passed, 18 total (16 before this change).
- **PASS** — `npx jest src/lib/programs/__tests__/evidence-review-contract.test.ts` plus the
  artifacts route directory: 7 suites, 59 tests, all passing.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the changed file, exit 0.
- **PASS (mutation-tested — the new cases have teeth, verified individually):**
  - requiring a vault-artifact reference in the queue loader → both new cases fail;
  - stopping the draft extraction from reading the nested citation list → the approvability case
    fails.
  Both mutations were reverted; the committed diff is test-only.
- **NOT RUN** — live signed-in walk. This change has no runtime effect, and the review queue's
  live behavior after a governed load is proven by the data lane's own run, not by this record.

## Rollout Plan

Merge to `main`. No runtime rollout: the diff is a test file, so the next image build picks it up
with no behavioral change. No migration, flag, or environment change.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime update is requested by this release.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the single commit. There is no migration, no stored state, and no runtime surface to
restore, so revert is complete and immediate.

## Known Gaps

- The route test's data-plane mock resolves a table's rows regardless of the filters in the chain.
  It therefore cannot prove the tenant-key matching used by the queue loader, and this record does
  not claim it does. Tenant scoping remains covered only by the loader's own code and by live
  readback.
- The transition workbook ships with its "Evidence or Source" column pre-populated with the
  evidence we *suggest* the client provide. A later gate check treats a non-empty cell in that
  column as the client having named a source, so our own suggestion can satisfy it. That is a
  governance weakness, not a blocker — it makes the check easier to pass, never harder. It is
  deliberately left alone here: tightening it would add a new gate obstacle mid-run, and it should
  be sequenced as its own change once the end-to-end run is proven.
- Whether job-written evidence is reviewable from the approvals overview screen (as opposed to the
  Files & Evidence cabinet) is still unproven. Out of scope for this record.

## Audit Evidence

- PR URL and squash commit for this branch.
- CI run on the pull request, including the typecheck and unit suites above.
- The test file itself: each case states, in a comment, the failure it is written to catch.
