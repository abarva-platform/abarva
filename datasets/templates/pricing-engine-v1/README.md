# Pricing Engine — Client Upload Template Pack v1

Purpose: let a tenant (client) upload their **own** rate card, pricing
assumptions, role-naming aliases, and technology cost defaults into the
Nexus Pricing Engine, without needing to touch — or even see — the full
326-role / 908-rate-band global reference taxonomy (PR1:
`datasets/reference/pricing-engine-v1/`).

These files are templates only, not seed data. They are smaller and
narrower than the global reference pack on purpose (brief §6.3): a client
uploads only the rows they actually have committed rates, assumptions,
aliases, or cost defaults for. Everything a client does **not** provide
falls back to the global default automatically — see "What happens to
roles you don't upload" below. This is handled by
`src/lib/pricing/governed-load/` (PR3) and is a governed, previewed,
approved commit — never a silent overwrite.

## Files

1. `client_rate_card.template.csv` — required for a client to price Moves
   against their own committed rates instead of the researched global
   benchmark.
2. `client_pricing_profile.template.csv` — required for client-specific
   commercial assumptions (offshore ratio, discount tier, etc.).
3. `client_role_aliases.template.csv` — optional. Only needed if the
   client's own role-naming vocabulary differs from the canonical
   `pricing_roles` catalog and you want uploads/lookups to resolve by the
   client's own label.
4. `client_technology_costs.template.csv` — optional. Only needed if the
   client has negotiated/knows their own AI-platform or technology cost
   defaults instead of the global default.

## `client_rate_card.template.csv`

```
role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to
ROL-037,LVL-04,,LOC-US-EAST,onshore_si_t1_benchmark,hour,410.00,USD,2026-08-01,
```

| Column | Required | Meaning |
| --- | --- | --- |
| `role_or_band_ref` | yes | A canonical `pricing_roles.role_code` (e.g. `ROL-037`) or `pricing_rate_bands.rate_band_code` (e.g. `ROL-037-LVL-04`) from the global taxonomy. Must resolve to a real row — this is checked during upload. |
| `level` | no | A canonical `pricing_seniority_levels.level_code` (e.g. `LVL-04`). Leave blank if `role_or_band_ref` already names a specific level (a rate-band code). |
| `provider_ref` | no | Reserved for a named delivery provider/vendor. Leave blank for a role-level rate. |
| `location_ref` | no | A canonical `pricing_delivery_locations.location_code`. Leave blank for a location-agnostic rate. |
| `rate_basis` | yes | Free-text label for how this rate was derived (e.g. `client_negotiated`, `client_msa_rate_card`). |
| `unit` | yes | `hour`, `day`, or `year` — must match how `rate_value` is denominated. |
| `rate_value` | yes | The numeric rate, in `currency`. |
| `currency` | no (defaults `USD`) | ISO currency code. |
| `valid_from` | yes | `YYYY-MM-DD` — the date this rate becomes effective. |
| `valid_to` | no | `YYYY-MM-DD` — leave blank for open-ended. |

**A client does NOT need to populate all 326 roles.** Upload only the roles
you have a real, committed rate for. Every role you omit keeps resolving
to the global default (`pricing_rate_bands`) — see the coverage report
(`buildRateCardCoverageReport` in `src/lib/pricing/governed-load/`) for
exactly which roles are direct (yours), inherited (global default), or
genuinely unresolvable (missing) after your upload.

## `client_pricing_profile.template.csv`

```
assumption_key,assumption_value,unit_hint,notes
offshore_ratio_default,0.35,ratio_0_to_1,Default onshore/offshore blend for unscoped workstreams
```

| Column | Required | Meaning |
| --- | --- | --- |
| `assumption_key` | yes | A stable identifier for the assumption (e.g. `offshore_ratio_default`, `discount_tier`, `annual_billable_hours`). |
| `assumption_value` | yes | The value. Parsed as JSON if it looks like a number/boolean/JSON object, otherwise kept as a string. |
| `unit_hint` | no | Free-text unit/shape hint for downstream consumers (e.g. `ratio_0_to_1`, `usd`, `pct`). |
| `notes` | no | Free-text rationale. |

## `client_role_aliases.template.csv` (optional)

```
alias_label,role_code,alias_type,notes
Senior Data Engineer,ROL-037,client_naming,Client's internal title for this canonical role
```

Maps the client's own internal role-naming vocabulary onto a canonical
`pricing_roles.role_code`, tenant-scoped (does not affect any other
tenant's alias resolution).

## `client_technology_costs.template.csv` (optional)

```
cost_key,cost_value,unit,notes
ai_platform_license_annual_usd,180000,usd_per_year,Client's negotiated platform license
```

Overrides a specific global technology-cost default
(`pricing_technology_cost_defaults`) with the client's own known number.
Any `cost_key` you don't provide keeps using the global default.

## What happens to roles you don't upload

The governed-load coverage report classifies every one of the 326 canonical
roles into exactly one bucket for a tenant:

- **direct** — the tenant's own current, approved rate-card line prices
  this role.
- **inherited** — no tenant-specific line exists, but the role's
  `default_rate_band_code` resolves to a real global `pricing_rate_bands`
  row, so the global default prices it instead.
- **missing** — neither a tenant line nor a resolvable global default
  exists. This is surfaced explicitly, never hidden — a Move that prices
  against a role in this bucket cannot claim a supportable rate.

## Governed, not raw

Every upload goes through parse → schema validation → semantic validation
(does this role/level/rate-band code actually exist in the canonical
taxonomy?) → a diff preview (added/changed/unchanged/removed vs. the
tenant's current approved version) → an explicit approve/commit step. A bad
row never silently corrupts the tenant's rate card, and an approved
version is never overwritten in place — a new upload always creates a new,
superseding version (or a no-op if the content is byte-identical to what's
already approved). See `src/lib/pricing/governed-load/` for the
implementation and `src/app/api/admin/pricing/` for the admin API.
