# AZLAB38 - L10 SOC2 Evidence Pack Export

Date: 2026-05-15  
Status: wired, dry-run validated  
Layer: L10 compliance / audit trail

## Why This Exists

Enterprise infosec and SOC2 reviewers will ask for evidence, not screenshots. The lab now has sensitive-upload audit rows, gate state tables, data inventory audit logs, and local approval ledgers. This slice turns those into a repeatable export command.

The goal is simple: one command produces an auditor-readable folder with CSV/JSON evidence and a manifest.

## Artifacts

| Artifact | Purpose |
|---|---|
| `src/scripts/export-soc2-evidence-pack.ts` | Exports known audit/evidence tables and local approval ledgers. |
| `npm run export:soc2-evidence-pack` | Local/operator command. |

## Exported Sources

| Source | Output | Notes |
|---|---|---|
| `sensitive_upload_audit` | `sensitive_upload_audit.csv` | Sensitive-upload guard decisions and release/hard-delete lifecycle rows. |
| `data_inventory_audit_log` | `data_inventory_audit_log.csv` | Setup/data inventory changes when table exists. |
| `gate_criteria` | `gate_criteria.csv` | Gate definitions tied to Moves/programs. |
| `gate_criterion_states` | `gate_criterion_states.csv` | Gate state evidence tied to Moves/programs. |
| `.approvals/ledger.json` | `program_approvals.json` | Local/file-backed approval ledger when present. |
| `.approvals/phase-gates.json` | `phase_gates.json` | Local/file-backed phase gate ledger when present. |
| `.approvals/sponsor-commitments.json` | `sponsor_commitments.json` | Local/file-backed sponsor commitment ledger when present. |
| manifest | `manifest.json` | Generated timestamp, filters, files, row counts, skips. |

Missing optional tables or ledgers are recorded as `skipped` in the manifest instead of failing the export.

## How To Run

Dry run:

```bash
npm run export:soc2-evidence-pack -- --dry-run
```

Export all rows up to the default cap:

```bash
DATABASE_URL="$DATABASE_URL" npm run export:soc2-evidence-pack
```

Export recent evidence only:

```bash
DATABASE_URL="$DATABASE_URL" npm run export:soc2-evidence-pack -- \
  --since 2026-05-01T00:00:00.000Z \
  --out-dir artifacts/soc2-evidence/may-2026
```

## Current Limit

This exports evidence; it does not yet prove live SQL immutability by attempting `UPDATE`/`DELETE` as an authenticated tenant role. AZLAB34 covers migration-contract assertions for public-role SELECT-only and append-style lifecycle rows. The next hardening step is a live SQL assertion suite.

## Next L10 Controls

| Next control | Why |
|---|---|
| Live SQL immutability attempts | Proves `UPDATE`/`DELETE` fail under non-service roles. |
| Purview label persistence fixture | Proves labels survive release/hard-delete lifecycle actions. |
| Monthly GitHub Action / operator runbook | Produces recurring evidence packs for customer/security reviews. |
