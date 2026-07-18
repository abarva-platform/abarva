# Airline Demo Tenant Data Factory

Final status: BLOCKED_BEFORE_PROMOTION

Planning-grade synthetic candidate context only. Not real client production data, not PHI/PII/payment-card data, not active tenant truth, and not a claim of realized financial value.

## What Passed

- 19 source/template files and 4,840 source/template rows.
- 216 executive interview rows across 18 stakeholder groups.
- 9,680 canonical facts.
- 1,100 entity profiles.
- 1,600 graph nodes and 2,600 graph edges.
- 2,100 context gaps and 140 evidence references.
- Home, Tower, Intelligence, Moves, and Source candidate preview packs are locally consumable.
- Template guidance and data dictionaries generated under `templates/skyharbor-air/`.
- Interview support files generated under `datasets/tenant-inputs/skyharbor-air/interviews/`.

## What Is Blocked

- Azure/Postgres write execution remains blocked by the existing guarded loader.
- Active promotion is not requested and was not performed.
- Signed-in page/API read-back from the data plane is not claimed.

## Label Contract

- AbarVa-facing display label: Airline Demo.
- Physical/source label: SkyHarbor Air.
- Tenant key: skyharbor-air.
