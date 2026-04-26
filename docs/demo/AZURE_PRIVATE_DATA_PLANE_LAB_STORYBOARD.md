# Azure Private Data Plane Lab Storyboard

**Date:** 2026-04-26
**Slice:** LIVE4
**Status:** code_complete
**Audience:** AbarVa sales engineers and founders delivering a live demo to Fortune 500 prospects

---

## Executive Summary

Fortune 500 buyers will not send raw operational data to a SaaS platform. AbarVa's answer is the
two-plane architecture: a SaaS Control Plane (AbarVa-owned, running on Vercel/Azure) and a Client
Private Data Plane (client-owned, running in the client's Azure tenant). Raw data never crosses the
boundary. AbarVa requests evidence manifests; clients approve what to share.

This storyboard guides a 17-minute live demo walk covering the trust problem, the architecture, the
Azure resource group split, the private data plane components, the evidence-without-raw-data pattern,
the boundary enforcement contract, the May 4 lab deployment plan, and the honest caveat list for
what remains client-specific.

**Total slides:** 8
**Total duration:** 17 minutes

---

## Slide 1 — AZLAB-S01: The Data Trust Problem

| Field | Value |
|---|---|
| Type | narrative |
| Duration | 2 minutes |
| Client question | How do you handle our data residency and sovereignty requirements? |

**Key message:** Fortune 500 clients will not send raw data to a SaaS platform

**What to show:** Single slide: client data stays in client boundary diagram

**Speaker notes:**
Open with the problem every enterprise buyer has. Their data is their moat.

**What NOT to claim:**
Do not claim AbarVa has solved all data sovereignty requirements.

---

## Slide 2 — AZLAB-S02: Two-Plane Architecture

| Field | Value |
|---|---|
| Type | architecture |
| Duration | 3 minutes |
| Client question | Where does my data actually live? |

**Key message:** SaaS Control Plane + Client Private Data Plane — no raw data crosses the boundary

**What to show:** AZLAB1 blueprint diagram from `docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md`

**Speaker notes:**
Show the two-plane split. AbarVa orchestrates; client data never leaves their Azure tenant.

**What NOT to claim:**
Do not claim the lab is in production — it is a planned proof of concept.

---

## Slide 3 — AZLAB-S03: Azure Resource Group Split

| Field | Value |
|---|---|
| Type | architecture |
| Duration | 2 minutes |
| Client question | What Azure resources are in my environment? |

**Key message:** rg-abarva-lab-control (AbarVa-owned) vs rg-abarva-lab-private-dp (client-owned)

**What to show:** Resource group table from AZLAB5 runbook

**Speaker notes:**
Two resource groups, two ownership domains. Client controls the private data plane RG entirely.

**What NOT to claim:**
Do not claim client billing is set up — lab uses AbarVa subscription for proof of concept.

---

## Slide 4 — AZLAB-S04: Private Data Plane Components

| Field | Value |
|---|---|
| Type | demo_step |
| Duration | 2 minutes |
| Client question | What components run in my environment? |

**Key message:** Private Postgres, Blob Storage, Key Vault, App Insights, Model Gateway Stub — all client-side

**What to show:** AZLAB5 runbook component list and AZLAB3 connector stub code

**Speaker notes:**
Walk through the six components in the private data plane. Each is client-owned and client-controlled.

**What NOT to claim:**
Do not claim these are provisioned today — May 4 lab target.

---

## Slide 5 — AZLAB-S05: Evidence Without Raw Data

| Field | Value |
|---|---|
| Type | demo_step |
| Duration | 3 minutes |
| Client question | What data does AbarVa actually see? |

**Key message:** AbarVa requests evidence manifests; client approves what to share

**What to show:** AZLAB4 private evidence manifest types and sample output

**Speaker notes:**
Show the AZLAB4 private evidence manifest demo. 8 enterprise data sources — Workday, Salesforce,
Oracle, SAP, Qualtrics, Datadog, Genesys, ServiceNow — all with `rawDataRetainedByClient: true`.

**What NOT to claim:**
Do not claim live integration with these systems exists today.

---

## Slide 6 — AZLAB-S06: Boundary Enforcement Contract

| Field | Value |
|---|---|
| Type | trust_story |
| Duration | 2 minutes |
| Client question | How is the boundary enforced technically? |

**Key message:** Every cross-boundary call is logged, audited, and governed by explicit rules

**What to show:** AZLAB2 boundary rule list and audit event structure

**Speaker notes:**
Show AZLAB2 boundary contract: 8 rules, 4 failure modes, audit trail. No raw data ever crosses.

**What NOT to claim:**
Do not claim SOC2 or ISO27001 certification from this lab.

---

## Slide 7 — AZLAB-S07: May 4 Lab Deployment Plan

| Field | Value |
|---|---|
| Type | plan |
| Duration | 2 minutes |
| Client question | When can we see this running? |

**Key message:** Lab will be provisioned and validated by May 4, 2026

**What to show:** AZLAB5 deployment checklist and verification steps

**Speaker notes:**
Concrete timeline: VNet, Container Apps, Postgres, Key Vault, Blob, App Insights, connector smoke test.

**What NOT to claim:**
Do not commit to a specific client deployment date in this meeting.

---

## Slide 8 — AZLAB-S08: What Remains Client-Specific

| Field | Value |
|---|---|
| Type | caveat |
| Duration | 1 minute |
| Client question | What would a real deployment require on our side? |

**Key message:** IAM integration, data classification policy, network peering, and compliance certification are client-led

**What to show:** Caveat list from this storyboard

**Speaker notes:**
Be honest about what the lab proves vs. what requires a client-specific engagement.

**What NOT to claim:**
Do not claim the lab substitutes for a full client deployment engagement.

---

## What the Lab Proves

1. Two-plane architecture is technically viable on Azure
2. Evidence manifests can be requested and approved without raw data crossing the boundary
3. Resource group ownership split is deployable
4. Connector stub pattern supports future real integration
5. Audit trail enforces boundary rules deterministically

---

## What the Lab Does NOT Prove

1. Production-scale performance under real client load
2. Live integration with Workday/Salesforce/SAP/Oracle
3. SOC2 or ISO27001 compliance
4. Client-specific network peering or IAM policy
5. Cost at production scale

---

## What Remains Client-Specific

1. Azure subscription and tenant setup
2. IAM/Entra ID integration
3. Data classification and retention policy
4. Network peering and private endpoint configuration
5. Compliance audit and certification

---

## Fortune 500 Trust Rationale

Fortune 500 clients require data sovereignty. The two-plane architecture ensures AbarVa never
receives raw client data — only evidence manifests that the client explicitly approves. The private
data plane runs in the client's Azure tenant, under client IAM and network controls.

---

## May 4 Lab Plan

By May 4 2026: provision `rg-abarva-lab-private-dp` with VNet (10.0.0.0/16), Container Apps for
connector stub, PostgreSQL Flexible Server (Burstable B1ms), Blob Storage, Key Vault, App Insights.
Run connector smoke test. Document boundary audit log output.
