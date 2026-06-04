# 2026-06-04-architecture-live-evidence-capture — Architecture Live Evidence Capture Runbook

## Release ID

`2026-06-04-architecture-live-evidence-capture`

## Status

`candidate`

## Plain-English Summary

Adds an Architecture live evidence capture runbook that turns the remaining Architecture backlog rows into an ordered evidence execution path. It does not claim the rows are Done. It names the live Azure, Clerk, Anthropic, parser, status-provider, and external-vendor proof required before the tracker can close those rows.

## Layer Impact

- `internal-admin`: Adds operator-facing evidence capture guidance and a verifier for backlog governance.
- `global-control-lane`: Documents evidence expectations for shared identity, tenant isolation, audit, upload, parsing, usage, ops, status, and assurance controls. No runtime behavior changes.

## Client Applicability

- All clients: The evidence model applies to every client environment before closure claims are made.
- Specific clients: None.
- Internal only: The runbook and verifier are for AbarVa operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/ARCHITECTURE_LIVE_EVIDENCE_CAPTURE_2026-06-04.md`
- `scripts/architecture/verify-architecture-live-evidence-capture.mjs`
- `docs/releases/records/2026-06-04-architecture-live-evidence-capture.md`

## QA / Validation

- Pass: `node scripts/architecture/verify-architecture-live-evidence-capture.mjs`
- Pass: `node --check scripts/architecture/verify-architecture-live-evidence-capture.mjs`
- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR and merge queue. No runtime rollout is required because this is an operator documentation and governance verifier change.

## Rollback Plan

Revert the PR if the evidence model conflicts with the active Architecture closure-control packet. No data migration, feature flag, or production deploy rollback is required.

## Audit Evidence

- PR URL after opening.
- CI checks after PR creation.
- Local verifier output from `node scripts/architecture/verify-architecture-live-evidence-capture.mjs`.
- Release check output from `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

This runbook does not close the Architecture rows by itself. Done still requires live or external evidence for Azure, Clerk, Anthropic, status-provider, parser fallback, immutable audit log, malware scanning, and external pen-test work.
