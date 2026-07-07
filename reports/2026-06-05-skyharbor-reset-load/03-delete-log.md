# SkyHarbor Reset/Load Pass - 03 Delete Log

Created: 2026-06-06

## Delete Verdict

No delete was performed.

Reason: the required live DB inventory and backup gate could not complete because the Azure/Postgres hostname did not resolve from this runtime.

```text
getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

## Guardrail Outcome

| Guardrail | Result |
|---|---|
| Delete only SkyHarbor | not reached |
| Backup before delete | blocked by DB reachability |
| Preserve other tenants | pass; no mutation attempted |
| Preserve shared/global rows | pass; no mutation attempted |
| Preserve canonical client identity unless reset plan recreates it | pass; no mutation attempted |

## What Was Deleted

Nothing.

## What Was Left Untouched

Everything, including:

- SkyHarbor client row, if present.
- SkyHarbor enterprise context rows, if present.
- SkyHarbor applications, initiatives, vendor contracts, Moves, Source events, artifacts, generated deliverables, documents, and object references, if present.
- Lakeshore, Meridian/PHS, Apex, Morgan Street, First Capital, Northstar, and shared/global records.
- Repo dataset assets and documentation.

## Required Next Delete Runner

Run the reset from a network location that can resolve/reach the Azure private Postgres endpoint, such as:

- Azure Bastion/jump VM inside the VNet.
- Azure Container Apps job or Function with private endpoint/DNS access.
- GitHub Actions runner configured inside the VNet.
- VPN/private-network runner that resolves the private DNS zone.

Do not use the local legacy `DATABASE_URL` fallback because it points to a Supabase pooler and is out of scope for this Azure data-plane lane.
