# Upload Instructions And Sensitivity Guide

Synthetic demo evidence. No real client confidential data.

## Purpose

This file travels with the Kyriba proof pack so a buyer can see what kinds of inputs are useful and what should be masked before upload.

## What A Real Client Can Safely Provide

| Data type | Useful fields | Mask or exclude |
|---|---|---|
| Treasury volumetrics | entity count, bank count, account count, monthly payment counts, exception rates, reconciliation hours | account numbers, routing numbers, beneficiary names, raw transactions |
| Bank connectivity | bank name, format type, frequency, onboarding wave, testing complexity | portal screenshots, credentials, certificates, private keys |
| ERP and feed landscape | application name, owner role, feed type, frequency, criticality, data-quality issue | endpoint URLs, API tokens, payloads with PII |
| CMDB/application portfolio | app ID, app name, tier, category, owner role, lifecycle state | hostnames, IPs, vulnerability detail, privileged paths |
| Architecture/security context | logical diagrams, control requirements, identity model, egress pattern | real firewall rules, IP ranges, secrets, unresolved security findings unless approved |
| Run-cost/rate-card data | cost bucket, annual volume, blended rate, role, effort assumption | invoice-level vendor detail or restricted contract rates unless approved |
| Vendor contracts | vendor name, renewal date, scope category, high-level terms | full agreements, negotiated discounts, confidential clauses |

## How This Synthetic Data Was Generated

AbarVa generated realistic but fictional planning evidence for a Lakeshore/Kyriba rollout. The data is intentionally shaped like files a Treasurer, CIO ERP owner, Enterprise Architect, PMO, Procurement lead, Security lead, or FP&A partner could provide. Sensitive fields are masked, aggregated, or omitted.

## Masked Versus Scrambled

Masked values preserve the useful shape while hiding the sensitive value. Example: `acct-****-0042`, `route-*****-1210`, or `api://bank-gateway/***/balances`. Use masking when AbarVa needs to understand count, type, pattern, or integration complexity.

Scrambled values are random replacements that do not preserve the original structure. Use scrambling when the original shape is not needed for analysis or when policy requires stronger de-identification.

For this proof, AbarVa uses masked or synthetic references so the downstream RFP, scoring, cost, and risk logic can still react to evidence without exposing real secrets.

## What AbarVa Should Prove With It

The proof is not that an AI can write a generic RFP. The proof is that changed evidence changes the work product:

`evidence -> activated decision pattern -> RFP/scoring/cost/risk/recommendation change`

Example: high bank/account/entity complexity should increase integration and testing weight, add bank connectivity questions to the RFP, increase cutover and hypercare cost, and surface onboarding/reconciliation risks.

## Human Approval

Client-provided evidence should be reviewed by a named human before it becomes active enterprise context. Generated artifacts remain drafts until approved by the client.
