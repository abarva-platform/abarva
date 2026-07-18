# 2026-07-18 Moves aVa Status Classifier Coverage

## Release ID

`2026-07-18-moves-ava-status-classifier-coverage`

## Status

`candidate`

## Plain-English Summary

Signed-in Meridian proof showed the normal "current gate status" and "what evidence is needed" questions now use the deterministic live Move answer, but diagnostic wording such as "live gate tally" and "checklist status" still fell through to the generic context-bundle path. This change widens the deterministic classifier so those status phrases use the same live Move packet.

## Layer Impact

- `global-control-lane`: changes shared Moves aVa question classification for status/gate-readiness wording.
- No schema, data-layer, ingestion, tenant-data, or gate-approval behavior changed.

## Client Applicability

- All clients: no.
- Specific clients: tenants with `moves_ava_chat_hardening` enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening`.

## Changes Included

- `src/lib/programs/ava-chat/answer-modes.ts`: routes "gate tally" and "checklist status" phrases to `gate_blocker`.
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`: covers the failed diagnostic proof wording.

## QA / Validation

- Pass: focused Jest for Moves aVa packet and quality-gate tests.
- Pass: focused ESLint for classifier and packet test files.
- Pass: full TypeScript validation with increased heap.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Not-run: PR checks.
- Not-run: ACA deploy.
- Not-run: signed-in Meridian production proof.

## Rollout Plan

Open a PR, squash merge to main, allow the repo-owned ACA main deploy workflow to build and deploy the image, then rerun the signed-in Meridian Moves aVa proof including diagnostic wording.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required during deploy.
- Worker image invariant: required during deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR. Because this only changes deterministic question classification, rollback is runtime-only.

## Audit Evidence

- Partial-pass proof after #5021: `/Users/anand/Projects/nexus/proof/moves-phase-intel-s1d-live-2026-07-18T15-37-19-009ZZ`.
- PR URL: pending.
- ACA deploy run: pending.
- Post-deploy signed-in proof: pending.

## Known Gaps

- This does not redesign the Moves phase UX or the broader Phase Intelligence tab.
