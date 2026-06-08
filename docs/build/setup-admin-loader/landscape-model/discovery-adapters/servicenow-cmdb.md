# Adapter: ServiceNow CMDB (CI export)

> **Owner:** VP / Director, Applications (and shared with Infrastructure).
> **Primary target:** L2 Applications. **Also routes to:** L5 Infrastructure
> (servers, storage, network), L4 stores (databases). **Mode:** create +
> CI-class routing. **Natural key:** app = normalized `vendor+product`;
> host = `name` (hostname); database = `name` (instance).

ServiceNow CMDB is the most common single source for a mid/large estate's L2 and
much of L5. A CMDB export is a flat dump of **Configuration Items (CIs)**, each
typed by its `sys_class_name`. One export commonly mixes applications, servers,
databases, and network gear in one file (or ships one file per class). The
adapter's central job is **CI-class → layer routing**, then per-class field
mapping.

---

## 1. What the export looks like

A CMDB export is produced from a CI list view (`cmdb_ci` and its subclasses) via
**Export → CSV/Excel**, or pulled from the Table API. Typical shape:

- Wide CSV/XLSX, one row per CI, dozens of columns. Reference fields
  (`vendor`, `support_group`, `model_id`, `location`) export either as the
  **display value** ("Oracle America, Inc.") or as a **sys_id** depending on the
  export setting — the adapter must handle both.
- **Signature columns** (trigger recognition): `sys_id`, `sys_class_name`,
  `install_status` (or `operational_status`), `cmdb_ci` / `name`, `sys_updated_on`.
  Presence of `sys_class_name` + `install_status` is the strong signal.
- Date/number formats follow the instance locale. `install_status` and
  `operational_status` often export as **numeric codes** (see §5) unless the
  instance is configured to export choice labels.

Common subclasses seen in one estate: `cmdb_ci_appl` / `cmdb_ci_app_server` /
`cmdb_ci_business_app` (apps), `cmdb_ci_server` / `cmdb_ci_win_server` /
`cmdb_ci_linux_server` / `cmdb_ci_esx_server` (servers), `cmdb_ci_database` /
`cmdb_ci_db_instance` (databases), `cmdb_ci_storage_*`, `cmdb_ci_netgear` /
`cmdb_ci_ip_router` / `cmdb_ci_ip_switch` (network).

---

## 2. CI-class → layer routing

Route **first** on `sys_class_name`, then apply the per-class mapping. Classes not
in the table → review-required ("unknown CI class `x`: which layer?").

| `sys_class_name` (family) | Routes to | Entity type |
|---|---|---|
| `cmdb_ci_business_app`, `cmdb_ci_appl`, `cmdb_ci_app_server`, `cmdb_ci_web_application`, `cmdb_ci_service_*` | **L2** | application |
| `cmdb_ci_server`, `cmdb_ci_win_server`, `cmdb_ci_linux_server`, `cmdb_ci_unix_server`, `cmdb_ci_aix_server` | **L5** | compute (physical/virtual host) |
| `cmdb_ci_esx_server`, `cmdb_ci_vcenter*`, `cmdb_ci_vm_instance`, `cmdb_ci_vmware_instance` | **L5** | virtualization (host / VM) |
| `cmdb_ci_database`, `cmdb_ci_db_instance`, `cmdb_ci_db_mssql_*`, `cmdb_ci_db_ora_*` | **L5** host **+ L4** store (split→) | database |
| `cmdb_ci_storage_*`, `cmdb_ci_san`, `cmdb_ci_disk` | **L5** | storage |
| `cmdb_ci_netgear`, `cmdb_ci_ip_router`, `cmdb_ci_ip_switch`, `cmdb_ci_lb`, `cmdb_ci_firewall` | **L5** | network |
| `cmdb_ci_datacenter`, `cmdb_ci_zone` | **L5** | datacenter |
| `cmdb_ci_cloud_*` (e.g. `cmdb_ci_cloud_service_account`) | **L5** | cloud_account |

> A `cmdb_ci_database` row is both an L5 host fact (the instance runs somewhere)
> *and* an L4 store (it holds data domains). Emit an L5 database host **and** an
> L4 store, linked by `engine+instance`. Most CMDBs do **not** capture data
> domains, warehouse-vs-OLTP role, or refresh — so the L4 store lands thin and is
> enriched later by the CDAO catalog adapter.

---

## 3. Column-mapping table

### 3a. Applications (L2) — `cmdb_ci_business_app` / `cmdb_ci_appl*`

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `name` | `l2.product` (display) | L2 | `1:1` (also feeds natural key) |
| `vendor` (or `manufacturer`) | `l2.vendor` + vendor spine | L2/spine | `norm()` → canonical vendor; resolve sys_id→name if needed |
| `model_id` / `model_number` | `l2.product` (refine) / vendor spine | L2 | `1:1`; helps disambiguate product+version |
| `version` / `u_version` | `l2.version` | L2 | `1:1` |
| `sys_class_name` (CI class) | `l2.architecture` (hint) | L2 | `lookup{…}` — *coarse*; usually review-required (§5) |
| `u_environment` / `environment` | `l2.environment` | L2 | `lookup{prod→production, …}` |
| `install_status` | `l2.lifecycle_disposition` | L2 | `lookup{}` (see §5 codes) |
| `operational_status` | `l2.operational_status` | L2 | `lookup{1→operational, …}` |
| `u_business_criticality` / `business_criticality` | `l2.business_criticality` | L2 | `lookup{}` → Tier 0/1/2/3 |
| `support_group` (assignment group) | `l2.it_owner` + ops spine | L2/spine | `norm()`; group name → owning team |
| `managed_by` / `owned_by` | `l2.business_owner` / `l2.it_owner` | L2/spine | `1:1` (person → owner) |
| `u_application_id` / `correlation_id` | `l2.source_ref` (ServiceNow id) | L2 | `1:1` (provenance only, not natural key) |
| `cost` / `u_annual_cost` | `l2.annual_tco_usd` (partial) | spine | `unit()` currency; **partial** — true TCO from Apptio |
| `u_compliance` / data-classification | `l2.compliance_scope` | spine | `lookup{HIPAA/PCI/SOX/…}` if present |
| `location` | `l2.hosting_location` → L5 ref | L2→L5 | `1:1` then link to L5 datacenter |
| `sys_id` | provenance key (not natural key) | — | retained for re-import diff |

### 3b. Servers / hosts (L5) — `cmdb_ci_server` / `*_server`

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `name` / `host_name` / `fqdn` | `l5.hostname` | L5 | `norm()` lowercase, strip domain → **natural key** |
| `sys_class_name` | `l5.entity_type` (compute vs virtualization) | L5 | `lookup{esx→virtualization, …}` |
| `os` / `os_version` | `l5.guest_os` | L5 | `1:1` |
| `cpu_count` / `cpu_core_count` | `l5.cpu` | L5 | `1:1` (note vCPU vs physical) |
| `ram` / `memory` (MB) | `l5.memory_gb` | L5 | `unit()` MB→GB |
| `disk_space` (GB) | `l5.storage_gb` | L5 | `1:1` |
| `virtual` (boolean) / class | `l5.virtualization` | L5 | `derive()` → vmware/hyperv/physical |
| `manufacturer` + `model_id` | `l5.hardware_model` + vendor spine | L5/spine | `norm()` (Dell/HPE/Cisco…) |
| `location` | `l5.datacenter_ref` | L5 | `1:1` → link L5 datacenter |
| `install_status` / `operational_status` | `l5.lifecycle` / `l5.operational_status` | L5 | `lookup{}` (§5) |
| `support_group` | ops spine owner | spine | `norm()` |

### 3c. Databases (split→ L5 host + L4 store) — `cmdb_ci_database`

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `name` (instance) | `l4.store_instance` + `l5.hostname` (if host) | L4/L5 | `norm()` → **natural key** `engine+instance` |
| `vendor` / `version` | `l4.engine` (SQL Server/Oracle/…) | L4 | `norm()` |
| `tcp_port`, `sid`, `catalog` | `l4.store_instance` (refine) | L4 | `1:1` |
| `runs_on` / hosting relationship | `l4→l5 host link` | link | relationship table (`cmdb_rel_ci`) |
| (data domains, role, refresh) | `l4.*` | L4 | **absent in CMDB** → review/enrich |

### 3d. Network / storage / datacenter (L5)

Map `name`→`l5.hostname`/asset name (natural key), `ip_address`,
`manufacturer`+`model_id`→`l5.hardware_model`+vendor, `location`→datacenter,
`sys_class_name`→entity_type (network vs storage). Network-gear specifics
(ports, role) usually need the Infra owner; default review-required for role.

---

## 4. Natural keys (reconciliation, model §4)

- **L2 application:** `norm(vendor) + "|" + norm(product)` (+ `environment` when
  multiple environments are tracked as separate CIs). `name` alone is **not** the
  key — CMDB names are inconsistent ("SAP ECC" vs "SAP ERP Central Component").
  Use `vendor`+`model_id`/`version` to derive a clean product token.
- **L5 host/cluster:** `norm(hostname)` — lowercase, strip DNS domain, strip
  trailing instance suffixes. This is the same key vCenter and cloud adapters use,
  so the *same server* described by CMDB and vCenter **merges**.
- **L4 store:** `norm(engine) + "|" + norm(instance)`.
- **Vendor:** `norm(legal/trade name)` into the vendor spine; every CI's `vendor`
  contributes.
- **`sys_id`** is kept as a stable **source ref** (for re-import diffing), never
  as the cross-source natural key — it is ServiceNow-internal and meaningless to
  vCenter/Flexera.

---

## 5. Review-required ambiguities (what the Steward asks)

1. **`sys_class_name` too coarse for architecture.** CI class tells you app vs
   server, not `mainframe` vs `client_server` vs `cots_packaged` vs
   `microservices`. **Default:** leave `l2.architecture` unset → ask, don't guess.
2. **Status codes vs labels.** `install_status` / `operational_status` may export
   as integers. Default code map (verify per instance — *these are configurable*):
   `install_status`: `1=Installed/operational`, `7=Retired/Decommissioned`,
   `100=Absent`, `3=In Maintenance`, `6=In Stock`, `4=Pending Install`.
   `operational_status`: `1=Operational`, `2=Non-Operational`, `6=Retired`.
   → `lookup{}` to `l2.lifecycle_disposition` (`retire`/`legacy_eol` for retired,
   `sustain`/`invest` otherwise — disposition itself usually needs human intent).
   **If codes are unmapped or non-standard → review-required.**
3. **Decommissioned CIs still present.** Exports frequently include
   `install_status=7/Retired`. Default: **do not commit as live** — flag
   "N retired CIs in export; include as historical or drop?"
4. **Free-text / sys_id vendor field.** `vendor` may be free text or an unresolved
   sys_id. Normalization below confidence threshold → ask
   ("`Oracle Corp` vs existing `Oracle America, Inc.` — same vendor?").
5. **Business app vs technical app duplication.** ServiceNow often has both a
   `cmdb_ci_business_app` ("Payroll") and underlying `cmdb_ci_appl` ("Workday
   HCM"). Default: prefer business_app as the L2 entity, attach technical apps as
   components; flag the relationship for confirmation.
6. **`environment` missing.** Many CMDBs don't track env on the CI. Default
   `production` only if the estate is single-environment; otherwise ask.
7. **Cost is not TCO.** `cost`/`u_annual_cost` is usually license or asset cost,
   not fully-loaded TCO. Map to `annual_tco_usd` as **partial**, marked for
   Apptio enrichment — never present as final TCO.
8. **DB role unknown.** A `cmdb_ci_database` could be OLTP, ODS, or a warehouse.
   CMDB rarely says. Default L4 store role = `unknown` → enrich from CDAO catalog.

---

## 6. Illustrative sample

**Source (ServiceNow CMDB CI export, mixed classes):**

| name | sys_class_name | vendor | u_environment | install_status | u_business_criticality | support_group | os | ram |
|---|---|---|---|---|---|---|---|---|
| Workday HCM | cmdb_ci_business_app | Workday, Inc. | Production | 1 | Tier 1 - High | HR Systems | | |
| sapprd01 | cmdb_ci_linux_server | Dell Inc. | Production | 1 | Tier 1 - High | Basis Team | RHEL 8.6 | 524288 |
| MERIDIAN_CLARITY | cmdb_ci_database | Microsoft | Production | 1 | Tier 1 - High | DBA Team | | |

**Mapped:**

- Row 1 → **L2 application** `{ product:"Workday HCM", vendor:"Workday",
  natural_key:"workday|hcm", environment:"production", lifecycle:sustain,
  business_criticality:"Tier 1", it_owner:"HR Systems", source_ref:sys_id }`.
  Vendor "Workday, Inc." → vendor spine `Workday`.
- Row 2 → **L5 compute** `{ hostname:"sapprd01", natural_key:"sapprd01",
  guest_os:"RHEL 8.6", memory_gb:512 (524288MB/1024), hardware_model vendor:Dell,
  operational_status:operational }`. Will **merge** with the vCenter VM of the
  same hostname.
- Row 3 → **split:** **L5 database host** `{ hostname:"meridian_clarity" }` +
  **L4 store** `{ engine:"SQL Server", instance:"MERIDIAN_CLARITY",
  natural_key:"sqlserver|meridian_clarity", role:unknown→review }`. Likely Epic
  Clarity — flag for CDAO catalog enrichment (role=data_warehouse).

---

## 7. Reviewer sanity-check notes

A reviewer with real ServiceNow experience should verify against the **actual
target instance**:

- `install_status` / `operational_status` **integer code maps** — these are
  per-instance choice lists and frequently customized. The defaults in §5 are
  the OOB values; confirm before trusting lifecycle routing.
- Whether reference fields (`vendor`, `support_group`, `location`, `model_id`)
  export as **display value or sys_id** in this instance's export profile — the
  adapter handles both but the sys_id-resolution lookup must be loadable.
- Which **business-criticality choice list** is in use (`Tier 0–3` vs
  `High/Medium/Low` vs `1–5`) — drives the `lookup{}` to our Tier 0/1/2/3.
- Custom `u_` columns vary per customer; the §3 list is illustrative of common
  ones, not exhaustive. Map customer-specific `u_` fields explicitly.
- Whether business_app vs technical app (`cmdb_ci_business_app` vs `cmdb_ci_appl`)
  duplication exists, and the preferred L2 entity choice (§5.5).
