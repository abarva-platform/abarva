# 2026-10-05 Source lab NDA contact control

## Release ID

`2026-10-05-source-lab-nda-contact-control`

## Status

`candidate`

## Plain-English Summary

The synthetic-lab NDA panel now offers an event contact decision when an accepted supplier has an active, contact-allowed canonical contact. The operator selects a contact, enters a decision rationale, and confirms that the authority applies to event NDA and RFx use. Signing controls appear only after the approved authority is read back. This action itself sends no email or envelope.

## Layer Impact

- Release lane: `experimental` (synthetic-lab-only operator workflow).
- Layer 3 canonical model: reads tenant-scoped supplier contacts; no canonical contact mutation.
- Layer 4 Source: records the existing event-specific contact authority and projects its readiness in the NDA panel.

## Client Applicability

- All clients: no new operator control.
- Specific clients: synthetic lab tenant only.
- Internal only: signed-in Source stage approvers.
- Public/demo only: synthetic lab workflow.
- Feature flag: existing demo e-signature configuration; upload fallback remains.

## Changes Included

- Extend the NDA operator status projection with eligible active internal-domain contacts only.
- Present a single contact-approval action before the existing signing controls.
- Reuse the existing contact-approval API; no route, schema, or provider change.

## QA / Validation

- Focused operator-status and NDA-panel suites: 23 tests passing, including external-address refusal.
- Red-first tests failed before implementation.
- Mutation proof: removing confirmation from approval-button readiness makes the new interaction test fail.
- Node 24 TypeScript check and scoped ESLint passed locally.
- Hosted CI and signed-in runtime replay are pending.

## Rollout Plan

Squash-merge after applicable CI and review, then use only the repo-owned ACA main deploy workflow. No migration, data load, contact approval, provider send, or email is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: verify template, 100% traffic revision, and required workers after deploy.
- Worker image invariant: same immutable digest as web.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the synthetic NDA contact control.

## Rollback Plan

Revert this UI/projection change through a PR and redeploy through the same workflow. Existing event contact-authority records are not silently reversed; operator review is required for any recorded decision.

## Audit Evidence

PR, hosted CI, official deploy run, digest/runtime readback, and signed-in interaction record to be added after those steps occur.

## Known Gaps

Synthetic template publication, human contact decision, demo signature, webhook completion, executed-NDA review, and stage exit remain separate actions and are not claimed by this release.
