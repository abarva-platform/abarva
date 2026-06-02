# DORA Metrics

Use this runbook to generate an internal delivery-health snapshot for engineering reviews, hiring conversations, and operating cadence discussions.

## Command

```bash
npm run metrics:dora
```

The command writes:

- `audit-artifacts/metrics/dora-dashboard.md`
- `audit-artifacts/metrics/dora-dashboard.json`

Use `npm run metrics:dora:smoke` to validate the generator with a fixture.

## What It Measures

- Deployment frequency: merged pull requests per week in the selected window.
- Lead time for change: pull request creation time to merge time.
- Change-fail rate proxy: rollback, revert, hotfix, incident, outage, P0, or P1 style pull requests divided by merged pull requests.
- MTTR proxy: creation-to-merge time for the failure-proxy pull requests.

## Interpretation Limits

The dashboard is intentionally labeled as an operating proxy. It does not yet connect deployments to incident records, rollback drills, or production telemetry. Treat the values as engineering operating indicators, not audited SLA evidence.

## Options

Run the script directly for a custom window:

```bash
node scripts/metrics/dora-dashboard.mjs --days 90 --limit 500
```

Use a fixture for deterministic validation:

```bash
node scripts/metrics/dora-dashboard.mjs --fixture /path/to/prs.json --output /tmp/dora.md --json-output /tmp/dora.json
```
