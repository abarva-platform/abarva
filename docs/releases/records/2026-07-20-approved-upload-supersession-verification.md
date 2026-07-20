# 2026-07-20-approved-upload-supersession-verification — Confirmed and hardened: approved-upload supersession

## Release ID

`2026-07-20-approved-upload-supersession-verification`

## Status

`released`

## Plain-English Summary

Backlog item 93 asked to "support an approved artifact being superseded by
a client-uploaded replacement file." Before writing new code, this release
audited how much of that already existed — and found the entire mechanism
was already fully built and working, shipped as part of the same-day
`deliverables_v2` approval-lineage work (the migration adding
`signed_off_version`/`approved_artifact_id`, `signOffDeliverable`'s
upload-handling branch, and `saveMoveArtifact`'s generic artifact-level
supersession chain in `move_artifacts`). What was missing was test coverage
for the specific "a SECOND approved upload supersedes the first" scenario —
the existing test only covered a single upload. This release adds that
missing regression test. No production code changed: the test confirms
correct existing behavior rather than fixing a bug.

## Layer Impact

- **global-control-lane**: test-only change to
  `src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts`.
  No production code in `src/lib/programs/mutations.ts` or
  `src/lib/programs/deliverables/move-artifacts.ts` was modified.

## Client Applicability

- All clients: n/a — test-only change, no runtime behavior change.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Verified (read, not modified) the existing implementation:
  - `signOffDeliverable` (`src/lib/programs/mutations.ts`) — on an approved
    upload, inserts a new `deliverable_versions` row and sets
    `deliverables_v2.signed_off_version`/`approved_artifact_id` to point at
    the version/artifact just approved. Confirmed this correctly moves
    forward (not just sets once) across repeated calls.
  - `saveMoveArtifact` (`src/lib/programs/deliverables/move-artifacts.ts`)
    — generic artifact-level supersession: finds the prior `current`
    `move_artifacts` row for the same `(move_id, artifact_type)`, links the
    new row's `supersedes_artifact_id` to it, and marks the prior row
    `lifecycle_state: "superseded"` / `superseded_by_artifact_id` pointing
    forward. Already directly unit-tested in
    `src/lib/programs/deliverables/__tests__/move-artifacts.test.ts`.
  - The sign-off route
    (`src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`)
    — parses an uploaded file, extracts text, calls `saveMoveArtifact` (which
    triggers the supersession above), then calls `signOffDeliverable` with
    the new artifact id.
  - Downstream content propagation already exists and is tested:
    `src/lib/deliverables/deliverable-content-signals.ts` and
    `src/lib/deliverables/moves-generate-deps.ts` both prefer the
    `signed_off_version`'s content row over a later draft when resolving
    what to feed forward — covered by
    `deliverable-content-signals.test.ts`/`moves-generate-deps.test.ts`.
- `src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts`
  — new test: two successive `signOffDeliverable` calls with different
  `approvedArtifactId`/`approvedContent` for the same deliverable. Confirms
  (1) both approved versions are preserved as real `deliverable_versions`
  rows (version history, never overwritten), and (2)
  `deliverables_v2`'s `signed_off_version`/`approved_artifact_id` pointer
  moves forward to the LATEST approval on the second call, not stuck on the
  first.

## QA / Validation

- `npx jest src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts`
  — 2/2 pass (1 existing + 1 new).
- `npx jest src/lib/programs/deliverables/__tests__/move-artifacts.test.ts
  src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts` —
  6/6 pass.
- `npx eslint` on the changed test file — 0 errors.
- `git diff --check` — clean.
- Local `npx tsc --noEmit -p .` historically crashes in this sandbox; CI's
  "Typecheck + reasoning-layer tests" is authoritative.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Test-only — no
runtime rollout, no migration, no flag. Deploy proceeds through the
repo-owned `aca-main-deploy` workflow as a matter of course (any merge to
main triggers it), but this specific change has no observable production
effect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29750365143](https://github.com/abarva-platform/abarva/actions/runs/29750365143)
  (headSha `bd6a589f536b38dc35e02ddb8005c6c71cb48a98`, the #5148 merge
  commit), conclusion `success`.
- Shared runtime mutators: none used directly.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:5245615e2e9119a3991d91b6c8ebb5f235e05db14364b0fd580268bedb111f1d`.
- ACA runtime invariant: **proven** — the workflow's own runtime-invariant
  check passed (100%-traffic revision `ca-abarva-web-lab-eastus--mbd6a589f`
  matches the built image digest).
- Worker image invariant: N/A.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **not applicable**, as documented above — test-only
  change with no runtime behavior difference. The workflow's own automated
  production health check passed as part of the deploy.

## Rollback Plan

Revert the merge commit. Test-only — no data or schema impact either way.

## Audit Evidence

- PR: [abarva-platform/abarva#5148](https://github.com/abarva-platform/abarva/pull/5148),
  all required checks passed, squash-merged as
  `bd6a589f536b38dc35e02ddb8005c6c71cb48a98`.
- CI/deploy run: [aca-main-deploy #29750365143](https://github.com/abarva-platform/abarva/actions/runs/29750365143),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--mbd6a589f`, 100%
  ingress traffic, image digest
  `sha256:5245615e2e9119a3991d91b6c8ebb5f235e05db14364b0fd580268bedb111f1d`.

## Known Gaps

- **`approved_artifact_id` is fetched into `PhaseDocumentsPanel.tsx`'s
  `DbDeliverable` type but never rendered or used** — there is no "download
  the original uploaded file" link anywhere in the UI; a user can only
  download the regenerated HTML/DOCX/XLSX (which does contain the
  human-approved parsed text via `signed_off_version`, but not the original
  uploaded file itself, e.g. the original .docx with its own formatting).
  This is a real, scoped gap — tracked as backlog item 94 ("propagate
  authoritative approved upload across Moves/aVa/exports"), not attempted
  in this release to keep this one strictly about verifying/hardening the
  supersession mechanism itself.
- **No live-generated real-upload proof** — this release is test-only and
  intentionally does not attempt a live production upload cycle; that is
  covered by the dedicated live E2E backlog items (95/96).
