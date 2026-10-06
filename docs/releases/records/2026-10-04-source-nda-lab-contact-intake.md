# 2026-10-04-source-nda-lab-contact-intake - Fictional NDA Contact Intake

## Release ID

`2026-10-04-source-nda-lab-contact-intake`

## Status

`candidate`

## Plain-English Summary

Adds a controlled path to validate four fictional NDA test-signer contacts before any data load. The default job only checks a hash-pinned input and emits proof. The exact input now has a named-person load approval; a later apply still requires the operator confirmation, a private Blob proof target, and matching canonical supplier identities.

## Layer Impact

- Release lane: `client-data-lane` for a synthetic lab-only canonical contact intake path. The manual operator workflow is `internal-admin` control, not an end-user route.
- Layer 1: a declared, synthetic lab-only contact extract with a governance manifest.
- Layer 2: an operator-only adapter validates and can load the exact extract into the canonical contact table after separate approval.
- Layer 3: no canonical rows are changed by this release alone; a later approved job may insert only the four declared contacts. No event approvals or NDA evidence are written.
- Layer 4: no product surface is changed.

## Client Applicability

- All clients: no contact data change.
- Specific clients: none.
- Internal only: the manual operator workflow.
- Public/demo only: the declared lab fixture, not real supplier contacts.
- Feature flag: none; apply remains approval-gated and off by default.

## Changes Included

- Synthetic contact CSV and dataset manifest with exact-hash load approval.
- Hash-checked dry-run/apply adapter, exact-row replay protection, Blob proof readback, and manual ACA operator workflow.
- Behavioral tests and proof validation.

## QA / Validation

- PASS: red-first behavior covered a post-validation plan edit; the apply path now rejects it before opening a transaction.
- PASS: seven focused tests cover exact four-row planning, wrong tenant/hash/contact identity, canonical supplier mismatch, exact replay, apply contract and manifest load approval.
- PASS: two Node tests cover proof validation and the manual-only, hash-pinned workflow boundary.
- PASS: deliberate removal of the post-validation plan guard made the focused suite fail; restoring it returned the suite to green.
- PASS: local dry run reported four validated contacts, zero inserts and `committed: false`.
- PASS: Node 24 TypeScript with an 8 GB heap, scoped ESLint, and manifest validation.
- PASS: the repo-owned operator dry run validated the exact input and committed no rows (run 37173841371).
- NOT RUN: data apply and post-apply signed-in readback remain separate evidence.

## Rollout Plan

Squash merge through a PR. Only the repo-owned ACA main workflow builds and deploys the image. The operator workflow is manual-only and dry-run by default. Its apply mode may run only after the exact-scope data-load authorization and this named-person manifest load approval are both present in the deployed operator image. The apply path refuses to proceed if the private Blob proof target is absent.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be verified after the official main deploy.
- ACA runtime invariant: web template, 100%-traffic revision, and required workers must match the approved digest before runtime claims.
- Worker image invariant: verify separately; this release does not alter worker code.
- Feature/env flag update path: none.
- Live signed-in proof required: the NDA phase still requires a signed-in Stage 05 readback; this adapter alone does not satisfy it.

## Rollback Plan

Do not run apply. For a deployed code regression, revert through a PR and official main deploy. If a separately approved future apply inserts rows, reconcile those exact contact IDs through a separate reviewed data operation; code rollback alone does not remove canonical rows.

## Audit Evidence

- Code PRs #8954 and #8959 merged; official ACA main run 37173817384 deployed their descendant SHA. The separate approval-record PR and its deploy are still pending.
- Operator dry-run proof: manual run 37173841371 completed successfully for the exact input hash with no committed rows. No apply proof exists yet.
- Non-secret load approval reference: `SOURCE-NDA-LAB-CONTACTS-20261004`.
- Exact fixture hash: `269f6b7c6224737a9007d51032c77d1ea1bb115331ae4b8db65387266b87b06a`.

## Known Gaps

- The exact-hash load approval is recorded, but this release does not itself apply the data.
- No canonical contact rows, event contact approvals, provider emails, or signed NDAs are claimed by this release record.
