# SkyHarbor Reset/Load Pass - 04 Clean Slate Verification

Created: 2026-06-06

## Clean Slate Verdict

Not verified.

The clean-slate verification depends on a successful delete pass, and the delete pass was not allowed to run because the live DB was unreachable.

## Post-Delete Counts

| Category/table | Expected clean-slate state | Observed count | Status |
|---|---|---:|---|
| `clients` | retained canonical client row if loader depends on it | unknown | DB unreachable |
| `enterprise_context_source_files` | 0 or retained only if source parent rows required and proven current | unknown | DB unreachable |
| `enterprise_context_chunks` | 0 stale rows before reload | unknown | DB unreachable |
| `applications` | 0 stale SkyHarbor demo rows before reload | unknown | DB unreachable |
| `ai_initiatives` | 0 stale SkyHarbor rows before reload | unknown | DB unreachable |
| `vendor_contracts` | 0 stale SkyHarbor rows before reload | unknown | DB unreachable |
| Moves/engagement records | 0 stale demo records before proof creation | unknown | DB unreachable |
| Source events/artifacts | 0 stale demo records before proof creation | unknown | DB unreachable |
| Generated deliverables/docs | 0 stale demo records before proof creation | unknown | DB unreachable |
| Object/blob references | 0 stale SkyHarbor-only objects before proof creation | unknown | DB unreachable |

## Explanation For Remaining Unknowns

Unknowns remain because the local runtime cannot resolve:

```text
pg-abarva-context-lab-001.postgres.database.azure.com
```

This is consistent with a private Azure/Postgres endpoint or missing local private DNS/VNet access.
