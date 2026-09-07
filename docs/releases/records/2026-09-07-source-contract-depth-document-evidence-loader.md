# 2026-09-07-source-contract-depth-document-evidence-loader — Add the missing clause/document-extraction load path for the contract-depth package

## Release ID

`2026-09-07-source-contract-depth-document-evidence-loader`

## Status

`candidate`

## Plain-English Summary

The contract-depth synthetic evidence package already computes realistic contract-clause and document page-text rows for every contract it covers — auto-renew language, notice periods, service-credit formulas, termination rights, each tied to a named synthetic source document. Its loader (`load-contract-depth-package.ts`) already reads those rows into `source.contract_term` and a page-text character-count fact, but stops there. It never writes the same rows into the document-extraction tables (`doc.file`, `doc.page`, `doc.span`, `doc.extraction`) that the Source workspace's Contract 360 UI reads from to show a citable "Clauses (detail)" evidence state — no comment or TODO explains this as deliberate; it reads as an unfinished wiring step.

A different loader (`load-source-golden-contract-evidence.mjs`) already writes into exactly those tables, for other tenants and a differently-shaped package — but its manifest/reconciliation checks (invoice-line exceptions, rate-card variance, renewal-negotiation history) don't exist for the contract-depth package's data, so pointing it at this package would fail its own validation.

This adds a small, narrowly-scoped companion loader (`load-contract-depth-document-evidence.mjs`) that reads the same `contract_clauses.csv` / `contract_page_text.csv` rows the existing loader already parses, and writes them into `doc.file` / `doc.page` / `doc.span` / `doc.extraction` using the same schema and insert pattern already proven by the golden-evidence loader — without that loader's incompatible reconciliation requirements. It invents nothing: every row traces to a source CSV row already reviewed and tagged `synthetic_demo_reviewed` / `synthetic_demo_only_not_client_truth`.

## Layer Impact

Release lane: `client-data-lane` — writes governed synthetic evidence for a specific tenant's contracts; no shared control-plane behavior changes.

- Layer 4 (Products — Source): no code change to any product surface. Contract 360's existing "Clauses (detail)" / evidence-citation read path is unchanged; it simply has rows to read for contracts this loader is run against.
- Layer 3 (Canonical model): adds rows to `doc.file`, `doc.page`, `doc.span`, `doc.extraction`, `meta.concept` for whichever contract ids are explicitly passed via `--contract-id`. No schema change — these tables already exist and are populated for other tenants.
- Layers 1-2 (Client intake, source adapters): none. Reads the same already-reviewed `source-files/contract_clauses.csv` and `source-files/contract_page_text.csv` the existing `load-contract-depth-package.ts` already loads elsewhere.

## Client Applicability

- All clients: no — this only affects contracts explicitly named via `--contract-id` for one synthetic demo/reference tenant (the same tenant the contract-depth package in `datasets/source/contract-depth/` was generated for).
- Specific clients: none — the affected tenant is a synthetic composite reference tenant, not a real customer, per its own `/home` banner ("COMPOSITE REFERENCE TENANT · DEMO · Synthetic portfolio. Not a customer, not a case study.").
- Internal only: no.
- Public/demo only: yes — this is demo-tenant evidence depth, not a production client.
- Feature flag: none.

## Changes Included

- `scripts/source/load-contract-depth-document-evidence.mjs` — new. Plan/apply loader; requires explicit `--contract-id` scope (refuses to run unscoped). Plan mode is read-only (parses CSVs, prints intended row counts, no DB connection). Apply mode writes `doc.file`/`doc.page`/`doc.span`/`doc.extraction`/`meta.concept`, scoped to the tenant-key and contract ids passed, deleting only rows under that exact scope before reinserting (idempotent rerun).
- `package.json` — two new scripts: `source:contract-depth-package:doc-evidence:plan`, `source:contract-depth-package:doc-evidence:apply-job`.

## QA / Validation

- `npx eslint scripts/source/load-contract-depth-document-evidence.mjs` — **pass**, clean.
- Plan mode run locally against the real package for `MER-TECH-AMS-001` (Cognizant Technology Solutions) — **pass**: output matched exact independent verification done earlier by reading the CSVs directly — 6 `contract_page_text` rows, 7 `contract_clauses` rows, 6 distinct source files. No DB write in plan mode.
- Apply mode against the live tenant — **not run** as of this PR. That is the explicit next step: run as an ACA Job per the ACA Data Build Job Rule (`docs/ops/aca-data-build-job-rule.md`), scoped to `--contract-id MER-TECH-AMS-001` only, once this image is deployed. This PR does not claim that step passed.

## Rollout Plan

Merge to main via PR (squash). Standard ACA main-deploy build on merge. The loader itself does not run automatically — it is invoked afterward as an explicit ACA Job (`npm run ops:aca-job -- --image <new-digest> --script source:contract-depth-package:doc-evidence:apply-job --env CONTRACT_DEPTH_DOC_EVIDENCE_CONTRACT_ID=MER-TECH-AMS-001 --env CONTRACT_DEPTH_DOC_EVIDENCE_APPLY=true`), scoped to one contract, with live before/after proof pulled from the contract API afterward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly — the web image ships the new script, but the script only runs when explicitly invoked as an ACA Job, never as part of a web request.
- Approved image digest: assigned by the main deploy workflow on merge; the data-load ACA Job is submitted against that digest afterward.
- ACA runtime invariant: standard post-deploy check applies to the web image; unaffected by whether the data-load job has run yet.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the data load specifically (not this code change alone) — after the ACA Job runs, fetch `MER-TECH-AMS-001`'s contract API and confirm `docExtractions`/`evidencePricing` are populated and match the CSV source rows, then confirm Contract 360's Evidence/Clauses facet renders the same in a live signed-in session.

## Rollback Plan

Code: revert the PR — the new script is inert until explicitly invoked, so reverting removes no live behavior. Data: rerunning the same loader with `--apply` for the same contract id(s) is idempotent (deletes and reinserts only rows scoped to that tenant/contract), so a bad load can be corrected by rerunning with fixed input; a full rollback of loaded rows would be a scoped delete on `doc.file`/`doc.page`/`doc.span`/`doc.extraction`, keyed on the same tenant key and contract/file ids the load used, documented per the break-glass path if needed outside a rerun.

## Known Gaps

- Only tested in plan mode as of this PR; the actual `--apply` run against the live tenant is the follow-up action, gated on this image being deployed and on running it through the ACA Job path rather than ad hoc.
- Scoped to `MER-TECH-AMS-001` (Cognizant) only for this initial run, by design — the other five contracts with partial evidence depth (Microsoft, Salesforce, AWS, Kyndryl, Optum Rx) have the same gap and could be loaded the same way in a follow-up, one `--contract-id` value at a time or as a comma-separated list.
- `doc.file.blob_uri` is synthesized (`azure-blob://.../<source_file_id>.txt`) since the contract-depth package has no actual PDF binary, only page text — consistent with how the package already ships a `page_text_sha256` per page rather than a real file hash. This is fine for demo citation purposes but is not a real blob and should not be treated as one if this pattern is ever extended toward a real document-storage integration.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- ACA Job execution id and proof bundle: to be attached after the apply run.
