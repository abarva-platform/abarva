# Lakeshore Holdings V6 Synthetic Intelligence Pack

This package contains the Lakeshore Holdings synthetic V6 enterprise intelligence templates.

## Model

Lakeshore Holdings is modeled as a private holding company with corporate shared services, Corporate IT, a Corporate Innovation IT and Data AI group, and four portfolio companies with their own local IT leadership and systems.

## Key rules

- Corporate Shared Services includes HR, legal, finance, treasury, investments, governance, and corporate business operations.
- Corporate IT runs the systems that support Corporate Shared Services.
- Corporate Innovation IT and Data AI is a subset of Corporate IT budget, not an additive enterprise budget line.
- Each portfolio company has local IT, local systems, local vendors, local programs, and local spend.
- Allocated shared-services consumption rows are management allocation views and must not be added to the direct enterprise IT budget.

## Validation

Run:

```bash
node scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs
node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs
```

The validator writes `out/lakeshore-v6-holdco-validation.json`.
