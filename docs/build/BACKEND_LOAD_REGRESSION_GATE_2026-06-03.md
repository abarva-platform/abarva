# Backend Load Regression Gate Manifest

Date: 2026-06-03
Status: candidate
Backlog: T160
Release lane: internal-admin

## What Changed

Added a PR-safe backend load regression contract gate so the existing Node 24
primary-surface load runner cannot silently break between major releases.

## Included

- `package.json`
  - Adds `load:backend-regression:check`.
- `.github/workflows/backend-load-regression.yml`
  - Runs the dry-run contract gate on every PR and manual dispatch.
- `docs/runbooks/backend-load-regression-gate.md`
  - Documents PR contract gate, major-release live load run, evidence packet,
    and T160 status rule.
- `scripts/load/verify-backend-load-regression-gate.mjs`
  - Verifies the workflow, package script, runbook, build manifest, and release
    record stay wired.

## Boundary

This slice does not run a live Azure/staging/production load test. It keeps the
load harness and CI invocation alive in every PR, while the existing
`azure-l8-primary-surface-load.yml` workflow remains the real environment load
runner for major releases.

T160 remains `In progress` until a real post-major-release backend load run is
executed and evidence is attached.
