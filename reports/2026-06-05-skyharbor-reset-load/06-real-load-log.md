# SkyHarbor Reset/Load Pass - 06 Real Load Log

Created: 2026-06-06

## Real Load Verdict

Not run.

Reason: the required clean-slate verification did not complete because the live DB was unreachable. Running a real load without first proving and backing up existing SkyHarbor state would violate the reset lane instructions.

## Commands Not Run

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --skip-embeddings
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --only-chunks
```

## Blocker

```text
getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

## Real Load Requirements Before Retry

1. Run from a network location that resolves the Azure private Postgres endpoint.
2. Re-run the live inventory.
3. Export/backup SkyHarbor-only rows/files.
4. Delete stale SkyHarbor-only rows/files.
5. Verify clean slate.
6. Run dry-run from the same private runtime.
7. Run real load.
8. Verify post-load counts, embeddings, and retrieval behavior.

## Loader Flag Caveat

`--skip-embeddings` is not currently implemented in the shared loader. A real load may embed pending chunks using Azure OpenAI, OpenAI, or deterministic fallback depending on available env vars. If the intended first pass must avoid embeddings, add/verify a real `--skip-embeddings` guard before executing the command.
