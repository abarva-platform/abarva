# 2026-06-01-resilience-compliance-docs - Resilience and Compliance Runbooks

## Release ID

`2026-06-01-resilience-compliance-docs`

## Status

`candidate`

## Plain-English Summary

Adds pilot-readiness documentation for predictable release cadence, disaster
recovery, data return/deletion, encryption posture, and the decision to keep
the multi-tenant control plane on Vercel while client data planes remain in
Azure.

## Layer Impact

Internal-admin layer: adds operating runbooks for release cadence, disaster
recovery, and data return/deletion.

Global-control lane documentation: records the Vercel control-plane posture and
baseline encryption posture for security review.

## Client Applicability

- All clients: Documentation applies to all pilots and future client reviews.
- Specific clients: None.
- Internal only: Primary audience is AbarVa operators and security reviewers.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/runbooks/release-cadence.md`.
- Adds disaster recovery and data return/deletion runbooks.
- Adds encryption posture documentation.
- Adds ADR-0007 for Vercel control-plane posture and updates the ADR index.

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: ASCII scan for touched docs with `LC_ALL=C rg -n "[^\\x00-\\x7F]" ...`

## Rollout Plan

Merge to `main`. These are documentation-only operating controls; no runtime,
database, or deployment migration is required.

## Rollback Plan

Revert the PR to remove the added documents and ADR index entry. No runtime or
data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Release record:
  `docs/releases/records/2026-06-01-resilience-compliance-docs.md`.
- Runbooks and ADR added by this release.

## Known Gaps

This PR documents the operating posture. It does not provision an external
status page, run an actual DR drill, bind insurance, or change live cloud
configuration.
