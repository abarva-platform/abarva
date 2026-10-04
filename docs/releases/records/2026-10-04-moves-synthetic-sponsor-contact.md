# 2026-10-04 — Synthetic Moves Sponsor Contact Fixture

## Release ID

`2026-10-04-moves-synthetic-sponsor-contact`

## Status

`candidate`

## Plain-English Summary

The offline synthetic P1 evidence kit now includes a clearly synthetic, non-deliverable sponsor role contact. The fixture states that no external email is sent and that the contact has no in-product approval authority.

## Layer Impact

- **Release lane: `public-demo`** — offline synthetic QA material only.
- **Layer 4 — Products:** fixture and validator coverage only; no runtime product behavior changes.
- **Governance:** the package remains synthetic, Move-scoped, pending human review when uploaded, and not agent-ready.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: Synthetic QA package and validator.
- Public/demo only: Yes; offline fixtures only.
- Feature flag: None.

## Changes Included

- Add a role-alias contact using the reserved `.invalid` domain and an explicit no-email preference to the P1 decision record.
- Version the offline package as `1.0.2` and test that the contact remains synthetic and informational.

## QA / Validation

- `npm run test:moves:adaptive-e2e-kit` — 9 tests passed; 14-file allowlist and estimate arithmetic validated.
- `git diff --check` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — all 11 gates passed.

## Rollout Plan

Merge through the protected PR workflow. No runtime deployment or data load is part of this change. The file may be uploaded only by a signed-in operator to a deliberately selected synthetic Move and must remain pending until human review.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no runtime files changed.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No runtime behavior changed.

## Rollback Plan

Revert the fixture PR to restore the prior offline evidence text and package version. No database, tenant state, or runtime rollback is required.

## Audit Evidence

- Associated PR and CI checks.
- `npm run test:moves:adaptive-e2e-kit` output and this task's private checkpoint ledger.

## Known Gaps

This change does not upload evidence, approve a review, send email, or advance a Move. Those remain separate governed workflow actions.
