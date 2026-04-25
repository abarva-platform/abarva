# Evidence Ledger And Governance

## Purpose

The evidence ledger tracks claim-to-source so AbarVa can explain what a response, score, or recommendation is based on.

## Evidence Ledger Records

Ledger records should include:

- Claim or derived fact.
- Source object.
- Source type.
- Work object.
- Extraction method.
- Confidence.
- Freshness.
- Access status.
- Agent or tool that used it.
- Audit timestamp.

## Governance

Governance covers permissions, audit trails, approval state, data retention, source provenance, and sensitive-data controls.

## Agent Behavior

Agents should cite available evidence, disclose missing evidence, and avoid unsupported certainty. If confidence is low, stale, restricted, or waived, the response must label that state.

For Source specifically, agents can cite only data marked as Usable Evidence. Loaded data, available data, uploaded files, connected systems, or parsed-but-unvalidated records are not enough for citation.

Low-confidence, stale, restricted, waived, or uncited evidence must be surfaced to Nexus, Sentinel, Atlas, and Steward. Nexus should adjust the artifact tier and next action. Sentinel should flag evidence risk. Atlas should summarize executive impact. Steward should route the Admin/Setup action.

## Product Impact

Programs, Source, Intelligence, Control Tower, and Admin/Setup all consume evidence state. Evidence readiness should affect what pages show, what actions are available, and what agents are allowed to say.

## MVP / V1 / V2

MVP: source labels and explicit missing evidence. V1: claim-to-source records and audit links. V2: automated provenance scoring and governance policy enforcement.
