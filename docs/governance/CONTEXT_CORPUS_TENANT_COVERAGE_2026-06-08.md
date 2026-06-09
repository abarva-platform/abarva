# Context & Corpus Tenant Coverage (end-to-end) — 2026-06-08

PR-6 of the Context & Corpus Governance Framework. This is the **end-to-end
coverage view**: for every canonical tenant (+ corpus_global), how many governed
objects exist and how many are agent-ready / retrievable / fenced / unreviewed —
read straight from the PR-3 readiness ledger (`governed_object_readiness`).

This file is the **runbook + template**. The live populated table is overwritten
in place when an operator runs the report as an ACA job (the private DB is
unreachable from a workstation).

## Why it completes the loop

- PR-2 proved raw **presence** per tenant.
- PR-3 seeded **readiness** state per object.
- PR-6 joins them into one **coverage** view, and applies the SkyHarbor guarantee
  to readiness: a canonical tenant with no ledger rows is flagged
  "NO DATA FOUND," never silently omitted.

## Run it (ACA job, inside the VNet)

```
npm run governance:tenant-coverage-report
```

```
az containerapp job start \
  --name caj-governance-tenant-coverage \
  --resource-group <rg> \
  --image <acr>/abarva-web:<tag> \
  --command "npm run governance:tenant-coverage-report"
```

Prerequisite: the PR-3 migration applied and the readiness backfill committed
(`npm run governance:readiness-backfill -- --commit`). If the ledger is empty the
report says so and lists every canonical tenant as having no rows.

## Reading the report

- **Governed %** = `agent_ready / total`. Right after the conservative PR-3
  backfill this is ~0 by design — nothing is auto-promoted; promotion is earned
  via cite-render verification (PR-5 runtime / PR-7 visible citations).
- **Retrievable** counts objects in an FTS/Azure-Search index (the Lakeshore
  trap: committed ≠ retrievable).
- **Restricted / Blocked** are the fenced classes (sensitive data, missing
  tenant_id, non-canonical key).

---

<!-- The live coverage table is written below this line by the report run. -->

_No live run yet — run `npm run governance:tenant-coverage-report` as an ACA job
to populate this section._
