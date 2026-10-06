# 2026-10-03-source-nda-demo-embedded-link - Demo NDA Embedded Signing

## Release ID

`2026-10-03-source-nda-demo-embedded-link`

## Status

`candidate`

## Plain-English Summary

An authorized internal operator can choose a separate embedded-delivery mode for a synthetic NDA envelope and request a short-lived recipient signing link. Link issuance rechecks the accepted supplier, approved active contact, published template, recorded sent envelope and exact document hash. Email delivery remains the default and cannot be converted into an embedded recipient view.

## Layer Impact

- Release lane: `experimental`, restricted to the synthetic lab tenant and demo provider.
- Layer 3 canonical model: reads supplier and contact authority; no supplier fact is written.
- Layer 4 Source: adds a lab-only recipient-view action; it does not record execution or NDA coverage.

## Client Applicability

- All clients: no new active signing capability.
- Specific clients: none.
- Internal only: authenticated Source stage approvers in the synthetic lab tenant.
- Public/demo only: no public route; provider use remains demo-environment-only.
- Feature flag: off unless existing demo provider configuration is complete.

## Changes Included

- Explicit email or embedded delivery selection on the existing NDA send route.
- Stable recipient identity for embedded demo envelopes.
- Authenticated `POST /api/v1/source/[eventId]/nda/esign/link` route and tenant/event-scoped envelope readback.
- Focused refusal tests for wrong tenant, retired authority, mismatched document, email-mode confusion and foreign signing URLs.
- No migration or shared runtime configuration change.

## QA / Validation

- Red-first service and route tests exercised the absent link boundary and email-to-embedded confusion. A text-to-UUID comparison against the provider envelope ID was caught and corrected.
- Focused tests, Node 24 typecheck, scoped ESLint, release checks and applicable hosted CI must pass before merge.
- No provider call, signature, executed NDA or phase exit is claimed by local QA.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repository-owned ACA main workflow deploys the image. The default email mode and manual upload fallback remain unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this PR.
- Approved image digest: record after official deployment.
- ACA runtime invariant: independently verify the web template, sole 100%-traffic revision and both worker jobs at one immutable digest.
- Live signed-in proof required: yes, replay the synthetic NDA stage after deploy.

## Rollback Plan

Disable the demo provider through the repo-owned configuration path or revert the route and delivery-mode selection in a new PR, then let the official main workflow replace the image. Preserve envelope rows and provider evidence for audit.

## Audit Evidence

PR and CI URL, official ACA run, digest/revision/worker readback, focused test output and signed-in stage replay belong in the private smoke ledger.

## Known Gaps

The embedded path is distinct from the default email round trip. The Stage 05 operator control, declined/expired handling, provider configuration, template publication, approved contacts, actual signed files and four-of-four coverage remain separate proof steps.
