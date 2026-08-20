# Current-state data flow — field-level semantic audit

**Step 1 deliverable. Measured against `origin/main` source CSVs and both golden snapshots.
No code changed to produce this.**

---

## Summary

Three findings change the design, not just labels.

1. **Every flow endpoint resolves to an application record — in both tenants, by different keys.**
   The projection never joined, so it drew raw strings and, for one tenant, opaque codes.
2. **No recorded field carries technology semantic class cleanly.** A governed reference taxonomy
   is required; there is no field to defer to.
3. **The two tenants have structurally different integration shapes.** One converges; the other has
   no convergence at all. One diagram template will misrepresent one of them.

---

## Field-by-field

### `sourceSystem` / `targetSystem`

| tenant | distinct sources | distinct targets | resolves to application register |
| --- | --- | --- | --- |
| meridian-health | 143 | 185 | **143/143 and 185/185** by `systemName` |
| skyharbor-air | 92 | 499 | **92/92 and 310/310** by `originalRowId` |

**Can safely mean:** an identifier for an application record, in every row of both tenants.

**Cannot safely mean:** a display label. One tenant's values are `APP-0093`, `APP-0082` — opaque
codes. Rendering them verbatim shows a reader `APP-0093` where the record can say `Workday Core HR`.

**The join key differs by tenant and neither is declared.** One joins on name; the other on
`originalRowId`, a field the first tenant's application register does not have. A consumer must try
both and record which succeeded.

| id | resolves to | recorded `systemCategory` |
| --- | --- | --- |
| APP-0093 | Workday Core HR | HCM Platform |
| APP-0082 | SAP S/4HANA — Finance (FI) | ERP Core |
| APP-0127 | ServiceNow ITSM | IT Service Management Platform |

---

### `platformOrDatabase` — 6 values / 5 values

**Cannot safely mean an architectural tier.** This is the defect that started the correction.

| tenant A value | actual class |
| --- | --- |
| Rhapsody Integration Engine | integration engine |
| SSIS package (on-prem) | ETL/ELT platform |
| Epic Caboodle | enterprise data warehouse |
| Epic Clarity (SQL Server) | operational reporting database |
| SQL Server (on-prem) | database platform |
| Tableau extract (.hyper, on-prem) | BI extract |

Two of six are data-movement tooling. Four are storage or an extract format.

| tenant B value | actual class |
| --- | --- |
| Informatica PowerCenter ETL | ETL/ELT platform |
| Confluent Kafka Event Backbone | event-streaming platform |
| API Gateway / iPaaS (MuleSoft) | API/ESB platform |
| EDI / B2B Trading Partner Gateway | B2B/EDI gateway |
| Direct point-to-point | **a pattern — the absence of a platform** |

ETL is not middleware. Event streaming is not ETL. API/ESB is not a database. `Direct
point-to-point` is not a platform at all; rendering it as a node invents a hop the record says does
not exist.

**Can safely mean:** technology context for the flow. Nothing more.

---

### `integrationType` — 9 values / 7 values

**Can safely mean:** the recorded data-movement mechanism. The one clean field.

**Cannot safely mean an architectural tier either.** `SQL Server linked-server pull` and
`database replication` are database-level movement; `SSIS ETL pipeline` is ETL; `FHIR API` is an
interface. Grouping all nine under one lane called "Integration" asserts a category the record does
not state — the same error as `platformOrDatabase`, one level along.

---

### `systemType` / `systemCategory` (on the joined application record)

| tenant | `systemType` | `systemCategory` |
| --- | --- | --- |
| A | **2 values** — COTS, Custom-built | 77 values |
| B | 8 values — incl. Data-Platform, Middleware, Mainframe-Legacy | 75 values |

`systemCategory` **mixes technology class with business domain in the same column**:

- technology: `SQL Server database/mart`, `SSIS ETL package`, `SSAS OLAP cube`,
  `Data & Analytics Platform`
- business domain: `Imaging / PACS`, `Airport Operations Control`, `Loyalty Platform`

Useful evidence for classification; must not be the classification.

---

### Supporting fields

| field | can mean | cannot mean |
| --- | --- | --- |
| `refreshFrequency` | a recorded cadence value | that a flow *is* real-time architecturally |
| `regulatedDataFlag` | the row is marked as carrying regulated data | which regulation; that unmarked rows are unregulated |
| `qualityStatus` | 3 governance states | fitness for a specific use |
| `analyticsUsage` | tenant A: 7 controlled values. **tenant B: 102 free-text sentences** | a cross-tenant comparable field |
| `currentStateOrTargetState` | current vs target | that everything drawn is current unless filtered — it must be filtered |

---

## Structural shape differs by tenant

| | tenant A | tenant B |
| --- | --- | --- |
| flows (source CSV) | 520 | 499 |
| distinct targets | 185 | **499** |
| **max inbound to any target** | 84 | **1** |
| targets receiving more than one flow | **86** | **0** |
| top source concentration | 3 environments of one system, 307/520 (59%) | 99/499 (20%) |

**Tenant A converges. Tenant B does not** — 499 flows to 499 distinct destinations, sequential ids,
no destination receiving two. That is a generator artifact, not an estate. A convergence diagram is
the wrong projection for it, and the shipped diagram drawing six of those destinations individually
implied they were significant when they were six singletons among 499.

---

## What this means for the design

1. **Join first, always.** Resolve both endpoints to the application register (name, then
   `originalRowId`) and record which key matched as classification provenance.
2. **Classification cannot defer to a field.** A governed reference taxonomy keyed on reviewed
   product aliases is required, with `unknown` as the default.
3. **`integrationType` belongs on the edge**, not as a lane.
4. **`platformOrDatabase` is context on the edge**, not a node — except where the value is a real
   intermediary tool, and never for `Direct point-to-point`.
5. **The lane set must adapt.** A tenant whose records identify no intermediary tooling should show
   source → destination directly with the mechanism on the connector.
6. **Concentration claims must be computed per tenant.**

---

## Data-model gaps

| gap | consequence |
| --- | --- |
| Join key between integration endpoints and the application register is undeclared and differs per tenant | every consumer must guess or try both |
| `systemCategory` conflates business domain and technology class | unusable for tier assignment by any consumer |
| `analyticsUsage` is an enum in one tenant, free prose in the other | not comparable across tenants |
| `platformOrDatabase` conflates platforms, databases, extract formats and a no-platform sentinel | cannot answer "what tool carries this flow" without a taxonomy |
| Tenant B's target topology has zero convergence with sequential ids | synthetic generation artifact; not a plausible estate |
| One tenant's application register lacks `originalRowId` | the two cannot share one join implementation without a fallback chain |

---

## Snapshot freshness (observed while auditing)

Tenant B's source CSV holds **499** integration rows; its golden snapshot holds **310**. The
snapshot is stale relative to the active canonical inputs. This is the condition the freshness gate
is meant to surface and currently does not.
