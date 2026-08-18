# Service Level Schedule — Enterprise Technology Platform Services Master Agreement

> **SYNTHETIC DEMO DOCUMENT — NOT A REAL AGREEMENT — NOT LEGAL ADVICE**
> Generated from structured contract facts for product demonstration. Supplier legal entities are
> invented. No term here reflects any actual company, negotiation, or executed contract.

| | |
| --- | --- |
| Document ID | `CTR-SA-006-SLA` |
| Contract ID | `CTR-SA-006` |
| Supplier | Synthetic Enterprise Technology Platform Services Supplier 006 LLC ("Supplier 006") |
| Customer | Integrated Healthcare Demonstration System Inc. ("Integrated Healthcare Demo") |
| Effective Date | 2023-01-01 |
| Governing Law | State of Illinois |
| Incorporates | `CTR-SA-006-MSA` |

This Service Level Schedule is incorporated into the Master Services Agreement `CTR-SA-006-MSA` at Section 3.1 of the Agreement.

## 1. Scope

1.1 This Schedule applies to the covered services ordered under `CTR-SA-006-ORDER`, in the production environment only.
1.2 Non-production environments are provided on a commercially reasonable basis and carry no service level.

## 2. Availability

2.1 Supplier 006 shall maintain monthly availability of at least **99.50%**.
2.2 "**Downtime**" means any full minute during which the covered service is unavailable to all authorised users, as measured by the supplier's monitoring at one-minute intervals from at least two independent external probes. Partial degradation that does not prevent use is not Downtime.
2.3 Availability is calculated as (total minutes in the month less Downtime minutes, excluding minutes excused under Section 5) divided by total minutes in the month, expressed as a percentage to two decimal places.
2.4 Scheduled maintenance notified at least five (5) business days in advance, up to eight (8) hours per month, is excluded from the calculation.

## 3. Severity Levels and Targets

Response is the time to acknowledge and assign the incident. Restore is the time to return the service to use, whether by fix or by workaround. The two are measured separately.

| Severity | Description | Response Target | Restore Target | Service Credit |
| --- | --- | --- | --- | ---: |
| **Sev 1** | Production outage affecting all authorised users | 15 minutes | 4 hours | 25% |
| **Sev 2** | Material degradation affecting a major workflow | 1 hour | 1 business day | 10% |
| **Sev 3** | Non-critical defect or service request | 1 business day | 5 business days | 0% |

## 4. Service Credits

4.1 Credits are calculated against the monthly proportion of the annual fee for the affected service, by availability band:

| Monthly availability achieved | Credit |
| --- | ---: |
| At or above 99.50% | 0% |
| Below 99.50% but at or above 99.00% | 5% |
| Below 99.00% but at or above 98.00% | 10% |
| Below 98.00% | 25% |

4.2 Aggregate credits in any contract year shall not exceed **20%** of annual fees.
4.3 To claim a credit the customer shall submit a written request within **thirty (30) days** of the end of the month in which the failure occurred, identifying the incident and the availability calculation relied on. Credits are applied against the next invoice.
4.4 Supplier 006 shall respond to a credit claim within fifteen (15) business days. An unanswered claim is deemed accepted.
4.5 Credits are the sole financial remedy for missed service levels, without prejudice to termination rights for material breach.

## 5. Exclusions

5.1 Service levels do not apply to failures caused by: customer environments, equipment or connectivity; third-party networks outside the supplier's control; scheduled maintenance under Section 2.4; customer misuse or unauthorised modification; or force majeure under Section 16.2 of the Agreement.
5.2 The supplier bears the burden of demonstrating that an exclusion applies.

## 6. Escalation

| Elapsed time without restoration | Escalates to |
| --- | --- |
| 1 hour (Sev 1) | Supplier duty manager and customer service owner |
| 4 hours (Sev 1) | Supplier director of operations |
| 8 hours (Sev 1) | Supplier executive sponsor and VP Infrastructure & Cloud |

6.1 The customer may invoke escalation at any time by written notice to the supplier service manager.
6.2 Escalation does not suspend the restoration obligation or the accrual of credits.

## 7. Reporting and Review

7.1 Supplier 006 shall provide a monthly service report within ten (10) business days of month end.
7.2 Reports shall state availability achieved, the calculation under Section 2.3, incidents by severity, and credits due.
7.3 The parties shall review service level performance quarterly.

## 8. Chronic Failure

8.1 Failure to meet the availability target in any three (3) consecutive months, or in any four (4) months in a rolling twelve (12) month period, is a material breach entitling Integrated Healthcare Demo to terminate the affected service without penalty on thirty (30) days written notice.

