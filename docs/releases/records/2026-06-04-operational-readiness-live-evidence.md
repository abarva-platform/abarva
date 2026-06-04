# 2026-06-04-operational-readiness-live-evidence — Operational Readiness Live Evidence Runbook

## Release ID

`2026-06-04-operational-readiness-live-evidence`

## Status

`candidate`

## Plain-English Summary

Adds an Operational Readiness live evidence runbook for the remaining open rows: hosted demo proof, disaster drill proof, OFAC screening evidence, founder close-sprint acknowledgement, hire-plan approval, and founder cadence evidence. It names what evidence is required before those rows can move from In progress to Done.

## Layer Impact

- `internal-admin`: Adds operator-facing evidence capture guidance and a verifier for Operational Readiness closure discipline.
- `global-control-lane`: Documents evidence expectations for demo operations, disaster drills, screening, and founder operating controls. No runtime behavior changes.

## Client Applicability

- All clients: The operating evidence model applies before pilot claims are made.
- Specific clients: None.
- Internal only: The runbook and verifier are for AbarVa operators and founder cadence.
- Public/demo only: T110 applies to synthetic demo environment evidence only.
- Feature flag: None.

## Changes Included

- `docs/runbooks/operational-readiness-live-evidence.md`
- `scripts/ops/verify-operational-readiness-live-evidence.mjs`
- `docs/releases/records/2026-06-04-operational-readiness-live-evidence.md`

## QA / Validation

- Pass: `node scripts/ops/verify-operational-readiness-live-evidence.mjs`
- Pass: `node --check scripts/ops/verify-operational-readiness-live-evidence.mjs`
- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR and merge queue. No runtime rollout, migration, data load, feature flag, or production deploy is required.

## Rollback Plan

Revert the PR if the evidence model conflicts with the active Operational Readiness tracker. No production rollback is required because this is documentation and verifier only.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Local verifier output from `node scripts/ops/verify-operational-readiness-live-evidence.mjs`.
- Release check output from `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

This runbook does not close the six Operational Readiness rows by itself. Done still requires hosted demo route/auth/reset evidence, a retained disaster drill, a live/manual OFAC screening record, and founder acknowledgement or approval evidence.
