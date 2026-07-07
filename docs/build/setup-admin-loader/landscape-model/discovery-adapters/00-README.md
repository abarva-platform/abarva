# Discovery-Export Adapters

> How each owner-tool's **native export** maps to the canonical landscape model
> (`../00-MODEL.md`). These adapters make §3 (owner→artifact assembly) and §4
> (entity identity & reconciliation) concrete: column-level mappings the
> intelligent mapper / Steward can be seeded with.

---

## 1. The principle

The estate already lives in these tools. Nobody hand-types 2,000 applications,
2,000 VMs, or 3,000 contracts into our form. Each owner (§3 of the model) already
runs a system of record — ServiceNow CMDB, vCenter, a cloud inventory, Flexera,
Epic's own registry, an interface engine — and each can export it. The loader's
job is to **ingest the native export and map it to the model**, asking the human
only where the mapping is genuinely ambiguous.

An adapter is therefore not a UI. It is a **reviewable mapping spec**: a pinned
contract that says "when a file looks like *this*, these columns mean *these*
canonical fields, the natural key is *that*, and *these* ambiguities are
review-required." The mapper uses the adapter as a prior; the Steward uses it to
phrase questions; a human reviewer uses it to sanity-check the result.

---

## 2. What an adapter is (the common pattern)

Every adapter doc follows the same four-step pattern. The mapper executes them in
order; each adapter doc fills in the tool-specific detail.

1. **Identify the export.** Recognize the file as a known tool export from its
   shape — header signature (characteristic column names), file naming, sheet
   layout, value vocabularies. (e.g. a CSV with `sys_id`, `sys_class_name`,
   `install_status` is almost certainly a ServiceNow CMDB CI export.) The adapter
   lists the **signature columns** that trigger it.

2. **Map columns → canonical fields → layer.** The core of the adapter: a
   table of `source column → canonical field → layer (L1–L5 / spine)`, with the
   transform/normalization rule for each. Most columns map 1:1; some require a
   lookup (CI class → entity type), a normalization (vendor string → canonical
   vendor), a unit conversion (MB → GB, currency), or a split (one row → an L2
   app *and* an L5 host).

3. **Set the natural key for reconciliation.** Per §4 of the model, every mapped
   entity needs a stable natural key so the *same real-world thing* described by
   two artifacts merges instead of duplicating. The adapter states which source
   columns compose the key and how they normalize (e.g. L2 app = normalized
   `vendor + product`; L5 host = `hostname`; vendor = normalized legal name).
   This is what lets a vCenter VM link to the ServiceNow app it hosts, and a
   Flexera license row enrich (not re-create) an existing L2 application.

4. **Flag review-required ambiguities.** Where the source is silent, lossy, or
   self-contradictory, the adapter tells the Steward what to ask. These are the
   *known* failure modes of each export — environment not captured, CI class too
   coarse, vendor field free-text, cost in vendor currency, decommissioned rows
   still present. The conservative default (per AGENTS.md truth standard): if the
   mapping is not deterministic, the entity enters **review-required**, not
   committed silently.

Each adapter also carries (5) a **tiny illustrative sample** — a few real-shaped
rows mapped end-to-end — so a reviewer can see the contract working.

---

## 3. Reconciliation across adapters (why the natural keys matter)

The adapters are designed to **converge**, not run in parallel silos. The same
entity is seen from multiple angles, and the shared natural-key discipline is what
merges them:

| Real-world thing | Seen by | Natural key they share |
|---|---|---|
| The Epic EHR application | ServiceNow (L2 CI), Flexera (license), Apptio (TCO), Epic registry (modules) | `vendor+product` = `epic\|ehr` |
| A VMware VM running an app | vCenter (L5 VM), ServiceNow (L5 Server CI), Azure (if migrated) | `hostname` |
| An HL7 feed between Epic and a lab | Interface engine (L3 channel), Epic Bridges registry (L3) | `source→target + pattern` |
| A SQL Server warehouse | ServiceNow (L5 Database CI), CDAO catalog (L4 store), vCenter (L5 host) | `engine + instance` (L4) / `hostname` (L5) |
| A vendor (e.g. Oracle) | every L2 CI, Flexera, Apptio, contract registry | normalized legal/trade name |

When two adapters describe the same key, the Steward **merges per-attribute with
provenance** and raises a `conflict` finding on disagreement (e.g. Apps says Epic
is `vendor_hosted`; Infra lists an on-prem Epic ODB cluster). This is the §4
match → merge → link loop. Adapters that *enrich* (Flexera, Apptio) explicitly
must not create new L2 rows — they attach attributes to matched ones.

---

## 4. Layer-routing cheat sheet

Several tools emit rows that span layers. The adapters route by an internal
discriminator (CI class, resource type, object kind):

- **L1 capability** — rarely in tool exports; arrives from the EA capability
  model / Confluence (handled as a content artifact, not a structured adapter).
- **L2 application** — ServiceNow `cmdb_ci_appl*` classes, Epic modules, the
  *application* rows of any portfolio. Enriched by Flexera/Apptio.
- **L3 integration** — interface-engine channels, Epic Bridges/Interconnect
  interfaces, API-gateway catalogs, EDI partner maps.
- **L4 data & analytics** — DW/lake stores, BI/report catalogs, ETL jobs, Epic
  Clarity/Caboodle. A ServiceNow `cmdb_ci_database` is an L5 host fact *and*
  often an L4 store — split + link.
- **L5 infrastructure** — vCenter VMs/hosts/clusters/datastores, cloud
  resources, ServiceNow `cmdb_ci_server` / `_storage` / network classes.
- **Spines** — vendor (every adapter contributes a vendor string), security/BAA
  (CISO artifacts), operations (support group / owner columns everywhere).

---

## 5. Adapter index

| Adapter | Owner (§3) | Primary layers | Natural key | Mode |
|---|---|---|---|---|
| [`servicenow-cmdb.md`](servicenow-cmdb.md) | VP/Dir Applications | **L2** (+ L5, L4 db) | app: `vendor+product`; host: `hostname` | create + class-route |
| [`vcenter.md`](vcenter.md) | VP/Dir Infrastructure | **L5** | VM / host / cluster name | create + link-up to L2 |
| [`azure-resource-graph.md`](azure-resource-graph.md) | VP/Dir Infrastructure | **L5** (+ some L4) | cloud resource id; `cloud_account` | create (multi-cloud) |
| [`flexera-apptio.md`](flexera-apptio.md) | Procurement / Apps | **L2 attrs** + vendor spine | `vendor+product` | **enrich/merge** (no create) |
| [`epic-system-registry.md`](epic-system-registry.md) | App/Integration (health) | **L2, L3, L4** | module / interface / store name | create (Epic estate) |
| [`interface-engine.md`](interface-engine.md) | Integration Architect | **L3** | channel/route name | create + link endpoints |

**Coverage by tier** (model §6): Lakeshore (S) leans on hand-built XLSX + a few
exports; Meridian (M) → ServiceNow + Epic registry + vCenter + interface engine;
Apex (L) → full discovery: ServiceNow + multi-cloud inventory + Flexera + Apptio.

---

## 6. Conventions used in every adapter

- **Canonical field names** are written as `layer.field` (e.g. `l2.deployment_model`,
  `l5.virtualization`) and follow `../00-MODEL.md` §2 and the field catalog
  (`../01-FIELD-CATALOG.md`, when present). Controlled-vocabulary values are shown
  `like_this`.
- **Transform notation:** `1:1` (copy), `norm()` (normalize/canonicalize),
  `lookup{…}` (value map), `derive()` (computed), `split→` (one source row →
  multiple entities), `unit()` (unit/currency conversion).
- **Provenance** (Gate 0 / truth standard) is attached to *every* mapped cell
  automatically — artifact id, owner, sheet/row/column — and is not repeated per
  mapping row below.
- **Review-required** is the conservative default whenever a mapping is not
  deterministic; the adapter lists the specific triggers.
