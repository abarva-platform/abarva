# Data governance ownership and decision rights

**SYNTHETIC - NOT CLIENT-ATTESTED.** This fictional test input contains no real
health-system policy, no real role-holder, and no approved governance decision.

## Working model for the scenario

The data product is a governed data foundation for a synthetic integrated
delivery network (IDN) that must support reusable AI and analytics across
clinical, member/payer, and operational domains. No single domain team can
declare an enterprise definition authoritative by itself. A synthetic Enterprise
Data Governance Council is proposed as the forum that ratifies cross-domain
definitions and resolves conflicts between clinical, revenue-cycle, and
population-health views of the same patient, member, or provider.

| Decision | Proposed accountable role | Evidence still needed |
|---|---|---|
| Approve a certified clinical/quality measure definition | Clinical analytics product owner | Named role-holder and a signed measure definition register |
| Grant access to a PHI source | Health Information Management (HIM) owner and security | Entitlement record, minimum-necessary purpose, expiry |
| Certify shared member/provider measures | Enterprise Data Governance Council | Ratified measure dictionary and change log |
| Accept a data-quality exception on PHI | Domain data steward | Thresholds, exception owner, escalation SLA |
| Approve production release of a governed dataset | Authorized workspace user under product workflow | Release checklist and recorded decision |
| Validate cost/value assumptions | Finance partner | Source-backed baseline and named measurement owner |

## Proposed controls

1. Every certified dataset has a named clinical or business owner, a stated
   purpose, a definition, a refresh cadence, and an approved consumer group
   before implementation is estimated.
2. Measure definitions are versioned; an amendment records author, reviewer,
   effective date, and the reports or models it affects.
3. A source-access request to any PHI system is approved before any sample is
   copied to a lower environment, under minimum necessary.
4. Exceptions are never silently converted to green status: they carry an owner,
   due date, impact statement, and an explicit acceptance decision.
5. A scope change that adds a source, a population, a protected data category
   (for example behavioral health under 42 CFR Part 2), or a control returns to
   estimation before build authorization.

## Still required before this is a client fact

The real council membership, the named accountable role-holders, the signed
decision-rights matrix, and the escalation SLA are not established here and must
be confirmed with the client before any production sizing.
