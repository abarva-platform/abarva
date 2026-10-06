# Synthetic ServiceNow sourcing-request export

This public-safe fixture represents a native-shaped `sc_req_item` export for sourcing-help requests. It is synthetic planning data: no row represents a real requester, supplier, contract, ticket, or commercial commitment.

## Grain and identity

One row is one ServiceNow requested item version. The stable upstream identity is `source_table + sys_id`; `extract_version` identifies the immutable extract snapshot. Re-importing the same identity and version must be idempotent. A later version is an auditable revision, not a silent overwrite.

## Coverage

The file contains ten detailed requests covering all ten Source archetypes currently routed from classifier categories:

1. Application Managed Services
2. ERP / SI Implementation
3. AI / Data Platform
4. AI Engineering Partner
5. Contract Renewal
6. Cloud FinOps
7. Contact Center / CX
8. BPO Shared Services
9. MSSP / Cyber
10. Staff Augmentation

The originating domains are Plan, Delivery, Enterprise, and IT. Domain and function are context; neither is treated as sufficient evidence for archetype assignment.

## Decision-grade depth fields

The export remains source-native. These fields represent additional variables on the synthetic ServiceNow catalog item; they are not an AbarVa workbook schema.

| Field | Source owner | Meaning and validation |
| --- | --- | --- |
| `estimated_annual_value` | Requester and finance partner | Requester-stated point estimate. It must sit inside the recorded low/high range and is never treated as validated savings. |
| `estimated_value_low` / `estimated_value_high` | Requester and finance partner | Planning bounds for the commercial envelope. Both must be present together and `low <= point <= high`. |
| `value_time_basis` | Requester and finance partner | Declares whether the range is an annual run rate, subscription/consumption envelope, implementation program, or delivery program. |
| `incumbent_context` | Requester and procurement | Explains the incumbent/contract position, including an explicit net-new statement when no incumbent is recorded. Supplier and contract strings remain unresolved references. |
| `service_volume_summary` | Business or service owner | Semicolon-delimited operating volumes that shape scope and pricing. Every fixture carries at least three quantified measures. |
| `source_system_references` | Evidence owners | Pipe-delimited native systems or governed reports from which the request facts can be checked. |
| `evidence_references` | Evidence owners | Pipe-delimited `attachment_id:evidence_type:source_basis` references. `source_basis` is `source_extract`, `source_report`, or `planning_document`; it does not imply parsing, review, or approval. |

The dry-run contract checks each request against an explicit expected route: originating domain, organization, business function, category, buying motion, and archetype. Set-level coverage alone is insufficient because two misrouted rows could otherwise cancel each other out.

## Important field semantics

- `estimated_annual_value` is requester-stated planning input, not a validated spend or savings fact.
- Value bounds and time basis describe the requester's planning envelope; they do not make the point estimate authoritative.
- `incumbent_supplier_name` is source text, not a resolved legal-entity identity.
- `existing_contract_reference` is a reference, not proof that the contract exists in the canonical register.
- `service_volume_summary` is source-request context. The named source systems and evidence references must be obtained and governed before the volumes become canonical facts.
- `attachment_references` contains synthetic identifiers only; it does not imply that evidence was parsed, reviewed, or approved.
- `regulated_data_flags` drive review needs; they contain no regulated data.
- `decision_owner` and `baseline_owner` are role labels, not real people.
- No row authorizes supplier contact, selection, NDA execution, award, or external communication.
