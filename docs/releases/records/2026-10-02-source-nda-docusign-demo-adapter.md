# 2026-10-02-source-nda-docusign-demo-adapter — Demo-only NDA provider adapter

## Release ID

`2026-10-02-source-nda-docusign-demo-adapter`

## Status

`candidate`

## Plain-English Summary

Adds an optional DocuSign demo adapter behind the existing NDA e-signature interface. It signs JWT assertions with a pinned Azure Key Vault key instead of holding private-key bytes, sends hash-pinned PDF documents to a demo account, rewrites all recipients to a configured test inbox, verifies Connect HMAC on raw webhook bytes, and reads completed PDFs and certificates only after provider completion. The authenticated capability route constructs the adapter for valid demo configuration without sending anything. There is no product send route or live callback in this release; existing executed-document upload remains the only active path.

## Layer Impact

- Release lane: `experimental`.
- Layer 4 Products: internal Source NDA provider implementation and tests; no default UI or send path.
- Layer 3 Canonical Model: no canonical authority row or commercial fact change.
- Layer 2 Source Adapters: no client-intake adapter change.

## Client Applicability

- All clients: no behavior change while the optional provider is unused.
- Specific clients: none.
- Internal lab: the adapter refuses non-demo use and rewrites every signer address to the configured test inbox.
- Feature flag: not activated by this release.

## Changes Included

- DocuSign demo JWT, envelope, recipient view, HMAC, and completed-document adapter.
- The provider interface passes event and canonical supplier identity to the recipient-view call so it derives the exact email alias used when sending.
- Verified webhook events carry only provider envelope ID and status; tenant/event identity must be resolved from the persisted, tenant-fenced envelope by the future callback handler.

## QA / Validation

- Red-first missing-adapter test followed by 20 focused provider/configuration/route tests.
- Negative cases cover altered document bytes, non-demo tenants, signer placement, external callback URLs, invalid HMAC, and mismatched provider account.
- Deliberately changing the send address back to the caller-provided supplier address failed two tests, then the rewrite was restored.
- TypeScript, scoped ESLint, release checks, and applicable CI are recorded with the PR.
- No live DocuSign call was made in tests; the actual demo round trip remains unproven.

## Rollout Plan

Merge through a PR; only the repo-owned ACA main workflow deploys shared runtime images. No runtime flag, provider credential, email, or envelope is created by this release. Future routes may instantiate this adapter only after the tenant and demo configuration guard passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main workflow.
- ACA runtime invariant: check the template image, 100%-traffic revision, and required worker images after deployment.
- Live signed-in proof required: later send/webhook slice, not claimed here.

## Rollback Plan

Revert this PR through a PR. No provider or database state exists to unwind.

## Audit Evidence

- Focused tests, negative/mutation proof, PR checks, and official deploy run when available.

## Known Gaps

Envelope persistence, send-route authority, webhook idempotency/filing, embedded signing UI, provider configuration, and signed-in demo acceptance are separate slices. The provider's recorded fixtures need final reconciliation with the account's live Connect payload during that acceptance run.
