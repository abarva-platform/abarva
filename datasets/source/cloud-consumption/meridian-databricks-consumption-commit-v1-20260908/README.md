# Meridian Databricks consumption commitment package

Synthetic demo evidence package for a Databricks consumption-commit contract running on AWS.

This package is Layer 1 intake evidence for governed Azure loading through scripts/source/load-cloud-consumption-package.mjs. It is not client truth, it is not a real Databricks transaction, and it does not authorize finance-confirmed savings claims.

## Contract visibility

Source360 should show vendor Databricks, Inc., contract MER-TECH-DBX-001, annual platform commitment 1550000 USD, support fee 341000 USD, annual commercial value 1891000 USD, five-year committed value 7750000 USD, actual usage 66100 USD, and four candidate opportunities. Opportunity rows also preserve buyer ask, negotiation language, vendor concession, timing dependency, owner role, priority, and risk-if-ignored fields for Optimize and aVa grounding.

## Restricted-source boundary

Raw/full Databricks contract files and pricing exhibits stay outside the public repo in local restricted storage. This repo package contains only synthetic source rows and synthetic markdown evidence summaries stamped synthetic_demo_only_not_client_truth.

## Non-mutating validation

Run:

```bash
node scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=meridian-databricks-consumption-commit-v1-20260908 --package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908 --proof-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/qa/plan-proof
```

Mutating Layer 2/3/4 load requires the governed ACA data-build job path and explicit operator approval.
