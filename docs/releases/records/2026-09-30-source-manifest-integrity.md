# 2026-09-30-source-manifest-integrity - Source Manifest Integrity

## Release ID

`2026-09-30-source-manifest-integrity`

## Status

`candidate`

## Plain-English Summary

The synthetic source-package validator now confirms that every declared extract still has the bytes and family membership recorded in its manifest. A changed file, missing family, duplicate declaration, or escaped path fails validation before an operator can use the package as load evidence.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1 source validation: verifies extract integrity against the package manifest. It does not approve source content or change canonical data.
- Layer 3 and product projections: no changes.

## Client Applicability

- All clients: no live data or product behavior change.
- Specific clients: none.
- Internal only: synthetic ECL package validation and CI.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Harden the existing dense source-package validator.
- Add a planted file-tamper and path-escape regression to the ECL CI lane.

## QA / Validation

- Fresh generated package validates.
- A source-byte change with the old manifest hash is refused.
- A manifest path outside its declared family is refused without reading it.
- Existing source-room plausibility tests pass.

## Rollout Plan

Merge by PR. The repo-owned ACA main workflow will deploy the code image; no data-build job or tenant load is triggered. The new validation runs in the ECL CI lane and on future explicit package checks.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web and worker digest equality after deploy.
- Worker image invariant: verify both required workers use the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm Home continues to render the same labelled record; this validation does not promote data.

## Rollback Plan

Revert the PR by a new controlled PR if the validator rejects a legitimate unchanged package. Do not bypass the source check for a mutating load.

## Audit Evidence

- PR CI result, planted regression output, release check, main deploy run, and runtime digest readback.

## Known Gaps

This verifies manifest-to-file integrity, not human approval of the manifest itself. A new versioned source set still requires its own reviewed manifest, quality gate, ACA Job, and independent readback before Home publication.
