# Data governance ownership and decision rights

**SYNTHETIC - NOT CLIENT-ATTESTED.** This fictional test input contains no
enterprise policy, real role-holder, or approved governance decision.

## Working model for the scenario

The data product is a ten-report HR analytics foundation. The product team
cannot declare HR definitions authoritative by itself. A synthetic Data Product
Council is proposed as the forum to resolve cross-domain definition conflicts.
The HR data owner is accountable for permitted HR use; source-system owners
control source access; analytics engineering owns technical implementation;
Finance validates any financial baseline before it is used in a business case.

| Decision | Proposed accountable role | Evidence still needed |
|---|---|---|
| Approve each report's business definition | HR analytics product owner | Named role-holder and signed definition register |
| Grant source access | HR source data owner and security | Entitlement record, purpose limitation, expiry |
| Certify shared measures | Data Product Council | Ratified metric dictionary and change log |
| Accept data-quality exceptions | Domain steward | Thresholds, exception owner, escalation SLA |
| Approve production release | Authorized workspace user under product workflow | Release checklist and recorded decision |
| Validate cost/value assumptions | Finance partner | Source-backed baseline and named measurement owner |

## Proposed controls

1. Every report has a named business owner, purpose, definition, refresh
   cadence, and consumer group before implementation is estimated.
2. Metric definitions are versioned; an amendment records author, reviewer,
   effective date, and affected reports.
3. A source access request is approved before any source sample is copied to a
   lower environment.
4. Exceptions are never silently converted to green status: they have an owner,
   due date, impact statement, and explicit acceptance decision.
5. A scope change that adds a report, source, population, or control returns to
   estimation before build authorization.

## Open questions for the real discovery

- Which role can ratify HR definitions and resolve disputes with Finance?
- Is there an existing data council with authority, or must one be convened?
- Who owns report access after handoff, and who removes access when roles change?
- What is the required audit retention period and who monitors it?

No item in this document is an approved client decision. The reviewer must
correct role assignments and record the evidence basis in the product.
