# External Pen Test Readiness Packet

Status: vendor-readiness packet
Owner: AbarVa security / founder
Release lane: internal-admin
Backlog: T031
Last updated: 2026-06-03

## Purpose

This packet prepares AbarVa to schedule and run an external penetration test
without improvising scope, access, evidence, or remediation ownership. It does
not claim that a penetration test has been completed. T031 remains `In progress`
until a qualified external vendor completes testing, delivers a
report, and AbarVa records remediation or risk acceptance evidence.

## Vendor Scope

Default vendor target:

- External application testing against preview or approved pilot-production
  URLs.
- Authenticated application testing with role-scoped test users.
- API and route authorization review.
- Tenant isolation testing for approved synthetic or pilot-safe data only.
- Upload, export, and document-processing abuse cases.
- Clerk SSO and RBAC flow review when a test organization is available.
- Azure private data-plane configuration review by evidence packet, not by
  unrestricted subscription access.

Out of scope unless explicitly approved:

- Denial-of-service, load exhaustion, or destructive tests.
- Social engineering, phishing, or physical security.
- Production data exfiltration attempts.
- No cross-client testing or any attempt to access another client's data plane.
- Persistence, malware deployment, crypto mining, or backdoor installation.

## Candidate Vendors

| Vendor | Fit | Procurement note |
| --- | --- | --- |
| Cobalt | Marketplace-style application pen test | Faster scheduling for standard web/API scope. |
| Bishop Fox | Enterprise-grade application and cloud security testing | Strong fit for F500 security review expectations. |
| NCC Group | Broad application and cloud assessment coverage | Useful if procurement wants a large global firm. |

The selected vendor must provide a named project lead, test window, rules of
engagement, report format, severity taxonomy, retest policy, and evidence
handling policy before testing starts.

## Access Package

Provide only time-boxed, least-privilege access:

| Access item | Requirement |
| --- | --- |
| Test users | Dedicated accounts with role labels: viewer, operator, admin, and customer admin where applicable. |
| Clerk organization | Test org only; no standing access to real customer organizations. |
| Data set | Synthetic or pilot-approved data with no unapproved PHI, PII, secrets, or customer confidential files. |
| Environment | Preview or explicit pilot-production test window. |
| Secrets | No raw secrets in email, GitHub, Slack, docs, screenshots, or reports. Use approved secret-sharing channel only. |
| Azure evidence | Exported configuration evidence, screenshots, or read-only review session. No broad owner access by default. |

## Test Cases To Require

| Area | Minimum coverage |
| --- | --- |
| Authentication | Clerk session handling, sign-in redirects, token replay, expired session handling, role downgrade. |
| Authorization | Admin-only route protection, customer-admin boundaries, object-level checks, API method behavior. |
| Tenant isolation | Client-id scoping, route anti-enumeration, source artifacts, generated exports, parse cache, audit evidence. |
| Upload pipeline | Malware gating, PHI/PII quarantine, filename metadata, content-type confusion, parser fallback controls. |
| AI/agent surfaces | Prompt injection, tool no-auto-action boundary, grounded-response constraints, evidence citation behavior. |
| Data export | Artifact authorization, signed/download routes, report generation, board-pack and workbook output controls. |
| Cloud posture | Azure private endpoints, storage public access, Key Vault RBAC, diagnostic logging, immutable audit posture. |
| Secrets | GitHub, Vercel, environment variable exposure, client bundle leakage, logs, generated artifacts. |
| Dependency posture | High/critical dependency risk, known vulnerable package exploitability, supply-chain controls. |

## Evidence Folder

Before the vendor starts, create a dated folder under a private evidence store
outside the public repo:

```text
pen-test/
  YYYY-MM-DD-vendor-name/
    00-rules-of-engagement.pdf
    01-scope-and-access.md
    02-test-user-register.csv
    03-environment-manifest.md
    04-azure-evidence/
    05-daily-status/
    06-final-report/
    07-remediation-plan.md
    08-retest-evidence/
```

Do not commit vendor reports, exploit details, credentials, or sensitive
screenshots to the public repository.

## Severity And SLA

| Severity | Default SLA | Release posture |
| --- | --- | --- |
| Critical | Hotfix immediately; target 24-48 hours | Block production expansion until fixed or accepted by Anand. |
| High | Target 7 calendar days | Block new pilot go-live unless explicitly accepted. |
| Medium | Target next planned release | Track with owner and retest evidence. |
| Low | Backlog with rationale | No production block unless pattern repeats. |
| Informational | Document or monitor | No production block. |

## Buyer-Safe Statement

Use this wording until the external test is actually complete:

> AbarVa has a defined external penetration test readiness package covering
> web/API testing, authenticated role testing, tenant-isolation checks,
> upload-processing abuse cases, AI guardrails, and Azure private data-plane
> evidence review. The first external test is planned and will not be represented
> as complete until the independent report, remediation record, and retest
> evidence are available.

## Done Criteria For T031

T031 can move to `Done` only when all evidence exists:

- Vendor contract or statement of work executed.
- Rules of engagement signed.
- Test window completed.
- Final report received from the vendor.
- Critical and high findings remediated or formally risk-accepted.
- Retest evidence captured for remediated critical/high findings.
- Customer-safe summary prepared for procurement/security review.
- Tracker updated with report date, vendor, and remediation state.
