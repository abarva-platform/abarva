# 2026-10-03-source-nda-stage05-operator-control - Demo NDA Operator Control

## Release ID

`2026-10-03-source-nda-stage05-operator-control`

## Status

`candidate`

## Plain-English Summary

Stage 05 shows an individual signing action and envelope status for each accepted supplier in the synthetic lab event. The send control remains disabled until the demo provider is configured, a published template is selected, an approved active contact exists, and the operator confirms internal test-inbox delivery. The existing upload and executed-document review path remains available. A sent or completed envelope is never presented as NDA coverage.

## Layer Impact

- Release lane: `experimental`, synthetic lab tenant only for sending.
- Layer 3 canonical model: reads declared supplier-contact identity and policy; writes no canonical supplier or contact fact.
- Layer 4 Source: reads event-scoped contact/envelope workflow state and presents a guarded demo send action.

## Client Applicability

- All clients: no new provider send capability; existing upload fallback remains.
- Specific clients: none.
- Internal only: authenticated Source stage approvers in the synthetic lab tenant.
- Public/demo only: no public route.
- Feature flag: off unless existing demo provider configuration is complete.

## Changes Included

- Tenant/event-scoped operator readback of accepted candidates, approved active contacts and latest demo envelopes in one session.
- Extension of the authenticated NDA capability route to return that limited readback for the synthetic lab tenant.
- Per-supplier Stage 05 send/status UI placed before the detailed evidence list, with green ready and gray disabled buttons.
- Resolve the event page's declared app-client alias to its canonical tenant before selecting the synthetic-lab control; other tenants remain ineligible.
- The existing upload and reviewed executed-NDA form stay in place.
- No migration, canonical contact write or external supplier-domain delivery.

## QA / Validation

- Red-first repository, route and UI tests cover wrong tenant, missing contact, disabled provider, explicit confirmation, envelope status and uncertain send outcomes.
- Signed-in Stage 05 replay exposed an app-client alias mismatch that hid the lab publication action. A red-first alias test reproduced it; the canonical-key fix preserves the other-tenant refusal.
- Focused tests, Node 24 typecheck, scoped ESLint, generated census checks, release gates and applicable hosted CI must pass before merge.
- No live provider send, signature, executed NDA or phase exit is claimed by local QA.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repository-owned ACA main workflow deploys the image. The action remains disabled for absent authority or provider configuration; no data job or provider operation is started by deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this PR.
- Approved image digest: record after official deployment.
- ACA runtime invariant: independently verify the web template, sole 100%-traffic revision and both worker jobs at one immutable digest.
- Live signed-in proof required: yes, replay the synthetic NDA stage after deploy.

## Rollback Plan

Disable the demo provider through the repo-owned configuration path or revert the UI and readback in a new PR, then let the official main workflow replace the image. Preserve envelope and executed-NDA records for audit.

## Audit Evidence

PR and CI URL, official ACA run, digest/revision/worker readback, focused test output and signed-in Stage 05 replay belong in the private smoke ledger.

## Known Gaps

The live synthetic event currently lacks a published template and approved active contacts. Contact identity belongs to canonical intake and cannot be invented by this Source projection. Provider configuration, actual demo signing, certificate filing, declined/expired handling and four-of-four coverage are separate proof steps.
