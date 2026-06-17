# First Capital Financial Forward Execution Plan

## Goal

Move First Capital Financial from a strong synthetic enterprise substrate to a live, governed, retrieval-proven intelligence tenant.

The bar is not "files exist." The bar is:

`source evidence staged -> parsed with citations -> mapped -> committed to tenant context tables -> embedded/indexed -> retrieval proven -> insight evaluator run -> UI cards/answers repaint from live DB`.

## Current State

- Static substrate pack improved and regenerated.
- Fixture-like evidence text reduced to zero in the static audit.
- First Capital now passes static audit as `load_ready_after_live_proof`.
- Current static measurements:
  - 180 application/system rows
  - 380 integration edges
  - 82 vendor/contract rows
  - 1,677 org/role rows
  - 291 financial/run-cost rows
  - 292 ops/DORA/incident/change rows
  - 40 regulatory/risk rows
  - 400 retrieval corpus chunks
- Live DB population proof was not completed from this shell because the configured Azure Postgres host did not resolve from the current network.

## Stage 1 - Freeze The File Pack

Actions:

- Treat `datasets/first-capital-financial-synthetic-v1/` as the current candidate pack.
- Keep the regenerated source files and corpus text.
- Keep the expanded regulatory obligations.
- Do not load any older First Capital source docs or chunks that still read like generated fixture text.

Gate:

- `node scripts/audit/enterprise-synthetic-data-depth-audit.mjs`
- First Capital must remain:
  - `fixtureHits = 0`
  - `decision = load_ready_after_live_proof`

## Stage 2 - Add Missing Evidence Before Production-Like Demo

Stage these under:

`datasets/client-load-staging/first-capital/`

Required folders:

- `01_public_company_evidence`
- `04_it_systems_landscape`
- `05_architecture_infrastructure`
- `06_data_and_integration`
- `07_security_risk_compliance`
- `99_load_receipts`

Priority uploads/templates:

- Annual report / 10-K analog
- Quarterly earnings report analog
- Investor presentation / conference transcript analog
- IT hosting/platform topology
- Infrastructure estate inventory
- Workload volumetrics
- Data center/private cloud/public cloud topology
- System cost and budget template
- Public-to-internal IT alignment template

Gate:

- Every raw file appears in `source-catalog`.
- Every unstructured file has citation-grain expectation: page, slide, heading, sheet/cell, row, or timestamp.

## Stage 3 - Dry Run The Loader

Command:

`TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run`

Expected:

- Tenant resolves to canonical `first-capital`.
- Client id resolves to `a75687bf-71b9-4524-ab4e-68ae3f28d200`.
- Dataset root resolves to `datasets/first-capital-financial-synthetic-v1`.
- Source files and corpus chunks pass schema compatibility.
- Table loads report intended row counts without mutation.

Gate:

- No schema error.
- No tenant-key drift to `arcturus` or `firstcapital` in committed context tables.
- No fallback DB.

## Stage 4 - Load In The Private Data Plane

Run only from the environment that can resolve/reach the Azure Postgres private host.

Recommended sequence:

1. Load source files and chunks.
2. Load structured tables.
3. Refresh embeddings/search.
4. Run tenant context healthcheck.
5. Run retrieval proof.
6. Run insight evaluator.

Candidate commands:

`TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts`

Then:

`node scripts/audit/live-tenant-population-audit.mjs`

Gate:

- `enterprise_context_source_files > 0`
- `enterprise_context_chunks >= 400`
- `enterprise_context_facts` populated if the current loader path extracts facts
- embedding/index coverage has no unexplained failed rows
- `context_insights > 0` after evaluator

## Stage 5 - Retrieval Proof

Ask tenant-scoped questions that must cite First Capital-only evidence:

1. What do we know about First Capital Financial?
2. Which initiatives should be killed, held, restructured, or continued?
3. What blocks killing or replacing FIS Horizon?
4. What is the FedNow/RTP modernization dependency chain?
5. What are the top vendor concentration risks?
6. Which systems support AML/BSA remediation and model-risk evidence?
7. What public-company strategy/KPI commitments constrain the IT roadmap?
8. Which architecture or cost facts are still missing?

Gate:

- Answers cite First Capital rows/chunks.
- Answers do not import Apex, Meridian, Northstar, SkyHarbor, or Lakeshore facts.
- Missing evidence is named honestly.

## Stage 6 - Insight Evaluation

Run the significance-rule evaluator after facts/chunks are committed.

Expected insight themes:

- Core banking modernization hold
- FedNow/RTP dependency and resiliency risk
- AML/BSA model-risk readiness
- Vendor concentration and exit risk
- Digital account-opening abandonment
- SAP ECC finance future decision
- AI tooling governance and model-risk constraints
- Infrastructure/architecture evidence gaps

Gate:

- `/api/intelligence/insights` returns live First Capital insight rows.
- UI cards repaint from the DB, not hardcoded fixtures.

## Stage 7 - Archive Bad Generated Rows

Do not hard-delete.

Candidate archive criteria:

- Source events generated under `arcturus` or non-canonical client key.
- Moves or Source events with fixture/demo boilerplate.
- Rows with no source artifact, no evidence linkage, and no tenant-scoped provenance.
- Duplicate Source event codes.
- Any generated artifact that claims evidence not present in the First Capital context layer.

Gate:

- Moves use existing reversible archive path.
- Source events should only be archived with provenance, or after an additive archive ledger/provenance migration if current schema lacks enough audit fields.

## Decision

Proceed, but do it as a live-data proof chain:

1. Freeze and audit the improved pack.
2. Stage public/company and architecture evidence.
3. Dry-run loader.
4. Load from private-network environment.
5. Run live population audit.
6. Prove retrieval.
7. Run insight evaluator.
8. Archive bad generated artifacts with provenance.
