# Airline Demo New Template Instantiation and Source Corpus Design

Status: design package, no Azure apply, no parsing, no product runtime change.

Tenant key: `airline-demo-new`  
Short code: `airdn`  
Source release: `airline-demo-new-source-corpus-v1.0.0`

This package instantiates the universal Knowledge template framework for a new synthetic airline tenant and adds an airline industry overlay plus a technology-procurement / Source overlay. It does not reuse any populated tenant data from any other demonstration tenant.

## Package folders

- `01-template-workbooks/`: client-practical template catalog, overlays, field dictionary, interviews, KPIs, relationships and parity matrix.
- `02-synthetic-enterprise/`: independent synthetic enterprise profile and hidden truth design.
- `03-source-corpus-design/`: parser-visible corpus plan, source manifest design and dataset schema.
- `04-restricted-evaluator-design/`: restricted truth/crosswalk design artifacts for evaluator-only storage.
- `05-validation/`: validation report and machine-readable validation summary.
- `06-review-package/`: review ZIP for handoff.

