# Module Migration Wave Plan

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Wave Sequence

1. **Read-only live inventory** — confirm tables, RLS, row counts, tenant filters, and consumers.
2. **Identity-map design** — create candidate crosswalks for tenant, vendor, contract, program, application, metric, decision, risk, action, and evidence objects.
3. **Moves shadow publication** — publish approved decisions/programs/outcomes to canonical candidates; keep workflow local.
4. **Source shadow publication** — publish selected supplier/contract/proposal facts; keep event workflow local.
5. **Tower shadow publication** — publish governed metrics/value/risk observations; keep monitoring controls local.
6. **Shared consumption projections** — build stable read models for Cube, Nexus, aVa, Superset, and Observable.
7. **Signed-in parity certification** — module screens, aVa answers, exports, and dashboards match or improve.
8. **Cutover** — switch consumers only after parity, rollback, and tenant isolation proofs pass.

## Stop Conditions

- Tenant leakage, unscoped read path, conflicting metric definitions, missing lineage for promoted facts, or dashboard/aVa quality regression.
