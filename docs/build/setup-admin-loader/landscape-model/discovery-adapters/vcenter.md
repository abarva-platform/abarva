# Adapter: VMware vCenter (VM / host / cluster / datastore export)

> **Owner:** VP / Director, Infrastructure. **Primary target:** L5
> Infrastructure (compute, virtualization, storage). **Mode:** create + link-up
> to L2. **Natural key:** VM name / host (ESXi) FQDN / cluster name / datastore
> name.

vCenter is the authoritative source for the virtualized estate — the bulk of L5
compute in most companies that aren't fully cloud-native. It exports four related
object types that the adapter loads as distinct L5 entities and links together,
then links *up* to the L2 applications those VMs host.

---

## 1. What the export looks like

vCenter exports come from a few routes; the adapter recognizes all three by shape:

- **vSphere Client → Export list** (per inventory view): one CSV per object type
  — a **VMs** export, a **Hosts** export, a **Clusters/Datastores** export.
- **RVTools** (the de-facto field tool): one XLSX **workbook with many tabs** —
  `vInfo` (VMs), `vHost` (ESXi hosts), `vCluster`, `vDatastore`, `vNetwork`,
  `vCPU`, `vMemory`, `vDisk`. RVTools is extremely common in discovery; treat its
  tab names as **signature**.
- **PowerCLI** `Get-VM | Export-Csv` style dumps — column names follow the
  PowerCLI property names (`Name`, `PowerState`, `NumCpu`, `MemoryGB`,
  `VMHost`, `Guest`, `ProvisionedSpaceGB`, `UsedSpaceGB`).

Signature columns/tabs: presence of `Powerstate`/`PowerState`, `VMHost`/`Host`,
`Provisioned MB`/`ProvisionedSpaceGB`, `Datastore`, `Cluster`, and a guest-OS
field. RVTools tab names (`vInfo`, `vHost`) are the strongest signal.

---

## 2. Object → entity routing

| vCenter object (export/tab) | L5 entity | Notes |
|---|---|---|
| **VM** (`vInfo` / Get-VM) | virtualization → VM (compute) | the main rows; one per guest |
| **ESXi host** (`vHost`) | virtualization → hypervisor host (compute) | physical server running vSphere |
| **Cluster** (`vCluster`) | virtualization → cluster | groups hosts; HA/DRS unit |
| **Datastore** (`vDatastore`) | storage | backed by SAN/NAS (link to L5 storage) |
| **Resource pool / vApp** | (optional) grouping | usually skip unless app-aligned |

Containment links (model §4 "link"): **VM → ESXi host → cluster**, and
**VM → datastore(s)**. These are intra-L5. The cross-layer link is **VM → L2 app**
(§4 below).

---

## 3. Column-mapping table

### 3a. VMs (`vInfo` / Get-VM) → L5 virtualization (compute)

| Source column (RVTools / PowerCLI) | Canonical field | Layer | Transform |
|---|---|---|---|
| `VM` / `Name` | `l5.hostname` (VM name) | L5 | `norm()` → **natural key** |
| `DNS Name` / `Guest Hostname` | `l5.fqdn` (alt key) | L5 | `norm()`; better cross-source key than display name |
| `Powerstate` / `PowerState` | `l5.power_state` | L5 | `lookup{poweredOn→on, poweredOff→off, suspended→suspended}` |
| `OS according to the configuration file` / `OS according to the VMware Tools` / `Guest` | `l5.guest_os` | L5 | `norm()`; prefer VMware-Tools value (actual) over config |
| `CPUs` / `NumCpu` | `l5.cpu` (vCPU) | L5 | `1:1` (note: **vCPU**, not physical cores) |
| `Memory` (MB) / `MemoryGB` | `l5.memory_gb` | L5 | `unit()` MB→GB if MB |
| `Provisioned MB` / `ProvisionedSpaceGB` | `l5.storage_provisioned_gb` | L5 | `unit()` MB→GB |
| `In Use MB` / `UsedSpaceGB` | `l5.storage_used_gb` | L5 | `unit()` MB→GB |
| `Host` / `VMHost` | `l5.host_ref` (→ ESXi host) | L5 link | resolve to host entity |
| `Cluster` | `l5.cluster_ref` | L5 link | resolve to cluster entity |
| `Datastore` | `l5.datastore_ref` (1..n) | L5 link | split on multi-datastore |
| `Folder` / `Resource pool` | grouping hint / app tag | hint | feeds VM→app heuristic (§4) |
| `Annotation` / `Notes` / custom attrs / `Tags` | `l5.app_hint` | hint | **key for VM→L2 link** (§4) |
| `Datacenter` | `l5.datacenter_ref` | L5 link | vSphere datacenter object |
| `VM UUID` / `SMBIOS UUID` | `l5.source_ref` | L5 | stable id for re-import diff |

### 3b. ESXi hosts (`vHost`) → L5 virtualization (hypervisor)

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `Host` / `Hostname` | `l5.hostname` (FQDN) | L5 | `norm()` → **natural key** |
| `Cluster` | `l5.cluster_ref` | L5 link | — |
| `# CPU` / `# Cores` | `l5.cpu_sockets` / `l5.cpu_cores` | L5 | `1:1` (**physical** cores here) |
| `# Memory` (MB) | `l5.memory_gb` | L5 | `unit()` MB→GB |
| `Vendor` + `Model` | `l5.hardware_model` + vendor spine | L5/spine | `norm()` (Dell/HPE/Cisco UCS…) |
| `ESX Version` / `Build` | `l5.hypervisor_version` | L5 | `1:1` (vSphere version) |
| `Datacenter` | `l5.datacenter_ref` | L5 link | — |
| `# VMs` | `derive()` (cross-check) | — | reconcile against VM rows |

### 3c. Clusters (`vCluster`) → L5 virtualization (cluster)

`Name`→`l5.cluster_name` (**natural key**); `NumHosts`, `NumCPUcores`,
`TotalCPU`/`TotalMemory`→capacity; `HA enabled`/`DRS enabled`→`l5.ha_drs`;
`Datacenter`→link. Cluster is the HA/DRS boundary — useful for resilience/DR in
the security spine.

### 3d. Datastores (`vDatastore`) → L5 storage

`Name`→`l5.datastore_name` (**natural key**); `Capacity MB`→`l5.capacity_gb`
(`unit()`); `Free MB`/`Provisioned MB`→utilization; `Type` (VMFS/NFS/vSAN)→
`l5.storage_type`; `# VMs`→link count. Where the datastore is NFS/iSCSI to a SAN,
flag a link to the L5 storage array (often not in the vCenter export → review).

---

## 4. VM → L2 application linkage (the cross-layer join, model §4)

vCenter has **no application field** — it knows VMs, not apps. The link to L2 is
*inferred* and is the most valuable (and most error-prone) part of this adapter.
Heuristics, in priority order, each producing a confidence score:

1. **Tag / custom attribute / Annotation** says the app (e.g. tag
   `app=Workday`, annotation "Epic ODB node"). Highest confidence when present.
2. **Naming convention** (`norm(VM name)`). e.g. `sapprd01`, `epicodb02`,
   `tableau-app-03`. Match VM-name prefix against known L2 vendor/product tokens.
3. **Folder / resource pool** named after the app or business service.
4. **Hostname match to a ServiceNow L2 `runs_on` relationship** — if CMDB already
   linked an app CI to this hostname, adopt that link (strongest cross-source
   signal; this is the §4 merge paying off).

Below threshold → `l5.app_hint` stored, **link left for Steward** ("VM `sqlprd07`
— which application does this host? candidates: Epic Clarity, SAP BW").

---

## 5. Natural keys (reconciliation, model §4)

- **VM:** `norm(DNS name)` if present, else `norm(VM display name)`. Prefer DNS
  name — it matches ServiceNow `fqdn` and the cloud adapter's hostname after
  migration, so the **same machine merges** across CMDB ↔ vCenter ↔ cloud.
- **ESXi host:** `norm(host FQDN)`.
- **Cluster:** `norm(cluster name)` (scoped by vSphere datacenter when names
  repeat).
- **Datastore:** `norm(datastore name)`.
- **`VM UUID` / `SMBIOS UUID`** is retained as source ref for re-import diff, not
  as the cross-source key (other tools don't carry it consistently).

Duplicate-host caution: a VM seen in CMDB (as a server CI) and in vCenter must
merge on hostname, **not** create two L5 rows. The adapter relies on the shared
`hostname` natural key with ServiceNow.

---

## 6. Review-required ambiguities (what the Steward asks)

1. **VM→app linkage below confidence** (§4) — the big one; most VMs.
2. **vCPU vs physical cores.** VM `CPUs` are vCPU; host `# Cores` are physical.
   Don't sum vCPU across VMs as physical capacity — flag if a capacity rollup is
   attempted.
3. **Provisioned vs used storage.** Thin-provisioned VMs over-report provisioned.
   Default: carry both; use `used` for footprint, `provisioned` for commitment.
   Ask if only one is present which it represents.
4. **Powered-off / orphaned / template VMs.** `poweredOff` for a long time, or
   `template`/orphaned, may be dead. Default: load but flag — "N powered-off VMs;
   live or decommissioned?"
5. **Guest-OS source mismatch.** "OS per config file" vs "OS per VMware Tools"
   disagree (Tools value is truth but blank if Tools not running). Prefer Tools;
   flag blanks.
6. **Stale RVTools snapshot.** RVTools is a point-in-time dump; check export date
   vs other artifacts. Old snapshot → flag freshness.
7. **Datastore→SAN array link missing.** vCenter rarely names the backing array;
   the L5 storage link defaults to review (enriched by the Infra storage inventory
   or ServiceNow storage CIs).
8. **Cluster name collisions** across datacenters → scope key by datacenter.

---

## 7. Illustrative sample

**Source (RVTools `vInfo` tab, abbreviated):**

| VM | DNS Name | Powerstate | OS (VMware Tools) | CPUs | Memory | Provisioned MB | Host | Cluster | Datastore | Annotation |
|---|---|---|---|---|---|---|---|---|---|---|
| sapprd01 | sapprd01.corp.local | poweredOn | RHEL 8.6 | 8 | 524288 | 1048576 | esxprd05.corp.local | PROD-CLUSTER-A | ds_san_prod_03 | SAP S/4 app node |
| epicodb02 | epicodb02.meridian.org | poweredOn | Windows Server 2019 | 32 | 1048576 | 4194304 | esxprd11.meridian.org | EPIC-PROD | ds_pure_epic_01 | Epic ODB |

**Mapped:**

- Row 1 → **L5 VM** `{ hostname:"sapprd01.corp.local", power_state:on,
  guest_os:"RHEL 8.6", cpu:8 (vCPU), memory_gb:512, storage_provisioned_gb:1024,
  host_ref:"esxprd05.corp.local", cluster_ref:"PROD-CLUSTER-A",
  datastore_ref:"ds_san_prod_03", natural_key:"sapprd01.corp.local" }`. Annotation
  "SAP S/4 app node" → **L2 link** to `sap|s4hana` (high confidence). **Merges**
  with the ServiceNow `sapprd01` server CI on hostname.
- Row 2 → **L5 VM** `{ hostname:"epicodb02.meridian.org", memory_gb:1024 (1TB),
  cpu:32, datastore_ref:"ds_pure_epic_01" (Pure storage) }`. Annotation "Epic ODB"
  → **L2 link** to `epic|ehr`; supports the §4 conflict check vs an Apps claim of
  `vendor_hosted` Epic (here Infra shows on-prem Epic ODB nodes → raise conflict).

---

## 8. Reviewer sanity-check notes

A reviewer with real vCenter/RVTools experience should verify:

- That **memory units** in the actual export are MB (RVTools `vInfo` Memory is
  MB; PowerCLI `MemoryGB` is GB) before the MB→GB conversion is applied — getting
  this wrong is a 1024× error.
- That **vCPU vs physical-core** semantics are preserved end-to-end (VM rows =
  vCPU; host rows = sockets/cores) and not naively summed.
- The **VM→app heuristic** quality on this estate — does the naming convention
  actually encode the app? If names are opaque (`vm-0042`), nearly everything
  goes to review and the CMDB `runs_on` link (§4.4) becomes the only reliable
  source.
- Whether DNS names are populated (Tools running) — if mostly blank, the natural
  key falls back to display name and cross-source merge with CMDB weakens.
- That powered-off/template/orphaned handling matches the customer's intent
  (some keep large pools of templates that should not count as live estate).
