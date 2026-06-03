# Pilot Data Loader Governance

## Rule

Client and pilot data must not be loaded through seed side-load scripts. New data enters AbarVa through the Admin Data Loader or a loader-backed ingestion path that records tenant-scoped ingestion evidence.

## Why This Matters

The pilot bar is not "can we make the surface look loaded." The pilot bar is "can we prove where the data came from, who loaded it, how it was validated, what was approved, and how to roll it back." Seed side-loads skip those controls and make cross-tenant mistakes harder to detect.

## Required Path

Use the Admin Data Loader workflow for new tenant data:

1. Choose the client and data dimension.
2. Upload the source file through the Admin context-layer upload flow.
3. Run scan, schema validation, mapping, and preview.
4. Approve the preview before commit.
5. Commit through the loader path with tenant-scoped audit evidence.
6. Verify the load in Data Trust, Intelligence, Source, Tower, and the post-deploy crawl where relevant.

Loader-backed ingestion must write or preserve evidence in the ingestion ledger, including `data_ingestion_runs` or the pilot ingestion ledger tables. If a file type or dimension is not supported, the work item is "enhance the Admin Data Loader," not "side-load a seed."

## Allowed Exceptions

Static product fixtures and global static corpus assets may still exist for tests, demos, or industry reference content. They are not pilot client data. Any new exception must be marked explicitly in the file:

- `pilot-data-loader-exception: static-test-fixture`
- `pilot-data-loader-exception: global-static-corpus`

Those markers are intentionally narrow. They do not permit tenant data, pilot reloads, SkyHarbor/Apex/Meridian/First Capital private context, vendor contracts, financials, program inventories, evidence ledgers, or Tower actuals to bypass the loader.

## Release Gate

`npm run release:check` includes the Pilot Data Loader Gate. It flags new or changed client-data seed/load entrypoints under seed, setup-data, corpus-load, SkyHarbor generation, and tenant data paths unless the change is a static exception or has a release record documenting the loader-backed ingestion path.

## Pilot Reload Guidance

For SkyHarbor or any other pilot reload, erase and reload only through the Admin Data Loader process. If the current module cannot ingest the full file package across all dimensions, add the missing loader capability first, then run the load. This keeps the four-week pilot push honest, auditable, and ready for a real client conversation.
