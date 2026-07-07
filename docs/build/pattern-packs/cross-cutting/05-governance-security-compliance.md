# Pattern Pack 05 — Governance, Security & Compliance (`GOV`)

**Pack code:** `GOV`
**Layer:** Cross-cutting (horizontal · reusable across all domains)
**Created:** 2026-06-06

---

## What this pack covers

This is the pack that makes a healthcare lakehouse **defensible to a CISO, an auditor, and a Chief Privacy Officer** — not just buildable by a data engineer. It covers three intertwined disciplines:

1. **Data governance** — Unity Catalog as the single governance backbone: namespace, access control, classification, lineage, and attribute-based policy.
2. **Security architecture** — encryption, identity, network isolation, secrets, and audit, expressed as compliance controls rather than infrastructure trivia.
3. **Regulatory compliance** — HIPAA on Databricks (the compliance security profile + BAA model), HITRUST CSF control mapping, de-identification, consent / minimum-necessary, privacy for AI, and the readiness gate that must be GREEN before PHI lands.

### The own-it argument *is* a compliance argument

Most of this pack is the structural reason an own-it lakehouse beats a rented analytics SaaS for regulated health data. The verified basis (deep-research 2026-06-06, 3-0 confirmed):

> Databricks HIPAA support is delivered through the enableable **compliance security profile** (which adds monitoring agents and a hardened CIS Level 1 compute image) **plus a Business Associate Agreement (BAA) signed with *both* Databricks and the cloud provider (AWS)**. PHI is processed in the **customer's own cloud account** — the classic compute plane runs in a VPC inside the customer's AWS account.
> Sources: https://docs.databricks.com/aws/en/security/privacy/hipaa · https://docs.databricks.com/aws/en/security/privacy/security-profile

That single fact — *PHI never leaves the client's AWS account* — is what every pattern in this pack defends. A rented health-analytics platform (Innovaccer / Health Catalyst / Arcadia) ingests PHI onto the **vendor's** infrastructure; the BAA posture, the breach-blast-radius, and the IP ownership are all categorically different. When you own the lakehouse, the client is the covered entity's data custodian; when you rent, you've added a business associate who holds the PHI.

### How to read the Own-it field in this pack

For a governance pack, "own-it" rarely means "build your own audit system from scratch." It means: **the control runs inside the client's account / tenant, the client holds the keys, the client owns the logs and the policy definitions, and the client can exit without the vendor holding their data hostage.** We mark:

- **OWN** — control and its artifacts live entirely in the client estate (e.g. KMS CMKs, S3 audit buckets, Unity Catalog grants).
- **MANAGED-OWN-DESTINATION** — a managed service operates the control, but the data/keys/policy land in the client's account and the client owns them (e.g. Databricks runs the platform, but PHI sits in the client VPC under the client's CMK).
- **RENT** — the vendor holds the data, keys, or policy; disqualified by default for an own-it mandate, flag explicitly.

---

## Pattern index

| ID | Name | Maturity |
|---|---|---|
| GOV-01 | Unity Catalog as the governance backbone | Production-ready |
| GOV-02 | HITRUST CSF control mapping (crown jewel) | Production-ready |
| GOV-03 | HIPAA on Databricks — compliance security profile + BAA | Production-ready |
| GOV-04 | Fine-grained access control — RLS, column masking, dynamic views | Production-ready |
| GOV-05 | Data classification + tagging driving policy (ABAC) | Production-ready |
| GOV-06 | Encryption — CMK per classification, at-rest + in-transit | Production-ready |
| GOV-07 | Audit logging — immutable, org-wide, retention-bound | Production-ready |
| GOV-08 | Identity & access governance — SSO, SCIM, JIT, least-privilege | Production-ready |
| GOV-09 | Network security as a compliance control | Production-ready |
| GOV-10 | Secrets governance — no hardcoded credentials, rotation | Production-ready |
| GOV-11 | Data residency & sovereignty — region pinning | Production-ready |
| GOV-12 | De-identification & tokenization — Safe Harbor / Expert Determination | Production-ready |
| GOV-13 | Consent management & minimum-necessary | Emerging |
| GOV-14 | Privacy for AI — PHI in prompts/RAG, the zero-retention boundary | Emerging |
| GOV-15 | Multi-tenant / federated governance for holding groups | Emerging |
| GOV-16 | Compliance readiness gate — controls GREEN before PHI lands | Production-ready |
| GOV-17 | Service principals vs users — non-human identity governance | Production-ready |
| GOV-18 | Break-glass / emergency access with full audit | Emerging |

---

### PATTERN GOV-01 · Unity Catalog as the governance backbone

**Intent** — Establish one centralized governance layer for every data and AI asset across all workspaces, so access control, lineage, discovery, and audit are defined once and enforced everywhere — instead of per-workspace, per-table ACL sprawl.

**Applies to** — Every domain, every Move. Foundational; nearly every other GOV pattern composes on top of it. Lifecycle: Architecture, Mobilization.

**Solution shape** — Adopt **Databricks Unity Catalog** as the single metastore for the region/account, with its **three-level namespace**: `catalog.schema.table` (also covering views, volumes, functions, models, and ML features). Map the namespace to organizational meaning:

- **Catalog** = a governance / data-domain boundary — e.g. `phi_clinical`, `deid_research`, `finance`, `marketing`, or one catalog per environment (`prod`, `dev`). For multi-entity clients, one catalog per legal entity.
- **Schema** = a data product or subject area within the domain (e.g. `phi_clinical.encounters`, `phi_clinical.labs`).
- **Securable objects** = tables, views, volumes (for files/PHI documents), functions, and registered models.

Access is granted with the SQL **grant model** (`GRANT SELECT ON TABLE …`, `GRANT USE CATALOG`, `GRANT USE SCHEMA`) to **groups, never individuals**. Privileges inherit down the hierarchy (a grant on a catalog flows to its schemas and tables) so policy is expressed at the lowest cardinality possible. Layer **attribute-based access control (ABAC)** on top (see GOV-05) so policies key off classification tags rather than enumerating every object. Unity Catalog also provides automatic **column- and table-level lineage**, a searchable data catalog, and emits the **audit logs** that GOV-07 depends on.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** Databricks operates Unity Catalog, but the metastore, grants, tags, and lineage are the client's governance IP and live in the client's account/region. The catalogs point at data in the client's own S3 (managed or external tables under the client's CMK). Contrast RENT: a SaaS analytics platform defines access policy inside the *vendor's* console over data the vendor holds — the client cannot export the policy model or the lineage graph on exit.

**Where it sits** — Governance tier, spanning all medallion layers (Bronze/Silver/Gold all register under the same metastore).

**Evidence anchors** — Unity Catalog three-level namespace and privilege inheritance: https://docs.databricks.com/aws/en/data-governance/unity-catalog/ · Grant model: https://docs.databricks.com/aws/en/data-governance/unity-catalog/manage-privileges/ · Best-in-class engagements stand up the metastore and the catalog/schema design *before* the first PHI table lands, so governance is never retrofitted.

**Anti-patterns** — (1) *Hive metastore / per-workspace ACLs* left in place — governance fragments, no cross-workspace lineage, no central audit. (2) *Granting to individual users* instead of groups — ungovernable at scale, breaks SCIM-driven deprovisioning. (3) *One mega-catalog* with PHI and non-PHI mixed and no schema-level domain boundaries — makes minimum-necessary (GOV-13) and classification (GOV-05) impossible to enforce.

**Feeds artifacts** — Architecture target state (governance backbone); Mobilization foundation milestone ("metastore + catalog design"); the provenance anchor for every downstream GOV pattern.

**Maturity** — Production-ready.

---

### PATTERN GOV-02 · HITRUST CSF control mapping (crown jewel)

**Intent** — Produce the artifact that makes a healthcare lakehouse defensible: a control-by-control mapping from the **HITRUST CSF** control domains to the **specific AWS + Databricks features** that satisfy each one — so a CISO can sign off, an auditor can trace evidence, and the architecture's compliance posture is asserted, not assumed.

**Applies to** — Every healthcare engagement touching PHI (PHS, Lakeshore, any covered entity / business associate). Lifecycle: Architecture, Business Case (de-risking), Mobilization (control implementation backlog).

**Solution shape** — Build a living control-mapping table. For each HITRUST CSF control domain, name the AWS service, the Databricks feature, and the implementing GOV pattern. The reference mapping (control-domain → control → mechanism):

| HITRUST CSF domain | Control objective | AWS mechanism | Databricks mechanism | GOV pattern |
|---|---|---|---|---|
| **01 Information Protection Program** | Documented, governed security program | AWS Artifact (compliance reports), Organizations SCPs | Compliance security profile enabled | GOV-03, GOV-16 |
| **02 Endpoint Protection** | Hardened compute | CIS-benchmarked AMIs | Hardened **CIS Level 1** compute image (part of compliance security profile) + monitoring agents | GOV-03 |
| **03 Portable Media / 04 Mobile Device** | No uncontrolled data egress | S3 Block Public Access, VPC egress firewall | No-public-IP clusters, IP access lists, Unity Catalog volumes (no local download) | GOV-09 |
| **06 Configuration Management** | Baseline & drift control | AWS Config, Security Hub | Cluster policies, compliance security profile enforcement | GOV-16 |
| **07 Vulnerability Management** | Patch & scan | Inspector, ECR scanning | Monitoring agents in the compliance profile; Databricks-managed image patching | GOV-03 |
| **09 Transmission Protection** | Encryption in transit | TLS 1.2+, ACM | TLS to/from clusters; PrivateLink for control-plane traffic | GOV-06, GOV-09 |
| **10 Password / Authentication** | Strong auth, SSO, MFA | IAM Identity Center, MFA | SSO/SAML, SCIM-provisioned identities | GOV-08 |
| **11 Access Control** | Least-privilege, RBAC | IAM roles, SCPs | Unity Catalog grants, RLS, column masking, dynamic views, ABAC | GOV-01, GOV-04, GOV-05 |
| **12 Audit Logging & Monitoring** | Tamper-evident audit trail | CloudTrail (org-wide), S3 Object Lock, GuardDuty | Unity Catalog audit logs, verbose audit logs, system tables | GOV-07 |
| **13 Education / Awareness** | Trained workforce | (process control — org responsibility) | (process control) | — |
| **14 Third-Party Assurance** | Vendor risk / BAAs | AWS BAA | Databricks BAA | GOV-03 |
| **16 Incident Management** | Detect & respond | GuardDuty, Security Hub, SNS alerting | Audit-log alerting on anomalous grants/exports | GOV-07, GOV-18 |
| **19 Data Protection & Privacy** | Encryption at rest, de-id, minimum-necessary | KMS CMKs, Macie (PII discovery) | CMK-encrypted storage, classification tags, dynamic views, de-id pipelines | GOV-06, GOV-05, GOV-12, GOV-13 |

Each row in the *delivered* artifact carries: control ID, the mechanism, the **evidence reference** (e.g. "CloudTrail trail ARN, S3 bucket with Object Lock in compliance mode, retention 7 yr"), the owner, and a status (Implemented / Planned / N-A-with-rationale). The mapping is reviewed with the client CISO and becomes the backbone of the HITRUST assessment scope.

A worked example of how a single row reads in the delivered artifact, so the depth is unambiguous:

> **HITRUST 12.c — Audit Logging.** *Control objective:* a tamper-evident record of access to ePHI, retained for the compliance window. *Mechanism:* AWS CloudTrail organization trail (all accounts, non-disableable) + Databricks Unity Catalog audit logs and system tables, both delivered to a central S3 bucket with **Object Lock in compliance mode**, retention 7 years, MFA-delete and versioning on. *Evidence reference:* CloudTrail trail ARN `arn:aws:cloudtrail:…`, audit bucket ARN with Object Lock policy attached, system-table query showing UC access events. *Owner:* Platform Security. *Status:* Implemented. *Pattern:* GOV-07.

Two scoping disciplines make the artifact credible rather than aspirational: (a) controls that are **organizational process** (HITRUST 13 education, parts of 01) are marked as the client's responsibility, not the platform's, with the owner named — never silently claimed; and (b) any control marked **N-A** carries a written rationale an assessor can challenge. The mapping is versioned alongside the architecture and re-validated at each material release (GOV-16), because a stale mapping is worse than none — it asserts a posture that no longer holds.

**Own-it vs rent** — **OWN.** The control mapping, the evidence artifacts (logs, config, key policies), and the assessment scope are the client's compliance IP — they survive any vendor change. The mechanisms are MANAGED-OWN-DESTINATION (AWS/Databricks operate them; the client owns the configuration and evidence). RENT alternative: relying on a SaaS vendor's HITRUST certification *for their platform* — that certifies the **vendor's** environment, not the client's data handling, and the client inherits none of the evidence.

**Where it sits** — Governance tier; produced in Architecture, executed across Mobilization.

**Evidence anchors** — HITRUST CSF domain structure (HITRUST Alliance CSF v11.x — *confirm exact version with client's assessor*). AWS HIPAA-eligible services + AWS BAA: AWS Artifact. Databricks compliance security profile and HIPAA: https://docs.databricks.com/aws/en/security/privacy/hipaa · https://docs.databricks.com/aws/en/security/privacy/security-profile · Mapping completeness target: **100% of in-scope CSF controls mapped to a named mechanism or a documented compensating/N-A control** (estimate — confirm scope with assessor).

**Anti-patterns** — (1) *"We use HIPAA-eligible services, therefore we're compliant"* — eligibility ≠ configuration; the mapping must show the control is **enabled and evidenced**. (2) *Borrowing the vendor's certificate* as the client's compliance — it covers the wrong boundary. (3) *Mapping controls to slideware, not to evidence* — an auditor wants the trail ARN and the key policy, not a claim. (4) *Stale mapping* — controls drift; the artifact must be re-validated each release (ties to GOV-16).

**Feeds artifacts** — Architecture compliance section (the defensibility centerpiece); Business case risk-reduction line; Mobilization control-implementation backlog; the HITRUST assessment scope document.

**Maturity** — Production-ready.

---

### PATTERN GOV-03 · HIPAA on Databricks — compliance security profile + BAA

**Intent** — Establish the *structural* basis for processing PHI on the lakehouse: enable the platform's hardened compliance mode and put the right business-associate agreements in place, so PHI is handled in a contractually and technically defensible way — inside the client's own cloud account.

**Applies to** — Any engagement processing PHI / ePHI. Lifecycle: Architecture (decision), Mobilization (enablement), and a hard gate in GOV-16.

**Solution shape** — Three concrete, verifiable requirements (deep-research 2026-06-06, 3-0 confirmed):

1. **Enable the Databricks compliance security profile** on the workspace(s) that will process PHI. This adds **monitoring agents** to the compute and uses a **hardened, CIS Level 1 benchmarked compute image**. It is an *enableable* setting — PHI must only land on workspaces where it is on.
2. **Sign a BAA with Databricks** — covering Databricks as a business associate for the platform.
3. **Sign a BAA with the cloud provider (AWS)** — because the **classic compute plane runs in a VPC inside the customer's own AWS account**, and PHI is processed there. The customer is the data custodian; AWS and Databricks are business associates for their respective layers.

The architectural consequence is the own-it core: **PHI is processed in the customer's own AWS account** (classic compute plane = customer-VPC), under the customer's KMS keys (GOV-06), with network isolation (GOV-09) and audit (GOV-07) the customer controls. Use the **classic compute plane** (compute in the customer VPC) for PHI workloads rather than serverless where the data-residency / VPC-isolation guarantee is required by the client's risk posture — *confirm the current serverless PHI eligibility with Databricks for the client's region, as this evolves.*

**Own-it vs rent** — **MANAGED-OWN-DESTINATION**, and this pattern is the headline own-it argument of the entire pack. PHI never leaves the client's AWS account; the client holds the keys; the BAAs make the platform layers business associates *to the client*, not custodians instead of the client. RENT contrast: a health-analytics SaaS ingests PHI onto the **vendor's** infrastructure — the vendor becomes a PHI custodian, the breach blast-radius spans the vendor's tenant base, and the client's exit means extracting PHI from someone else's account.

The risk-posture difference is concrete enough to state plainly in a business case: when you own the lakehouse, a breach of the vendor's *other* customers cannot expose your PHI (your PHI is in your VPC under your CMK); a regulator's questions about where your PHI lives have a single, client-controlled answer; and exit is a key-revocation and account-handover, not a data-extraction negotiation. When you rent, all three invert. This is why the own-it argument and the compliance argument are the *same* argument here.

**Where it sits** — Governance + landing-zone tier; the precondition for any PHI in any medallion layer.

**Evidence anchors** — Databricks HIPAA: https://docs.databricks.com/aws/en/security/privacy/hipaa · Compliance security profile (monitoring agents + CIS Level 1 hardened image, enableable): https://docs.databricks.com/aws/en/security/privacy/security-profile · Verified deep-research 2026-06-06 (3-0): "BAA with BOTH Databricks AND AWS; PHI processed in the customer's own cloud account; classic compute plane = VPC in the customer's AWS account." AWS BAA available via AWS Artifact.

**Anti-patterns** — (1) *PHI on a workspace without the compliance security profile enabled* — unhardened image, no monitoring agents; fails the control. (2) *Only one BAA* — a Databricks BAA without the AWS BAA (or vice-versa) leaves the compute/storage layer uncovered. (3) *Assuming "HIPAA-eligible" means "HIPAA-configured"* — the profile must be turned on and PHI gated to those workspaces. (4) *Routing PHI through serverless without confirming eligibility* for the client's residency/isolation requirement.

**Feeds artifacts** — Architecture target state (the own-it PHI-residency assertion); Business case (compliance as moat / risk reduction); Mobilization gate; HITRUST domains 01, 02, 07, 14 in GOV-02.

**Maturity** — Production-ready.

---

### PATTERN GOV-04 · Fine-grained access control — RLS, column masking, dynamic views

**Intent** — Ensure that *which rows* and *which columns* a user sees is enforced centrally by data sensitivity and role — so an analyst can run population queries without ever seeing a raw SSN, MRN, or a patient outside their authorized cohort.

**Applies to** — Any catalog containing PHI/PII; analytics, research, and BI consumption. Lifecycle: Architecture, Mobilization.

**Solution shape** — Three Unity Catalog mechanisms, composed:

- **Column-level masking** — attach a **column mask function** to sensitive columns (SSN, MRN, name, DOB). The function returns the raw value for privileged groups and a masked/redacted/hashed value for everyone else (e.g. `CASE WHEN is_account_group_member('phi_unmasked') THEN ssn ELSE 'XXX-XX-' || right(ssn,4) END`).
- **Row-level security (row filters)** — attach a **row filter function** to a table so users only see rows their role permits (e.g. a clinician sees only their assigned panel; a regional analyst sees only their region). Driven by the caller's group membership / mapping tables.
- **Dynamic views for PHI** — where masking/filtering logic is complex or governed as a product, expose a **view** in the Gold layer that bakes in the de-identification / masking and grant SELECT on the *view* not the base table. Consumers never touch the raw PHI table.

Drive all three off **classification tags** (GOV-05) and **groups** (GOV-08), so policy is centralized and ABAC-style rather than hand-maintained per object.

A reference layering for a clinical catalog: Bronze and Silver hold raw, fully-identified PHI with SELECT granted only to the ingest service principal (GOV-17) and a small `phi_engineering` group; the Gold layer exposes governed views (`gold.encounters_analyst`) that apply column masks and row filters, and SELECT on those views is what the broad analyst population receives. The single privileged escape hatch — `phi_unmasked` — is granted to a named, tiny group, gated through JIT (GOV-08), and every access to it is alerted on (GOV-07). The result is that "an analyst sees a patient's SSN" requires an explicit, time-boxed, audited elevation that a reviewer will see — it is never the default.

**Own-it vs rent** — **OWN.** The mask/filter functions, view definitions, and the policy mappings are the client's governance IP in Unity Catalog. RENT contrast: row/column security defined inside a BI tool's semantic layer or a SaaS vendor's console — enforced only at that one consumption surface, bypassable by direct data access, and not portable.

**Where it sits** — Governance tier; primarily Gold (serving) layer, with raw PHI quarantined in Bronze/Silver under tight grants.

**Evidence anchors** — Unity Catalog row filters & column masks: https://docs.databricks.com/aws/en/data-governance/unity-catalog/row-and-column-filters/ · Dynamic views: https://docs.databricks.com/aws/en/data-governance/unity-catalog/create-views/ · Best-in-class: the *only* path to raw identifiers is a single, heavily-audited `phi_unmasked` group; everyone else hits masked views.

**Anti-patterns** — (1) *"No column masking on PHI columns — every analyst sees SSN/MRN"* — the canonical failure; one over-broad grant exposes every identifier. (2) Masking in the BI layer only, leaving the warehouse table open. (3) Row filters that fail open (return all rows) when the mapping table is empty — must fail closed. (4) Duplicating PHI into an "analyst copy" with identifiers stripped manually — drifts, and the copy isn't governed.

**Feeds artifacts** — Architecture access-control design; HITRUST domains 11 & 19 in GOV-02; Mobilization data-product acceptance criteria.

**Maturity** — Production-ready.

---

### PATTERN GOV-05 · Data classification + tagging driving policy (ABAC)

**Intent** — Classify and tag every data asset by sensitivity (PHI / PII / confidential / public) so that **access policy keys off the tag, not the object** — making governance scale across thousands of tables and making "show me everything tagged PHI" answerable in one query.

**Applies to** — Every catalog; foundational to GOV-04, GOV-12, GOV-13. Lifecycle: Architecture, Mobilization, ongoing operations.

**Solution shape** — Define a **classification taxonomy** (e.g. `sensitivity: phi | pii | confidential | internal | public`; plus purpose tags like `phi.element: ssn | mrn | dob | name`). Apply **Unity Catalog tags** to catalogs, schemas, tables, and columns — manually at design time and via discovery scanning (AWS Macie or a Databricks scanning job) for drift detection. Then use **attribute-based access control (ABAC)**: write policies that grant/mask based on the *tag* (e.g. "mask any column tagged `phi.element=ssn` for non-`phi_unmasked` members") rather than enumerating columns. This is how GOV-04's masks and GOV-13's minimum-necessary stay maintainable as the catalog grows. Tags also drive **key selection** (GOV-06 — PHI-tagged data lands under the PHI CMK) and **audit scoping** (GOV-07 — alert on access to PHI-tagged objects).

**Own-it vs rent** — **OWN.** The taxonomy, tags, and tag-driven policies are the client's governance model in Unity Catalog, queryable and exportable. RENT contrast: a vendor's internal "sensitivity flags" you can't see, query, or carry out.

**Where it sits** — Governance tier; applied across all medallion layers (tag at ingest, enforce at serving).

**Evidence anchors** — Unity Catalog tags & ABAC: https://docs.databricks.com/aws/en/data-governance/unity-catalog/ · AWS Macie for automated PII/PHI discovery in S3: https://docs.aws.amazon.com/macie/ · Coverage target: **100% of columns in PHI catalogs classified** before serving grants are issued (estimate — confirm).

**Anti-patterns** — (1) Classification as a one-time spreadsheet that immediately goes stale — must be enforced at ingest and scanned for drift. (2) Enumerating columns in mask functions instead of tag-driven ABAC — unmaintainable, drifts the moment a new PHI column lands untagged. (3) Untagged-by-default treated as non-sensitive — should fail closed: unclassified columns in a PHI catalog are masked until classified.

**Feeds artifacts** — Architecture classification model; HITRUST domain 19; Mobilization ingestion acceptance criteria.

**Maturity** — Production-ready.

---

### PATTERN GOV-06 · Encryption — CMK per classification, at-rest + in-transit

**Intent** — Encrypt all data at rest and in transit with **customer-managed keys** scoped by data classification, so the client controls and can revoke the keys that protect PHI — proving custody and satisfying the encryption controls of HIPAA/HITRUST.

**Applies to** — Every byte of PHI/PII at rest and in motion. Lifecycle: Architecture, Mobilization; gated in GOV-16.

**Solution shape** —

- **At rest:** all S3 buckets (Bronze/Silver/Gold, audit, and the Databricks workspace storage) encrypted with **AWS KMS customer-managed keys (CMKs)**, not the default AWS-managed keys. Use **separate CMKs per classification** — a dedicated `phi` CMK distinct from `internal`/`public` keys — so PHI key access is independently auditable and revocable. Enable **CMK for Databricks managed services and workspace storage** so notebooks, query results, and DBFS root are under client keys too. Enable **S3 default encryption** + **S3 server access logging / access logging** on PHI buckets.
- **In transit:** **TLS 1.2+** everywhere — client-to-workspace, workspace-to-S3, and control-plane traffic over **PrivateLink** (GOV-09). No unencrypted JDBC/ODBC.
- **Key governance:** KMS key policies grant use to the specific roles/principals only; **automatic key rotation** enabled; CloudTrail logs every key use (feeds GOV-07).

**Own-it vs rent** — **OWN.** CMKs live in the client's AWS KMS; the client can rotate, audit, and **revoke** them — revoking a CMK cryptographically severs access, including the platform's. This is the strongest form of data custody. RENT contrast: a SaaS vendor encrypting "your data" with the *vendor's* keys — the client cannot revoke, and key custody sits with the vendor.

**Where it sits** — Landing-zone + governance tier; all medallion layers.

**Evidence anchors** — Databricks customer-managed keys (workspace storage + managed services): https://docs.databricks.com/aws/en/security/keys/customer-managed-keys · AWS KMS rotation & key policies: https://docs.aws.amazon.com/kms/ · HITRUST domain 19 (data protection) & domain 09 (transmission). S3 access logging: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html.

**Anti-patterns** — (1) Default AWS-managed encryption on PHI buckets — technically encrypted, but the client can't prove independent custody or revoke. (2) One CMK for everything — can't revoke PHI access without breaking non-PHI workloads, and PHI key use isn't separately auditable. (3) TLS termination at a load balancer with cleartext on the internal hop. (4) Key rotation disabled and never reviewed.

**Feeds artifacts** — Architecture encryption design; HITRUST domains 09 & 19; Mobilization key-management runbook.

**Maturity** — Production-ready.

---

### PATTERN GOV-07 · Audit logging — immutable, org-wide, retention-bound

**Intent** — Capture a complete, **tamper-evident** record of who accessed what, when, and what they did — across the platform, the cloud, and the data — and retain it for the compliance window, so an investigator or auditor can reconstruct any event and trust the record hasn't been altered.

**Applies to** — Every PHI environment. Lifecycle: Architecture, Mobilization; gated in GOV-16.

**Solution shape** — Three log sources into one immutable store:

1. **Unity Catalog audit logs / verbose audit logs** + **system tables** — every grant, query, table access, masking-bypass, and data export. This is the data-access layer of the trail. Alert on sensitive events (e.g. access to `phi_unmasked`, bulk exports, grant changes).
2. **AWS CloudTrail — organization-wide** — every API call across all accounts (IAM changes, KMS key use, S3 access, network changes). Configured as an **organization trail** so individual accounts can't disable their own logging.
3. **Application/cluster logs** delivered to S3.

**Immutability is the crown requirement:** the central audit S3 bucket uses **S3 Object Lock in compliance mode** with a retention period, plus **MFA delete** and versioning, so logs **cannot be altered or deleted** — even by an account admin — for the retention window. Set retention to the compliance requirement (HIPAA requires retention of certain documentation for **6 years**; many healthcare programs standardize on **7 years** — *confirm the exact window with the client's compliance/legal team*). Layer **GuardDuty** + **Security Hub** for anomaly detection and route alerts to the SOC (feeds GOV-18).

**Own-it vs rent** — **OWN.** The logs, the immutable bucket, and the retention policy are the client's evidence, in the client's account. RENT contrast: a vendor's audit log you can only view through their console, with retention and immutability you can't verify and can't take with you.

**Where it sits** — Governance tier; spans all layers and the cloud control plane.

**Evidence anchors** — Unity Catalog audit logs & system tables: https://docs.databricks.com/aws/en/admin/account-settings/audit-logs · AWS CloudTrail organization trails: https://docs.aws.amazon.com/awscloudtrail/ · S3 Object Lock (compliance mode = immutable): https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html · HIPAA documentation retention 6 yr (45 CFR §164.316(b)(2)). HITRUST domain 12.

**Anti-patterns** — (1) *"Audit logs in a mutable bucket — tamperable, fails HITRUST."* The canonical failure: if an admin can delete the log, the log proves nothing. Object Lock compliance mode is mandatory. (2) Per-account CloudTrail an admin can switch off — use an org trail. (3) Logging access but never alerting — logs you never read don't catch a breach in time. (4) Retention shorter than the compliance window, or logs aged out by a lifecycle rule before the window closes.

**Feeds artifacts** — Architecture audit design; HITRUST domains 12 & 16; Mobilization SOC runbook; the evidence column of GOV-02.

**Maturity** — Production-ready.

---

### PATTERN GOV-08 · Identity & access governance — SSO, SCIM, JIT, least-privilege

**Intent** — Govern *who* can authenticate and *what* they're entitled to from a single identity source, with least-privilege defaults and just-in-time elevation — so access is provisioned, reviewed, and revoked centrally, and no standing god-mode exists.

**Applies to** — Every environment. Lifecycle: Architecture, Mobilization, ongoing operations.

**Solution shape** —

- **SSO/SAML** via **AWS IAM Identity Center** (or the client's IdP — Okta/Entra) as the single front door to AWS and Databricks; **MFA enforced**.
- **SCIM provisioning** from the IdP into Databricks so groups and membership are driven by the IdP — joiner/mover/leaver flows deprovision access automatically. **Grant only to groups** (ties to GOV-01).
- **Least-privilege** roles: analysts get masked-view access, not raw PHI; engineers get build access in dev, not prod data; admins are few and audited.
- **Just-in-time (JIT) access**: privileged elevation (e.g. `phi_unmasked`, prod admin) is **time-boxed and approval-gated** rather than standing — request → approve → auto-expire, every step audited. Pair with break-glass (GOV-18) for emergencies.
- **Quarterly access reviews / recertification** driven off Unity Catalog grants + IdP group membership.

**Own-it vs rent** — **OWN.** Identity governance runs on the client's IdP and IAM Identity Center; entitlements are the client's policy. RENT contrast: local user accounts inside a SaaS tool, outside the client's IdP and joiner/leaver process — orphaned accounts, no central recertification.

**Where it sits** — Governance + landing-zone tier.

**Evidence anchors** — Databricks SSO/SCIM: https://docs.databricks.com/aws/en/admin/users-groups/scim/ · AWS IAM Identity Center: https://docs.aws.amazon.com/singlesignon/ · HITRUST domains 10 & 11. Recertification cadence: quarterly is common in healthcare (estimate — confirm with client policy).

**Anti-patterns** — (1) Local accounts not provisioned via SCIM — survive an employee's departure. (2) Standing privileged access ("everyone's an admin to move fast") — violates least-privilege and explodes blast radius. (3) MFA optional. (4) No periodic access review — entitlement creep goes undetected.

**Feeds artifacts** — Architecture identity design; HITRUST domains 10 & 11; Mobilization onboarding/offboarding runbook.

**Maturity** — Production-ready.

---

### PATTERN GOV-09 · Network security as a compliance control

**Intent** — Express network isolation (private connectivity, no public IPs, controlled egress) in **compliance terms** — these controls exist to keep PHI off the public internet and to prevent exfiltration, mapping directly to HITRUST transmission and media-protection domains. (For the build-level detail, reference the ARCH pack network patterns; this pattern is the *compliance rationale*.)

**Applies to** — Every PHI environment. Lifecycle: Architecture, Mobilization.

**Solution shape** — The security-relevant view of the network architecture (see ARCH pack for implementation):

- **AWS PrivateLink** for control-plane and S3 connectivity, so Databricks↔control-plane and workspace↔storage traffic never traverses the public internet — satisfies *transmission protection* (HITRUST 09).
- **No-public-IP (secure cluster connectivity)** clusters in the customer VPC — compute nodes have no public IPs, removing the inbound attack surface (HITRUST 03/04, endpoint exposure).
- **Egress firewall / controlled egress** (e.g. via an egress proxy or AWS Network Firewall) so clusters can only reach an allow-list of destinations — prevents data exfiltration to unsanctioned endpoints (HITRUST 03 portable-media / exfiltration).
- **VPC with private subnets, security groups, NACLs**; **S3 Block Public Access** account-wide; **VPC endpoints** for AWS services.
- **IP access lists** on the Databricks workspace so the console/API is reachable only from corporate/VPN ranges.

The compliance framing: each network control is *evidence for a specific HITRUST control*, not just an infra preference — that's what makes it auditable in GOV-02.

**Own-it vs rent** — **OWN.** The VPC, PrivateLink endpoints, firewall rules, and IP access lists are the client's network controls in the client's account. RENT contrast: a SaaS platform reachable over the public internet where the client cannot inspect or constrain the network path PHI travels.

**Where it sits** — Landing-zone + governance tier.

**Evidence anchors** — Databricks PrivateLink & secure cluster connectivity (no public IP): https://docs.databricks.com/aws/en/security/network/ · AWS Network Firewall / egress control: https://docs.aws.amazon.com/network-firewall/ · HITRUST domains 03, 04, 09. (Implementation detail: ARCH pack network patterns.)

**Anti-patterns** — (1) Public-IP clusters reachable from the internet processing PHI. (2) Unrestricted egress — a compromised notebook can exfiltrate PHI to any endpoint. (3) Treating network as "infra, not compliance" so it never lands in the control mapping and the auditor finds an unevidenced gap. (4) Workspace console open to `0.0.0.0/0` with no IP access list.

**Feeds artifacts** — Architecture network section (compliance rationale); HITRUST domains 03/04/09 in GOV-02; Mobilization network runbook.

**Maturity** — Production-ready.

---

### PATTERN GOV-10 · Secrets governance — no hardcoded credentials, rotation

**Intent** — Ensure no credential, key, or connection string is ever hardcoded in notebooks, jobs, or repos — every secret is stored in a managed vault, injected at runtime, rotated automatically, and access-audited.

**Applies to** — Every pipeline, job, and integration. Lifecycle: Architecture, Mobilization, ongoing operations.

**Solution shape** — Use **AWS Secrets Manager** (and/or **Databricks secret scopes** backed by it) as the single source for all credentials — source-system passwords, API keys, service-principal secrets, JDBC strings. Pipelines reference secrets by name; the value is injected at runtime and **redacted in logs and notebook output**. Enable **automatic rotation** in Secrets Manager for supported secret types; for the rest, define a rotation cadence and owner. Grant secret read access by least-privilege IAM/role, and **audit every secret access** via CloudTrail (feeds GOV-07). For source-system access prefer **IAM roles / IRSA / instance profiles** over long-lived keys where possible — the best secret is no secret.

**Own-it vs rent** — **OWN.** Secrets and rotation policy live in the client's Secrets Manager. RENT contrast: credentials stored in a vendor's console you can't audit or rotate on your schedule.

**Where it sits** — Landing-zone + governance tier; touches all pipelines.

**Evidence anchors** — AWS Secrets Manager rotation: https://docs.aws.amazon.com/secretsmanager/ · Databricks secret scopes: https://docs.databricks.com/aws/en/security/secrets/ · HITRUST domains 10 & 11.

**Anti-patterns** — (1) Credentials hardcoded in a notebook or committed to git — the most common real-world breach vector. (2) Secrets printed to logs/output (un-redacted). (3) Long-lived static keys never rotated. (4) One shared secret across all pipelines — can't revoke one consumer without breaking all.

**Feeds artifacts** — Architecture secrets design; HITRUST domains 10/11; Mobilization secrets/rotation runbook.

**Maturity** — Production-ready.

---

### PATTERN GOV-11 · Data residency & sovereignty — region pinning

**Intent** — Guarantee that PHI is stored and processed only in approved geographic region(s), so the architecture satisfies data-residency obligations and cross-border-transfer constraints.

**Applies to** — Any client with residency requirements (US healthcare PHI; clients with state-level or contractual residency clauses; future cross-border entities). Lifecycle: Architecture, Mobilization.

**Solution shape** — **Pin the region**: the Unity Catalog metastore, all S3 buckets, the Databricks workspace, and the classic compute plane VPC all in the **approved AWS region(s)** (e.g. `us-east-1` / `us-west-2` for US PHI). Enforce with **AWS Organizations SCPs** that deny resource creation outside approved regions — so an engineer can't accidentally spin up PHI compute in a non-compliant region. Set **S3 replication only to approved regions** (or disable cross-region replication for PHI). For multi-entity / cross-border clients (ties to GOV-15), keep each jurisdiction's data in its own region-pinned catalog and document any cross-border data flow with its legal basis. Confirm Databricks **serverless** features process in-region for the client's requirement before using them for PHI (see GOV-03).

**Own-it vs rent** — **OWN.** Region pinning is enforced by the client's SCPs over the client's resources. RENT contrast: a SaaS vendor's stated region with no client-enforceable guarantee and possible cross-region processing the client can't see.

**Where it sits** — Landing-zone + governance tier.

**Evidence anchors** — AWS Organizations region-restriction SCPs: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples_general.html · HITRUST domain 19 / data-protection. Approved regions: US PHI typically pinned to US regions (confirm with client).

**Anti-patterns** — (1) No SCP guardrail — relies on discipline, fails the day someone clicks the wrong region. (2) Cross-region replication or backups silently copying PHI out of the approved region. (3) Using a global/serverless feature without confirming in-region processing.

**Feeds artifacts** — Architecture residency section; HITRUST domain 19; Mobilization SCP/guardrail setup.

**Maturity** — Production-ready.

---

### PATTERN GOV-12 · De-identification & tokenization — Safe Harbor / Expert Determination

**Intent** — Enable secondary use of clinical data (research, analytics, dev/test) **without** exposing PHI, by producing properly de-identified datasets under a defensible method — so the de-identified data falls outside HIPAA's restrictions and the raw PHI is never copied where it isn't needed.

**Applies to** — Research catalogs, analytics not requiring identifiers, dev/test environments, model training (ties to GOV-14, MLOPS pack). Lifecycle: Architecture, Mobilization.

**Solution shape** — Choose and document a HIPAA **de-identification method** per dataset:

- **Safe Harbor** — remove the **18 specified identifiers** (names, geographic subdivisions smaller than state, all date elements except year, ages over 89, contact details, SSN, MRN, account/device/biometric IDs, full-face photos, etc.) and have no actual knowledge the residual could re-identify. Deterministic, auditable, the default for most de-id pipelines.
- **Expert Determination** — a qualified statistician certifies the re-identification risk is *very small*; permits richer data (e.g. fuller dates, finer geography) than Safe Harbor when research needs it. Requires the expert's documented methodology and sign-off.

Implement as a **governed de-id pipeline** writing to a separate `deid_*` catalog: Safe-Harbor scrubbing of the 18 identifiers, **tokenization** of identifiers needed for linkage (replace MRN with a consistent surrogate token via a secured token vault, so longitudinal joins work without exposing the real MRN), date-shifting, and generalization (e.g. age bucketing, 3-digit ZIP). For **dev/test**, prefer **synthetic data** (statistically representative, no real PHI) over even de-identified production data, so lower environments never hold real patient data. Tag de-id outputs (GOV-05) and grant broadly; keep raw PHI locked to GOV-04's narrow groups.

The token vault is the linchpin and the most common place de-id goes wrong: the MRN→token mapping must live in a **separately-secured store, isolated from the de-identified dataset**, with its own narrow grants and audit — because if the mapping co-locates with the data (or is derivable from it), the "de-identified" data is re-identifiable and is therefore still PHI under HIPAA. A correct pattern: a consistent salted-hash or vault-issued surrogate where the reversal mapping is held only by a tiny, audited group for the rare legitimate re-link, and the research consumers never have access to it. Date-shifting must be **per-patient consistent** (the same offset for all of a patient's dates) so intervals remain analytically valid while absolute dates are obscured.

**Own-it vs rent** — **OWN.** The de-id pipelines, token vault, and method documentation are the client's IP in their catalogs. RENT contrast: shipping raw PHI to a vendor for de-identification — defeats the purpose and adds a custodian.

**Where it sits** — Governance + Silver/Gold; the boundary between the PHI catalog and the research/dev catalogs.

**Evidence anchors** — HHS guidance on de-identification (Safe Harbor 18 identifiers + Expert Determination): https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html · 45 CFR §164.514(b). Synthetic data for dev/test reduces lower-environment PHI risk to zero (no real PHI present).

**Anti-patterns** — (1) "De-identified" data that still carries full dates of birth, full ZIP, or an un-tokenized MRN — fails Safe Harbor. (2) Reversible "tokenization" where the mapping is co-located with the data — re-identifiable, still PHI. (3) Copying production PHI into dev/test "just to have realistic data." (4) Claiming Expert Determination without the documented expert methodology.

**Feeds artifacts** — Architecture de-id design; domain-pack research use cases; HITRUST domain 19; Mobilization de-id pipeline build.

**Maturity** — Production-ready.

---

### PATTERN GOV-13 · Consent management & minimum-necessary

**Intent** — Bake the HIPAA **minimum-necessary** principle and patient-consent constraints into data-access design — so each use only ever touches the least PHI required for its purpose, and consent / purpose limitations are enforced, not assumed.

**Applies to** — All PHI consumption; especially research and secondary use. Lifecycle: Architecture, Mobilization, operations.

**Solution shape** — Operationalize **minimum-necessary** through the access stack: purpose-scoped Gold views that expose only the columns a given use needs (treatment vs payment vs operations vs research see different projections), driven by classification tags (GOV-05) and group entitlements (GOV-08). Where the client maintains a **consent / preference registry** (e.g. research opt-in/opt-out, sensitive-category restrictions like behavioral health or substance-use under 42 CFR Part 2), join it as a **row filter** (GOV-04) so non-consented patients are excluded from the relevant datasets *at query time*. Document, per data product, the purpose, the minimum columns, and the consent basis — this becomes an access-justification artifact. Treat heightened-sensitivity categories (behavioral health, HIV, substance use, genetic) with their own tags and tighter grants.

**Own-it vs rent** — **OWN.** The purpose-scoped views, consent-join logic, and access-justification records are the client's governance IP. RENT contrast: a vendor platform that ingests all PHI regardless of purpose, with minimum-necessary unenforced.

**Where it sits** — Governance + Gold; the consumption boundary.

**Evidence anchors** — HIPAA minimum-necessary standard: 45 CFR §164.502(b), §164.514(d) — https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html · 42 CFR Part 2 (substance-use confidentiality) for affected datasets. Consent-as-row-filter composes on GOV-04.

**Anti-patterns** — (1) Granting whole-table access "for convenience" when a use needs three columns — violates minimum-necessary. (2) Ignoring consent / opt-out so non-consented patients appear in research extracts. (3) Treating 42 CFR Part 2 data like ordinary PHI — it has stricter rules. (4) No documented purpose per data product — can't defend the access scope.

**Feeds artifacts** — Architecture consumption-governance design; HITRUST domain 19; Population-health / research domain-pack use cases; Mobilization data-product specs.

**Maturity** — Emerging (consent-registry integration maturity varies by client).

---

### PATTERN GOV-14 · Privacy for AI — PHI in prompts/RAG, the zero-retention boundary

**Intent** — Govern PHI flowing into AI systems — training data, RAG context, and LLM prompts — so models and providers never become an uncontrolled PHI custodian, and every AI path that touches PHI sits inside a BAA / zero-retention boundary. (Ties to the MLOPS pack.)

**Applies to** — Any GenAI / RAG / ML use case over clinical data. Lifecycle: Architecture, Mobilization, operations.

**Solution shape** — Three rules, enforced architecturally:

1. **PHI in prompts/RAG must stay inside a BAA + zero-retention boundary.** Use an LLM endpoint covered by a BAA with the provider (e.g. **Amazon Bedrock**, which is HIPAA-eligible under the AWS BAA, or a Databricks-hosted / self-hosted model inside the client account) configured for **no training on, and no retention of, customer prompts/outputs**. Never send PHI to a consumer or non-BAA LLM API.
2. **PHI in training data is minimized and governed.** Prefer **de-identified** data (GOV-12) for training/fine-tuning; where identified data is required, keep training inside the client account under the same controls as any PHI workload (GOV-03/06/07).
3. **De-identify or filter at the RAG boundary** where the use case allows — retrieve from a de-identified index, or strip identifiers before they reach the prompt — and **audit every PHI-bearing inference** (prompt + retrieved context) into the immutable store (GOV-07). Apply Unity Catalog access controls to the vector/RAG index the same as any PHI table (GOV-04/05).

**Own-it vs rent** — **MANAGED-OWN-DESTINATION** at best (Bedrock/Databricks under BAA + zero-retention, in the client account). RENT / disqualified: a public LLM API with no BAA and default retention/training — PHI leaves the boundary and the provider may train on it.

**Where it sits** — Governance tier × serving/AI tier; the boundary between the lakehouse and any model.

**Evidence anchors** — Amazon Bedrock HIPAA eligibility under AWS BAA (no training on customer data; confirm zero-retention config): https://docs.aws.amazon.com/bedrock/ · Databricks Mosaic AI / foundation-model serving within the account under the BAA (GOV-03). Provider zero-retention terms must be confirmed in the BAA — *flag: confirm retention/training terms in writing per provider.* Composes with the MLOPS pack serving/monitoring patterns.

**Anti-patterns** — (1) *"PHI in a public LLM prompt with no BAA."* The canonical AI failure — sends PHI to a provider who may retain or train on it, outside any BAA; a reportable disclosure. (2) Building a RAG index over raw PHI with no Unity Catalog access control on the index. (3) Fine-tuning on identified PHI when de-identified data would serve, then exporting the model. (4) No audit of PHI-bearing inferences — can't reconstruct what the model saw.

**Feeds artifacts** — Architecture AI-privacy boundary; HITRUST domains 14 & 19; MLOPS-pack serving design; Mobilization AI-governance gate.

**Maturity** — Emerging.

---

### PATTERN GOV-15 · Multi-tenant / federated governance for holding groups

**Intent** — Govern data across a multi-entity client (a holding group with several legal entities / facilities) so each entity's data stays sovereign and isolated, while shared, cross-entity analytics remain possible under explicit, governed data-sharing — never accidental commingling.

**Applies to** — Holding-group / multi-facility / multi-tenant clients (and conceptually the AbarVa `holding_group_id` tenancy pattern — entity-scoped isolation with a parent group). Lifecycle: Architecture, Mobilization.

**Solution shape** — Map each legal entity to its **own Unity Catalog catalog** (e.g. `entity_a_phi`, `entity_b_phi`), with entity-scoped groups (GOV-08) and grants — so by default no entity can read another's PHI. Where data residency or sovereignty differs by entity, region-pin per entity (GOV-11). For *deliberate* cross-entity analytics, use **governed sharing** (Unity Catalog sharing / Delta Sharing) with an explicit grant and a documented legal basis — sharing is opt-in and audited, never a side effect of a broad grant. Carry an **entity/tenant identifier** (conceptually the `holding_group_id` / `entity_id`) on shared assets and enforce it via **row filters** (GOV-04) on any cross-entity Gold product so a query is always scoped to the caller's authorized entities. All cross-entity access lands in the immutable audit trail (GOV-07).

**Own-it vs rent** — **OWN.** The per-entity catalogs, isolation grants, and sharing agreements are the client group's governance model. RENT contrast: a multi-tenant SaaS where the client's entities are tenants of the *vendor* and isolation is the vendor's (unverifiable-to-the-client) implementation.

**Where it sits** — Governance tier; catalog/namespace design.

**Evidence anchors** — Unity Catalog catalog-per-domain isolation + Delta Sharing for governed cross-boundary sharing: https://docs.databricks.com/aws/en/data-sharing/ · Conceptual tie to AbarVa `holding_group_id` entity-scoped tenancy. Cross-border entities also invoke GOV-11.

**Anti-patterns** — (1) One shared catalog across all entities with row filters as the *only* boundary — one filter bug commingles PHI across legal entities. (2) Cross-entity sharing via a broad grant instead of explicit, documented Delta Sharing. (3) No entity identifier on shared assets — can't scope or audit cross-entity access. (4) Ignoring per-entity residency differences.

**Feeds artifacts** — Architecture tenancy/isolation design; HITRUST domains 11 & 19; Mobilization catalog-design milestone.

**Maturity** — Emerging.

---

### PATTERN GOV-16 · Compliance readiness gate — controls GREEN before PHI lands

**Intent** — Define a hard, auditable gate that **every required control must pass GREEN before any PHI is ingested** — so compliance is a precondition, not a retrofit, and "go-live with PHI" is an explicit, evidenced decision.

**Applies to** — Every PHI environment, at the transition from build to first-PHI-load. Lifecycle: Mobilization (the gate); referenced in Architecture and Business Case as a risk control.

**Solution shape** — A checklist gate, each item GREEN with evidence, signed off by the client CISO / Privacy Officer before PHI ingest is enabled:

| # | Control | GREEN criterion (evidence) | Pattern |
|---|---|---|---|
| 1 | Compliance security profile | Enabled on all PHI workspaces | GOV-03 |
| 2 | BAAs | Signed with **both** Databricks **and** AWS | GOV-03 |
| 3 | Encryption | CMKs per classification; at-rest + TLS in-transit; rotation on | GOV-06 |
| 4 | Network | No-public-IP, PrivateLink, egress controlled, IP access lists | GOV-09 |
| 5 | Identity | SSO+MFA, SCIM, least-privilege groups, JIT for privileged | GOV-08 |
| 6 | Access control | RLS + column masks + PHI views in place; `phi_unmasked` narrow | GOV-04 |
| 7 | Classification | PHI columns 100% tagged; ABAC policies active | GOV-05 |
| 8 | Audit | UC audit + org CloudTrail → immutable S3 (Object Lock) with retention | GOV-07 |
| 9 | Secrets | No hardcoded creds; vault + rotation | GOV-10 |
| 10 | Residency | Region pinned + SCP guardrails | GOV-11 |
| 11 | De-id / dev-test | Lower environments use synthetic/de-id data, no raw PHI | GOV-12 |
| 12 | HITRUST mapping | Control mapping complete; evidence references attached | GOV-02 |
| 13 | AI boundary (if applicable) | LLM endpoints under BAA + zero-retention | GOV-14 |

The gate is **fail-closed**: any RED item blocks PHI ingest. Re-run the gate at each material release (controls drift). Record the gate result as an audit artifact.

**Own-it vs rent** — **OWN.** The gate, its evidence, and the sign-off are the client's compliance record. (A rented platform has no equivalent client-side gate — the client inherits the vendor's posture and can't gate it.)

**Where it sits** — Governance tier; the Mobilization go-live checkpoint.

**Evidence anchors** — Composes GOV-02..GOV-15. Databricks compliance profile + BAA preconditions: https://docs.databricks.com/aws/en/security/privacy/hipaa · S3 Object Lock immutability: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html. Best-in-class engagements treat first-PHI-load as a formal, signed gate, not an engineering toggle.

**Anti-patterns** — (1) Loading PHI "to start testing" before the gate passes — the single most damaging compliance mistake. (2) A one-time gate never re-run — controls drift and the next release silently regresses. (3) Gate sign-off without evidence references — a checkbox, not a control. (4) Engineering self-approving the gate without CISO/Privacy sign-off.

**Feeds artifacts** — Mobilization go-live gate (the centerpiece); Business case risk-control narrative; Architecture compliance summary; audit evidence package.

**Maturity** — Production-ready.

---

### PATTERN GOV-17 · Service principals vs users — non-human identity governance

**Intent** — Govern automated/non-human access (pipelines, jobs, integrations) through dedicated **service principals** with scoped, least-privilege entitlements — so automation never runs as a person's account, and machine access is independently auditable and revocable.

**Applies to** — Every automated pipeline, job, CI/CD process, and integration. Lifecycle: Architecture, Mobilization, operations.

**Solution shape** — Run all automation as **Databricks service principals** (and AWS **IAM roles**, not IAM users) — never as a named human's credentials. Each service principal is scoped to exactly the catalogs/schemas/secrets its job needs (least-privilege; GOV-01/10), provisioned and inventoried alongside human identities (GOV-08), and its actions are attributable in the audit trail under the principal's identity (GOV-07). Secrets/credentials for service principals live in the vault with rotation (GOV-10); prefer OAuth/role-assumption over long-lived secrets. Service principals are included in access reviews and deprovisioned when their job retires — orphaned machine identities are a common breach vector.

**Own-it vs rent** — **OWN.** Service principals, their entitlements, and their audit trail are the client's identity governance. RENT contrast: a vendor's internal service accounts the client can't see, scope, or revoke.

**Where it sits** — Governance + landing-zone tier; all pipelines.

**Evidence anchors** — Databricks service principals: https://docs.databricks.com/aws/en/admin/users-groups/service-principals/ · AWS IAM roles for workloads: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html · HITRUST domains 10 & 11.

**Anti-patterns** — (1) Pipelines running under a human's personal token — breaks when they leave, mis-attributes audit. (2) One over-privileged service principal for everything — can't scope or revoke per job. (3) Service principals excluded from access reviews — orphaned automation identities persist. (4) Long-lived static secrets for service principals instead of OAuth/role assumption.

**Feeds artifacts** — Architecture identity design; HITRUST domains 10/11; Mobilization pipeline-onboarding runbook.

**Maturity** — Production-ready.

---

### PATTERN GOV-18 · Break-glass / emergency access with full audit

**Intent** — Provide a controlled, fully-audited **emergency access** path for genuine incidents — so responders can act fast without standing god-mode existing the rest of the time, and every emergency elevation is conspicuous, time-boxed, and reviewed after the fact.

**Applies to** — Incident response, production emergencies in PHI environments. Lifecycle: Mobilization (design), operations.

**Solution shape** — Define a **break-glass procedure**: a normally-empty privileged group (e.g. `phi_break_glass`) that grants elevated access only when invoked. Invocation requires a documented reason and (where feasible) a second-person approval; access is **time-boxed and auto-expires** (composes with JIT in GOV-08). Every break-glass invocation triggers a **high-priority alert to the SOC** and lands prominently in the immutable audit trail (GOV-07), and is subject to a **mandatory post-incident review** confirming the access was justified and revoked. Break-glass complements, never replaces, normal least-privilege access — it exists precisely so that no standing emergency-level access is needed day-to-day.

**Own-it vs rent** — **OWN.** The procedure, the alerting, and the audit/review are the client's incident-governance controls. RENT contrast: relying on a vendor's support team to make emergency changes, outside the client's audit and review.

**Where it sits** — Governance tier; identity + audit.

**Evidence anchors** — Composes GOV-07 (audit/alerting) and GOV-08 (JIT). HITRUST domains 11 (access control) & 16 (incident management). Post-incident review cadence: every invocation (no sampling) for PHI environments (estimate — confirm with client IR policy).

**Anti-patterns** — (1) Standing emergency access ("the on-call always has admin") — defeats least-privilege and is the access that gets abused. (2) Break-glass with no alert — emergency access used silently. (3) No auto-expiry — the elevation never gets revoked. (4) No post-incident review — can't tell justified use from abuse.

**Feeds artifacts** — Architecture incident-access design; HITRUST domains 11 & 16; Mobilization IR runbook.

**Maturity** — Emerging.

---

## Composition notes — how this pack feeds a Move artifact

A defensible healthcare architecture composes nearly the whole pack, anchored by three crown patterns:

```
COMPLIANCE SPINE:   GOV-03 (HIPAA: compliance profile + dual BAA — the own-it core)
                    GOV-02 (HITRUST control mapping — the CISO-defensible artifact)
                    GOV-16 (readiness gate — controls GREEN before PHI lands)
   ×
GOVERNANCE:         GOV-01 (Unity Catalog backbone)
                    GOV-05 (classification/ABAC) → GOV-04 (RLS/masking/views)
                    GOV-13 (minimum-necessary/consent)
   ×
SECURITY:           GOV-06 (CMK encryption) · GOV-07 (immutable audit)
                    GOV-08 (identity) · GOV-17 (service principals) · GOV-18 (break-glass)
                    GOV-09 (network — compliance view) · GOV-10 (secrets) · GOV-11 (residency)
   ×
SECONDARY-USE/AI:   GOV-12 (de-id/tokenization) · GOV-14 (privacy for AI) · GOV-15 (multi-entity)
```

The own-it posture of the whole architecture rests on **GOV-03**: PHI is processed in the client's own AWS account, under the client's keys (GOV-06), with the client's audit (GOV-07) and the client's policy (GOV-01/04/05). **GOV-02** turns that posture into an auditor-traceable artifact, and **GOV-16** makes it a gated, evidenced go-live decision. Every quantitative claim above that isn't sourced to a cited doc is flagged "estimate — confirm."
