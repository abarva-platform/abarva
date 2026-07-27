# Tenant Isolation and RLS Audit

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Static Result

Inventory captured 131 module-relevant persisted objects parsed from migration DDL across Moves, Source, and Tower.

Module counts: Moves: 11; Source: 50; Tower: 70.

Disposition counts: retain_operational: 72; archive: 5; promote_link_canonical_knowledge: 38; project_shared_consumption: 16.


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
