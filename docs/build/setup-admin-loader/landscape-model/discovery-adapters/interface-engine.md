# Adapter: Interface Engine Channel Export (Rhapsody / Mirth / Corepoint)

> **Owner:** Enterprise / Integration Architect. **Primary target:** L3
> Integration (interfaces / channels: source→target, pattern, transformation).
> **Mode:** create + link endpoints to L2. **Natural key:** channel / route name
> (secondary: `source→target + pattern/message_type`).

The interface engine is the L3 system of record for **how systems talk**. Its
channel/route export is the cleanest source for the integration layer — far
better than inferring interfaces from app lists. Most relevant to health (HL7-heavy
Meridian) but applies to any estate with an integration broker. Each channel is one
L3 interface: a source endpoint, a target endpoint, a message pattern, and a
transformation.

---

## 1. What the export looks like (per engine)

| Engine | Export source | Shape / terminology |
|---|---|---|
| **Rhapsody** (Lyniate) | Route/Comm-point config export (XML/CSV) | **routes** between **communication points** (in/out); filters/JavaScript mappers |
| **Mirth Connect** (NextGen) | **Channel** export (XML), or admin report | **channels**, each with a **source connector** + 1..n **destination connectors**; transformers |
| **Corepoint** (Lyniate) | Connection/action export | **connections** with actions/maps |
| **Cloverleaf** (Infor) | Site/thread config | threads/processes, inbound/outbound |

Common shape regardless of engine: one row (or one config object) per
**channel/route**, with a **source** system/connector, one or more **destination**
systems/connectors, a **message type** (HL7v2 trigger, FHIR, X12, flat file), a
**transport** (MLLP/TCP, SFTP, HTTPS, DB), a **transformation/filter**, and a
**status** (enabled/disabled). Signature: connector/route/channel vocabulary +
MLLP/HL7 message types + source/destination pairing.

---

## 2. Column / config → L3 mapping

| Source field (engine terms) | Canonical field | Layer | Transform |
|---|---|---|---|
| Channel / route / connection name | `l3.interface_name` | L3 | `norm()` → **natural key** |
| Source connector / inbound comm-point | `l3.source_ref` → L2 | L3 link | `norm()` → match L2 app |
| Destination connector(s) / outbound | `l3.target_ref` (1..n) → L2 | L3 link | `split→` per destination; match L2 |
| Message type (ADT/ORU/ORM/SIU/DFT…; FHIR; 837/835 X12) | `l3.message_type` | L3 | `1:1` |
| Standard | `l3.pattern` | L3 | `lookup{hl7v2, fhir, edi_x12, rest_api, soap, file_batch, db_link}` |
| Transport (MLLP/TCP, SFTP, HTTPS, JDBC) | `l3.transport` | L3 | `lookup{}` |
| Direction (inbound/outbound/bidir) | `l3.direction` | L3 | `derive()` from connector roles |
| Transformer / filter / map present | `l3.transformation` | L3 | `derive()` (has-mapping flag + summary) |
| Status (enabled/deployed/disabled) | `l3.status` | L3 | `lookup{active, inactive, retired}` |
| Throughput / messages-per-day | `l3.data_volume` / `l3.frequency` | L3 | `1:1` if statistics exported |
| Engine name + version | `l3.middleware` | L3 | `derive()` (Rhapsody/Mirth/Corepoint) |

A single Mirth channel with N destinations or a Rhapsody route fanning out →
**`split→` N L3 interface rows** sharing the source, each its own source→target
edge (so the integration graph is edge-accurate).

---

## 3. Endpoint → L2 linkage (the join, model §4)

Connector names encode the connected system, but loosely (`LAB_OUT`,
`QUEST_ORU`, `EPIC_ADT_IN`, `pharmacy-mllp`). The adapter resolves each endpoint
to an L2 app by:

1. **Explicit system field** if the engine captures it (best).
2. **Connector-name token match** against known L2 vendor/product tokens and
   against external partners (labs, payers, HIEs).
3. **Host/port → L5 host → L2 app** when the connector targets a known host
   (bridges to vCenter/CMDB).

Endpoints that resolve to **external parties** (Quest, LabCorp, a payer, an HIE,
Surescripts) are not internal L2 apps — model them as **external-partner
endpoints** on the interface, not as estate applications.

---

## 4. Natural keys (reconciliation, model §4)

- **L3 interface:** `norm(channel/route name)`. Because engines fan out, the
  secondary identity is `source_ref → target_ref + message_type` — this is what
  **merges the same logical feed** seen in the interface engine *and* in the Epic
  Bridges registry (`epic-system-registry.md`), so an Epic→Quest ORU feed is one
  interface, not two.
- **Endpoint → L2:** resolved to the L2 natural key (`vendor|product`) or an
  external-partner key.
- **Middleware → L3 entity / vendor spine:** the engine itself (Rhapsody/Mirth)
  is also an L2/L3 platform entity and a vendor-spine entry.

---

## 5. Review-required ambiguities (what the Steward asks)

1. **Endpoint resolution below confidence** — opaque connector names
   (`OUT_07`, `TCP_4011`) that don't reveal the connected system. Default: keep
   the raw connector label, link to review.
2. **Internal app vs external partner.** Decide whether an endpoint is an estate
   L2 app or an outside party — drives whether it joins the app inventory.
3. **Disabled / retired channels.** Engines accumulate dead channels; `disabled`
   status → flag (live integration vs historical).
4. **Pattern inference.** MLLP transport strongly implies HL7v2 but isn't proof;
   FHIR over HTTPS vs a generic REST API needs the message detail. Ambiguous →
   ask rather than guess `pattern`.
5. **Fan-out cardinality.** Confirm that a multi-destination channel should become
   N interface edges (default) vs one multi-target interface — affects the graph
   and any per-edge volume/criticality.
6. **Duplicate of Epic Bridges.** When Epic fronts the engine, merge on the §4
   secondary key; flag suspected duplicates for confirmation.
7. **Transformation opacity.** A channel's JavaScript/IGUANA/Tcl transform can't
   be fully parsed; record presence + a summary, not the logic — flag if business
   rules live in the mapper (migration risk).

---

## 6. Illustrative sample

**Source (Mirth channel export, abbreviated):**

| Channel | Source connector | Destination connector | Message type | Transport | Status |
|---|---|---|---|---|---|
| EPIC_ADT_to_Bed | LLP_Listener (Epic ADT) | LLP_Sender (BedTracker) | ADT | MLLP | Enabled |
| Lab_Results_to_Epic | SFTP_Reader (Quest) | LLP_Sender (Epic Beaker) | ORU | MLLP/SFTP | Enabled |

**Mapped:**

- "EPIC_ADT_to_Bed" → **L3 interface** `{ interface_name:"EPIC_ADT_to_Bed",
  source_ref:epic|ehr, target_ref:<bed-management app>, message_type:ADT,
  pattern:hl7v2, transport:mllp, direction:outbound, middleware:"Mirth Connect",
  status:active, natural_key:"epic_adt_to_bed" }`. Source resolves to Epic;
  destination "BedTracker" → match an L2 app (or review if not in inventory).
- "Lab_Results_to_Epic" → **L3 interface** `{ source_ref:Quest (external partner),
  target_ref:epic|beaker, message_type:ORU, pattern:hl7v2, transport:sftp+mllp,
  direction:inbound }`. Quest = external partner endpoint, not an L2 app.
  **Merges** with the Epic Bridges `LAB_ORU` feed from the Epic registry on
  `source→target + ORU`.

---

## 7. Reviewer sanity-check notes

A reviewer with real Rhapsody/Mirth/Corepoint experience should verify:

- The **engine-specific terminology** mapping (Rhapsody route+comm-points vs Mirth
  channel+connectors vs Corepoint connection+actions) onto the single L3 model,
  and that **fan-out** is represented as the customer expects (N edges vs one).
- **Endpoint resolution** quality on this estate — whether connector names encode
  the connected system well enough, or whether most endpoints go to review.
- The **internal-vs-external** classification of endpoints (labs, payers, HIEs,
  Surescripts) — getting this wrong inflates or deflates the app inventory.
- **Pattern/transport** correctness (MLLP→HL7v2, X12 transaction sets like
  837/835/270/271 for EDI, FHIR vs REST) — these drive the integration narrative.
- The **Epic Bridges overlap** — that feeds aren't double-counted across this
  adapter and `epic-system-registry.md`.
- That **transformation logic** is captured as presence/summary (with a
  migration-risk flag) rather than assumed parseable.
