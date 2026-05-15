# AZLAB42 - L10 Scheduled SOC2 Evidence Pack

Date: 2026-05-15  
Status: wired  
Layer: L10 compliance / audit trail

## Why This Exists

AZLAB38 made SOC2 evidence exportable by command. For enterprise security review, that should not depend on founder memory. AbarVa needs a scheduled/manual workflow that produces the evidence pack, stores the result as a CI artifact, and fails loudly when the database secret is missing.

## Artifact

| Artifact | Purpose |
|---|---|
| `.github/workflows/l10-soc2-evidence-pack.yml` | Monthly and manual SOC2 evidence-pack export. |
| `npm run export:soc2-evidence-pack` | Underlying exporter. |

## Schedule

The workflow runs monthly:

```text
17 10 1 * *
```

It can also be launched manually with:

- `dry_run`
- `since`
- `max_rows`

## Required Secret

One of:

- `SOC2_EVIDENCE_DATABASE_URL`
- `AZURE_LAB_DATABASE_URL`

Manual `dry_run=true` does not require a database secret and validates wiring only.

## Outputs

| Artifact | Contents |
|---|---|
| `soc2-evidence-export-result` | JSON console output from the exporter. |
| `soc2-evidence-pack` | CSV/JSON evidence files and `manifest.json` when not dry-run. |

## Control Statement

L10 evidence is now on a cadence:

- sensitive-upload audit decisions
- release / hard-delete lifecycle rows
- data inventory audit log
- gate criteria and gate state evidence
- local approval ledgers when present
- manifest with row counts and skipped optional sources

## Current Limit

The workflow exports evidence; it does not retain artifacts beyond GitHub artifact retention. Long-term evidence retention should copy packs to private Blob Storage once the compliance retention policy is finalized.

## Next L10 Controls

| Next control | Why |
|---|---|
| Blob-retained evidence archive | Keeps monthly evidence beyond GitHub artifact retention. |
| Live Purview fixture | Validates classification persistence against Azure Postgres with real fixture rows. |
| Broader admin-action export | Adds admin/user/access actions to the monthly evidence pack. |
