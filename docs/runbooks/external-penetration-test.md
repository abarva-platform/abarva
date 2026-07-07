# External Penetration Test Runbook

This runbook covers T031: scheduling, executing, and closing an external
penetration test for AbarVa.

## Pre-Booking Checklist

- Confirm target environment: preview, pilot-production, or limited production
  window.
- Confirm no cross-client testing and no access to unrelated client data planes.
- Select vendor and receive project lead, dates, report format, retest policy,
  and evidence handling policy.
- Create dedicated test users and record account purpose, role, expiration, and
  owner.
- Prepare synthetic or customer-approved data only.
- Prepare current architecture/security evidence packet.
- Confirm emergency contact during the test window.
- Confirm stop-test authority and escalation path.

## Rules Of Engagement

The rules of engagement must state:

- Authorized URLs, APIs, tenants, and test accounts.
- Exact test window and time zone.
- Prohibited tests: destructive tests, denial-of-service, social engineering,
  malware, persistence, cross-client access, and production data exfiltration.
- Evidence handling requirements and retention expectations.
- Real-time notification path for critical findings.
- Retest process and timeline.

## During The Test

1. Enable vendor access only at the approved start time.
2. Monitor auth, API, upload, audit, and cloud logs.
3. Record daily status notes in the private evidence folder.
4. Triage critical findings immediately.
5. Disable vendor accounts at the approved end time or when testing stops.

## Finding Triage

For every finding, record:

- Vendor severity and AbarVa-assigned severity.
- Affected route, API, service, or control.
- Client impact: all clients, a specific client, internal only, or none.
- Evidence reference in the private evidence store.
- Fix owner.
- Target remediation date.
- Release lane and release record link when code changes are required.
- Retest outcome or risk acceptance.

## Closure Checklist

- Vendor final report stored in the private evidence store.
- Critical/high findings fixed or explicitly risk-accepted.
- Retest evidence stored for fixed critical/high findings.
- Customer-safe summary produced without exploit details.
- Tracker updated truthfully.
- Follow-up backlog items created for medium/low findings.
- Test users disabled or deleted.

## Validation

Repository readiness can be checked with:

```bash
npm run security:pen-test-readiness:verify
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

The verifier only proves the repository has the readiness packet and runbook. It
does not prove that a vendor penetration test has been completed.
