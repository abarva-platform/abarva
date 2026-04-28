# AbarVa — Security Posture Overview

**Document type:** Public-facing security overview for enterprise pilot clients  
**Audience:** Security review teams, CISO, IT risk officers at Fortune 500 pilot clients  
**Version:** 1.0 — 2026-04-26  
**Honesty status:** All known gaps documented. No SOC2 compliance claimed. No pen-test completion claimed.

---

> **Important:** AbarVa is an early-stage SaaS platform in enterprise pilot phase. This document is an honest self-assessment. We will update it as controls mature. We do not claim compliance with any certification standard unless we have completed the relevant audit. Enterprise clients should treat this as a transparency document, not a compliance assertion.

---

## 1. Authentication and Access Control

### 1.1 User Authentication

- **Provider:** Clerk (SOC2 Type II certified)
- **MFA:** TOTP and OTP supported for all accounts; enforced for admin roles
- **Session management:** Clerk-issued JWTs with 15-minute expiry; refresh tokens rotated on use
- **Passkeys:** Supported but not enforced in pilot phase
- **Brute force protection:** Clerk enforces rate limiting and lockout policies

### 1.2 Authorization Model

- **Role-based access control (RBAC):** Four roles — `admin`, `advisor`, `client`, `investor`
- **Tenant isolation:** Row-level security (RLS) enforced at the Postgres layer; every query is tenant-scoped
- **RLS enforcement:** All data access routes enforce `tenantId` in every query; no cross-tenant data leakage in current seed/test data
- **API routes:** All `/api/tenant/[tenantSlug]/` routes validate Clerk session and verify tenantSlug matches the authenticated user's org membership before serving data

### 1.3 Known Gaps — Authentication

| Gap | Severity | Remediation Target |
|---|---|---|
| Custom auth provider (post-Clerk migration) not yet scoped | Low — Clerk is secure | Post-pilot Phase 2 |
| No hardware security key (FIDO2) enforcement | Low | Post-pilot |
| Admin route (`/admin`) has Clerk auth but no IP allowlist | Medium | Wave 27 or earlier on client request |
| Clerk API keys stored in Vercel env — not in HSM | Medium | Post-pilot Phase 2 |

---

## 2. Data Encryption

### 2.1 Encryption in Transit

- All traffic served over HTTPS (TLS 1.2+)
- Vercel CDN enforces HTTPS; HTTP requests redirected
- Database connections from the Next.js API layer use TLS to Neon Postgres

### 2.2 Encryption at Rest

- **Database:** Neon Postgres (provider: AWS us-east-1) — AES-256 at rest; managed by Neon
- **File storage:** No raw file storage in production today; evidence attachments are metadata-only in pilot phase
- **Vercel edge:** No data written to Vercel edge; all state in Postgres

### 2.3 Known Gaps — Encryption

| Gap | Severity | Remediation Target |
|---|---|---|
| No customer-managed encryption keys (CMEK) | Medium — provider-managed keys only | Azure private data plane (Tier 3 clients) |
| File uploads not yet implemented — no encryption standard for attachments | Low — feature not live | Wave 30+ |

---

## 3. Data Residency

### 3.1 Current State

- **Primary database:** Neon Postgres, hosted in AWS **us-east-1** (N. Virginia)
- **Application layer:** Vercel (US regions by default)
- **Clerk:** Auth data in Clerk-managed US infrastructure
- **EU residency:** Not available in current SaaS tier

### 3.2 For Fortune 500 Clients Requiring EU or Private Residency

AbarVa offers an **Azure Private Data Plane** option for Tier 3 enterprise clients. In this model:

- The client's data stays entirely within their Azure subscription (any region)
- AbarVa's SaaS Control Plane receives only metadata manifests — no raw data crosses the boundary
- Full architecture: see `docs/architecture/azure/AZLAB7-private-data-plane-design.md`

**Current status:** Private data plane architecture is complete; provisioning requires a client-specific Azure subscription engagement.

### 3.3 Known Gaps — Data Residency

| Gap | Severity | Remediation Target |
|---|---|---|
| EU SaaS hosting not available | Medium for EU clients | Post-pilot based on client demand |
| Data residency attestation not independently verified | Medium | SOC2 audit (post-pilot) |

---

## 4. Audit Logging

### 4.1 What is Logged

- Clerk authentication events (login, MFA challenge, session expiry, failed attempts) — retained per Clerk's standard policy
- API route access: request logs via Vercel (7-day retention on Vercel free tier; configurable on Pro/Enterprise tier)
- Application-level events: not yet structured; ad-hoc logging in API routes

### 4.2 Known Gaps — Audit Logging

| Gap | Severity | Remediation Target |
|---|---|---|
| No structured audit log table in Postgres | High | Wave 27 (PostHog integration planned) |
| Log retention below 90 days on current Vercel tier | Medium | Upgrade to Vercel Pro for pilot clients |
| No SIEM integration | Medium | Post-SOC2 scoping |
| No immutable log store | Medium | Post-pilot Phase 2 |

---

## 5. Backup and Disaster Recovery

### 5.1 Database Backups

- **Provider:** Neon Postgres — continuous WAL-based backups; point-in-time recovery (PITR) available
- **Retention:** 7 days on current Neon tier
- **RTO (Recovery Time Objective):** Estimated 1-4 hours for full restore (not SLA-backed at current tier)
- **RPO (Recovery Point Objective):** Near-zero via Neon PITR

### 5.2 Application Backups

- Application code is in GitHub with full commit history
- Vercel deployments are immutable — prior deployment can be restored in minutes

### 5.3 Known Gaps — Backup and DR

| Gap | Severity | Remediation Target |
|---|---|---|
| No DR runbook tested end-to-end | High | Wave 27 |
| Neon PITR not formally tested | Medium | Wave 27 |
| No cross-region failover | Medium | Post-pilot Phase 2 |
| No formal RTO/RPO SLA at current tier | High | Upgrade to Neon Pro for pilot clients |

---

## 6. Vulnerability Management

### 6.1 Dependencies

- `npm audit` run on every CI build (GitHub Actions)
- Renovate or Dependabot for dependency updates: **not yet configured** — manual audit cadence

### 6.2 Penetration Testing

- **No external penetration test has been conducted.** This will be disclosed clearly to pilot clients.
- Internal code review for OWASP Top 10 conducted by the founding team
- SQL injection: mitigated via parameterized queries (Drizzle ORM); no raw SQL string concatenation
- XSS: mitigated via React's default escaping; no `dangerouslySetInnerHTML`
- CSRF: Clerk's SameSite cookie policy + JWT validation provides CSRF protection

### 6.3 Known Gaps — Vulnerability Management

| Gap | Severity | Remediation Target |
|---|---|---|
| No external penetration test | High | Pre-Series A or on pilot client request |
| No automated dependency scanning (Dependabot) | Medium | Wave 27 |
| No SAST tool in CI pipeline | Medium | Wave 27 |
| No formal vulnerability disclosure policy published | Low | Pre-Series A |

---

## 7. Azure Private Data Plane Option (Tier 3 Clients)

For enterprise clients with strict data sovereignty requirements, AbarVa offers a dedicated private data plane architecture:

- **Data stays in your Azure subscription:** Raw datasets, model outputs, and procurement records never leave the client's Azure environment
- **Boundary enforcement:** The AbarVa SaaS layer receives only structured metadata manifests — citation locators, not content
- **Identity integration:** Azure AD RBAC for data plane access; zero-standing-access model
- **Infrastructure:** Container Apps + Postgres Flexible Server + Key Vault + Log Analytics — all in the client's resource group
- **Cost:** ~$183/month for lab; scales with data volume

Full architecture and deployment playbook: `docs/architecture/azure/AZLAB7-private-data-plane-design.md`

---

## 8. Compliance Status

| Framework | Status | Notes |
|---|---|---|
| SOC2 Type II | Not certified | Target: engage auditor post-first-paid-pilot |
| ISO 27001 | Not certified | Target: post-Series A |
| GDPR | Partial — US data only; EU hosting not available | Required for EU clients |
| HIPAA | Not applicable | No healthcare data processed |
| FedRAMP | Not applicable | No US government clients in current scope |

---

## 9. Incident Response

- **Contact:** anand.sundaram@thesundaram.com (founding team) — direct response within 4 business hours during pilot
- **Process:** No formal IR runbook yet — documented as a gap
- **Notification:** Pilot clients will be notified within 24 hours of any confirmed data incident

### Known Gaps — Incident Response

| Gap | Severity | Remediation Target |
|---|---|---|
| No formal IR runbook | High | Wave 27 |
| No breach notification template | Medium | Wave 27 |
| No automated alerting on anomalous access | Medium | PostHog integration Wave 27 |

---

## 10. Summary Table — Gap Registry

| Area | Known Gaps | Highest Severity |
|---|---|---|
| Authentication | 4 gaps | Medium |
| Encryption | 2 gaps | Medium |
| Data Residency | 2 gaps | Medium |
| Audit Logging | 4 gaps | High |
| Backup / DR | 4 gaps | High |
| Vulnerability Management | 4 gaps | High |
| Incident Response | 3 gaps | High |

**Total identified gaps: 23**

No gaps are hidden. Enterprise clients considering a pilot with AbarVa should evaluate whether these gaps are acceptable for their risk tolerance. AbarVa is actively working through the remediation targets listed above.

---

_Document owner: AbarVa founding team_  
_Next review: Wave 27 or upon pilot client security review request_
