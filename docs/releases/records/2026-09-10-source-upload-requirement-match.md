# 2026-09-10-source-upload-requirement-match - Source upload requirement matching

## Release ID

`2026-09-10-source-upload-requirement-match`

## Status

`candidate`

## Plain-English Summary

Source now matches uploaded evidence filenames using normalized separators and token boundaries before considering loose substrings. A Q&A filename containing the word `bidder` therefore maps to clarifications instead of being mistaken for a proposal because `bid` appeared inside another word.

## Layer Impact

- `global-control-lane`, Layer 4 workflow projection: upload-to-evidence requirement reconciliation.
- Layers 1-3: no schema, adapter, canonical-data, or tenant-data changes.

## Client Applicability

- All clients: yes, for Source evidence uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Normalizes punctuation and separators before scoring requirement filename tokens.
- Gives an exact token or phrase match higher precedence than a loose substring match.
- Preserves stage scoping and honest no-match behavior.
- Adds a regression test for the `bidder` versus bidder-Q&A collision.

## QA / Validation

- PASS: focused upload-to-requirement matcher suite (`13` tests).
- PASS: scoped ESLint.
- PASS: repository TypeScript validation under the required Node 24 runtime with an 8 GB compiler heap.
- PASS: release control check.
- NOT RUN: pull-request checks; recorded before merge.
- NOT RUN: signed-in re-upload proof; required after governed deployment.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA. Signed-in proof re-uploads a synthetic Q&A log and verifies that the Q&A requirement advances to `Parsed` without changing approval state.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned ACA main workflow. The matcher is pure and this release adds no schema or destructive data operation.

## Audit Evidence

- Focused matcher tests covering all existing lifecycle examples and the bidder-Q&A collision.
- Pull request, governed deployment run, runtime-invariant evidence, and signed-in Q&A lifecycle proof.

## Known Gaps

Existing uploads that were previously linked to the wrong evidence requirement are not silently rewritten. Re-uploading the source file after deployment applies the corrected deterministic match while preserving stronger lifecycle states.
