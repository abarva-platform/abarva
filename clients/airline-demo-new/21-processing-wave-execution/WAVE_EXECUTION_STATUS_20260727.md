# Airline Demo New — Processing Wave Execution Status

## Scope

- Tenant: `airline-demo-new`
- Release: `airline-demo-new-source-corpus-v1.0.0`
- Environment: isolated Airline lab data plane
- Runtime image used for initial waves: `acrabarvalab001.azurecr.io/abarva/web@sha256:0ff1caae440f0ef7d4362f6455b164b19245fde6ff6a2df2cfee31689764ea8f`
- Execution lane: Azure Container Apps Jobs

## Passed Waves

| Wave | Execution | Result | Evidence |
| --- | --- | --- | --- |
| State probe | `job-airdn-validate-lab` one-shot override | Passed | `00-state-probe/airline-state-probe-overrides-20260727.yaml` |
| Source register | `job-airdn-validate-lab-m3wr5xo` | Passed: 48 operational files, 25 parser-visible files, 0 evaluator-truth source rows | `01-source-register/source-register-via-validate-logs-20260727.txt` |
| Source parse | `job-airdn-validate-lab-p35ed93` | Passed: 25 parser-visible sources, 99,883 parsed records, 0 silent skips | `02-source-parse/source-parse-via-validate-clientid-logs-20260727.txt` |
| Evidence extract | `job-airdn-validate-lab-5glcrz1` | Passed: 99,883 evidence rows, 99,883 entity candidates, 99,883 fact candidates, 66,200 relationship candidates | `03-evidence-extract/evidence-extract-via-validate-logs-20260727.txt` |
| Normalize | `job-airdn-validate-lab-kwcoa98` | Passed: 264,230 normalized candidate records, 0 quarantine | `04-knowledge-normalize/knowledge-normalize-via-validate-logs-20260727.txt` |
| Entity resolve | `job-airdn-validate-lab-qtnazks` | Passed: 99,015 resolved, 0 unresolved, 0 ambiguous | `05-entity-resolve/entity-resolve-via-validate-logs-20260727.txt` |

## Current Stop

Semantic validation on the deployed image stopped with `hidden_truth_references`.

The diagnostic query showed this is a false-positive validator match from ordinary parser-visible procurement scorecard rows containing a field named `evaluator_note`. Those rows are part of the operational source corpus and are not restricted evaluator-only truth.

The code fix narrows the hidden-truth detector to explicit restricted markers:

- `restricted_evaluator`
- `evaluator_only`
- `hidden_truth`
- `hidden_canonical`
- `not_parser_visible`

## Required Next Step

After this branch is merged and the ACA main deploy produces a new digest:

1. Confirm the ACA runtime invariant for the deployed digest.
2. Rerun `airline-demo-new-knowledge-validate-v1` through the governed ACA job lane.
3. Continue to review apply, domain publish, baseline publish, projection build, Home read-model refresh, and reconciliation only if validation passes.

## Permanent Job Contract Repair

The first wave proved that the job definitions need these settings available without one-shot overrides:

- `AZURE_CLIENT_ID` for the assigned user-managed identity
- `ABARVA_AIRDN_STORAGE_ACCOUNT`
- PostgreSQL host, database, user, and `pg-admin-password` secret reference
- Digest-pinned image value

The Airline job Bicep template in this branch includes those settings.
