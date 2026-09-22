# Synthetic candidate-supplier registry

This package is public-safe synthetic planning data for dry-run validation of Source New supplier suggestion filters. It does not represent real clients, real suppliers, real contracts, real people, email addresses, supplier contact permission, or a production data-plane load.

## Grain and authority

One row is one candidate supplier registry observation. `record_id` is the stable synthetic row identity. `supplier_legal_name` is deliberately prefixed with `Fictional` so the package cannot be mistaken for a real supplier master.

`expected_decision` is the validator expectation:

- `eligible` means the row is structurally eligible for suggestion-filter testing only.
- `fail_closed` means the row is a negative control that must not pass the dry-run filter.

Candidate eligibility is not award status, sourcing-event selection, NDA readiness, or permission to contact a supplier.

## Coverage

The package contains two eligible synthetic legal entities for each Source archetype currently routed from a classifier category:

1. `AMS_MANAGED_SERVICES`
2. `ERP_SI_IMPLEMENTATION`
3. `AI_DATA_PLATFORM`
4. `AI_ENGINEERING_PARTNER`
5. `CONTRACT_RENEWAL`
6. `CLOUD_FINOPS`
7. `CONTACT_CENTER_CX`
8. `BPO_SHARED_SERVICES`
9. `MSSP_CYBER`
10. `STAFF_AUGMENTATION`

Coverage is proved by `scripts/source/validate-candidate-supplier-registry-package.ts`, which reads the live category-to-archetype route registry instead of a hand-typed denominator. Some registered archetypes may remain available for direct registry lookup before a classifier category routes to them.

## Field semantics

- `category_id`, `business_function`, and `eligible_archetype_id` are explicit eligibility signals. Category must map to the declared archetype through the code registry.
- `source_system`, `source_file`, `source_row`, `source_record_id`, and `lineage_state` are required lineage fields. Missing lineage fails closed.
- `authority_state` records whether the candidate row has been reviewed for fixture eligibility. `draft_review` fails closed.
- `contact_policy` is the policy posture for fixture testing. It is not permission for Codex, Source, or an operator to contact anyone.
- `contact_authority_state` must be explicit. `missing` fails closed.
- `existing_contract_status` distinguishes candidate eligibility from current-contract status:
  - `no_existing_contract` means no contract reference is asserted.
  - `incumbent_reference_only` means synthetic intake text named an incumbent-style reference but no canonical contract is asserted by this package.
  - `registered_contract_counterparty` means the row exercises the shape of an existing counterparty reference for filters. It is still synthetic and does not assert a real contract.
  - `not_applicable_negative_control` is reserved for fail-closed rows.

## Negative controls

The five negative controls prove the dry-run validator refuses:

- missing lineage
- draft authority
- duplicate supplier identity
- category/archetype mismatch
- missing contact authority

## Prohibitions

This package does not authorize Azure load, tenant write, Source event mutation, candidate persistence, NDA execution, award action, supplier outreach, or production retrieval. A later load path would require a separate governed data-plane approval and signed-in proof.
