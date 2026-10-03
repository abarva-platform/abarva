# 2026-10-03-source-nda-draft-persistence — Persist Unsent NDA Envelopes

## Release ID

`2026-10-03-source-nda-draft-persistence`

## Status

`candidate`

## Plain-English Summary

The demo signing workflow gains a database state for an unsent envelope. The database binds that draft to an accepted event candidate and the hash of an applicable, published template. A later send must be a separate, auditable state transition. A completion callback cannot process a draft.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3, Canonical Model: the existing tenant-fenced envelope workflow table gains a draft state and document-hash binding; it does not become executed-NDA authority or a commercial fact.
- Layer 4, Products: Source gains a draft persistence adapter and a fail-closed callback guard.

## Client Applicability

- All clients: no active signing change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: the lab signing configuration, currently disabled.
- Feature flag: `SOURCE_NDA_ESIGN_PROVIDER` remains disabled until a separate controlled release.

## Changes Included

- Add an authored migration for draft status, nullable sent timestamp, immutable document hash, and database checks at draft creation and send.
- Add a tenant/event/supplier/candidate-fenced repository for recording and marking a draft sent.
- Refuse viewed, declined, and completed callbacks on an unsent draft.
- No route, provider call, email, signature, or live data mutation.

## QA / Validation

- Red-first repository and draft-callback tests failed before implementation.
- Focused NDA tests, TypeScript, lint, release gates and PR CI are recorded on the PR.
- A temporary removal of the callback draft guard failed the behavior test; the guard was restored.
- The migration was executed only on a disposable local Postgres instance with fixture rows. It accepted a valid unsent draft and a valid send, and rejected hash mismatch, direct-sent insert, send after template retirement, and sent-timestamp rewrite. No shared database migration was run.

## Rollout Plan

Squash merge after applicable CI; let only the repo-owned ACA main workflow deploy code. Applying the migration to the shared Product/Lab database is a separate, specifically authorized repo-owned migration job. The new repository is not exposed by a route until that approval and a later send-path release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from the successful main deployment.
- ACA runtime invariant: verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: verify required worker jobs use the same approved digest.
- Feature/env flag update path: separate controlled release; none here.
- Live signed-in proof required: verify the NDA panel remains blocked without published Legal authority.

## Rollback Plan

Revert the product code through a PR and repo-owned deployment. Do not attempt an ad-hoc schema rollback after draft rows exist; keep the additive draft schema inert until a reviewed migration rollback is designed. No migration is applied by this release.

## Audit Evidence

PR diff and checks, focused behavior tests, callback mutation result, disposable local SQL result, official ACA deploy run, immutable runtime digest, and signed-in negative Stage 05 readback.

## Known Gaps

The route that obtains the exact Legal-published PDF, persists the draft before delivery, reconciles a send acknowledgement and enables the operator UI remains unbuilt. The shared migration remains unapplied until separately authorized.
