# Tenant Isolation and RLS Audit

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Static Result

Inventory captured 679 module-relevant persisted objects or focused code references across Moves, Source, and Tower.

Module counts: Moves: 27; Source: 460; Tower: 192.

Disposition counts: retain_operational: 591; promote_link_canonical_knowledge: 68; archive: 8; replace: 1; project_shared_consumption: 11.


## What This Audit Can Prove

- Migration files and focused code references were scanned for tenant/client/user identity markers.
- Objects without parsed tenant or policy markers are flagged for live DB review, not declared unsafe.

## Main Risks

- Legacy/public tables may rely on application-layer tenant filtering rather than strict RLS.
- Referenced objects not found in parsed DDL need live schema confirmation.
- Cross-module consumption projections must never become wildcard tenant readers.

## Required Live Checks

1. Query Postgres catalog for every table's RLS enabled state.
2. Verify policies include tenant-scoped predicates or controlled service-role exceptions.
3. Verify every module read adapter accepts tenant identity from the request/session, not a display label or folder name.
4. Prove no Source/Tower/Moves projection can return another tenant's IDs under signed-in browser/API tests.
