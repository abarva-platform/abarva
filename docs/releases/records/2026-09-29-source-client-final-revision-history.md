# 2026-09-29 Source Client Final revision history

## Release ID

`2026-09-29-source-client-final-revision-history`

## Status

`candidate`

## Plain-English Summary

An authorized reviewer can submit a revised Client Final after the first accepted final supersedes its generated draft. The revised file remains linked to the generated draft for provenance and supersedes the prior final. Events without any generated draft remain blocked.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Source: the existing authenticated Client Final action selects its draft provenance from the version history already loaded for the event and artifact.
- Layer 3: no new model, schema, loader, or fact owner. Existing tenant and approval checks, artifact versioning, immutable blob upload, and current-authority controls remain unchanged.

## Client Applicability

- All clients using the Source Client Final review path.
- No client-specific data or feature flag.

## Changes Included

- Find the most recent generated draft in the ordered artifact history even when a prior Client Final has superseded it.
- Keep the current-authority resolver for the existing final and its supersession link.
- Add first-upload, revision-after-supersession, and no-draft route coverage.

## QA / Validation

- Pass: red-first route test reproduced the revision rejection (409 instead of 200).
- Pass: current-only mutation reproduced the same rejection; restored implementation passes.
- Pass: no-draft negative test rejects before blob or metadata writes.
- Pass: focused route and artifact-authority suites, 20/20 tests.
- Pass: TypeScript check with 8 GB heap and scoped ESLint.
- Not run: applicable PR CI/review, official runtime and signed-in replay at record creation.

## Rollout Plan

Squash merge after applicable CI/review. Only the repo-owned ACA main workflow deploys the merged image. No migration or data build is required. Replay the same signed-in Client Final revision and verify version, prior-final supersession, draft provenance, and current-authority uniqueness.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: pending official build.
- ACA runtime invariant: web template, 100%-traffic healthy revision, and required worker jobs match the approved digest.
- Live signed-in proof required: yes; retry the exact rejected revision.

## Rollback Plan

Revert the squash commit through a reviewed PR and let the repo-owned main workflow deploy the rollback. Accepted artifact versions remain auditable; do not delete them.

## Audit Evidence

Local red-first and mutation test output; PR, CI, official deployment, and private synthetic journey evidence are recorded separately after execution.

## Known Gaps

This repair does not parse or index Client Final files for enterprise retrieval. Artifact acceptance, stage gate readiness, and search readiness remain separate states.
