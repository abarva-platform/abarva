# 2026-10-02-source-nda-esign-contract — Optional NDA e-signature boundary

## Release ID

`2026-10-02-source-nda-esign-contract`

## Status

`candidate`

## Plain-English Summary

Adds a provider-neutral contract and in-memory test provider for optional NDA e-signature work. The feature remains off by default; existing executed-document upload is unchanged. A configuration guard permits only the declared lab tenant with the demo provider environment and a pinned signing-key location. An authenticated, read-only route reports whether the capability is available without exposing configuration identifiers. No envelope can be sent by this release.

## Layer Impact

- Release lane: `experimental`.
- Layer 4 Products: Source gets an internal interface, configuration check, and authenticated availability route; no send or signing page uses them yet.
- Layer 3 Canonical Model: no schema, authority row, or canonical fact changes.

## Client Applicability

- All clients: no user-visible change; the new capability route returns unavailable unless configured.
- Specific clients: none.
- Internal only: test and development code.
- Public/demo only: future demo integration is constrained to the declared lab tenant.
- Feature flag: off unless explicitly configured; even then no caller exists in this release.

## Changes Included

- `src/lib/source/esign/provider.ts` and `config.ts`, plus a test-only in-memory provider.
- Authenticated `nda/esign/status` route and focused behavior tests.
- No migration, provider request, email, or runtime configuration change.

## QA / Validation

- Red-first missing-module and missing-route tests, then 11 passing behavior cases.
- Mutation removing the tenant guard failed the cross-tenant demo test; the guard was restored.
- TypeScript, scoped ESLint, orphan audit, tenancy-fence census, release checks and CI results are recorded with the PR.

## Rollout Plan

Merge through a PR. The repo-owned ACA main workflow deploys code, but nothing activates until later reviewed slices and separate configuration are in place.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main workflow.
- ACA runtime invariant: check template, 100%-traffic revision, and required workers after deployment.
- Worker image invariant: match the approved digest.
- Feature/env flag update path: separate reviewed mainline change; not this PR.
- Live signed-in proof required: later send/webhook slice, not claimed here.

## Rollback Plan

Revert this PR through a PR. No database or provider state needs rollback.

## Audit Evidence

- PR, local test log, CI checks, and official deploy run when available.

## Known Gaps

No DocuSign adapter, envelope persistence, send route, production webhook, signed document filing, embedded signing, or signed-in round trip is included.
