# 2026-10-04-source-nda-terminal-envelope - NDA terminal envelope state

## Release ID

`2026-10-04-source-nda-terminal-envelope`

## Status

`candidate`

## Plain-English Summary

The demo NDA workflow records a provider-voided envelope as a distinct terminal state. A voided or declined envelope remains uncovered and cannot later become a completed envelope through a delayed callback. A subsequent send requires a new envelope and the same current supplier, contact and template checks. The existing upload and reviewed executed-NDA path remains unchanged.

## Layer Impact

- Release lane: `client-data-lane` schema guard with an `experimental` demo-only provider path.
- Layer 3 canonical model: no supplier or contact fact is written.
- Layer 4 Source: provider envelope workflow state gains a voided timestamp; no NDA authority is granted by that state.

## Client Applicability

- All clients: no new provider action is enabled.
- Specific clients: none.
- Internal only: synthetic lab provider callbacks when configured.
- Public/demo only: no new public route.
- Feature flag: existing demo provider configuration remains off by default.

## Changes Included

- Accept only signed, account-matched provider void callbacks.
- Persist a terminal, immutable voided state with a separate timestamp and no completion artifacts.
- Preserve idempotency on duplicate terminal callbacks and refuse late completion after void/decline.
- Leave completed-envelope authority unchanged: signed files require separate review.

## QA / Validation

- Red-first adapter, processor, repository and migration tests; a removed void branch was mutation-tested and failed the completion-path assertion.
- Focused tests, typecheck, lint, release gates and applicable hosted migration replay must pass before merge.
- The migration is authored only. Shared database apply needs separate authorization for this exact filename.
- No provider send, signature or live NDA coverage follows from these tests.

## Rollout Plan

Merge only after applicable CI and review. The code path stays inactive until demo provider configuration; apply `20261004002000_source_nda_esign_voided_state.sql` only through the repo-owned lab migration workflow after exact-file authorization and pending-set verification. Only the repo-owned ACA main workflow may update shared web and worker images.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this PR.
- Approved image digest and runtime invariant: record after official deployment.
- Live signed-in proof required: yes; verify void/decline display and negative NDA coverage after schema apply.

## Rollback Plan

Disable demo provider through the approved configuration path or revert the runtime code in a new PR. Do not delete terminal rows. A schema rollback would need a separately reviewed forward migration after reconciling any voided rows.

## Audit Evidence

PR/CI, migration preflight/apply ledger, immutable runtime digest, signed-in readback and provider event evidence belong in the private smoke ledger.

## Known Gaps

The live synthetic event has no applicable published template or approved active contact authority. Provider identifiers and OAuth consent are not yet proven. This slice does not establish four-of-four signed NDA coverage or supplier outreach permission.
