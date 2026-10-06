# 2026-10-03-source-nda-demo-email-routing - Internal inbox delivery mode

## Release ID

`2026-10-03-source-nda-demo-email-routing`

## Status

`candidate`

## Plain-English Summary

The demo e-signature adapter can prepare an email-delivered envelope for fictional signers. Every recipient address is rewritten to an alias of the configured internal test inbox. No send action is added by this release.

## Layer Impact

- Release lane: `experimental` (lab-only, disabled by default).
- Layer 3: no canonical supplier, contract, NDA or approval fact changes.
- Layer 4: Source provider delivery options and deployment configuration validation only.

## Client Applicability

- All clients: no active signing change.
- Specific clients: none.
- Internal only: lab configuration and test inbox.
- Public/demo only: synthetic signing mode, never a production supplier destination.
- Feature flag: the existing provider remains disabled by default.

## Changes Included

- Allows email signers in the demo adapter without an embedded recipient identity; preserves embedded signing behavior.
- Requires the configured test inbox to be on the internal domain at runtime, inside the adapter, and in the repo-owned deployment preflight.
- Continues to replace all original signer addresses with deterministic test-inbox aliases before a provider request.
- Does not create an envelope, send email, approve an NDA, or change a stage gate.

## QA / Validation

- PASS: red-first tests showed the old adapter rejected email signers and accepted an external test-inbox domain.
- PASS: two deliberate regressions, weakening the inbox guard and including an embedded identity for an email signer, were each caught by focused tests and restored.
- PASS: 25 focused behavior and deployment tests, Node 24 TypeScript, scoped ESLint and shell syntax.
- NOT RUN: applicable PR CI and review are pending; results will be recorded in the PR.
- NOT RUN: no provider send or Outlook inbox receipt is claimed from local tests.

## Rollout Plan

Squash-merge after applicable checks and review. Only the repo-owned ACA main workflow may deploy an approved digest. Leave the provider disabled until a governed Legal-published PDF, authorized send path and signed-in synthetic round trip are separately proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: prove after deployment; not yet known.
- ACA runtime invariant: verify web template, sole 100%-traffic revision and required worker images match one immutable digest.
- Worker image invariant: required after deployment.
- Feature/env flag update path: unchanged; disabled is the default.
- Live signed-in proof required: yes, after the send and review slices and authorized schema apply.

## Rollback Plan

Keep the provider disabled or redeploy the prior approved digest through the repo-owned workflow. Preserve any previously staged private evidence.

## Audit Evidence

The PR contains the focused test results, mutation proof and release checks. Official ACA and signed-in evidence are separate post-merge records.

## Known Gaps

The envelope schema remains unapplied. This release does not bind a Legal-published PDF to the send path, create an envelope, configure Connect, prove inbox receipt, or file an executed NDA.
