# ACA Data Build Job Rule

Status: active operating rule for production/lab data-plane builds.

## Rule

Mutating operator data builds must run as Azure Container Apps Jobs, not as production web requests and not as long-running manual `az containerapp exec` sessions.

This applies to Semantic2 dossier builds, context enrichment builds, data-plane reconciliation, evidence projection, materialized read-model refreshes, and any other operator workflow that writes to Azure/Postgres or Blob.

## Why

The web deployment lane is for shipping product code. It is not the right execution lane for iterative data-build work. ACA Jobs give each run a stable identity, timeout, retry policy, log stream, and output location without forcing repeated web image deploys or tying a build to an interactive shell.

## Required Job Contract

Every mutating data build job must record:

- Job name
- Run id
- Tenant scope
- Build version
- Input source version
- Idempotency key
- Started/finished timestamps
- Operator identity or automation identity
- Git SHA and image digest
- Status: queued, running, succeeded, failed, cancelled
- Retry count and timeout
- Progress checkpoint table or progress JSON
- Blob proof bundle location
- Validation output location
- Quality-gate output location
- Release record link

## Minimum Execution Flow

1. Build or reuse the approved ACA image.
2. Submit an ACA Job for the data build.
3. Pass tenant scope, build version, input source version, and idempotency key as explicit env/args.
4. Write progress to a DB status table or a Blob progress object.
5. Write final proof outputs to Blob and, when requested for review, copy a ZIP to the operator Downloads folder.
6. Fail the job if validation fails.
7. Do not wire a product surface until the quality gate and human review pass.

## Forbidden Paths

- Mutating DB writes from a Next.js route handler for operator builds.
- Long-running builds in the production web request path.
- Manual `az containerapp exec` for mutating builds except break-glass.
- Repeated web deploys solely to run an operator data-build script.
- Surface wiring before the gate report says the data is eligible.

## Break-Glass

`az containerapp exec` is allowed only for read-only inspection or a documented break-glass run. A break-glass run must include:

- Reason the ACA Job path could not be used
- Commands run
- Tenant scope
- Whether any mutation happened
- Rollback/cleanup notes
- Proof artifacts

## Release Checklist Item

No new data-plane build may be promoted without an ACA Job path or a documented break-glass exception.
