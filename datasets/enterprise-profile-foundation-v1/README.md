# Enterprise Profile Foundation v1

Status: governed synthetic/demo tenant input standard.

This dataset establishes Enterprise Profile as a required tenant data domain, not a Home-page copy source. It is used by the non-destructive enterprise-profile foundation audit to prove that every active demo tenant has enough profile metadata to support downstream Home/aVa summaries without hand-authored narrative truth.

Northstar is intentionally not included because it is retired/excluded from active tenant processing.

## Files

- `templates/enterprise_profile_foundation_template.csv` — required input template for new tenant packets.
- `active-tenants/enterprise_profile_foundation.csv` — synthetic source data for active demo tenants.

## Guardrails

- Synthetic profile facts are planning/demo grade unless a tenant packet marks them as real and provides client evidence.
- Missing or placeholder values such as `not_loaded`, `unknown`, `TBD`, `N/A`, `sample`, and `lorem ipsum` are treated as gaps, not facts.
- Executive prose is not stored as source truth. Home and aVa must derive summaries from canonical profile records.
