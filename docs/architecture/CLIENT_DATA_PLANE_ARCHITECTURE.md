# Client data plane — the demo shortcut is not the architecture

Status: architecture statement. Commit to `docs/architecture/`.
Verified against `origin/main` when promoted from local directive. This public version intentionally uses generic tenant labels.

## The two shapes, and they are not the same

**Demo, today — acceptable, and only because the data is fake.**

```
repo CSVs → baked into the web image → ACA data-build job → shared Azure Postgres/ECL → projections → app
```

`Dockerfile:129` does `COPY --from=build /app/datasets ./datasets`, so the entire dataset tree
travels in the image. The registry permits it: `canonicalRoot = datasets/tenant-inputs`, and
`azureLanding.storageAccount` is still `"to-be-bound-by-environment"`. For synthetic tenants this is
convenient and costs nothing.

**Client, required — not an upgrade path, a different plane.**

```
client Blob landing zone → manifest + hash → ACA job inside the client VNet
  → client-scoped Azure Postgres/ECL → tenant-scoped serving views → app
```

- Source files live in **that client's** private storage account. Never the repo.
- Jobs run **inside that client's** VNet. Never a shared runner, never a laptop.
- ECL tables are **client-scoped** Postgres, not a shared instance with a tenant column.
- The app reads **tenant-scoped serving/projection views**, never base tables.
- Source-intelligence digests live in the **client data plane**, with hash and provenance —
  a digest is a derivative of client data and inherits its classification.
- **No client source file is ever baked into a shared web image.**

## The line that must not be crossed by accident

`COPY /app/datasets` takes the whole tree — every tenant, every template, every archive. Today that
is image bloat. With one real client it is a tenancy breach: client A's intake riding inside the
image that serves client B, and nobody has to make a mistake for it to happen — it is the default.

**Before the first real engagement:** scope that COPY, or package per tenant, or move intake out of
the image entirely. This is not a hardening task to schedule; it is a precondition. A synthetic
tenant cannot demonstrate that it works, because a synthetic tenant is exactly what makes it look
harmless.

## Why doing digests repo-local now is not a detour

The `source_intel` digest already carries content hash, schema fingerprint, row count, grain and
cell-level citations. **That is the manifest** the Blob landing zone needs. When the source moves to
Blob, what changes is where the bytes are read from; the manifest, hash and provenance step already
exists and does not have to be invented under client pressure.

So the sequence is: build the digest contract against synthetic repo files, prove it, then repoint
the reader. Not: wait for Blob to be bound, then design the contract in a client's environment.

## What each side may assume

| | Demo | Client |
| --- | --- | --- |
| Source location | repo, baked into image | client private Blob |
| Job execution | shared ACA job | ACA job inside client VNet |
| ECL | shared Postgres | client-scoped Postgres |
| App read path | tenant-scoped serving views | tenant-scoped serving views |
| Digests | repo, alongside the CSVs | client data plane, hash + provenance |
| Image contents | all tenants | no client source, ever |

The read path is the one row that is the same in both columns, and it should stay that way — it is
the seam that lets the plane change underneath without the product changing.

## Say it where it will be read

This statement belongs in `AGENTS.md` alongside the deployment-authority rules, not only here.
An agent reading only the repo today sees repo-baked CSVs working and will reproduce that pattern
for the first real client, because nothing in the codebase says not to.
