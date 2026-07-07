# Spend Approval Controls

## Purpose

This runbook defines lightweight financial controls for vendor spend,
professional services, usage-based AI costs, cloud infrastructure, security
tools, and customer-specific pilot expenses.

The goal is to keep founder speed while preventing surprise commitments,
unbounded consumption, and unreviewed vendor obligations.

## Approval Thresholds

| Spend level | Approval required | Evidence required |
| --- | --- | --- |
| Under $500 | Auto-approve by accountable operator | Purpose, vendor, amount, owner |
| $500 to $5,000 | Founder approval | Purpose, vendor, amount, budget impact, renewal/cancellation terms |
| Over $5,000 | Formal founder approval with board/advisor awareness where applicable | Business case, alternatives, term, cancellation path, security/privacy review if relevant |
| Any customer-data vendor | Founder approval regardless of amount | Data classes, security posture, DPA/SOC2/security evidence, client impact |
| Any usage-based AI/cloud commitment | Founder approval when no hard cap exists | Cap, alert threshold, shutoff owner, overage policy |

These thresholds cover one-time and recurring spend. For recurring spend, use
the annualized value for thresholding.

## Required Spend Record

Every approved spend item must capture:

- Vendor.
- Spend category.
- Amount and billing cadence.
- Annualized cost.
- Owner.
- Approval level.
- Approval evidence link.
- Renewal date.
- Cancellation terms.
- Data handled, if any.
- Security review required: yes/no.
- Budget owner.
- Client chargeback or pilot allocation, if applicable.

The vendor-management runbook is the system of record for renewals.

## Categories

| Category | Examples | Special rule |
| --- | --- | --- |
| Cloud/application | Vercel, Azure, Postgres, queues, observability | Must have alert or owner for usage-based costs |
| AI/model providers | Anthropic, OpenAI, embedding/reranking providers | Must map to token/consumption cap policy |
| Security/compliance | Vanta, pentest, scanning, audit tooling | Preserve report/evidence location |
| Sales/marketing | Domains, collateral, demo tooling | Must identify deal or channel purpose |
| Professional services | Counsel, accountant, design, contractors | Must define deliverable and approval owner |
| Customer-specific | Pilot data conversion, bespoke integration, travel | Must map to SOW or founder-approved pilot budget |

## Approval Workflow

1. Requester records vendor, amount, purpose, and urgency.
2. Requester checks whether it handles customer, employee, regulated, or
   confidential data.
3. Owner identifies approval threshold using annualized spend.
4. Approver records decision and evidence link.
5. Vendor register is updated with renewal/cancellation terms.
6. For usage-based services, cap and alert owner are recorded before use.
7. For customer-data vendors, security/privacy review is complete before
   production client data is sent.

## Usage-Based Cost Controls

For AI, parsing, storage, queue, or observability costs:

- Define monthly cap.
- Define alert threshold at 50%, 75%, and 90% when the platform supports it.
- Define shutoff or throttle behavior.
- Define owner who receives alerts.
- Define customer-facing overage policy when usage is customer-driven.
- Reconcile weekly for the active pilot.

## Exceptions

Emergency spend can be approved verbally only when it prevents a live security,
availability, or customer-impacting incident from getting worse. The approver
must write the spend record within one business day.

## Related Runbooks

- `docs/runbooks/vendor-management.md`
- `docs/runbooks/token-consumption-overage-policy.md`
- `docs/runbooks/incident-response.md`
- `docs/runbooks/release-environments-and-promotion.md`
