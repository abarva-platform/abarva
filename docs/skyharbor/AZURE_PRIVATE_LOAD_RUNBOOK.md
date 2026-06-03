# SkyHarbor Azure Private Erase / Reload Runbook

## Purpose

This runbook is the operational answer to "how do we erase and reload SkyHarbor through the Azure-native uploader without contaminating the tenant data plane?" It governs the upcoming uploader process for SkyHarbor records, source files, chunks, embeddings, application portfolio, initiatives, vendor contracts, and verification evidence in the Azure private data lane.

This is a controlled reload process, not an invitation to repair the database by hand.

## Non-Negotiables

- Do not hand-patch SkyHarbor data with ad hoc SQL `insert`, `update`, or `delete` statements.
- Do not edit production SkyHarbor rows directly to make a verifier pass.
- Do not copy rows from Apex, Meridian, Northstar, First Capital, or any other tenant into SkyHarbor.
- Do not erase any row unless it is scoped to the canonical SkyHarbor client identity and the approved erase manifest names that row.
- Do not apply a reload if the preflight export, dry-run report, and release evidence packet are missing.

Corrections must flow from approved source exports through parsing, schema validation, uploader dry run, controlled erase, upload, and post-load verification.

## Inputs

- Dataset root: `datasets/skyharbor-air-synthetic-v1/`
- Loader wrapper: `scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs`
- Shared loader: `scripts/seed/load-tenant-substrate.ts`
- Uploader contract: Azure-native tenant uploader, scoped to `TENANT_KEY=skyharbor`
- Verification:
  - `node scripts/skyharbor/verify-skyharbor-substrate.mjs`
  - `node scripts/skyharbor/verify-airline-pattern-overlay.mjs`
  - `node scripts/skyharbor/stages/06_load_to_azure/audit_log_baseline.mjs`
  - `node scripts/skyharbor/stages/06_load_to_azure/rls_verification.mjs`
  - `node scripts/skyharbor/stages/07_verify/fact_fingerprint_check.mjs`
  - `node scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs`

## Required Environment

Run from a host with private network access to the Azure PostgreSQL Flexible Server.

```bash
export ABARVA_AZURE_DATABASE_URL='postgres://...'
export AZURE_OPENAI_EMBEDDING_ENDPOINT='https://...'
export AZURE_OPENAI_EMBEDDING_KEY='...'
export AZURE_OPENAI_EMBEDDING_DEPLOYMENT='text-embedding-3-large'
```

If Azure OpenAI embedding variables are absent, the shared loader falls back to `OPENAI_API_KEY`, then deterministic local embeddings for dry runs.

## Preflight Export and Evidence

Create an evidence folder before touching the Azure data lane:

```bash
export SKYHARBOR_EVIDENCE_DIR="datasets/skyharbor-air-synthetic-v1/azure_load_artifacts/$(date -u +%Y%m%dT%H%M%SZ)-erase-reload"
mkdir -p "$SKYHARBOR_EVIDENCE_DIR"
```

Capture the current state and the proposed reload state:

```bash
node scripts/skyharbor/verify-skyharbor-substrate.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/substrate_preflight.txt"
node scripts/skyharbor/verify-airline-pattern-overlay.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/airline_overlay_preflight.txt"
node scripts/skyharbor/stages/06_load_to_azure/audit_log_baseline.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/audit_log_baseline.txt"
node scripts/audit/db-substrate-audit.mjs --tenant=skyharbor | tee "$SKYHARBOR_EVIDENCE_DIR/pre_erase_db_substrate_audit.txt"
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run | tee "$SKYHARBOR_EVIDENCE_DIR/uploader_dry_run.txt"
```

Expected:

- Substrate and overlay verifiers pass.
- Dry run reports SkyHarbor source files, chunks, applications, initiatives, and vendor contracts without writing rows.
- Current-state export records counts, fingerprints, source-file IDs, chunk IDs, embedding provenance, uploader version or commit SHA, operator, UTC timestamp, and target environment.
- Evidence packet names the release record or PR that authorized the reload.

Stop here if any export is missing or ambiguous. Missing evidence is a release hold, not a reason to hand-patch.

## Erase Boundaries

The erase step may remove only rows owned by the canonical SkyHarbor client identity. The erase manifest must bind every operation to the resolved SkyHarbor client row and the `client_id` foreign key used by the affected table.

Allowed erase dimensions:

- SkyHarbor source-file metadata and parsed source payloads.
- SkyHarbor enterprise context chunks and chunk embeddings.
- SkyHarbor generated records and fact fingerprints derived from the approved dataset root.
- SkyHarbor application portfolio rows.
- SkyHarbor AI initiative rows.
- SkyHarbor vendor-contract rows.
- SkyHarbor AI egress audit baseline rows that were emitted by the uploader for the reload batch.

Out of bounds:

- `clients` rows for SkyHarbor or any other client.
- Clerk users, persona memberships, demo login state, or auth metadata.
- Release records, crawl baselines, readiness records, and audit logs that document prior runs.
- Any row whose `client_id` cannot be resolved to SkyHarbor before erase.
- Any row owned by Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, or a global corpus tenant.

The upcoming Azure-native uploader must emit an erase manifest before apply. Review the manifest for table name, primary keys, `client_id`, row count, dimension, operator, environment, and rollback pointer. If the manifest includes an unrecognized table or a null / mismatched `client_id`, hold the release.

## Upload Dimensions

Run the uploader as a dimension-aware reload. Full reload is preferred when clearing tenant leakage or stale fixture contamination. Dimension-scoped reload is allowed only when the evidence packet proves the issue is isolated.

| Dimension | Reload expectation | Minimum proof |
| --- | --- | --- |
| Source files | Approved source package only | Source export hash, file count, uploader dry-run count |
| Records / facts | Regenerated from approved source package | Schema validation and fact fingerprint delta |
| Chunks | Rebuilt from records and airline overlay | Chunk count and chunk-quality gate |
| Embeddings | Regenerated through Azure OpenAI or documented fallback for dry run only | Embedding audit with model/deployment provenance |
| Applications | SkyHarbor application portfolio only | Row count and named application sample |
| Initiatives | SkyHarbor AI initiatives only | Row count and named initiative sample |
| Vendor contracts | SkyHarbor vendor-contract rows only | Row count and named vendor sample |
| Audit baseline | Reload batch provenance | AI egress audit and uploader batch ID |

## Apply Reload

```bash
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --concurrency=8
```

For a chunks-only refresh after pattern-overlay edits:

```bash
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --only-chunks --concurrency=8
```

For the upcoming Azure-native uploader, the equivalent apply must be run only after the erase manifest has been reviewed and the dry run has passed. Save stdout/stderr into the evidence folder.

## Validation Checks

```bash
node scripts/audit/db-substrate-audit.mjs --tenant=skyharbor | tee "$SKYHARBOR_EVIDENCE_DIR/post_load_db_substrate_audit.txt"
node scripts/skyharbor/stages/06_load_to_azure/rls_verification.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/rls_verification.txt"
node scripts/skyharbor/stages/07_verify/fact_fingerprint_check.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/fact_fingerprint_check.txt"
node scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs | tee "$SKYHARBOR_EVIDENCE_DIR/ground_truth_results.txt"
```

Go/no-go thresholds:

- SkyHarbor enterprise context chunks include the 480 tenant facts plus 2,760 airline industry patterns.
- Application, initiative, and vendor-contract tables are populated for `skyharbor`.
- Cross-tenant RLS checks return zero SkyHarbor rows when queried as another tenant.
- Ground-truth verification answers the CTO Tier-1 set with citations.
- No post-load count is lower than the approved dry-run count unless the release record explicitly documents the intentional reduction.
- Every cited source in SkyHarbor answers resolves to a SkyHarbor source file or approved global airline pattern, never a healthcare, retail, banking, or medical-device tenant fixture.

## Tenant Leak Probes

Run leak probes after the data-plane validation and before declaring the reload complete:

```bash
npm run crawl:persona -- skyharbor-cto,skyharbor-cio --base-url https://app.abarva.ai
```

Inspect the crawl comparison and transcripts for:

- Meridian / healthcare markers such as `Meridian Health`, `Epic Hyperspace`, `MyChart`, `HIPAA`, `Sectra`, and `Innovaccer`.
- Apex / retail markers such as `Apex Retail`, `APX-`, `Commerce Cloud`, `Wipro AMS`, and retail assortment or merchandising language.
- First Capital / banking markers such as `First Capital`, `Arcturus`, consent-order language, or banking-specific regulatory facts.
- Northstar / medical-device markers such as `Northstar Clinical`, `510(k)`, `FDA PCCP`, and device-manufacturing facts.
- SkyHarbor answers that cite source files but describe another tenant's business.

Any product-surface leak is P0/HOLD. Release-ledger or audit-page mentions are evidence text and must be reviewed separately from product content, but they do not clear a product-surface finding.

## Rollback and Hold Criteria

Hold the reload before apply if:

- Preflight export, dry run, erase manifest, or release evidence is missing.
- The erase manifest targets any row outside SkyHarbor's resolved `client_id`.
- The uploader cannot prove the source package hash or batch ID.
- A dimension count changes unexpectedly between dry run and apply.
- Any operator proposes direct SQL repair instead of rerunning the controlled uploader path.

Hold after apply if:

- RLS verification returns any cross-tenant row.
- Ground-truth verification misses the CTO Tier-1 citation bar.
- Tenant leak probes find foreign tenant markers on product surfaces.
- The CXO crawl cannot complete for SkyHarbor CTO and CIO personas.
- Audit artifacts are incomplete or stored outside the evidence folder.

Rollback path:

1. Stop promotion and mark the release record as held or rolled back.
2. Preserve the failed evidence folder; do not delete failed artifacts.
3. Restore from the preflight export or the last known-good Azure snapshot using the controlled uploader rollback path.
4. Rerun the validation checks and tenant leak probes.
5. Reopen only after the release owner signs off on the corrected evidence packet.

## Post-Load CXO Crawl

After validation passes, run a SkyHarbor CXO crawl against the target environment:

```bash
npm run crawl:persona -- skyharbor-cto,skyharbor-cio --base-url https://app.abarva.ai
```

The crawl must cover Intelligence, Tower, Source, Moves, home, admin data-trust, and release/readiness surfaces available to the persona. Save screenshots, HTML, transcripts, crawl-run JSON, and comparison JSON in the evidence folder or link the generated `audit-artifacts/post-deploy-crawl/` run directory from the release record.

Pass criteria:

- Both SkyHarbor personas sign in and remain scoped to SkyHarbor.
- No P0 tenant leakage, console-error, or crawl-execution finding.
- Intelligence hard questions answer with SkyHarbor or approved global airline evidence.
- Tower, Source, Moves, and home surfaces do not show another tenant's client name, route fallback, fixture copy, or source artifact.
- Release owner can read the crawl transcript and explain what changed after the reload.

## Audit Artifacts

Save command output to:

- `$SKYHARBOR_EVIDENCE_DIR/pre_erase_db_substrate_audit.txt`
- `$SKYHARBOR_EVIDENCE_DIR/uploader_dry_run.txt`
- `$SKYHARBOR_EVIDENCE_DIR/erase_manifest.json`
- `$SKYHARBOR_EVIDENCE_DIR/azure_load_log.txt`
- `$SKYHARBOR_EVIDENCE_DIR/post_load_db_substrate_audit.txt`
- `$SKYHARBOR_EVIDENCE_DIR/rls_verification.txt`
- `$SKYHARBOR_EVIDENCE_DIR/fact_fingerprint_check.txt`
- `$SKYHARBOR_EVIDENCE_DIR/ground_truth_results.txt`
- `$SKYHARBOR_EVIDENCE_DIR/ai_egress_audit_baseline.csv`
- `$SKYHARBOR_EVIDENCE_DIR/post_load_cxo_crawl/`

## Customer Reuse Pattern

To use this process with a real airline data slice, replace the synthetic source files in `datasets/skyharbor-air-synthetic-v1/source_uploads/` with approved customer exports, regenerate records/chunks through `scripts/skyharbor/`, run the same loader, and keep the same verification gates.
