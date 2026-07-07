# Vendor Management Runbook

Status: operational draft
Backlog task: T122

## Purpose

Track every third-party vendor, subprocessor, renewal, security posture, data
access level, and operational owner before AbarVa signs or renews customer
commitments. This runbook complements `docs/legal/vendor-information-package.md`
and the public subprocessor posture.

This is an operating process. It does not create a vendor-management product
surface or automated procurement system.

## Vendor Register Fields

Every active vendor or subprocessor should have a register entry with:

| Field | Required | Notes |
| --- | --- | --- |
| Vendor name | Yes | Legal or contracting name. |
| Service owner | Yes | AbarVa owner accountable for use and renewal. |
| Business purpose | Yes | Why the tool is used. |
| Data classes | Yes | None, public, internal, client confidential, PII, PHI, payment, secrets. |
| Subprocessor status | Yes | Customer-facing subprocessor / internal-only / no customer data. |
| Contract status | Yes | Trial, active, pending DPA, pending BAA, terminated. |
| DPA / BAA status | If applicable | Required before regulated customer data use. |
| Security evidence | If applicable | SOC 2, ISO, pen test, security portal, questionnaire, or accepted exception. |
| Renewal date | Yes | Include notice deadline. |
| Cost owner | Yes | Budget owner and approval threshold. |
| Region / residency | If applicable | Record data region and customer constraints. |
| AI/model data use | If applicable | Training, retention, prompt logging, and opt-out posture. |
| Exit plan | Yes | Data return/deletion, replacement path, and offboarding owner. |

## Intake Before New Vendor Use

1. Record the vendor in the register before connecting production data.
2. Classify data classes and whether customer data, PII, PHI, payment data, or
   secrets will be exposed.
3. Check whether the vendor must appear on the subprocessor list.
4. Review contract terms for data use, model training, retention, incident
   notice, audit rights, subprocessors, and termination deletion.
5. Collect security evidence or record an approved exception.
6. Confirm DPA or BAA need before any regulated customer data is processed.
7. Assign renewal owner, budget owner, and offboarding owner.

## Renewal Review

Run renewal review at least 45 days before notice deadline.

- Confirm the vendor is still needed.
- Re-check data classes and subprocessor status.
- Confirm security evidence is current.
- Review incidents, outages, support issues, and cost changes.
- Confirm renewal price and approval threshold.
- Decide renew, renegotiate, replace, or terminate.
- Update the register and retain renewal evidence.

## Termination / Offboarding

1. Disable new data flows.
2. Export records needed for continuity.
3. Request data deletion or account closure when required.
4. Capture deletion confirmation or retained-exception explanation.
5. Remove access tokens, API keys, webhooks, and SSO app assignments.
6. Update subprocessor disclosures if customer-facing.
7. Record final disposition in the vendor register.

## Minimum Review Cadence

| Vendor risk tier | Review cadence |
| --- | --- |
| Customer data, PII, PHI, payment, or secrets | Quarterly |
| Internal operational data only | Semiannual |
| Public/no data | Annual |
| Critical production dependency | Quarterly even if no sensitive data |

## Completion Boundary

T122 can be marked Done when this runbook merges and the first live vendor
register location is identified. Automated vendor workflows, renewal reminders,
and public subprocessor automation are separate implementation tasks.
