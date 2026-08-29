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
2. Submit an ACA Job for the data build using the shared operator wrapper:
   `npm run ops:aca-job -- --image <acr-image>@sha256:<digest> --script <npm-script>`.
3. Pass tenant scope, build version, input source version, and idempotency key as explicit env/args.
4. Write progress to a DB status table or a Blob progress object.
5. Write final proof outputs to Blob and, when requested for review, copy a ZIP to the operator Downloads folder.
6. Fail the job if validation fails.
7. Do not wire a product surface until the quality gate and human review pass.

## Standard Operator Wrapper

The canonical wrapper is `scripts/ops/submit-aca-operator-job.mjs`.

It standardizes the pieces that were previously handled manually:

- requires digest-pinned images unless `ALLOW_MUTABLE_ACA_IMAGE=true` is explicitly set for a documented exception
- submits the existing private ACA operator job with start-time image, command, args, CPU, memory, and env overrides
- records request metadata, execution id, poll status, logs, proof-bundle extraction, and idle-restore evidence in a local output folder
- extracts proof bundles emitted between `__SEMANTIC2_PROOF_TGZ_BEGIN__` and `__SEMANTIC2_PROOF_TGZ_END__`
- restores the private operator job to the idle image/command after the run, unless `--no-restore-idle` is intentionally set
- redacts sensitive env values from request summaries

Example:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script semantic2:l3-dossiers:proof-job \
  --env NODE_OPTIONS=--conditions=react-server \
  --out-dir /tmp/abarva-l3-proof-$(date -u +%Y%m%dT%H%M%SZ)
```

For the L3 dossier proof lane, the shortcut is:

```bash
npm run ops:semantic2:l3-dossiers:proof -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --out-dir /tmp/abarva-l3-proof-$(date -u +%Y%m%dT%H%M%SZ)
```

## Tower Layer 3 reload order

`ecl_projection.tower_value_chain` carries `tower_value_chain_measure_fk` onto
`ecl_context.measure` — a Layer 4 row referencing a Layer 3 one. So once Layer 4 has been built,
a Layer 3 reload fails on that constraint:

```
ERROR: update or delete on table "measure" violates foreign key constraint
       "tower_value_chain_measure_fk" on table "tower_value_chain"
```

This is structural, not a fault in any particular change. The dependency resolves in one direction
only, so Layer 4 must release its references before Layer 3 can be replaced. Run three jobs, in
this order, all digest-pinned and all passing `--secret-env DATABASE_URL=azure-postgres-control-database-url`:

```bash
npm run ops:aca-job -- --image <digest> \
  --script tower:healthcare-demo-layer4-products:purge-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url --out-dir <out>

npm run ops:aca-job -- --image <digest> \
  --script tower:healthcare-demo-layer3-canonical:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url --out-dir <out>

npm run ops:aca-job -- --image <digest> \
  --script tower:healthcare-demo-layer4-products:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url --out-dir <out>
```

Layer 4 is deliberately empty between the first and last step, and Tower surfaces will read no
projection during that window. That is the honest state: a projection derived from canonical data
is not valid while that data is being replaced.

Two things that are easy to get wrong:

- **The wrapper does not default `DATABASE_URL`.** Omit `--secret-env` and the job fails inside the
  container with `DATABASE_URL is required`, after the image has already been pulled.
- **Read the wrapper's saved `04-logs.txt`, not `az containerapp job logs show`.** The `az` query
  truncates long Postgres errors — including the table names in a foreign-key violation, which are
  the only part that identifies the problem.

## Forbidden Paths

- Mutating DB writes from a Next.js route handler for operator builds.
- Long-running builds in the production web request path.
- Manual `az containerapp exec` for mutating builds except break-glass.
- Hand-written `az containerapp job update/start/logs` sequences when the shared wrapper can run the job.
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
