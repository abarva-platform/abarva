# Adapter: Cloud Inventory (Azure Resource Graph / AWS Config / GCP Asset Inventory)

> **Owner:** VP / Director, Infrastructure (Cloud / Platform team). **Primary
> target:** L5 Infrastructure (cloud_account, compute, storage, network) +
> some L4 (managed data services). **Mode:** create, multi-cloud. **Natural
> key:** cloud resource id (per provider) for resources; subscription / account /
> project id for `cloud_account`.

This adapter covers the **public-cloud** estate. Unlike vCenter (one product), it
is explicitly **multi-cloud**: a large estate (Apex tier) runs Azure + AWS + GCP
simultaneously. The adapter normalizes each provider's native inventory into one
L5 `cloud_account` spine plus typed resource entities, and uses **tags** as the
linkage to owner / environment / application.

---

## 1. What the export looks like (per provider)

| Provider | Native inventory source | Export shape |
|---|---|---|
| **Azure** | **Azure Resource Graph** (`az graph query`, Resource Graph Explorer) | JSON/CSV rows of resources: `id`, `name`, `type`, `resourceGroup`, `subscriptionId`, `location`, `tags`, `sku`, `properties` |
| **AWS** | **AWS Config** (aggregator export), or `describe-*` / Resource Explorer, or a CUR for cost | JSON: `resourceId`, `resourceType` (e.g. `AWS::EC2::Instance`), `accountId`, `awsRegion`, `tags`, `configuration` |
| **GCP** | **Cloud Asset Inventory** (`gcloud asset export`) | JSON: `name` (full resource path), `assetType` (e.g. `compute.googleapis.com/Instance`), `project`, `location`, `labels` |

Signature: Azure → `subscriptionId` + `type` like `microsoft.compute/...`;
AWS → `resourceType` like `AWS::...`; GCP → `assetType` like `*.googleapis.com/*`.
The provider is detected from these and drives the per-provider type map (§3).

A real discovery often arrives as **one file per subscription/account/project**;
the adapter expects multiple files and reconciles into one estate.

---

## 2. Resource type → entity routing

Each provider's resource type maps to a canonical L5/L4 entity class. The
**cloud_account** entity is created once per subscription/account/project and all
resources link to it.

| Canonical entity | Azure type (e.g.) | AWS type (e.g.) | GCP assetType (e.g.) |
|---|---|---|---|
| **cloud_account** (L5) | subscription (`subscriptionId`) | account (`accountId`) | project (`project`) |
| **compute** (L5) | `microsoft.compute/virtualmachines`, `.../virtualmachinescalesets` | `AWS::EC2::Instance`, `::AutoScaling::*` | `compute.../Instance` |
| **container/k8s** (L5 virtualization) | `microsoft.containerservice/managedclusters` (AKS) | `AWS::EKS::Cluster` | `container.../Cluster` (GKE) |
| **serverless** (L5/L2 arch) | `microsoft.web/sites` (Functions/App Svc) | `AWS::Lambda::Function` | `cloudfunctions.../Function` |
| **storage** (L5) | `microsoft.storage/storageaccounts`, managed disks | `AWS::S3::Bucket`, `::EBS::Volume` | `storage.../Bucket` |
| **network** (L5) | `microsoft.network/virtualnetworks`, `.../loadbalancers` | `AWS::EC2::VPC`, `::ELBV2::*` | `compute.../Network` |
| **managed DB → L4 store + L5** | `microsoft.sql/servers`, `.../flexibleServers`, Cosmos | `AWS::RDS::DBInstance`, `::DynamoDB::*` | `sqladmin.../Instance`, Spanner |
| **DW/lake → L4** | `microsoft.synapse/*`, `.../databricks` | `AWS::Redshift::*`, EMR, Glue | BigQuery dataset, Dataproc |
| **identity** (L5) | `microsoft.aad/*` (Entra) | IAM | Cloud Identity |

Unknown `type`/`resourceType`/`assetType` → review-required ("unmapped cloud
resource type `x` — entity class?").

---

## 3. Column-mapping table (provider-normalized)

The adapter normalizes the three providers' fields onto common canonical fields.

| Canonical field | Azure source | AWS source | GCP source | Transform |
|---|---|---|---|---|
| `l5.cloud_provider` | (azure) | (aws) | (gcp) | `derive()` from detection |
| `l5.cloud_account` (→ account entity) | `subscriptionId` (+ name) | `accountId` (+ alias) | `project` (+ name) | `1:1` → **account natural key** |
| `l5.resource_id` | `id` (full ARM id) | `resourceId` / ARN | `name` (full path) | `1:1` → **resource natural key** |
| `l5.resource_name` | `name` | resource Name tag / id | last path segment | `norm()` |
| `l5.entity_type` | `type` | `resourceType` | `assetType` | `lookup{}` (§2) |
| `l5.region` | `location` | `awsRegion` | `location` | `norm()` to canonical region label |
| `l5.resource_group` | `resourceGroup` | (n/a; tags/stack) | (folder) | `1:1` (grouping) |
| `l5.sku` / size | `sku` / `properties.hardwareProfile.vmSize` | instanceType | machineType | `1:1` (→ cpu/mem via SKU lookup) |
| `l5.power_state` | `properties.../powerState` | `state` (running/stopped) | `status` | `lookup{}` |
| **owner** (ops spine) | `tags.owner` / `tags.Owner` | `tags.owner` | `labels.owner` | `1:1` → owner |
| **environment** | `tags.environment`/`env` | `tags.environment` | `labels.env` | `lookup{}` → `l2.environment` |
| **app linkage** (→ L2) | `tags.app`/`application`/`service` | `tags.application` | `labels.app` | `norm()` → **VM→L2 link** |
| `l5.cost_center` | `tags.costCenter` | `tags.cost-center` | `labels.cost_center` | `1:1` → ops/finance |
| `l2.deployment_model` | `derive()` = `public_cloud` (or `saas`/`serverless` by type) | same | same | `derive()` |

Managed-database and warehouse resources **split→** an L4 store (engine = the
managed service, e.g. Azure SQL / RDS-PostgreSQL / BigQuery) **+** an L5 footprint,
linked by `engine+instance`.

---

## 4. Tags / labels are the linkage spine

Cloud resources carry **no native app/owner field** — like vCenter, the join to
L2 (application), the ops spine (owner, cost center), and `environment` come from
**tags** (Azure/AWS) / **labels** (GCP). Tagging discipline varies wildly:

- Well-tagged estate → `app`/`owner`/`env` populated → high-confidence linkage.
- Poorly-tagged → many resources with no app tag → linkage to review.

The adapter normalizes common tag-key variants
(`app`/`application`/`service`/`workload`; `env`/`environment`; `owner`/`team`)
case-insensitively, and records tag coverage as a quality metric.

---

## 5. Natural keys (reconciliation, model §4)

- **cloud_account:** `cloud_provider + "|" + account_id` (subscription id /
  account id / project id) — globally unique per provider.
- **Cloud resource:** the **provider resource id** (`id` / `resourceId`/ARN /
  full GCP path) — globally unique; the reliable cross-import key for re-runs.
- **Lift-and-shift VM cross-source merge:** a VM migrated from vCenter to cloud
  should merge on `norm(hostname)` where the cloud VM's name/`tags.hostname`
  matches the former on-prem hostname. Cloud resource id and hostname are tracked
  as **two keys**; the hostname key bridges to vCenter/CMDB.
- **Managed DB store:** `engine + "|" + instance/resource name`.

---

## 6. Review-required ambiguities (what the Steward asks)

1. **Untagged resources** — no `app`/`owner`/`env` tag. Default: load, link to
   review; report tag-coverage % per account.
2. **Multi-cloud account inventory of the *same* logical app.** A workload split
   across Azure + AWS must link to one L2 app — flag when an app tag appears
   across providers.
3. **SKU → cpu/memory.** Cloud size is a SKU string (`Standard_D8s_v5`,
   `m5.2xlarge`); actual vCPU/RAM need a SKU lookup table. If the table is absent,
   carry the SKU and leave cpu/memory unset → review.
4. **Serverless / PaaS have no host.** Lambda/Functions/App Service have no L5
   compute footprint in the classic sense — model as serverless L5 + `l2`
   architecture hint; don't force a host link.
5. **Stopped / deallocated resources** still in inventory — flag like vCenter
   powered-off (live vs deprovisioned).
6. **Cost not in the inventory.** Resource Graph/Config don't carry spend; TCO
   comes from the Azure cost export / AWS CUR / GCP billing export — flag
   `annual_tco_usd` as enrich-from-billing, not present.
7. **Region naming variants** (`eastus` vs `East US` vs `us-east-1`) → normalize
   to a canonical region label; ask on unknown.
8. **Resource-id format drift** (ARM id vs short name vs ARN) — ensure the full
   id is the stored key, not a truncated display name.

---

## 7. Illustrative sample (multi-cloud)

**Source A — Azure Resource Graph (JSON rows, abbreviated):**

| id | name | type | subscriptionId | location | tags |
|---|---|---|---|---|---|
| /subscriptions/abc/.../virtualMachines/web-prod-01 | web-prod-01 | microsoft.compute/virtualmachines | sub-abc | eastus | {app: storefront, env: prod, owner: digital} |
| /subscriptions/abc/.../storageAccounts/apexdatalake | apexdatalake | microsoft.storage/storageaccounts | sub-abc | eastus | {app: lakehouse, env: prod} |

**Source B — AWS Config (JSON, abbreviated):**

| resourceId | resourceType | accountId | awsRegion | tags |
|---|---|---|---|---|
| i-0a1b2c3d | AWS::EC2::Instance | 9988-7766 | us-east-1 | {application: storefront, environment: prod} |

**Mapped:**

- Azure VM `web-prod-01` → **L5 compute** under **cloud_account**
  `azure|sub-abc`, region `eastus`, deployment `public_cloud`, env `production`,
  owner `digital`; **L2 link** to app `storefront`.
- Azure storage `apexdatalake` (`storageaccounts`) → **L5 storage** *and*, because
  tag `app: lakehouse`, flagged as backing the **L4 lake/lakehouse** store →
  enrich/link from the CDAO catalog.
- AWS EC2 `i-0a1b2c3d` → **L5 compute** under **cloud_account** `aws|9988-7766`,
  region `us-east-1`, **L2 link** to the *same* `storefront` app as the Azure VM
  → raises a §6.2 multi-cloud-app note (storefront spans Azure + AWS).

---

## 8. Reviewer sanity-check notes

A reviewer with real cloud-inventory experience should verify:

- That the **resource-type → entity map** (§2) covers the customer's actual
  resource mix — the table lists the high-frequency types, not the hundreds of
  niche ones; uncovered types must route somewhere or to review.
- The **tag/label taxonomy** in use — the whole L2/owner/env linkage rests on it.
  Confirm the real tag keys (orgs often use `CostCenter`, `BusinessUnit`,
  `AppID` etc.) and add them to the §4 normalization map.
- That **cost** is correctly understood as *out of band* (inventory ≠ billing) —
  TCO must come from CUR / Azure cost / GCP billing, not Resource Graph.
- The **SKU→cpu/memory** lookup is current (SKUs change; new VM families appear).
- For **lift-and-shift** estates, whether the cloud VM names actually preserve the
  on-prem hostname (enabling the vCenter merge) or were renamed (breaking it).
- Multi-account/multi-cloud completeness — that every subscription/account/project
  was exported, since a missing account silently drops part of the estate.
