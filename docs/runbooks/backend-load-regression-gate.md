# Backend Load Regression Gate

Backlog row: T160
Owner: AbarVa operations
Cadence: every PR for harness contract; every major release for live load run

## Purpose

Lighthouse covers browser/UI budgets. T160 adds a backend load-regression
discipline so primary app routes and authenticated Azure/staging/production
surfaces do not drift silently after major releases.

## CI Contract Gate

PR CI runs:

```bash
npm run load:backend-regression:check
```

This is a dry-run contract check for `scripts/load/azure-primary-surfaces.mjs`.
It proves the load runner still parses the standard options, emits the expected
JSON report, and can be invoked by GitHub Actions without Azure secrets.

The workflow is:

- `.github/workflows/backend-load-regression.yml`

The workflow uploads:

- `audit-artifacts/performance/backend-load-regression-contract.json`

## Live Major-Release Run

After each major release candidate reaches pre-prod preview or first-client
pilot production, run the real L8 workflow:

```bash
gh workflow run azure-l8-primary-surface-load.yml \
  -f environment=staging \
  -f duration_seconds=300 \
  -f concurrency=10 \
  -f p95_target_ms=8000 \
  -f require_2xx=true
```

Use `production` only after the release manager approves a production load
window. Use `azure-lab` for private-data-plane dress rehearsals.

## Evidence To Attach

Each live run should attach:

- workflow run URL
- environment and deployment SHA
- duration and concurrency
- p95 target and observed p95
- 5xx count
- request-error count
- pass/fail/caveat disposition
- follow-up owner for any route above target

## T160 Status Rule

The repo-side CI gate is implemented when this workflow merges. T160 remains
`In progress` until the first real post-major-release backend load run is
executed against staging, production, or Azure lab and its evidence is attached.
