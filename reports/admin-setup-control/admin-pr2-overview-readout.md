# ADMIN-PR2 Overview Readout

## Purpose

The Admin Overview is now a Tenant Setup and Data Control Center instead of a
generic readiness checklist.

## What the First Screen Shows

- Uploaded evidence count and a reminder that evidence is not active context.
- Candidate tenant data version status.
- Active Tenant Access Layer status.
- Module readiness across Home, Intelligence, Moves, Source, and Tower.
- Promotion blockers.
- Production/write/runtime guardrails.
- Source-of-truth caveats.

## Truth Split

- Uploaded files are evidence sources.
- Candidate data is not created by this overview.
- Active tenant access is not updated by this overview.
- Modules are not marked ready from files alone.
- Promotion remains disabled until later Admin workstream PRs add candidate
  preview, proof bundles, approval, rollback, and explicit promotion.

## Out of Scope

- Full Admin redesign.
- Add Data redesign.
- Candidate promotion.
- Production tenant data writes.
- Active Tenant Access Layer updates.
- Module runtime behavior changes.
