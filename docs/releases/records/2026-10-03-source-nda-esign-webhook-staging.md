# 2026-10-03-source-nda-esign-webhook-staging - Demo NDA callback staging

## Release ID

`2026-10-03-source-nda-esign-webhook-staging`

## Status

`candidate`

## Plain-English Summary

A narrowly public, signed callback endpoint can receive demo e-signature status updates. On a verified completion it stores the signed PDF and completion certificate before marking the provider envelope complete. This is provider workflow state, not an approved or executed NDA record.

## Layer Impact

- Release lane: `experimental` (lab-only provider configuration with a narrowly public signed callback).
- Layer 3: no canonical supplier, contract, or executed-NDA authority is created or changed.
- Layer 4: Source stages provider envelope status and private file references for later human review.

## Client Applicability

- All clients: no active signing change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: the callback route is reachable without Clerk but requires a valid provider HMAC and a matching synthetic-tenant envelope.
- Feature flag: the existing e-signature provider configuration remains off by default.

## Changes Included

- Adds a signature-verified webhook route, tenant/provider/environment-fenced envelope transitions, and durable Blob staging for completed PDF and certificate bytes.
- Adds negative tests for invalid signature, unknown or cross-tenant envelope, malformed completion bytes, duplicate delivery, terminal-state conflict, and neighboring public routes.
- Does not send an envelope, email a supplier, create an executed-NDA authority row, or change a stage gate.

## QA / Validation

- Red-first processor and route tests failed on the unimplemented paths; all focused cases pass after implementation.
- A declined-to-completed guard mutation caused the focused test to fail and was restored.
- TypeScript, scoped ESLint, release controls and applicable CI are required before merge; record their results in the PR.
- No provider callback or signed-in acceptance is claimed from local tests.

## Rollout Plan

Squash-merge a reviewed PR. Only the repo-owned ACA main workflow may deploy the digest-pinned image. Keep provider disabled until the send path, applied envelope schema, provider configuration and signed-in synthetic round trip are separately proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: prove after deployment; not yet known.
- ACA runtime invariant: verify web template, sole 100%-traffic revision and required workers match one immutable digest.
- Worker image invariant: required after deployment.
- Feature/env flag update path: unchanged; disabled is the default.
- Live signed-in proof required: yes, after the remaining send and review slices and authorized migration apply.

## Rollback Plan

Disable the provider through the repo-owned deployment configuration and redeploy the prior approved digest through the same workflow. Existing staged private files and envelope rows remain auditable; do not delete evidence during rollback.

## Audit Evidence

PR, applicable CI, local test log, mutation result and official ACA run should be attached to the release review. No live signed-in NDA acceptance evidence exists yet.

## Known Gaps

The envelope migration has not been applied. A Legal-published binary template source, send route, embedded or email signing entry point, reviewed executed-NDA filing, provider Connect configuration and live callback proof remain separate work.
