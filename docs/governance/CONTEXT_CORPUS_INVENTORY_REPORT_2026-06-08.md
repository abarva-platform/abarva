# Context & Corpus Inventory Report (2026-06-08)

> **Template — pending live run.** The scanner reads the private Azure DB, which is unreachable from
> a workstation, so the populated report is produced by running the scanner as a Container Apps Job
> in the VNet (operator-job pattern). The pure aggregation is unit-tested
> (`src/lib/governance/__tests__/inventory.test.ts`); this file is regenerated on each live run.

## How to populate (ACA operator job)

The scanner ships in the app image. Run it as a one-off Container Apps Job against the lab
environment (read-only; no writes):

```bash
# 1) ensure a job exists that runs the app image with the runtime env/secrets + managed identity
#    (mirror an existing job, e.g. job-abarva-db-migrate-lab-eastus), command:
#       npx tsx src/scripts/governance/inventory-scan.ts --out /tmp/inventory.md
# 2) start it and read logs:
az containerapp job start -n job-abarva-governance-inventory -g rg-abarva-controlplane-lab-eastus
az containerapp job execution list -n job-abarva-governance-inventory -g rg-abarva-controlplane-lab-eastus -o table
# 3) copy /tmp/inventory.md from the run output into this file and commit.
```

(If the job does not yet exist, create it from the current ACR image
`acrabarvalab001.azurecr.io/abarva/web:<tag>` with the same env/secret refs + user-assigned identity
as `ca-abarva-web-lab-eastus`, entrypoint the command above.)

## Expected shape (from the pure aggregation)

- Per-scope coverage table: **every** canonical tenant key + `corpus_global`. A scope with no data is
  marked **NO DATA FOUND** and listed under "tenants with no data" — never omitted. (SkyHarbor =
  `skyharbor-air` will appear explicitly.)
- Per-store totals across `enterprise_context_chunks`, `ai_initiatives`, `data_inventory_records`,
  `program_evidence_items`, `deliverables_v2`, `genome_patterns`, `pattern_packs`, `knowledge_sources`.
- Granular missing-field counts (source_basis / confidence / classification / retrievability) light up
  after PR-3 adds the governed columns; PR-2 establishes coverage totals.

## Status

`scanner + aggregation merged; live run = pending operator ACA job`.
