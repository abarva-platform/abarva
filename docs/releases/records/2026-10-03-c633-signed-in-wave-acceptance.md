# 2026-10-03-c633-signed-in-wave-acceptance — Signed-in acceptance for the 2026-10-03 wave

## Release ID

`2026-10-03-c633-signed-in-wave-acceptance`

## Status

`candidate`

## Plain-English Summary

Five changes merged and deployed on 2026-10-03. All five were green in CI and
all five deployed cleanly, but nobody had signed in and looked at any of them,
so none of them was proven to work for a person rather than for a test. This
change records a signed-in walk of the three that alter what a signed-in user
sees, on the exact deployed image, and writes the result down as a results
matrix in the repository.

It introduces a file that did not exist before: a single place where signed-in
acceptance walks are recorded, one dated block per wave. Until now the only
record of such a walk was a sentence in an operator register, which is why the
debt kept being restated rather than paid.

**This release ships no product code.** It is evidence plus one new document.
The walk itself found one defect, which is filed rather than fixed here.

## Layer Impact

Release lane: `internal-admin` — acceptance evidence and the document that holds
it. No product surface, route, control, schema, flag, or data path is touched.

- `PRODUCTS`: unchanged. Three product surfaces were read; none was modified.
- Canonical model, source adapters, client intake: unchanged.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — operator and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new. Holds the reading
  rules, the standing boundary for an unattended walk, and the first dated
  block: the 2026-10-03 wave on deployed SHA `44b50dcd3d`.
- `docs/releases/records/2026-10-03-c633-signed-in-wave-acceptance.md` — this
  record.

No source file, workflow, migration, or configuration file is changed.

## QA / Validation

The deliverable of this item is a walk, so the validation *is* the walk. It is
recorded in full in the matrix; the summary:

- **Deployed artifact under test, read independently with read-only `az` before
  and after the walk and unchanged across both reads:** `ca-abarva-web-lab-eastus`
  template image `sha256:5bb19ba5…09ca` = sole 100%-traffic revision
  `ca-abarva-web-lab-eastus--m44b50dcd`, Healthy / Running. The `aca-main-deploy`
  run on the merge SHA (37131672723, `createdAt` 2026-10-03T15:00:15Z,
  `updatedAt` 15:08:34Z, success) is the newest run of that workflow, so nothing
  superseded it and the revision suffix is valid evidence.
- **Four rows walked, three pass, one fail.** Governed chart grid: pass, with
  5 of 9 chapters plotting an exhibit and the 4 that do not declaring why.
  Cross-dimensional pivot: pass across three dimensions and both measures, with
  truncation and unplotted-row disclosures changing correctly with the pivot.
  Phase transition refused for want of evidence: pass — gate reports `1/2 hard
  met`, readiness reads `0 ready / 6 insufficient / 9 unknown` against 15
  accepted responses, the refusal names the three missing evidence families, and
  the later phases are disabled.
- **Moves board client surface: fail**, filed as backlog item `U-553`. The
  header half of that merge is live; the title-sanitizer half does not hold on
  the real corpus — 5 of the 8 move names on the board still carry a build or
  run identifier, in two shapes the added rule does not match.
- **No write was performed.** The walk changed client-side view state only. The
  server-side fail-closed behaviour behind the phase gate is evidenced by that
  merge's own tests, not by this walk, and is named as owed in the matrix rather
  than implied.
- Not applicable to this change: red-first test, mutation check, and scope
  baseline. Nothing executable changed, so there is no guard to break and no
  suite whose count could move. Asserting a before/after number here would be
  the kind of ceremony this backlog exists to remove.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: see PR.
- `git diff --check`: clean.

## Rollout Plan

Merge by squash through the protected-main PR process. The repo-owned ACA main
deploy workflow will build and deploy an image from the merge SHA as it does for
any merge; this change alters no runtime behaviour, so that deploy carries no
product effect. No migration, data build, feature flag, or environment update.

## Rollback

Revert the pull request. Nothing depends on these files at build or run time;
reverting removes the recorded evidence and restores no prior behaviour, because
no behaviour changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none introduced.
- Approved image digest: the digest produced for the exact merge SHA.

## Audit Evidence

- The matrix itself, which names the deployed SHA, the digest, the revision, the
  deploy run and its timestamps, and the verdict per surface.
- The defect found by the walk is filed as `U-553` with its measured count,
  rather than described only in prose.
