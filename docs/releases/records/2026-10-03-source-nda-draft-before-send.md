# 2026-10-03-source-nda-draft-before-send — Separate Draft Creation From Delivery

## Release ID

`2026-10-03-source-nda-draft-before-send`

## Status

`candidate`

## Plain-English Summary

The lab e-signature adapter now creates an unsent envelope draft. Delivery requires a separate explicit call. This lets a later application route record the envelope and its authority before it asks the provider to notify anyone.

## Layer Impact

- Release lane: `experimental`.
- Layer 4, Products: the Source provider contract and demo adapter change. Canonical commercial facts and supplier identity are unchanged.

## Client Applicability

- All clients: no active e-signature change.
- Specific clients: none.
- Internal only: test provider contract.
- Public/demo only: the configured lab-only adapter, currently disabled at runtime.
- Feature flag: `SOURCE_NDA_ESIGN_PROVIDER` remains disabled unless separately configured through the controlled deploy path.

## Changes Included

- Split provider draft creation and draft delivery operations.
- Keep the demo PDF hash, tenant, signer, and internal-inbox checks at draft creation.
- Add behavior tests for no delivery during draft creation and explicit send.
- No migration, route, or live provider call.

## QA / Validation

- Red-first focused tests failed because the draft API was absent.
- Focused provider and adapter tests passed after implementation.
- A temporary mutation changing the draft request to `status: sent` failed the behavioral guard; the mutation was removed.
- TypeScript, scoped ESLint, release check, and PR CI results are recorded in the PR.

## Rollout Plan

Squash merge after review and applicable CI. The repo-owned ACA main workflow builds and deploys the image. No feature flag is enabled and no envelope is sent by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: record from the successful main deployment.
- ACA runtime invariant: verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: verify required worker jobs use the same approved digest.
- Feature/env flag update path: separate controlled release; none here.
- Live signed-in proof required: confirm Source NDA remains blocked without Legal authority and provider remains disabled.

## Rollback Plan

Revert this provider-contract change through a PR and the repo-owned main deployment. There is no migration or data rollback.

## Audit Evidence

PR checks, local focused test output, mutation result, official deployment run, immutable runtime digest, and signed-in Stage 05 readback.

## Known Gaps

The future send route must persist and authorize a draft before calling delivery; the envelope table does not yet represent drafts. This release does not make e-signature available to operators.
