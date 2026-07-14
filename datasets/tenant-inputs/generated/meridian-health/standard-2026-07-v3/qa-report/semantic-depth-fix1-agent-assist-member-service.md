# Meridian Health - Agent Assist / Member Service Semantic Proof

## Pain Points

- Agents search Salesforce cases, benefits notes, prior-auth status, and claims inquiry screens separately while the member waits on the call.
- Call transcript intent labels are inconsistent across billing, eligibility, claims status, and prior authorization categories.
- Genesys call metadata and Salesforce case outcomes are not reliably joined to claims and benefits context.
- Knowledge articles are duplicated across operations playbooks and CRM snippets, creating conflicting guidance for appeal and denial inquiries.
- Supervisors cannot prove whether AI suggestions reduce handle time without a baseline for after-call work, transfer rate, and first-contact resolution.

## Evidence Items

- Genesys call sample with queue, intent, handle time, transfer flag, and after-call-work fields.
- Salesforce Health Cloud case extract with member inquiry categories and resolution dispositions.
- Call transcript annotation sample for billing, eligibility, claims status, and prior authorization intents.
- Knowledge article export with duplicate and stale article flags.
- Member service KPI baseline for AHT, FCR, transfer rate, complaint escalation, and quality score.

## Metrics

- Average handle time by intent
- First contact resolution for claims-status calls
- After-call work minutes per agent shift

## Data Quality / Performance Issues

- intent taxonomy drift
- CRM-to-claims join gaps
- stale knowledge article duplicates

## Modernization Dependencies

- audited Claude agent-assist answer packet
- Genesys-Salesforce-claims context join
- human-approved next-best-action workflow

## Gate

PASS
