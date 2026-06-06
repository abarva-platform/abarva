# Pattern Pack 01 — Architecture & Platform (`ARCH`)

**Pack code:** `ARCH`
**Tier:** Cross-cutting · horizontal · the keystone pack every domain use case sits on.
**Created:** 2026-06-06

---

## What this pack is

This is the **cloud landing zone + lakehouse foundation** pack. Every other pattern pack — ingestion, modeling, MLOps, governance, FinOps, and every domain pack — assumes the platform described here already exists and is *green*. No data product, no model, no agent runs on a foundation that has not been stood up and proven first.

This pack exists because a prior artifact recommended "AWS platform setup" without standing up a landing zone — a single workload account, click-ops workspace, no Organizations, no SCP guardrails, no Transit Gateway, no Unity Catalog metastore. That is not a platform; it is a liability. The patterns below make that failure mode *impossible to repeat*: an artifact that cites this pack must select and defend a landing zone, a network spine, an identity model, a metastore design, and a readiness gate — not a single account with a workspace clicked into it.

### The platform-readiness principle

> **No data or AI workload begins until the platform-readiness gate is green.**
> Landing zone + network spine + workspace + Unity Catalog + identity federation + secrets + observability must all be provisioned-as-code, verified, and evidenced. "We'll harden it later" is the anti-pattern this pack was written to kill. See **ARCH-18** (platform-readiness gate).

### The ownership posture for this pack

Almost every pattern here lands on the **OWN** side of the OWN-IT-never-RENT spectrum, and that is not an accident. A landing zone, a customer-managed VPC, a regional Unity Catalog metastore, and Terraform/IaC modules are all deployed *into the client's own cloud accounts*. The control plane (Databricks SaaS, AWS/Azure consoles) is managed, but the **data plane, the IAM trust, the storage, the catalog, and the IaC source all live in the client's estate**. After the build, the client can fire the integrator and the platform keeps running. That is the test (README §"The first principle"), and the landing zone is where it is won or lost. Where a pattern admits a rent-side option (e.g., serverless compute, a SaaS observability backend), it is flagged explicitly with the ownership trade.

### Composition note

A domain use case typically composes: **ARCH-01** (landing zone) + **ARCH-04/05** (network) + **ARCH-06** (workspace) + **ARCH-07** (PrivateLink) + **ARCH-08** (Unity Catalog) + **ARCH-12** (identity) + **ARCH-18** (readiness gate), then layers `INGEST-*`, `MODEL-*`, `MLOPS-*`, `GOV-*`, `FINOPS-*` on top. Azure-Databricks clients swap **ARCH-16** (Azure landing-zone variant) for ARCH-01/04/06.

---

## Pattern index

| ID | Name | Tier |
|---|---|---|
| ARCH-01 | AWS landing zone — Control Tower + Organizations | landing zone |
| ARCH-02 | Account Factory for Terraform (AFT) | landing zone |
| ARCH-03 | Service Control Policies + guardrail baseline | landing zone / governance |
| ARCH-04 | Network spine — Transit Gateway hub-and-spoke + IPAM | network |
| ARCH-05 | Egress control — Network Firewall allowlist + VPC endpoints | network |
| ARCH-06 | Databricks workspace provisioning (customer-managed VPC) | data plane |
| ARCH-07 | Databricks PrivateLink (front-end + back-end) | network / data plane |
| ARCH-08 | Unity Catalog regional metastore design | governance |
| ARCH-09 | Catalog / schema / grant hierarchy | governance |
| ARCH-10 | Cluster policies + compute governance | data plane |
| ARCH-11 | Storage layout — S3 root bucket + managed/external locations | data plane |
| ARCH-12 | Identity federation — IAM Identity Center + SCIM | identity |
| ARCH-13 | Secrets management — Secrets Manager-backed scopes | security |
| ARCH-14 | Multi-environment topology + Asset Bundle promotion | data plane / serving |
| ARCH-15 | Observability — system tables + audit logs + Object Lock | governance / observability |
| ARCH-16 | Azure Databricks landing-zone variant (CAF / ALZ) | landing zone (Azure) |
| ARCH-17 | Disaster recovery + multi-region posture | resilience |
| ARCH-18 | Platform-readiness gate | gate / all tiers |
| ARCH-19 | Cost-control architecture (tagging + budget guardrails) | governance / FinOps boundary |
| ARCH-20 | Serverless + lakehouse-native compute posture | data plane |

---

### PATTERN ARCH-01 · AWS landing zone — Control Tower + Organizations

**Intent** — Stand up a governed, multi-account AWS foundation before any workload, so security, logging, and guardrails are structural rather than bolted on.

**Applies to** — All AWS-hosted engagements; the first foundation milestone of every Move. Lifecycle: Architecture → Mobilization.

**Solution shape** — AWS **Control Tower** establishes the landing zone, which sits on **AWS Organizations**. Control Tower provisions the mandatory shared accounts at setup: a **management (payer) account**, a **Log Archive account**, and an **Audit (security) account**, organized into a **Security OU** and a **Sandbox OU** by default, extended with a **Workloads OU** (split Prod / Non-Prod) and an **Infrastructure OU** (networking, shared services). Control Tower enforces **preventive guardrails** (SCPs) and **detective guardrails** (AWS Config rules) across the org. Multi-account strategy follows AWS's "one account = one blast-radius boundary": separate accounts per environment per workload domain, never one shared account.

**Own-it vs rent** — **OWN.** Control Tower and Organizations are AWS-native; the accounts, the org tree, the guardrails, and the logs all live in the client's own AWS Organization. AWS operates the console; the client owns every account, every byte of CloudTrail, and the entire account structure. After build, the client (or any successor integrator) administers it directly. No vendor holds the keys.

**Where it sits** — Landing zone tier. Precedes everything.

**Evidence anchors** — AWS Control Tower docs, "Shared accounts" and "Landing zone" (docs.aws.amazon.com/controltower/latest/userguide/how-control-tower-works.html). AWS Well-Architected Framework, Security Pillar, "AWS account management and separation" (SEC01-BP01). AWS Organizations best-practices whitepaper, multi-account strategy. Best-in-class delivery stands up the landing zone in **days-to-low-weeks** when AFT-driven (estimate — confirm against client change-control cadence).

**Anti-patterns** — (1) *Single-account architecture* — one account holding prod, dev, logging, and security; no blast-radius boundary, no SCP layering, a single root compromise is total. This is the exact failure the pack was written against. (2) *Click-ops landing zone* — building the org tree by hand in the console; not reproducible, no DR, drifts immediately. (3) *Logging into the workload account* — CloudTrail/Config logs writable by the same principals that run workloads; an attacker erases their own tracks. Logs must land in the separate Log Archive account.

**Feeds artifacts** — Architecture target-state (foundation layer); Mobilization foundation milestone; Business case foundation line item; Governance control-mapping (account separation as a control).

**Maturity** — production-ready.

---

### PATTERN ARCH-02 · Account Factory for Terraform (AFT)

**Intent** — Make account vending reproducible, auditable, and policy-consistent — every new account is born with the same baseline, from code.

**Applies to** — Any engagement that will provision more than a couple of accounts (i.e., all of them). Lifecycle: Architecture → Mobilization → run.

**Solution shape** — **Account Factory for Terraform (AFT)** layers a Terraform pipeline on top of Control Tower's Account Factory. An account request is a Terraform/`tfvars` entry in a Git repo; AFT's CodePipeline provisions the account via Control Tower, then runs **global customizations** (baseline IAM roles, VPC, GuardDuty, Config, tags) and **account-specific customizations**. The account-request repo is the source of truth; new accounts are pull requests. AFT keeps state in the client's AWS (S3 + DynamoDB lock) within the management/dedicated AFT account.

**Own-it vs rent** — **OWN.** AFT is open AWS reference architecture (Terraform). The pipelines, state, and modules run in the client's accounts and live in the client's Git. The client owns the vending mechanism and can extend or fork it freely.

**Where it sits** — Landing zone tier; the automation layer over ARCH-01.

**Evidence anchors** — AWS AFT docs (docs.aws.amazon.com/controltower/latest/userguide/aft-overview.html); `aws-ia/terraform-aws-control_tower_account_factory` module. AWS Well-Architected, Operational Excellence Pillar, "Perform operations as code" (OPS05).

**Anti-patterns** — (1) *Console-vended accounts* — bypassing AFT to click "Enroll account"; baseline drifts, customizations are inconsistent, no audit trail of why an account exists. (2) *Per-account snowflake baselines* — hand-editing each account's roles/VPC instead of routing through global customizations; un-auditable, un-reproducible. (3) *AFT state in a workload account* — co-locating the vending machine's state with workloads, breaking the blast-radius boundary.

**Feeds artifacts** — Architecture (provisioning model); Mobilization (foundation automation milestone); Governance (operations-as-code evidence).

**Maturity** — production-ready.

---

### PATTERN ARCH-03 · Service Control Policies + guardrail baseline

**Intent** — Set hard, org-level boundaries no workload account can escape — region locks, root-action denials, deny-public-S3, deny-disable-logging.

**Applies to** — All AWS engagements; especially regulated domains (HITRUST, HIPAA, PCI). Lifecycle: Architecture → run.

**Solution shape** — **Service Control Policies (SCPs)** attached at OU level via Organizations. A baseline SCP set: **region restriction** (deny all actions outside approved regions), **deny root user actions**, **deny disabling CloudTrail / Config / GuardDuty / Security Hub**, **deny S3 public access / deny making buckets public**, **deny leaving the Organization**, **require IMDSv2**, **deny unencrypted EBS/S3**. SCPs are *preventive* (they cap the maximum permission); they pair with **AWS Config** detective rules and **Security Hub** standards (CIS, AWS FSBP) for continuous detection. Control Tower's mandatory and strongly-recommended controls supply a starting set; the client extends with custom SCPs in version control.

**Own-it vs rent** — **OWN.** SCPs live in the client's Organization. The integrator authors them as code; the client owns and amends them. No external policy SaaS holds the guardrails.

**Where it sits** — Landing zone / governance tier. Boundary on top of ARCH-01.

**Evidence anchors** — AWS Organizations SCP docs (docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html); Control Tower controls reference; AWS Foundational Security Best Practices (FSBP) standard in Security Hub; CIS AWS Foundations Benchmark. Maps to GOV pack control catalog.

**Anti-patterns** — (1) *No SCPs ("IAM is enough")* — IAM policies can be edited by any account admin; SCPs are the only hard ceiling. (2) *Allow-list SCP applied too broadly* — an over-tight allow-list SCP at the root OU that breaks Control Tower's own automation. (3) *Region sprawl* — no region-restriction SCP, so workloads and data quietly land in non-compliant regions, breaking data-residency commitments.

**Feeds artifacts** — Architecture (guardrail layer); Governance (preventive-control evidence, maps to GOV-* control catalog); Mobilization (foundation hardening milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-04 · Network spine — Transit Gateway hub-and-spoke + IPAM

**Intent** — Give the estate a single, non-overlapping, centrally-routed network backbone instead of a tangle of peered VPCs.

**Applies to** — All multi-account AWS engagements; mandatory once there is more than one VPC or any on-prem/hybrid connectivity. Lifecycle: Architecture → Mobilization.

**Solution shape** — A **hub-and-spoke** topology built on **AWS Transit Gateway (TGW)**, owned in a central **networking account** (Infrastructure OU) and **shared via AWS RAM** to workload accounts. Spoke VPCs attach to the TGW; TGW route tables segment traffic (e.g., prod cannot route to dev). **AWS IPAM** (IP Address Manager) governs CIDR allocation org-wide so no two VPCs overlap — a prerequisite for TGW and for any future on-prem peering. VPCs use a standard subnet tier model: private (compute), private (data), and a tightly scoped public/egress tier only where strictly needed. Inbound from on-prem arrives via **Direct Connect** or **Site-to-Site VPN** terminating on the TGW.

**Own-it vs rent** — **OWN.** TGW, IPAM, VPCs, and route tables are all client-owned AWS resources, defined as Terraform. The client owns the entire routing fabric.

**Where it sits** — Network tier. Underpins ARCH-05, ARCH-06, ARCH-07.

**Evidence anchors** — AWS Transit Gateway docs and "Building a global network using AWS Transit Gateway Inter-Region peering"; AWS IPAM docs (docs.aws.amazon.com/vpc/latest/ipam/); AWS Well-Architected, Reliability Pillar, network topology guidance; AWS "Hub-and-spoke network" reference architecture.

**Anti-patterns** — (1) *VPC peering mesh* — full-mesh peering between N VPCs (N² peerings) instead of a TGW hub; unmanageable past a handful of VPCs, no transitive routing. (2) *Overlapping CIDRs* — VPCs allocated ad hoc without IPAM, then discovered to overlap when TGW/on-prem peering is attempted — a forced, expensive re-IP. (3) *Flat network* — one giant VPC shared across environments; no segmentation, fails HITRUST/PCI network-segmentation controls.

**Feeds artifacts** — Architecture (network target-state); Mobilization (network foundation milestone); Governance (network-segmentation control evidence).

**Maturity** — production-ready.

---

### PATTERN ARCH-05 · Egress control — Network Firewall allowlist + VPC endpoints

**Intent** — Ensure no compute reaches the public internet uncontrolled, and that traffic to AWS services never leaves the AWS network at all.

**Applies to** — All engagements handling regulated or sensitive data (PHI, PII, financial); the default posture for the lakehouse data plane. Lifecycle: Architecture → run.

**Solution shape** — **No-public-IP compute** is the baseline: Databricks clusters and any EC2/EMR run in **private subnets with no public IPv4**. Egress is centralized through the networking account where **AWS Network Firewall** enforces a **domain/FQDN egress allowlist** (e.g., only the Databricks control-plane endpoints, package mirrors, and approved SaaS); everything else is denied and logged. **Interface and gateway VPC endpoints (AWS PrivateLink)** keep traffic to **S3** (gateway endpoint), **STS, Kinesis, Secrets Manager, ECR, CloudWatch Logs, Kinesis Data Firehose** (interface endpoints) entirely on the AWS backbone — never traversing the internet or the firewall. Databricks back-end services (DBFS root S3, control-plane relay, secure cluster connectivity) reach AWS via these endpoints. Outbound to the Databricks control plane uses **back-end PrivateLink** (see ARCH-07), so even control traffic is private.

**Own-it vs rent** — **OWN.** Network Firewall, the VPC endpoints, and the allowlist rules are all client resources defined as code. The egress policy is the client's to set and audit.

**Where it sits** — Network tier; the security boundary around the data plane.

**Evidence anchors** — AWS Network Firewall docs (docs.aws.amazon.com/network-firewall/); AWS PrivateLink and "Gateway endpoints for Amazon S3" docs; Databricks "Enable private connectivity using AWS PrivateLink" and "Configure a customer-managed VPC" (docs.databricks.com/en/security/network/). AWS Well-Architected, Security Pillar, "Control traffic at all layers" (SEC05). HITRUST CSF network-segmentation requirements (maps to GOV pack).

**Anti-patterns** — (1) *Public-IP compute clusters* — clusters with public IPs or in public subnets; fails HITRUST/PCI network-segmentation controls, exposes the data plane. (2) *NAT-to-anywhere egress* — a NAT gateway with no firewall, allowing exfiltration to arbitrary destinations; no allowlist, no DLP boundary. (3) *S3 traffic over the internet* — no S3 gateway endpoint, so data-plane reads/writes traverse NAT/IGW, incurring cost and exposure. (4) *Endpoint sprawl without policy* — interface endpoints created without endpoint policies, so any principal in the VPC can reach any account's S3 via the endpoint.

**Feeds artifacts** — Architecture (network security target-state); Governance (egress-control + network-segmentation evidence); Mobilization (security hardening milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-06 · Databricks workspace provisioning (customer-managed VPC)

**Intent** — Stand up Databricks workspaces reproducibly into the client's own network and storage, so the data plane lives in the client estate.

**Applies to** — All Databricks-on-AWS engagements. Lifecycle: Architecture → Mobilization.

**Solution shape** — Provision workspaces with the **Databricks Terraform provider** (`databricks/databricks`), not the console. The workspace uses a **customer-managed VPC** (the client's spoke VPC from ARCH-04), a **cross-account IAM role** that lets the Databricks control plane launch compute in the client's account, and a **workspace root S3 bucket** (DBFS root) in the client's account with bucket policy scoped to the Databricks account ID. Configure via the `databricks_mws_*` resources: `databricks_mws_networks` (VPC, subnets, security groups), `databricks_mws_storage_configurations` (root bucket), `databricks_mws_credentials` (cross-account role), then `databricks_mws_workspaces`. The control plane is Databricks-managed SaaS; the **classic compute plane and all data sit in the client's VPC and S3**.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** The Databricks control plane is a managed SaaS (rent side: Databricks operates it). But the **data plane, the VPC, the cross-account IAM trust, the root bucket, and the workspace-as-Terraform all live in and are owned by the client.** Data and compute never leave the client's account. The client owns the data, the notebooks/jobs are exportable as code, and Unity Catalog metadata (ARCH-08) lives in the client's metastore. This is the correct "own the destination, rent the orchestration" posture for a lakehouse the client owns.

**Where it sits** — Data plane tier.

**Evidence anchors** — Databricks Terraform provider docs, "Provision workspaces" and `databricks_mws_workspaces` (registry.terraform.io/providers/databricks/databricks); Databricks "Configure a customer-managed VPC" (docs.databricks.com/en/security/network/classic/customer-managed-vpc.html); Databricks "Cross-account IAM role" docs.

**Anti-patterns** — (1) *Click-ops workspace creation* — creating workspaces in the account console; not reproducible, no DR rebuild path, no Git history, the exact "AWS platform setup with no landing zone" failure. (2) *Databricks-managed VPC in production* — accepting the default Databricks-managed VPC instead of a customer-managed VPC; gives up network control, can't apply ARCH-05 egress controls. (3) *Shared root bucket across workspaces* — co-mingling DBFS roots; breaks isolation and DR. (4) *Over-broad cross-account role* — granting the Databricks role `*` permissions instead of the documented minimal policy.

**Feeds artifacts** — Architecture (data-plane target-state); Mobilization (workspace foundation milestone); Governance (data-residency evidence — data stays in client account).

**Maturity** — production-ready.

---

### PATTERN ARCH-07 · Databricks PrivateLink (front-end + back-end)

**Intent** — Eliminate public internet traffic to and from the Databricks control plane — users and compute reach Databricks privately.

**Applies to** — Regulated and security-sensitive engagements (the default for PHI/PII/financial). Lifecycle: Architecture → Mobilization.

**Solution shape** — Two PrivateLink connections via AWS interface VPC endpoints to Databricks-published endpoint services: **back-end PrivateLink** — the classic compute plane in the client VPC reaches the control plane (REST API) and the **secure cluster connectivity (SCC) relay** over PrivateLink, so cluster traffic never uses public IPs; **front-end PrivateLink** — users reach the workspace web app / REST API privately, typically from on-prem over Direct Connect/VPN through a transit/PrivateLink VPC. Combined with **IP access lists** and **no-public-IP compute** (ARCH-05), this yields a workspace with **no public traffic to the control plane**. Provisioned via `databricks_mws_vpc_endpoint` and `databricks_mws_private_access_settings`.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** The endpoints and PrivateLink config are client-owned AWS/Databricks resources defined as code; the connectivity model keeps all traffic inside the client's controlled network. The control plane remains Databricks-managed, but reachability is on the client's private network terms.

**Where it sits** — Network / data-plane tier; tightens ARCH-05/ARCH-06.

**Evidence anchors** — Databricks "Enable private connectivity using AWS PrivateLink" (docs.databricks.com/en/security/network/classic/privatelink.html); Databricks "Secure cluster connectivity (no public IP / NPIP)" docs; `databricks_mws_private_access_settings` provider docs.

**Anti-patterns** — (1) *Front-end public, back-end private (or vice versa)* — securing only one direction; the workspace UI or the API remains internet-reachable. (2) *PrivateLink without IP access lists* — relying on PrivateLink alone while leaving the public endpoint enabled and unrestricted. (3) *SCC disabled* — leaving secure cluster connectivity off, so clusters get public IPs and open inbound ports.

**Feeds artifacts** — Architecture (private-connectivity target-state); Governance (no-public-traffic evidence for HITRUST/HIPAA); Mobilization (network hardening milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-08 · Unity Catalog regional metastore design

**Intent** — Establish one governance brain per region so data, lineage, and access control are unified — not fragmented per workspace.

**Applies to** — All Databricks engagements; the governance foundation for every domain pack. Lifecycle: Architecture → Mobilization.

**Solution shape** — Create **one Unity Catalog (UC) metastore per region**, and **attach all workspaces in that region to it**. The metastore is the top of the object hierarchy (metastore → catalog → schema → table/volume/model/function). A metastore-level storage location backs managed tables. Identity is federated in at the **account level** (account console / account-level SCIM), and the metastore is assigned to workspaces. Cross-workspace lineage, Delta Sharing, and consistent grants all depend on workspaces sharing one metastore. Provision with `databricks_metastore`, `databricks_metastore_assignment`, and account-level provider configuration.

**Own-it vs rent** — **OWN.** The metastore, its backing storage, and all catalog metadata live in the client's account and Unity Catalog. The client owns the governance graph, lineage, and grants. Exportable and portable.

**Where it sits** — Governance tier; the spine that ARCH-09 builds on.

**Evidence anchors** — Databricks "What is Unity Catalog?" and "Create a Unity Catalog metastore" — explicitly: **one metastore per region, attach all workspaces in that region** (docs.databricks.com/en/data-governance/unity-catalog/create-metastore.html). Databricks "Unity Catalog best practices."

**Anti-patterns** — (1) *Per-workspace metastore* — one metastore per workspace (the pre-UC Hive metastore mental model); **fragments governance, blocks cross-workspace lineage, prevents unified grants and Delta Sharing**. This is the single most common UC design error. (2) *Multiple metastores per region* — more than one metastore in a region; Databricks supports one per region and the extra cannot be assigned to those workspaces meaningfully. (3) *Legacy `hive_metastore` as primary* — continuing to land data in the workspace-local Hive metastore instead of UC catalogs; no central governance, no lineage.

**Feeds artifacts** — Architecture (governance target-state); Governance (data-governance control foundation, feeds GOV-*); Modeling (catalog placement for data products, feeds MODEL-*); Mobilization (governance foundation milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-09 · Catalog / schema / grant hierarchy

**Intent** — Lay out catalogs and schemas so environment, domain, and medallion layer are legible, and grants flow from groups not individuals.

**Applies to** — All Databricks engagements; directly shapes how `MODEL-*` data products are placed. Lifecycle: Architecture → run.

**Solution shape** — A deliberate three-tier layout under the metastore. A common, defensible pattern: **catalog = environment × domain** (e.g., `prod_clinical`, `dev_clinical`, `prod_finance`) or **catalog = domain, schema = environment** — chosen and documented, not ad hoc. Within a catalog, **schemas align to medallion layers and/or data-product groupings** (`bronze`, `silver`, `gold`, or product-named gold schemas). **Grants are made to groups, never to users** (groups federated via SCIM, ARCH-12), and use UC privileges (`USE CATALOG`, `USE SCHEMA`, `SELECT`, `MODIFY`, etc.) with **catalog-owner / schema-owner** groups. Managed tables/volumes are default; **external locations** (ARCH-11) are governed for raw landing. Defined as code via `databricks_catalog`, `databricks_schema`, `databricks_grants`/`databricks_grant`.

**Own-it vs rent** — **OWN.** The entire namespace and grant model live in the client's UC metastore as code. Client owns the access model.

**Where it sits** — Governance tier; sits inside ARCH-08.

**Evidence anchors** — Databricks "Unity Catalog object model" and "Manage privileges in Unity Catalog" (docs.databricks.com/en/data-governance/unity-catalog/manage-privileges/); Databricks "Unity Catalog best practices" (catalog/schema organization, group-based grants, environment isolation by catalog).

**Anti-patterns** — (1) *User-level grants* — granting `SELECT` to individuals; un-auditable, breaks when people move teams, no inheritance. Grant to SCIM-synced groups. (2) *One catalog for everything* — all environments and domains in a single catalog; no environment isolation, prod and dev co-mingled. (3) *Medallion-as-catalog* — `bronze`/`silver`/`gold` as top-level catalogs spanning all domains, instead of layers as schemas within a domain catalog; cross-cuts ownership and confuses lineage.

**Feeds artifacts** — Architecture (governance target-state); Modeling (data-product placement, feeds MODEL-*); Governance (access-model evidence); Ingestion (where Bronze lands, feeds INGEST-*).

**Maturity** — production-ready.

---

### PATTERN ARCH-10 · Cluster policies + compute governance

**Intent** — Constrain how compute is created so cost, security, and isolation are enforced at creation time, not audited after.

**Applies to** — All Databricks engagements; especially multi-tenant or regulated workspaces. Lifecycle: Architecture → run.

**Solution shape** — **Cluster policies** (`databricks_cluster_policy`) constrain instance types, autoscaling bounds, **auto-termination** (mandatory), tags (ARCH-19), Spark configs, and **data security / isolation mode**. Use **access modes** that support Unity Catalog: **Standard (shared)** and **Dedicated (single-user)** access modes — *not* the legacy no-isolation mode. Attach **instance profiles** only where direct S3 access outside UC is genuinely needed (prefer UC-governed access). Enable **Photon** for SQL/ETL performance where it pays off. Use **instance pools** (`databricks_instance_pool`) to cut cluster spin-up latency and pin warm capacity. Serverless egress is controlled via **serverless network policies / NCC** (network connectivity configuration) so serverless compute also honors the egress allowlist (ARCH-05/ARCH-20).

**Own-it vs rent** — **OWN** (classic) / **MANAGED-OWN-DESTINATION** (serverless). Classic compute runs in the client VPC under client policies. Serverless runs in Databricks' account (rent side for the compute host) but is governed by client-owned policies and NCC egress rules, and operates on client-owned data in the client's UC — flag the serverless host-location trade explicitly (see ARCH-20).

**Where it sits** — Data-plane tier.

**Evidence anchors** — Databricks "Compute policies" and "Access modes" / "Compute access mode limitations for Unity Catalog" (docs.databricks.com/en/compute/access-mode-limitations.html); Databricks "Instance pools"; Databricks "Photon"; Databricks "Serverless network connectivity / NCC" docs.

**Anti-patterns** — (1) *No-isolation shared clusters* — legacy access mode with no user isolation; one user's code can read another's credentials, incompatible with UC governance. (2) *No auto-termination* — clusters that run forever; the #1 avoidable spend leak (handed to FINOPS pack for modeling, but enforced here). (3) *Instance profiles as the default access path* — bypassing UC with broad instance-profile S3 access; defeats central governance. (4) *Unbounded autoscale* — policies with no max worker cap; a runaway job scales to hundreds of nodes.

**Feeds artifacts** — Architecture (compute-governance target-state); Governance (isolation-mode evidence); FinOps (auto-termination + sizing inputs, feeds FINOPS-*); MLOps (compute for training/serving, feeds MLOPS-*).

**Maturity** — production-ready.

---

### PATTERN ARCH-11 · Storage layout — S3 root bucket + managed/external locations

**Intent** — Lay out object storage so managed data, raw landing, and logs are separate, governed, and encrypted with client-held keys.

**Applies to** — All Databricks-on-AWS engagements. Lifecycle: Architecture → Mobilization.

**Solution shape** — Distinct S3 buckets by purpose: a **workspace root (DBFS) bucket** (ARCH-06, not for user data), a **UC managed-storage bucket** per metastore/catalog (managed tables/volumes), and **external-location buckets** for raw/landing and Bronze where data arrives from ingestion. UC governs external buckets through **storage credentials** (`databricks_storage_credential`, backed by an IAM role) + **external locations** (`databricks_external_location`), so access flows through UC grants, not raw IAM. Encrypt with **SSE-KMS using customer-managed keys (CMK)**; enable **bucket versioning**, **block public access**, and **access logging**. Audit/log buckets get **Object Lock** (see ARCH-15).

**Own-it vs rent** — **OWN.** Every bucket, the CMKs, the IAM roles, and the UC storage credentials/external locations are client-owned. Data at rest is encrypted with the client's keys in the client's account.

**Where it sits** — Data-plane tier; the persistence layer under ARCH-08/09.

**Evidence anchors** — Databricks "Manage external locations and storage credentials" (docs.databricks.com/en/connect/unity-catalog/external-locations.html); Databricks "Set up managed storage" docs; AWS S3 "Using SSE-KMS" and "Block Public Access" docs; AWS Well-Architected Security Pillar, "Protect data at rest" (SEC08).

**Anti-patterns** — (1) *Everything in the DBFS root* — landing user data in the workspace root bucket; no governance separation, root-bucket bloat, DR coupling. (2) *Raw IAM access to data buckets* — granting compute direct IAM S3 access instead of UC storage credentials + external locations; bypasses UC grants and lineage. (3) *AWS-managed SSE-S3 only for regulated data* — no CMK, so the client cannot independently revoke key access or evidence key control. (4) *Public-readable bucket* — block-public-access disabled.

**Feeds artifacts** — Architecture (storage target-state); Governance (encryption-with-CMK + access-via-UC evidence); Ingestion (landing-zone bucket layout, feeds INGEST-*); Modeling (managed-table storage, feeds MODEL-*).

**Maturity** — production-ready.

---

### PATTERN ARCH-12 · Identity federation — IAM Identity Center + SCIM to Databricks

**Intent** — One identity source of truth; users and groups flow into Databricks automatically, and group membership drives catalog access.

**Applies to** — All engagements. Lifecycle: Architecture → Mobilization → run.

**Solution shape** — The client's IdP (Entra ID / Okta / Ping) federates to **AWS IAM Identity Center (successor to AWS SSO)** for AWS console/account access, and **SCIM-provisions users and groups into the Databricks account console** (account-level SCIM, not per-workspace). Databricks **single sign-on** is configured via SAML/OIDC to the same IdP with **unified login** at the account level. **Groups are the unit of access**: a SCIM-synced group (e.g., `clinical-analysts`) is granted UC privileges on a catalog/schema (ARCH-09), so **group→catalog grant inheritance** means onboarding a user is just adding them to the IdP group. Provision with account-level `databricks_user`/`databricks_group`/`databricks_group_member` driven from the IdP, or native SCIM.

**Own-it vs rent** — **OWN.** Identity lives in the client's IdP and IAM Identity Center; Databricks consumes it via SCIM/SSO. The client owns the directory and the group→grant mapping. Offboarding in the IdP propagates automatically.

**Where it sits** — Identity tier; cross-cuts every other pattern.

**Evidence anchors** — AWS IAM Identity Center docs (docs.aws.amazon.com/singlesignon/); Databricks "Set up SCIM provisioning" and "Configure SSO" / "Unified login" (docs.databricks.com/en/admin/users-groups/scim/); Databricks "Sync users and groups from your identity provider."

**Anti-patterns** — (1) *Per-workspace SCIM* — provisioning identities into each workspace separately instead of account-level; drift, duplicate groups, broken inheritance. (2) *Local Databricks users* — creating users directly in Databricks outside the IdP; orphaned accounts, no central offboarding — a leaver retains access. (3) *Grants to users not groups* — see ARCH-09; defeats inheritance. (4) *Shared service-user logins* — humans sharing one account; no attribution in audit logs.

**Feeds artifacts** — Architecture (identity target-state); Governance (least-privilege + joiner/mover/leaver evidence, feeds GOV-*); Mobilization (identity foundation milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-13 · Secrets management — Secrets Manager-backed scopes

**Intent** — Keep credentials out of notebooks and code; centralize them with rotation and audit.

**Applies to** — All engagements with external connections (databases, APIs, SaaS sources). Lifecycle: Architecture → run.

**Solution shape** — Store secrets in **AWS Secrets Manager** (rotation, KMS-encrypted, CloudTrail-audited) and expose them to Databricks via **secret scopes**. Two patterns: (1) **Databricks-backed secret scopes** (`databricks_secret_scope` + `databricks_secret`) populated from Secrets Manager by an automated, least-privileged sync; or (2) reference Secrets Manager directly from jobs via the cluster's IAM role / instance profile scoped to specific secret ARNs. Notebooks reference secrets via `dbutils.secrets.get(scope, key)` — values are redacted in logs/output. Access to scopes is governed by **secret ACLs** mapped to SCIM groups (ARCH-12).

**Own-it vs rent** — **OWN.** Secrets live in the client's AWS Secrets Manager, encrypted with client CMKs, accessed by client-owned roles. Databricks holds only references/ACLs. Client owns and rotates the credentials.

**Where it sits** — Security tier; supports ingestion/serving connections.

**Evidence anchors** — AWS Secrets Manager docs and "Rotate secrets" (docs.aws.amazon.com/secretsmanager/); Databricks "Secret management" and "Secret scopes" (docs.databricks.com/en/security/secrets/); `databricks_secret_scope` provider docs.

**Anti-patterns** — (1) *Hardcoded credentials in notebooks/repos* — plaintext keys in source; the classic breach vector, leaks via Git history. (2) *Long-lived static keys with no rotation* — credentials that never expire; a leaked key is valid forever. (3) *One scope, no ACLs* — every user can read every secret; no least privilege. (4) *Secrets in cluster env vars in plaintext policy* — exposed in cluster config UI/logs.

**Feeds artifacts** — Architecture (secrets target-state); Governance (credential-management + rotation evidence); Ingestion (source-connection credentials, feeds INGEST-*).

**Maturity** — production-ready.

---

### PATTERN ARCH-14 · Multi-environment topology + Asset Bundle promotion

**Intent** — Separate dev / test / prod cleanly and promote code through them as artifacts, not by hand.

**Applies to** — All engagements past proof-of-concept. Lifecycle: Architecture → Mobilization → run.

**Solution shape** — **Separate workspaces per environment** (dev, test/staging, prod), each attached to the regional UC metastore (ARCH-08) but isolated by **environment catalogs** (ARCH-09) and **separate AWS accounts** (ARCH-01 Workloads OU split Prod/Non-Prod). Code and jobs are packaged as **Databricks Asset Bundles (DABs)** — a `databricks.yml` declaring jobs, pipelines, ML models, and resources with **per-target (per-environment) overrides** — and promoted via CI/CD (GitHub Actions / Azure DevOps) running `databricks bundle deploy -t prod`. Notebooks and pipeline definitions live in **Git (Databricks Repos / remote repo)**; nothing is hand-edited in prod. Workspace/account-level objects stay in Terraform; in-workspace assets (jobs, DLT/Lakeflow pipelines, models) ride DABs.

**Own-it vs rent** — **OWN.** Source of truth is the client's Git; bundles deploy into client workspaces. The client owns the promotion pipeline and can run it without the integrator.

**Where it sits** — Data-plane / serving tier; the SDLC layer over the platform.

**Evidence anchors** — Databricks "What are Databricks Asset Bundles?" and "Bundle deployment / targets" (docs.databricks.com/en/dev-tools/bundles/); Databricks "CI/CD with Databricks Asset Bundles"; Databricks "Software engineering best practices for notebooks."

**Anti-patterns** — (1) *One workspace, environments as folders* — dev/test/prod as folders in a single workspace; no isolation, a dev mistake hits prod data. (2) *Click-deploy to prod* — hand-running notebooks/jobs in prod; no reproducibility, no rollback, drift from Git. (3) *Terraform for in-workspace jobs* — forcing job/pipeline definitions through Terraform instead of DABs; awkward, fights the grain of both tools. (4) *No staging* — promoting dev straight to prod with no test workspace.

**Feeds artifacts** — Architecture (SDLC / environment target-state); MLOps (model promotion path, feeds MLOPS-*); Mobilization (CI/CD foundation milestone); Governance (change-management evidence).

**Maturity** — production-ready.

---

### PATTERN ARCH-15 · Observability — system tables + audit logs + Object Lock

**Intent** — Make the platform's behavior, access, and spend observable and tamper-evident from day one.

**Applies to** — All engagements; mandatory for regulated domains. Lifecycle: Architecture → run.

**Solution shape** — Three layers. (1) **Databricks system tables** (`system.access.audit`, `system.billing.usage`, `system.compute`, `system.lakeflow`, lineage tables) — UC-governed tables for audit, usage, and lineage queryable via SQL. (2) **Audit log delivery** configured at the account level to an **immutable S3 bucket with Object Lock (WORM, compliance mode)** so audit records cannot be altered or deleted within the retention window — plus **billable usage / billing logs** delivered for FinOps. (3) **Infrastructure telemetry** to **CloudWatch** (cluster, VPC flow logs, Network Firewall logs) and optional export to **Datadog or Grafana** (e.g., Databricks → Datadog integration, or system tables → Grafana via SQL) for unified dashboards and alerting. CloudTrail (org-level, ARCH-01) covers the AWS control surface; GuardDuty/Security Hub cover threat detection.

**Own-it vs rent** — **OWN** for the data; **RENT (flagged)** for the visualization backend if Datadog/Grafana Cloud is used. System tables, audit logs, and the Object-Lock bucket all live in the client's account — the client owns the evidence. A SaaS dashboarding tool (Datadog) is a rent-side convenience for *visualization only*; the source of truth remains client-owned, so the integration is acceptable with the trade surfaced. Self-hosted Grafana keeps even visualization on the own side.

**Where it sits** — Governance / observability tier; cross-cuts everything.

**Evidence anchors** — Databricks "Monitor usage with system tables" and "Audit log reference" / "Configure audit log delivery" (docs.databricks.com/en/admin/system-tables/, docs.databricks.com/en/admin/account-settings/audit-logs.html); AWS S3 "Object Lock" docs (compliance vs governance mode); Databricks "Billable usage log delivery"; Databricks–Datadog integration docs.

**Anti-patterns** — (1) *Mutable audit logs* — audit records in a normal bucket the workload account can delete; an attacker (or a mistake) erases evidence. Object Lock is the fix. (2) *No system-tables enablement* — flying blind on access and spend, then scrambling to reconstruct usage at audit time. (3) *Observability data leaving the client estate as the source of truth* — shipping raw audit/usage to a SaaS as the only copy; loses ownership of the evidence. (4) *Alerting bolted on post-incident* — no dashboards/alerts until something breaks.

**Feeds artifacts** — Architecture (observability target-state); Governance (immutable-audit + access-monitoring evidence, feeds GOV-*); FinOps (usage/billing data source, feeds FINOPS-*); Mobilization (observability foundation milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-16 · Azure Databricks landing-zone variant (CAF / Azure Landing Zones)

**Intent** — The same own-it platform discipline for clients on **Azure Databricks** — a parallel landing zone, not an afterthought.

**Applies to** — Azure-hosted engagements; substitutes for ARCH-01/02/04/06/07 on Azure. Lifecycle: Architecture → Mobilization.

**Solution shape** — Follow the **Microsoft Cloud Adoption Framework (CAF)** and deploy **Azure Landing Zones (ALZ)** — a management-group hierarchy (Platform MG with management/connectivity/identity subscriptions; Landing Zones MG split corp/online) governed by **Azure Policy** (the SCP-equivalent) and deployed via the **ALZ Terraform / Bicep accelerator**. Network spine: a **hub-and-spoke vNet** (or **Azure Virtual WAN**) with **Azure Firewall** egress allowlist, **no-public-IP** compute, and **Private Endpoints**. Provision **Azure Databricks** with **VNet injection** (customer-managed vNet), **Azure Private Link** for front-end and back-end (no public traffic to the control plane), **Unity Catalog with one metastore per region** (same rule as ARCH-08), **ADLS Gen2** storage with **managed identity / Access Connector for Azure Databricks** (instead of cross-account IAM role) and **storage credentials/external locations** in UC, **Microsoft Entra ID** for SSO + **SCIM** provisioning, and **Azure Key Vault-backed secret scopes** (the Secrets Manager equivalent). Promotion via Databricks Asset Bundles, identical to ARCH-14.

**Own-it vs rent** — **OWN / MANAGED-OWN-DESTINATION** — identical posture to the AWS path. Subscriptions, vNets, ADLS Gen2, the Access Connector managed identity, Key Vault, and the UC metastore all live in the client's Azure tenant. Azure Databricks control plane is Microsoft-managed; the data plane and data stay in the client's tenant. Client owns the platform and IaC.

**Where it sits** — Landing zone / data plane / network / identity (Azure).

**Evidence anchors** — Microsoft Cloud Adoption Framework and "Azure landing zones" (learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/); Azure Databricks "Deploy in your own VNet (VNet injection)" and "Enable Azure Private Link" (learn.microsoft.com/azure/databricks/security/network/); Azure Databricks "Unity Catalog — one metastore per region"; "Configure a managed identity / Access Connector for Azure Databricks"; "Azure Key Vault-backed secret scopes."

**Anti-patterns** — (1) *No landing zone on Azure either* — a lone subscription with a hand-clicked Azure Databricks workspace; same failure as the AWS single-account anti-pattern. (2) *Public workspace + no VNet injection* — accepting the default managed vNet and public control-plane access. (3) *Per-workspace metastore on Azure* — same fragmentation trap as ARCH-08. (4) *Storage account keys instead of managed identity* — using account keys/SAS instead of the Access Connector managed identity + UC.

**Feeds artifacts** — Architecture (Azure target-state); Governance (Azure-Policy + Private-Link evidence); Mobilization (Azure foundation milestone). Composes as the Azure substitute in the README composition model.

**Maturity** — production-ready.

---

### PATTERN ARCH-17 · Disaster recovery + multi-region posture

**Intent** — Define how the platform survives a region or workspace loss, and prove the recovery is real — not theoretical.

**Applies to** — All production engagements; depth scales with the client's RTO/RPO. Lifecycle: Architecture → Mobilization → run.

**Solution shape** — Because the platform is **all infrastructure-as-code** (ARCH-02/06/14), the primary DR mechanism is **rebuild-from-code into a secondary region** plus **data replication**. Concretely: (1) **Terraform + DABs rebuild** the landing zone, network, workspace, UC catalogs, and jobs in the DR region; (2) **S3 Cross-Region Replication (CRR)** / **ADLS GRS** replicates managed and external storage; (3) **Delta Lake + Delta Deep Clone** or **Delta Sharing** propagates table state; (4) a **secondary UC metastore in the DR region** (per ARCH-08's one-per-region rule) with catalog re-creation from code. Define **RTO/RPO targets per workload** and choose active-passive (warm standby, common) vs active-active (rare, costly). **DR is tested on a schedule** (game days) — an untested DR plan does not count. Databricks publishes a regional DR guidance pattern; align to it.

**Own-it vs rent** — **OWN.** Because the platform is code + client-owned storage, DR is fully in the client's control — the client can rebuild without the integrator and without vendor dependency beyond the managed control plane (which Databricks itself operates with regional resilience).

**Where it sits** — Resilience tier; cross-cuts landing zone, data plane, storage.

**Evidence anchors** — Databricks "Disaster recovery" guidance (docs.databricks.com/en/admin/disaster-recovery.html); AWS S3 Cross-Region Replication docs; AWS Well-Architected, Reliability Pillar, "Plan for disaster recovery" (REL13) — defines Backup/Restore, Pilot Light, Warm Standby, Multi-site Active/Active. RTO/RPO numbers are **client-specific — confirm with the client's BIA (business impact analysis)**; do not assert a default.

**Anti-patterns** — (1) *No DR for "internal" platforms* — treating the lakehouse as non-critical until a regional outage stops every downstream decision. (2) *Backup without rebuild* — replicating S3 data but having no IaC to stand the platform back up; data with nowhere to run. (3) *Untested DR* — a documented runbook never exercised; discovers the gaps during the real incident. (4) *Single-region metastore as a hidden SPOF* — DR-region workspaces with no DR metastore.

**Feeds artifacts** — Architecture (resilience target-state); Business case (DR cost line, RTO/RPO trade-offs); Governance (BC/DR control evidence); Mobilization (DR game-day milestone).

**Maturity** — production-ready.

---

### PATTERN ARCH-18 · Platform-readiness gate

**Intent** — A hard, explicit gate: nothing data/AI ships until the foundation is provably green. This pattern is the reason the pack exists.

**Applies to** — Every engagement, before any `INGEST-*`, `MODEL-*`, `MLOPS-*`, or domain workload begins. Lifecycle: end of Architecture / start of Mobilization — a Move gate.

**Solution shape** — A named **go/no-go checklist**, evidenced and signed, with every item provisioned-as-code and verified. The gate is GREEN only when **all** are true:

1. **Landing zone** — Control Tower (or Azure ALZ) deployed; management/log-archive/audit accounts (or platform subscriptions) present; OUs/MGs defined. *(ARCH-01 / ARCH-16)*
2. **Account vending** — AFT (or ALZ accelerator) operational; new accounts come from code. *(ARCH-02)*
3. **Guardrails** — baseline SCPs / Azure Policy attached; region lock, deny-disable-logging, block-public-storage enforced; Security Hub/Defender standards on. *(ARCH-03)*
4. **Network spine** — TGW/vWAN hub-and-spoke; IPAM with non-overlapping CIDRs; no-public-IP compute; egress firewall allowlist + VPC/Private endpoints for S3/STS/Kinesis/Secrets. *(ARCH-04 / ARCH-05)*
5. **Workspace** — Databricks workspace(s) provisioned via Terraform into a customer-managed VPC/VNet with cross-account role / Access Connector and client-owned root storage. *(ARCH-06 / ARCH-16)*
6. **Private connectivity** — front-end + back-end PrivateLink/Private Link; no public traffic to the control plane; IP access lists set. *(ARCH-07)*
7. **Unity Catalog** — one regional metastore; all in-region workspaces attached; catalog/schema/grant hierarchy defined; group-based grants. *(ARCH-08 / ARCH-09)*
8. **Identity** — IAM Identity Center / Entra ID federated; account-level SCIM live; SSO/unified login on; group→catalog inheritance working. *(ARCH-12)*
9. **Secrets** — Secrets Manager / Key Vault-backed scopes; no hardcoded credentials; ACLs by group. *(ARCH-13)*
10. **Environments** — dev/test/prod workspaces + catalogs separated; DAB promotion pipeline runs end-to-end. *(ARCH-14)*
11. **Observability** — system tables enabled; audit + billing log delivery to Object-Lock/immutable storage; CloudWatch/telemetry flowing; alerts wired. *(ARCH-15)*
12. **Cost controls** — tagging strategy enforced via policy; budgets/alerts set; cluster auto-termination mandatory. *(ARCH-19)*
13. **DR posture** — RTO/RPO defined; rebuild-from-code + replication designed (tested for prod-critical). *(ARCH-17)*

Each item carries **evidence** (Terraform plan/apply output, console screenshot, system-table query, audit-log sample). The gate is a **Move gate** with self-approval in pilot and admin/maestro approval in production (per gate-approval model).

**Own-it vs rent** — **OWN.** The gate certifies that the client owns a running platform. A failed item on the rent side (e.g., a SaaS dependency that holds data) must be surfaced and justified or remediated before green.

**Where it sits** — Gate tier; sits between the platform packs (ARCH) and everything downstream.

**Evidence anchors** — Composes the evidence anchors of ARCH-01 through ARCH-17. AWS Well-Architected Review as the external corroboration; Databricks "Security and compliance" / "Best practices" docs as the per-item reference. The checklist itself is the citable artifact.

**Anti-patterns** — (1) *"We'll harden it later"* — starting ingestion/modeling on a half-built foundation; the exact failure mode this pack kills. Later never comes; production rides an ungoverned base. (2) *Soft gate* — a checklist with no evidence and no sign-off; theater. (3) *Skipping items as "not needed for the demo"* — pilot-grade shortcuts that quietly become production (violates the no-demo-thinking principle). (4) *Gate owned by the integrator alone* — no client sign-off, so ownership is never actually transferred.

**Feeds artifacts** — Mobilization (the foundation go/no-go gate); Architecture (the readiness definition-of-done); Business case (foundation milestone completion); Governance (the audit-evidence bundle).

**Maturity** — production-ready.

---

### PATTERN ARCH-19 · Cost-control architecture (tagging + budget guardrails)

**Intent** — Build cost observability and guardrails into the platform structurally, so spend is attributable and capped — deep cost *modeling* is deferred to the FINOPS pack.

**Applies to** — All engagements. Lifecycle: Architecture → run. **Boundary: this is the architectural hook; `FINOPS-*` owns the value/cost model.**

**Solution shape** — (1) A **mandatory tagging strategy** — `environment`, `cost-center`, `workload`, `owner`, `data-domain` — enforced by **AWS tag policies / cluster-policy custom tags / Azure Policy** so untagged resources can't be created. Tags propagate to Databricks billing usage (`system.billing.usage`) for chargeback. (2) **Budget guardrails** — **AWS Budgets** (or Azure Cost Management budgets) with alert thresholds, plus **Databricks budgets / budget policies** on serverless. (3) **Cluster auto-termination** mandatory via policy (ARCH-10), **autoscaling caps**, **spot/Fleet** instances for non-critical compute, **instance pools** to cut idle spin-up. (4) Cost data flows from system tables + Cost and Usage Report (CUR) into the observability layer (ARCH-15) — and is **handed to FINOPS-* for unit-economics and value modeling**.

**Own-it vs rent** — **OWN.** Tags, budgets, CUR, and Databricks usage tables are all client-owned. The client owns the cost-attribution model and can run chargeback without the vendor.

**Where it sits** — Governance / FinOps-boundary tier.

**Evidence anchors** — AWS Budgets and Cost and Usage Report docs; AWS Well-Architected, Cost Optimization Pillar, "Expenditure and usage awareness" (COST03 — tagging/attribution); Databricks "Manage budgets" and `system.billing.usage` docs; Databricks "Best practices for cost optimization." **Specific savings percentages are deferred to FINOPS-* (flag any number here as estimate — confirm).**

**Anti-patterns** — (1) *Untagged estate* — no tag enforcement, so spend can't be attributed and chargeback is impossible. (2) *No budget alerts* — the first signal of overspend is the invoice. (3) *Doing FinOps modeling here* — over-reaching into unit-economics/value math that belongs in the FINOPS pack; this pattern is the architectural hook, not the model. (4) *On-demand everything* — no spot/pool/auto-termination strategy.

**Feeds artifacts** — Architecture (cost-control hooks); FinOps (tagging + usage data source — the primary handoff to FINOPS-*); Governance (cost-attribution evidence); Business case (run-cost inputs, defended in FinOps).

**Maturity** — production-ready.

---

### PATTERN ARCH-20 · Serverless + lakehouse-native compute posture

**Intent** — Decide deliberately where serverless compute fits, with its egress and ownership trade surfaced — not adopted by default or refused by reflex.

**Applies to** — Databricks engagements weighing serverless SQL/jobs/DLT/Model Serving. Lifecycle: Architecture.

**Solution shape** — Treat serverless as a **per-workload choice** governed by client-owned controls. Serverless SQL warehouses, serverless jobs, serverless Lakeflow Declarative Pipelines, and Model Serving run in **Databricks' account**, not the client VPC — so egress and network reachability are governed by a **Network Connectivity Configuration (NCC)** with **stable egress IPs / private endpoints** and **serverless egress controls / firewall** to honor the ARCH-05 allowlist, plus UC governs the data. The decision rule: prefer serverless for **bursty, interactive, or low-ops** workloads where fast startup and zero cluster management win; prefer **classic customer-managed compute** where strict network containment, custom libraries, or data-plane-in-VPC requirements dominate. Either way the **data stays in the client's UC and storage**.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION (flagged).** The serverless compute *host* is Databricks' account — a rent-side trade that must be **surfaced explicitly**. It qualifies as own-destination *because* the data, the catalog, and the governance/egress policy all remain client-owned and the workload is portable back to classic compute. For workloads where the host-location trade is unacceptable (strict residency/segmentation), select classic compute (ARCH-10). Never adopt serverless silently in a regulated context without the NCC + egress controls in place.

**Where it sits** — Data-plane tier; a sibling decision to ARCH-10.

**Evidence anchors** — Databricks "Serverless compute" and "Serverless network connectivity (NCC)" / "Configure a firewall for serverless compute" (docs.databricks.com/en/security/network/serverless-network-security/); Databricks "Model Serving" docs; Databricks "Serverless egress control" docs.

**Anti-patterns** — (1) *Serverless-by-default in regulated estates without NCC* — adopting serverless without configuring network connectivity / egress controls; data egresses uncontrolled, breaks segmentation. (2) *Refusing serverless on reflex* — paying for idle classic clusters on bursty BI/interactive workloads where serverless is cheaper and lower-ops. (3) *Unsurfaced host-location trade* — putting serverless in an own-it architecture without flagging that the compute host is the vendor's account.

**Feeds artifacts** — Architecture (compute-model decision + rationale); FinOps (serverless vs classic cost trade, feeds FINOPS-*); Governance (serverless egress-control evidence); MLOps (Model Serving choice, feeds MLOPS-*).

**Maturity** — production-ready (serverless GA across SQL/jobs/pipelines/serving; confirm regional availability per client).

---

## Pack-level anti-pattern summary (the failures this pack forbids)

| # | Anti-pattern | Killed by |
|---|---|---|
| 1 | "AWS platform setup" with no landing zone | ARCH-01, ARCH-18 |
| 2 | Single-account / single-subscription architecture | ARCH-01, ARCH-16 |
| 3 | Click-ops workspace / account creation | ARCH-02, ARCH-06, ARCH-14 |
| 4 | Public-IP compute clusters | ARCH-05, ARCH-07 |
| 5 | Per-workspace Unity Catalog metastore | ARCH-08 |
| 6 | Grants to users instead of SCIM groups | ARCH-09, ARCH-12 |
| 7 | Mutable / co-located audit logs | ARCH-15, ARCH-01 |
| 8 | Hardcoded credentials in notebooks | ARCH-13 |
| 9 | "We'll harden it later" — start workloads on a half-built base | ARCH-18 |
| 10 | Untagged, budget-less, never-terminating compute | ARCH-19, ARCH-10 |
| 11 | Backup without rebuild-from-code; untested DR | ARCH-17 |
| 12 | Unsurfaced serverless host-location / data-egress trade | ARCH-20 |

## Composition cheat-sheet

Minimum platform composition any domain Move artifact must select and defend:

```
AWS path:    ARCH-01 + ARCH-02 + ARCH-03         (landing zone + vending + guardrails)
           + ARCH-04 + ARCH-05                    (network spine + egress control)
           + ARCH-06 + ARCH-07                    (workspace + PrivateLink)
           + ARCH-08 + ARCH-09 + ARCH-11          (metastore + hierarchy + storage)
           + ARCH-12 + ARCH-13                    (identity + secrets)
           + ARCH-14 + ARCH-15 + ARCH-19          (environments + observability + cost hooks)
           + ARCH-17                              (DR)
           ⇒ ARCH-18 GREEN  ← the gate; only then do INGEST-/MODEL-/MLOPS-/domain packs begin

Azure path:  swap ARCH-16 for ARCH-01/02/04/06/07; ARCH-08/09/12/13/14/15/19/17 apply as written.
Compute:     choose per-workload between ARCH-10 (classic) and ARCH-20 (serverless), trade surfaced.
```

---

*End of Pack 01 — Architecture & Platform (`ARCH`). 20 patterns. Every quantitative claim is sourced or flagged "estimate — confirm." Every pattern states post-build ownership; the answer is the client.*
