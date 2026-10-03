# 2026-10-03-source-nda-demo-send-boundary — Governed Demo NDA Send

## Release ID

`2026-10-03-source-nda-demo-send-boundary`

## Status

`candidate`

## Plain-English Summary

An authenticated Source operator can request a synthetic NDA signing envelope only when the event has an accepted supplier, a published event-specific test template, and an approved active contact. The document bytes must match the published hash, name the canonical supplier legal entity, contain distinct test signing markers, and have no unresolved bracketed party placeholders. The provider first creates an unsent draft; the application records that draft before asking the provider to send. All demo recipients are routed through the configured internal test inbox. A failed or uncertain send is not retried automatically and never counts as executed NDA coverage.

## Layer Impact

- Release lane: `experimental`, off by default and restricted to the synthetic lab tenant.
- Layer 3 canonical model: reads governed supplier/contact identity and approved event contact authority; no canonical supplier fact is created or changed.
- Layer 4 Source: adds a lab-only envelope workflow action and status persistence. Envelope completion remains separate from reviewed executed-NDA authority.

## Client Applicability

- All clients: no new active send capability.
- Specific clients: none.
- Internal only: authenticated Source stage approvers in the synthetic lab tenant.
- Public/demo only: no public route; provider use is demo-environment-only.
- Feature flag: off unless all existing demo provider configuration values resolve.

## Changes Included

- New authenticated `POST /api/v1/source/[eventId]/nda/esign/send` route.
- Authority-bound PDF verification, provider draft/send service, and tenant/event-scoped draft repository.
- Focused refusal, ordering, route-fence and repository behavior tests.
- No new database migration. The previously applied envelope and draft-state schema is required.

## QA / Validation

- Red-first tests failed on absent service/route and then 6 of 7 service cases failed on missing authority/ordering behavior; the implementation made them pass. Replacing the action-time contact refusal with an always-false condition made the negative repository test fail, then the refusal was restored.
- Focused behavior/route suites, Node 24 TypeScript, scoped ESLint, release checks, and CI coverage/security inventories must pass before merge.
- No provider call, test email, live template, signature or signed-in phase exit is claimed by local QA.

## Rollout Plan

Squash-merge after applicable CI and review; only the repository-owned ACA main workflow deploys the image. The action remains unavailable without complete lab demo configuration and approved event evidence. Do not set production provider credentials or contact real suppliers through this route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this PR.
- Approved image digest: record after official deployment.
- ACA runtime invariant: independently verify web template and sole 100%-traffic revision at one immutable digest.
- Worker image invariant: both delivery-worker jobs must match that digest.
- Feature/env flag update path: existing repo-owned deploy inputs; no direct Container App update.
- Live signed-in proof required: yes, the exact synthetic NDA stage after deploy.

## Rollback Plan

Disable the demo provider through the repo-owned configuration path, leaving the existing upload fallback. Revert this route/service in a new PR and let the official main deploy replace the image. Preserve envelope rows and provider-side evidence for audit; do not delete or rewrite them.

## Audit Evidence

PR and CI URL, official ACA run, digest/revision/worker readback, focused test output, and signed-in NDA stage replay belong in the private smoke ledger. No live send evidence exists at candidate status.

## Known Gaps

The Stage 05 operator control, embedded signing link, declined/expired handling, provider configuration, template publication, approved contacts, executed-NDA filing and four-of-four signed-in close proof are separate slices. An uncertain provider/DB outcome is held as an unsent local draft for operator reconciliation; it is not retried or counted as coverage.
The existing synthetic NDA template fixture contains generic signature lines and an unresolved counterparty name rather than a concrete supplier-specific document with two distinct signing anchors. Four separate, visibly synthetic PDF versions with the correct canonical supplier names and both anchors must be reviewed and published for the four-candidate demo round trip. Reusing the generic template or swapping one supplier's document for another fails closed. A future governed document-assembly path is separate work before production use.
