# Layer reconciliation — audit lane, all seven active tenants

Date: 2026-08-13. Mode: **audit only.** No tenant file was written, no gate executed, no decision resolved.

## Layer 1 → Layer 2: the adapter layer does not run

| Measure | Result |
| --- | ---: |
| Workstream × tenant combinations assessed | 70 |
| With an implemented adapter | 28 (partially) |
| With **no** implemented adapter | **42** |
| Declared adapter families with zero implementation | **6 of 10** |
| Mapping profile × tenant dry-runs | 28 |
| That **would run** | **0** |

Families with no implementation at all: data-catalog-integration-and-lineage, finance-ap-gl-and-fpa,
kpi-and-operational-telemetry, organization-and-workforce, pmo-portfolio-and-benefits,
vendor-clm-and-procurement.

Every profile fails on required source fields or matches no source file. This is not a partial
capability with gaps; Layer 2 does not currently transform anything for any tenant.

**Consequence for the rest of this brief:** Layer 3 content did not arrive through Layer 2, and
refreshing Layer 4 from Layer 3 does not make the pipeline real. It makes the current contents of
Layer 3 visible.

## Layer 2 → Layer 3: graph defects by class

| Class | Endpoints/edges | Repairability |
| --- | ---: | --- |
| dangling-reference | 4,952 | **DECISION** — catalogue the object, or drop the edge |
| direction | 2,424 | repairable by edge repair |
| vocabulary | 690 | repairable by declaration or retype |
| phantom-edges | 519 | **DECISION** — no upstream source exists |
| external-evidence | 247 | by design; evidence lives outside the package |

Per-tenant detail: `layer3-graph-reconciliation.csv`.

The largest class is dangling references — edges naming objects that exist in no dimension. These
cannot be repaired mechanically without inventing rows to satisfy edges, which would manufacture a
graph rather than reconcile one.

## Layer 3 → Layer 4: not attempted, and why

Home reads Layer 1 directly:

```text
datasets/tenant-inputs/active/<tenant>/current          local-cxo-runtime.ts
datasets/tenant-inputs/<tenant>/standard-2026-07-v3      local-cxo-runtime.ts
```

The architecture states products read Layer 4 projections only. Rebuilding Home projections from
Layer 3 while Home continues to read Layer 1 would produce a projection nothing consumes, and would
leave the violation in place while appearing to have addressed it.

Recommended sequence: establish the projection boundary first, then refresh through it. Not done here
because it changes a runtime read path, which is a gate.

## aVa readiness: not assessable yet

The acceptance bar is four separate states — `loaded`, `indexed`, `retrievable`, `cited`. None can be
claimed today:

- **loaded** — no canonical load has been performed for any tenant.
- **indexed / retrievable** — nothing has been indexed from the refreshed state.
- **cited** — the graph traversal that a citation would rest on resolves at 0–99% depending on tenant,
  and at 2% for the tenant the product actually runs on.

A refusal test is also required and is currently the more important one: `promised_value_usd` is
`CONFLICT` for both cover tenants, so an answer quoting it is a failure regardless of how well the
retrieval performs.

## Gates — all closed

No registry activation, no active-root replacement, no Azure/Postgres load, no retrieval indexing, no
product or aVa activation, no runtime route change, no file retired or deleted, no CSV contract change.

## Decisions still open — report and block, as instructed

1. Segmentation drafts need SME correction; four assignments flagged as judgement calls; legal-entity
   vs P&L line-of-business split unresolved.
2. 97 free-text fields in the remediated package — generate prose or leave empty.
3. Interview evidence placement — inside the governed package, or external as currently classified.
4. lakeshore-industries — decide the data or declare the tenant as having no graph.
5. Two healthcare tenants both registered active; one is off-contract and carries 626 runtime
   references, the other is contract-clean with 13 and is blocked from data landing.
