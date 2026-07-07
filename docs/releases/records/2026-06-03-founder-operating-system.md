# 2026-06-03-founder-operating-system — Founder Operating System

## Release ID

`2026-06-03-founder-operating-system`

## Status

`candidate`

## Plain-English Summary

Adds a founder operating-system runbook covering the remaining operational
readiness backlog rows for close-sprint bandwidth, founder cadence, trigger-
based hiring, and SaaS metrics discipline. It gives AbarVa a repeatable weekly,
monthly, and quarterly operating rhythm without pretending external adoption
has already happened.

## Layer Impact

- `internal-admin` lane: gives founder/operator workflows a controlled
  operating cadence, hire trigger plan, and monthly metrics packet standard.
- `public-demo`: no public route or buyer-facing page changes.

## Client Applicability

- All clients: indirectly, because stronger founder operations support pilot
  delivery and client readiness.
- Specific clients: none.
- Internal only: founder/operator operating model.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/runbooks/founder-operating-system.md`
- `scripts/ops/verify-founder-operating-system.mjs`
- `package.json`
- This release record.

## QA / Validation

- Pass: `npm run ops:founder-operating-system:verify`
- Pass: `node --check scripts/ops/verify-founder-operating-system.mjs`
- Pass: `git diff --check`
- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR path. After merge, the runbook becomes the
internal operating reference for T305, T106, T117, and T123.

## Rollback Plan

Revert the PR if the founder replaces the cadence, hire plan, or metrics
standard. No runtime, data-plane, customer UI, or migration rollback is needed.

## Audit Evidence

- Backlog rows: `T305`, `T106`, `T117`, `T123`.
- PR URL: pending.
- Local QA commands listed above.

## Known Gaps

- Founder approval and live adoption evidence remains open.
- The first real monthly metrics packet/dashboard must still be created with
  current values before T117 can be marked `Done`.
