# 2026-10-04-source-nda-lab-contact-intake - Fictional NDA Contact Intake

## Release ID

`2026-10-04-source-nda-lab-contact-intake`

## Status

`candidate`

## Plain-English Summary

Adds a controlled path to validate four fictional NDA test-signer contacts before any data load. The default job only checks a hash-pinned input and emits proof. A later apply requires a separate named-person load approval for the exact input, an operator confirmation, a private Blob proof target, and matching canonical supplier identities.

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

- Synthetic contact CSV and draft dataset manifest.
- Hash-checked dry-run/apply adapter, exact-row replay protection, Blob proof readback, and manual ACA operator workflow.
- Behavioral tests and proof validation.

## QA / Validation

- PASS: red-first behavior covered a post-validation plan edit; the apply path now rejects it before opening a transaction.
- PASS: seven focused tests cover exact four-row planning, wrong tenant/hash/contact identity, canonical supplier mismatch, exact replay, apply contract and manifest load approval.
- PASS: two Node tests cover proof validation and the manual-only, hash-pinned workflow boundary.
- PASS: deliberate removal of the post-validation plan guard made the focused suite fail; restoring it returned the suite to green.
- PASS: local dry run reported four validated contacts, zero inserts and `committed: false`.
- PASS: Node 24 TypeScript with an 8 GB heap, scoped ESLint, and manifest validation.
- NOT RUN: hosted checks, ACA operator dry run, data apply, and signed-in readback are separate evidence.

## Rollout Plan

Squash merge through a PR. Only the repo-owned ACA main workflow builds and deploys the image. The operator workflow is manual-only and dry-run by default. Its apply mode must not be dispatched without a separate exact-scope data-load authorization and a committed named-person manifest load approval for this input hash. The apply path refuses to proceed if the private Blob proof target is absent.

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

- PR, CI and official ACA run links: to be filled after execution.
- Operator dry-run proof: to be captured separately; no apply proof exists yet.
- Exact fixture hash: `269f6b7c6224737a9007d51032c77d1ea1bb115331ae4b8db65387266b87b06a`.

## Known Gaps

- The dataset manifest intentionally lacks `load_approval`; apply must fail until a named person approves the exact source hash after review.
- No canonical contact rows, event contact approvals, provider emails, or signed NDAs are claimed by this code release.
