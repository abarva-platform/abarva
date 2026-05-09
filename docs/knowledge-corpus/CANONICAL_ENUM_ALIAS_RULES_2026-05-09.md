# Canonical Enum Alias Rules

Date: 2026-05-09

Status: Wave 1 normalization rules. No source data rewrite.

Runtime implementation:

- `src/lib/intelligence/canonical/normalizers.ts`
- `src/lib/intelligence/canonical/normalizers.test.ts`

## Principle

Normalization is runtime-safe and non-destructive. The normalizers return structured results with:

- `raw`: source values observed
- `values`: canonical values when resolved
- `unresolved`: source values that did not map cleanly

Wave 1 does not rewrite source data, DB rows, manifest entries, or seed files.

## Industry Aliases

| Source value | Canonical value |
| --- | --- |
| `financial-services` | `financial_services` |
| `financial_services,energy` | `financial_services`, `energy` |
| `retail-cpg` | `retail` |
| `cross-industry` | `cross_industry` |
| `healthcare/provider` | `healthcare` |
| `health-care` | `healthcare` |
| `fs` | `financial_services` |
| `cpg` | `retail` |
| `finserv` | `financial_services` |
| `banking` | `financial_services` |
| `insurance` | `financial_services` |
| `payer` | `healthcare` |
| `provider` | `healthcare` |
| `government` | `public_sector` |

Unknown industry values return `values: ["other"]` and preserve the raw value in `unresolved`.

## Enterprise Area Aliases

| Source value family | Canonical value |
| --- | --- |
| `front`, `customer`, `customer_experience`, `patient_experience`, `member_experience`, `sales`, `marketing`, `contact_center` | `front_office` |
| `middle`, `operations`, `risk`, `compliance`, `clinical_operations`, `merchandising`, `supply_chain` | `middle_office` |
| `back`, `finance`, `hr`, `procurement`, `legal`, `it` | `back_office` |
| `platform`, `data_platform` | `enterprise_platform` |

Unknown enterprise-area values return no canonical value and preserve the raw value in `unresolved`.

## Strategic Moves Phase Aliases

| Source value family | Canonical phase |
| --- | --- |
| `P0`, `originate`, `origination` | `originate` |
| `P1`, `charter`, `intake` | `charter` |
| `P2`, `diagnose`, `discover`, `diagnosis`, `discovery`, `diagnose_discover` | `diagnose_discover` |
| `P3`, `design`, `solution_design` | `design` |
| `P4`, `roadmap`, `estimates`, `business_case`, `change_plan`, `value_realization_plan` | `roadmap_business_case_change_value_plan` |
| `P5`, `mobilize`, `mobilization`, `handoff`, `mobilize_handoff`, `mobilize_and_handoff` | `mobilize_handoff` |

`Execute` intentionally does not normalize to a Strategic Moves phase. AbarVa designs, plans, mobilizes, and hands off; execution may be performed by clients, SI partners, Source-selected vendors, or delivery teams.

## Confidence Aliases

| Source value | Canonical value |
| --- | --- |
| `low`, `l` | `low` |
| `medium`, `med`, `m` | `medium` |
| `high`, `h` | `high` |
| `validated`, `verified` | `validated` |

Numeric confidence maps as:

- `>= 0.8` -> `high`
- `>= 0.6` and `< 0.8` -> `medium`
- `< 0.6` -> `low`

## Maturity Aliases

| Source value | Canonical value |
| --- | --- |
| `new`, `emerging` | `emerging` |
| `mature`, `proven` | `proven` |
| `scale`, `scaled`, `advanced` | `scaled` |
| `frontier`, `experimental` | `experimental` |

## Freeform Fields

These fields normalize to lowercase underscore slugs and preserve unknown inputs as canonical strings:

- `function`
- `process_area`
- `use_case_category`

Empty freeform values return `other`.

## QA Rules

1. Normalizers must not mutate source objects.
2. Alias examples from the 2026-05-09 audit must be covered by unit tests.
3. Unknown values must be explicit: either `other` for open taxonomies or `unresolved` for closed enums.
4. `Execute` must remain unresolved as a Strategic Moves phase.
