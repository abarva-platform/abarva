# Synthetic ServiceNow sourcing-request export

This public-safe fixture represents a native-shaped `sc_req_item` export for sourcing-help requests. It is synthetic planning data: no row represents a real requester, supplier, contract, ticket, or commercial commitment.

## Grain and identity

One row is one ServiceNow requested item version. The stable upstream identity is `source_table + sys_id`; `extract_version` identifies the immutable extract snapshot. Re-importing the same identity and version must be idempotent. A later version is an auditable revision, not a silent overwrite.

## Coverage

The file contains ten detailed requests covering all ten Source archetypes currently registered in code:

1. Application Managed Services
2. ERP / SI Implementation
3. AI / Data Platform
4. Digital Product Engineering
5. Contract Renewal
6. Cloud FinOps
7. Contact Center / CX
8. BPO Shared Services
9. MSSP / Cyber
10. Staff Augmentation

The originating domains are Plan, Delivery, Enterprise, and IT. Domain and function are context; neither is treated as sufficient evidence for archetype assignment.

## Important field semantics

- `estimated_annual_value` is requester-stated planning input, not a validated spend or savings fact.
- `incumbent_supplier_name` is source text, not a resolved legal-entity identity.
- `existing_contract_reference` is a reference, not proof that the contract exists in the canonical register.
- `attachment_references` contains synthetic identifiers only; it does not imply that evidence was parsed, reviewed, or approved.
- `regulated_data_flags` drive review needs; they contain no regulated data.
- `decision_owner` and `baseline_owner` are role labels, not real people.
- No row authorizes supplier contact, selection, NDA execution, award, or external communication.

