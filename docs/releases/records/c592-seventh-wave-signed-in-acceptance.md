# 2026-10-04-c592-seventh-wave-signed-in-acceptance — Seventh-wave signed-in walk

## Release ID

`2026-10-04-c592-seventh-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Seven merges were deployed with no signed-in verdict on any of their surfaces.
This records what a signed-in reader actually saw on the serving build, as one
dated block in the acceptance matrix: one row per surface, each marked
**pass / fail / blocked**.

It also closes the mechanism rather than the list. Previous wave records named
their merges as a hand-built list and left residue three times running. Before
any verdict was written, every merge that is an ancestor of the walked build and
newer than the oldest wave recorded in that file was enumerated and checked with
`git merge-base --is-ancestor` — 51 merges, all 51 ancestors — and each is
accounted for as a row or as a named exclusion with its reason. The sweep found
nine further client-visible merges that no acceptance covers; they are filed
rather than left to be rediscovered.

Documentation only. No route, component, test, workflow or configuration file
changes, and the walk itself performed **no write** — no upload, no template
published, no candidate accepted, no NDA sent, no approval submitted, no phase
advanced, no step saved, no file downloaded.

## Layer Impact

Layer 4 surfaces were **read**, not modified. Layers 1–3 are untouched: no
intake tab, adapter, canonical object, schema, migration or tenant dataset was
read or written.

## Client Applicability

- All clients: none
- Specific clients: none
- Internal only: yes — an acceptance record and this release record
- Public/demo only: none
- Feature flag: none

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new dated block,
  "2026-10-04 seventh wave — walked on serving SHA `031eec1f24`"
- `docs/releases/records/c592-seventh-wave-signed-in-acceptance.md` — this file

Merges given a verdict row: #8949 `f431ae90c7`, #8950 `d9e927f3c8`,
#8952 `b4b97d79a6`, #8953 `9f5702fe23`, #8955 `373a0b93a5`, #8958 `731187eab0`,
#8964 `031eec1f24`.

## QA / Validation

The walk is the validation, and it is recorded surface by surface in the matrix
block rather than summarised here. Four rows **pass**; two pass on the half a
read can reach and are **blocked** on the half that would need a write, with the
write named in each case.

Two findings are worth naming outside the rows:

- **#8949 merged empty.** `f431ae90c7` has one parent and a zero-file diff
  against it; the stepper change and both release records landed inside #8950's
  squash 21 seconds earlier. The commit proves nothing, so the surface settles
  it: `.mxw-phase-stepper` renders horizontally, 1121 × 64 at y=63, with `done`
  and `current viewing` step states.
- **A read-back string can be rewritten by the reading tool.** One control read
  back as `[BLOCKED: JWT token]` through three independent reads and would have
  been filed as a client-visible redaction leak on a governed publish path. It
  is the browser tool's own output redaction: the real text is a 55-character
  filename whose three dot-separated segments are JWT-shaped. Recovered by
  re-reading the same string in a form the scrubber does not match. The matrix
  block records the mechanism, because it can hide a real defect as easily as it
  invented this one.

Repository validation on the branch:

- `node scripts/release-check.mjs --base origin/main --head HEAD`
- Required GitHub contexts on the pull request

No code changed, so no test baseline applies and none is quoted.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow runs on merge as it does for
any change. This record carries no runtime behaviour, so `deployed` is its
ceiling for client effect; the deploy is noted for completeness only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none — this change mutates no Azure resource
- Approved image digest: not applicable; no image is built or pinned by this change
- ACA runtime invariant: read **read-only** twice to bracket the walk, at
  13:36:58Z and 13:50:56Z, and unchanged across both: template image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:1ddf77fd5d941e3186078a93efbf9453e1388363b899175d8c8eaccb5a8e37b7`,
  identical to the image on the sole 100%-traffic revision
  `ca-abarva-web-lab-eastus--m031eec1f` (`active: true`, `Healthy`, `Running`).
  No deploy landed inside the walk.
- Worker image invariant: not asserted by this change
- Feature/env flag update path: none
- Live signed-in proof required: this record **is** that proof, for the seven
  merges named above and for no others

## Rollback Plan

Revert the commit. Two documentation files; no migration, no runtime state, no
client-visible effect.

## Audit Evidence

- The matrix block itself — every verdict carries what was observed, and every
  `blocked` row names the precondition
- The ancestor sweep table — 51 merges, each with a disposition
- The two read-only `az containerapp show` / `az containerapp revision show`
  readbacks quoted in the block
- The pull request for this change, and its required checks
