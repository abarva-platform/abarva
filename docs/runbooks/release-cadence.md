# Release Cadence Runbook

## Purpose

Use this runbook to keep AbarVa releases predictable for pilots and security
review. The cadence is intentionally simple: planned maintenance windows for
risky work, release notes for every shipped change, and explicit evidence when
there is no client impact.

## Default Cadence

| Item | Default | Owner |
| --- | --- | --- |
| Planned maintenance window | Saturday, 8:00-10:00 p.m. Central Time | Release owner |
| Release notes | Every Friday, even when there is no production change | Release owner |
| Emergency release window | Any time for SEV-1/SEV-2 containment | Incident commander |
| Pilot client notice | At least 2 business days before planned client-impacting work | Client owner |

## Release Lane Rules

Every PR must classify the release lane before merge:

- `global-control-lane`: shared application/control-plane behavior.
- `client-data-lane`: client-scoped data-plane, schema, ingestion, retrieval, or
  private data-plane behavior.
- `internal-admin`: AbarVa-only admin or operations capability.
- `public-demo`: public pages, demo paths, founder artifacts, or investor-facing
  surfaces.
- `experimental`: feature-flagged or non-default capability.

If the change is release-relevant, attach a release record under
`docs/releases/records/` and run:

```bash
npm run release:check -- --base origin/main --head HEAD
```

## Weekly Release Notes

Release notes should be short and auditable. Include:

- PR number and release record.
- Layer impact and affected clients.
- Validation performed.
- Rollout method.
- Rollback path.
- Known gaps or deferred follow-ups.

If nothing shipped, record `No production changes this week` with the date and
the validation or monitoring evidence reviewed.

## Planned Maintenance Checklist

Use this checklist for migrations, auth changes, ingestion changes, data-plane
changes, or any change that can affect pilot client workflows.

- [ ] Release owner named.
- [ ] Release lane and affected clients confirmed.
- [ ] Client notice drafted when client workflows may be unavailable.
- [ ] Rollback runbook reviewed.
- [ ] Database migration runbook reviewed if schema/data changes are included.
- [ ] Post-deploy smoke check identified.
- [ ] Support/incident channel monitored during the window.
- [ ] Release record updated with final evidence.

## Emergency Release Checklist

Emergency releases are allowed for containment, security, privacy, availability,
or tenant-isolation risk. They still need evidence.

1. Open or link the incident record.
2. Identify the smallest safe change.
3. Run the narrowest meaningful validation before merge.
4. Record the skipped checks and why they were safe to defer.
5. Add a follow-up item for any deferred validation.
6. Send a plain-English status update after containment.

## Evidence To Attach

- PR URL and commit SHA.
- Release record path.
- CI/check summary.
- Deployment URL or deployment id.
- Smoke-test output or manual verification notes.
- Client notice, if applicable.
- Rollback decision or reason rollback was not needed.

## Out Of Scope

This runbook does not create an external status page or customer notification
system. It defines the operating cadence and evidence package until those tools
are added.
