# AbarVa — Security Controls Matrix

**Document type:** ISO 27001 / SOC2 reference controls self-assessment  
**Audience:** Enterprise security review teams  
**Version:** 1.0 — 2026-04-26  
**Status:** Self-assessed only. No external audit has been conducted.

---

> This matrix maps AbarVa's current controls to ISO 27001:2022 Annex A domains and SOC2 Trust Service Criteria (TSC). Status is `implemented`, `partial`, `planned`, or `not-applicable`. Do not treat this as a compliance attestation.

---

## Legend

| Status | Meaning |
|---|---|
| ✅ Implemented | Control is live and enforced |
| ⚠️ Partial | Control exists but has gaps |
| 🗓️ Planned | On roadmap; not yet live |
| ➖ Not applicable | Control does not apply to current scope |

---

## SOC2 Trust Service Criteria Mapping

### CC1 — Control Environment

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC1.1 | COSO principles — demonstrates commitment to integrity and ethics | ⚠️ Partial | Design canon enforced; no formal code of conduct document |
| CC1.2 | Board oversight of internal control | ➖ Not applicable | Founder-led; no formal board in pilot phase |
| CC1.3 | Management structure and reporting lines | ⚠️ Partial | Single founder; no formal org chart |
| CC1.4 | Commitment to competence | ✅ Implemented | Founding team has relevant security and engineering experience |
| CC1.5 | Accountability for internal control | ⚠️ Partial | Founder-owned; no delegated CISO role |

### CC2 — Communication and Information

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC2.1 | Information to support internal control | ⚠️ Partial | Audit logging partial; Vercel logs + Clerk auth events |
| CC2.2 | Internal communication | ✅ Implemented | GitHub Issues + Slack for engineering; wave-based documentation |
| CC2.3 | External communication | ⚠️ Partial | This document; no formal policy page published yet |

### CC3 — Risk Assessment

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC3.1 | Risk assessment process | ⚠️ Partial | Gap registry maintained in SECURITY_POSTURE.md; no formal risk register |
| CC3.2 | Fraud risk assessment | 🗓️ Planned | No formal assessment conducted |
| CC3.3 | Changes affecting risk | ⚠️ Partial | Wave-based change management; no formal change risk review |

### CC4 — Monitoring

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC4.1 | Ongoing monitoring | ⚠️ Partial | Vercel + Clerk event monitoring; no SIEM |
| CC4.2 | Evaluation and communication of deficiencies | ⚠️ Partial | Gap registry maintained; no automated deficiency alerts |

### CC5 — Control Activities

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC5.1 | Mitigation of risks through control activities | ✅ Implemented | RLS, JWT auth, HTTPS enforced |
| CC5.2 | Technology controls | ✅ Implemented | Parameterized queries, React XSS protection, Clerk CSRF |
| CC5.3 | Deployment through policies | ⚠️ Partial | Wave protocol enforces code review; no formal change management policy |

### CC6 — Logical and Physical Access

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC6.1 | Logical access security | ✅ Implemented | Clerk RBAC; tenant-scoped RLS; 4-role model |
| CC6.2 | Authentication | ✅ Implemented | MFA enforced for admin; OTP for all users |
| CC6.3 | Access provisioning and revocation | ⚠️ Partial | Clerk org management; no automated off-boarding workflow |
| CC6.4 | Privileged access management | ⚠️ Partial | Vercel + Neon env access restricted to founding team; no PAM tooling |
| CC6.5 | Physical security | ➖ Not applicable | No physical infrastructure; fully cloud-hosted |
| CC6.6 | Logical access restrictions | ✅ Implemented | API route auth validation on every request |
| CC6.7 | Vendor/partner access | ⚠️ Partial | Clerk, Vercel, Neon sub-processor relationships; no formal vendor security reviews |
| CC6.8 | Malware protection | ⚠️ Partial | npm audit in CI; no EDR on developer machines |

### CC7 — System Operations

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC7.1 | Detection and monitoring | ⚠️ Partial | Vercel deployment monitoring; no application-level alerting |
| CC7.2 | Malicious code and unauthorized software | ⚠️ Partial | GitHub Actions CI; no SAST/DAST |
| CC7.3 | Environmental threats | ➖ Not applicable | Fully cloud-hosted |
| CC7.4 | Incident response | 🗓️ Planned | No formal IR runbook; documented as high-priority gap |
| CC7.5 | Recovery from incidents | ⚠️ Partial | Neon PITR available; no tested DR runbook |

### CC8 — Change Management

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC8.1 | Change management | ✅ Implemented | GitHub PR-based; CI gate required before merge; wave protocol |

### CC9 — Risk Mitigation

| Ref | Criterion | Status | Evidence / Notes |
|---|---|---|---|
| CC9.1 | Risk mitigation — vendor | ⚠️ Partial | Clerk SOC2 reviewed; Vercel SOC2 reviewed; Neon SOC2 reviewed |
| CC9.2 | Business disruption risk | ⚠️ Partial | Vercel CDN + Neon HA; no formal BCP |

---

## ISO 27001:2022 Annex A Controls

### A.5 — Organizational Controls

| Control | Title | Status | Notes |
|---|---|---|---|
| A.5.1 | Policies for information security | ⚠️ Partial | This document; no board-approved policy |
| A.5.2 | Information security roles and responsibilities | ⚠️ Partial | Founder-owned; no formal CISO |
| A.5.3 | Segregation of duties | ➖ Partial | Single founder; PR review enforced for AI-generated code |
| A.5.7 | Threat intelligence | 🗓️ Planned | No formal threat intel program |
| A.5.9 | Inventory of information assets | ⚠️ Partial | Backlog registry tracks code assets; no formal data inventory |
| A.5.23 | Information security in cloud services | ✅ Implemented | Cloud providers (Vercel, Neon, Clerk) all SOC2 certified |
| A.5.28 | Collection of evidence | ✅ Implemented | Clerk + Vercel logs; QA32 evidence trust audit suite |

### A.6 — People Controls

| Control | Title | Status | Notes |
|---|---|---|---|
| A.6.1 | Screening | ➖ Not applicable | Founding team only in pilot |
| A.6.2 | Terms and conditions of employment | ➖ Not applicable | No employees in pilot phase |
| A.6.3 | Security awareness and training | ⚠️ Partial | Informal; no formal training program |

### A.7 — Physical Controls

| Control | Title | Status | Notes |
|---|---|---|---|
| A.7.1–A.7.13 | Physical security controls | ➖ Not applicable | No physical infrastructure |

### A.8 — Technological Controls

| Control | Title | Status | Notes |
|---|---|---|---|
| A.8.2 | Privileged access rights | ⚠️ Partial | Vercel + Neon admin restricted to founding team |
| A.8.3 | Information access restriction | ✅ Implemented | Clerk RBAC + Postgres RLS |
| A.8.5 | Secure authentication | ✅ Implemented | Clerk MFA; JWT with 15-min expiry |
| A.8.7 | Protection against malware | ⚠️ Partial | npm audit in CI; no SAST |
| A.8.10 | Information deletion | 🗓️ Planned | No formal data deletion workflow for offboarding |
| A.8.12 | Data leakage prevention | ✅ Implemented | Tenant RLS; API route tenant validation |
| A.8.15 | Logging | ⚠️ Partial | Vercel + Clerk logs; no structured audit log in app DB |
| A.8.16 | Monitoring activities | ⚠️ Partial | Vercel + Clerk; no SIEM |
| A.8.17 | Clock synchronisation | ✅ Implemented | Cloud infrastructure — NTP maintained by Vercel/Neon |
| A.8.20 | Network security | ✅ Implemented | HTTPS enforced; Vercel WAF |
| A.8.21 | Security of network services | ✅ Implemented | Neon private networking available; Vercel TLS |
| A.8.24 | Use of cryptography | ✅ Implemented | TLS in transit; AES-256 at rest (provider-managed) |
| A.8.25 | Secure development lifecycle | ⚠️ Partial | Wave-based code review; no formal SDLC policy |
| A.8.29 | Security testing in development | 🗓️ Planned | No SAST/DAST; manual review only |
| A.8.30 | Outsourced development | ➖ Not applicable | AI-assisted internal development only |
| A.8.33 | Test information | ✅ Implemented | All test data is deterministic seed data; no real PII in test suite |
| A.8.34 | Protection of information systems during audit | ⚠️ Partial | No formal audit procedures |

---

## Sub-Processor Summary

| Sub-processor | Role | SOC2 | Data processed |
|---|---|---|---|
| Clerk | Authentication, user management | SOC2 Type II | User credentials, session tokens |
| Vercel | Application hosting, CDN, edge | SOC2 Type II | Request logs, static assets |
| Neon (Postgres) | Primary database | SOC2 Type II | All tenant data, program data, evidence metadata |
| GitHub | Source code, CI/CD | SOC2 Type II | Application code, deployment pipeline |

No sub-processor has access to raw client data beyond what is described above. The private data plane option removes Neon from the data-processing chain for Tier 3 clients.

---

_Document owner: AbarVa founding team_  
_Scope: AbarVa SaaS (nexus-vert-kappa.vercel.app), pilot phase_  
_Next review: Wave 27 or upon pilot client security questionnaire receipt_
