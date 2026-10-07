# 2026-10-06 — Governed-data-foundation smoke evidence regenerated into the care-delivery IDN domain

## Release ID

`2026-10-06-moves-gdf-evidence-domain-regen`

## Status

`candidate`

## Plain-English Summary

The eleven synthetic discovery files for the governed-data-foundation smoke
Move described an HR-analytics scenario (worker identity, HR source systems, HR
reporting baseline). The Move is a care-delivery integrated network (IDN)
data foundation, and its P1→P2 readiness workbook asks about care-delivery data
sources and patient/member/provider identity. The off-domain content could not
honestly ground the workbook answers, so the gate stayed blocked.

This regenerates all eleven files into the care-delivery IDN data-foundation domain
— patient/member/provider identity (EMPI/provider master/enrollment), EHR /
claims / enrollment / provider-directory / lab / behavioral-health (42 CFR Part
2) sources, PHI privacy and minimum-necessary controls, certified clinical and
quality measures, and a Finance baseline that remains honestly unestablished.
Each file keeps its synthetic, not-client-attested labeling and its "still
required before this is a client fact" stance; the family keys, phases, evidence
types, and blueprint order are unchanged. The content is concrete enough that an
authorized reviewer can answer the readiness workbook from on-subject synthetic
evidence, without claiming any real client fact.

No evidence is loaded by this change. The source-set hash moves from
`b06f64dd…` to `de85a814f469454d7d5888bbdf6310401a6d220ea6db834d80874b4d1d6f91f9`;
the Move-scoped manifest is updated to the new hash. Loading remains a separate,
explicitly approved operator-job step, run only after the digest-pinned image
contains these files.

## Layer Impact

Release lane: `client-data-lane` for the scoped synthetic data-plane source set.
The fixtures and manifest are available globally but do nothing without the exact
Move-bound approval and a later job invocation.

- Layer 1 client intake: the eleven fictional fixture files are rewritten into
  the care-delivery IDN domain with explicit non-attested labels.
- Layer 2 source adapter: unchanged — the load job still maps each file to one
  canonical evidence item and review row by path and byte hash.
- Layer 3 canonical model: no rows written by this change; a later approved job
  would append pending records for the one authorized Move.
- Layer 4 products: no surface logic changes.

## Client Applicability

- All clients: no automatic load; additive fixture content only.
- Specific clients: one synthetic demo Move, identified only by the approved
  manifest at execution.
- Internal only: the operator job and proof bundle.
- Public/demo only: synthetic fixture content (care-delivery IDN, fictional).
- Feature flag: none.

## Changes Included

The eleven regenerated ACA source files, the Move-scoped dataset manifest
updated to the new source-set hash and source basis, and this record. The load
job script, package command, and the separate manual-UI fixture package are
unchanged.

## QA / Validation

- Fixture self-validation via the load script's `--source-hash` path: **PASS** —
  all eleven synthetic provenance markers present, no contact/credential
  patterns, exactly the eleven required families in blueprint order, object
  count 11, new hash `de85a814…`.
- Governance manifest validator (`validate:context-corpus manifests`) and
  `release:check` — run in CI on this PR.
- Not run yet: the live ACA load job and post-commit readback (a separate
  approved step after the image is built). The job's quality gate still requires
  one pending item and one pending review per family, zero approvals, and an
  unchanged phase.

## Rollout Plan

Merge through a PR to `main`; the repo-owned ACA main deploy workflow builds the
digest-pinned image containing these files. The load job is then submitted
separately with that digest and the new approved source hash. This change writes
no data by itself and shifts no web traffic.

## Deployment Authority

- Repo-owned deploy workflow `.github/workflows/aca-main-deploy.yml` builds the
  image after merge.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded from the main deploy before executing any job.
- ACA runtime invariant: verify web template, 100% traffic revision, and
  required workers before claiming runtime proof.
- Live signed-in proof required: the pending-review readback before any later
  approval or phase advancement.

## Rollback Plan

Revert the PR to restore the prior fixture content and hash. No data is written
by this change, so there is nothing to un-load; any future load correction
requires a new scoped decision and a new source-set hash.

## Known Gaps

- The content is concrete synthetic care-delivery evidence, not a real client
  current-state. It lets the readiness workbook be answered for a synthetic
  mechanics smoke; it establishes no real client fact, and each file keeps its
  "still required before this is a client fact" stance.
- No rows are written by this change. The P1 gate stays blocked until the
  evidence is loaded (separate approved job) and the workbook's structured
  responses are authored and accepted in the signed-in UI.
- Loading cannot happen until a digest-pinned image containing these files is
  built by the repo-owned deploy, so the new source hash is live only after
  merge + build.

## Audit Evidence

The PR and merge commit, the manifest source-set hash, and — for the later load
step — the ACA execution ID, logs, Blob proof bundle, post-commit readback, and
signed-in review screenshot.
