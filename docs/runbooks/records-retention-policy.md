# Records Retention Policy

Status: operational draft
Backlog task: T120

## Purpose

Define default retention expectations for AbarVa business, security, release,
audit, and customer-facing records. Product-specific private data-plane
retention is governed by
`docs/security/PILOT_PRIVATE_DATA_PLANE_SECURITY_RETENTION_POLICY_2026-06-01.md`.
Client return and deletion execution is governed by
`docs/runbooks/data-return-deletion.md`.

This policy is not legal advice. Contract terms, legal holds, incident holds,
tax requirements, and customer-specific data-processing agreements override the
defaults below when stricter.

## Retention Schedule

| Record class | Default retention | Owner | Notes |
| --- | ---: | --- | --- |
| Release records | 7 years | Engineering / founder | Keep release classification, QA, rollout, rollback, and audit evidence. |
| Architecture decisions and governance docs | Life of product + 7 years | Engineering / founder | Keep ADRs, governance indexes, runbooks, and policy changes. |
| Security audit evidence | 7 years | Security / founder | Includes access reviews, control evidence, scans, incidents, and exception approvals. |
| Customer contracts and order forms | Contract term + 7 years | Founder / legal | Includes MSA, SOW, DPA, BAA, order forms, and amendments. |
| Customer diligence responses | Contract term + 3 years | Founder / legal | Includes security questionnaires, architecture decks, and procurement packets. |
| Billing, tax, and financial records | 7 years | Finance / founder | Includes invoices, receipts, tax records, and payment evidence. |
| Vendor contracts and subprocessors | Contract term + 7 years | Founder / vendor owner | Includes DPAs, security reviews, renewals, and termination proof. |
| Support and incident tickets | 7 years for security incidents; 3 years otherwise | Support / security | Security incidents follow incident-response retention. |
| Client data return/deletion manifests | 7 years | Security / data lead | Retain proof even when underlying client data is deleted. |
| Private data-plane raw uploads | See private data-plane retention policy | Data lead | Defaults differ by artifact class and customer agreement. |
| Backups | Per backup policy and provider configuration | Engineering | Do not promise immediate backup erasure unless technically evidenced. |
| Marketing/site analytics | 13 months unless contract or law requires less | Founder / marketing | Prefer aggregated or de-identified retention. |

## Legal Hold And Incident Hold

If litigation, security incident, regulatory inquiry, or customer dispute is
reasonably expected, pause deletion for records in scope. Record:

- hold reason,
- approving owner,
- affected record classes,
- start date,
- review cadence,
- release date.

Do not release a hold without founder/legal approval.

## Deletion And Disposal

1. Verify record class, owner, customer scope, and retention period.
2. Check legal hold, incident hold, contract exception, and audit requirement.
3. Prefer provider-native lifecycle policies for expired storage objects where
   available.
4. For database rows, use reviewed scripts or migrations with scoped predicates.
5. Capture deletion manifest or provider evidence.
6. Retain deletion proof according to this policy.

## Exceptions

Every exception must record:

- record class,
- requested retention change,
- reason,
- approving owner,
- start and review dates,
- customer or contract reference when applicable.

## Annual Review

Review this policy at least annually and whenever AbarVa signs a customer with
stricter contractual, regulatory, or regional requirements.

## Completion Boundary

T120 can be marked Done when this policy merges. Runtime retention enforcement,
Azure lifecycle rules, and automated deletion workflows are separate
implementation tasks.
