# 2026-08-16-cover-vendor-contract-documents — Cover entities for synthetic contract documents

## Release ID

`2026-08-16-cover-vendor-contract-documents`

## Status

`candidate`

## Plain-English Summary

The synthetic contract evidence packages contained documents that read as executed agreements with
real companies, carrying invented commercial terms, in a public repository. A `_SYNTHETIC` suffix on
the filename did not make that safe: what a reader sees is a document titled as a real company's
agreement with fabricated figures in it.

This replaces those identities with invented cover entities, regenerates the affected PDFs from
their backing data, and adds a CI gate so it cannot recur.

The rule being enforced is narrow, and the distinction is the whole point:

- A real company **may** appear in an **inventory**. Recording that a business runs Microsoft 365,
  or that evidence came from ServiceNow CMDB, is a fact about that business.
- A real company **may not** appear as a **party** to a document that looks executed, because that
  fabricates an agreement in a real company's name.

Cover entities: **Northgate Cloud Corporation**, **Vantage Data Cloud, Inc.**, **Sterling Workforce
Systems, Inc.**

## Layer Impact

**Release lane: `internal-admin`.** Synthetic fixture packages and operator tooling only. Not
`client-data-lane`: no tenant schema, seed, ingestion, retrieval, or private data-plane path is
touched, and no tenant input registry entry changes.

- **Layer 1 (client intake):** unchanged. Tenant vendor and application inventories were
  deliberately left alone — that is the permitted case.
- **Layer 2–4:** no runtime change. Nothing is loaded, indexed, or promoted.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no — though the motivation is public-repo exposure
- Feature flag: none

## Changes Included

- `scripts/data/contract-packet/rekey-cover-vendors.mjs` — scripted substitution with an explicit
  mapping table and a protect list, so every change is auditable rather than hand-edited.
- `scripts/data/contract-packet/regenerate-contract-pdfs.mjs` — re-renders affected PDFs from
  `contract_pdf_page_text.csv` and recomputes `page_text_sha256` and `source_file_sha256`.
- `scripts/audit/validate-no-real-vendor-parties.mjs` — the CI gate.
- `scripts/source/build-meridian-contract-evidence-package.mjs` — 44 content-string substitutions so
  a future run does not recreate the problem.
- `datasets/source/contract-intelligence/**` — 113 text files re-keyed, 30 files renamed, 5 PDFs
  regenerated. File count unchanged at 161.
- `package.json` — `validate:no-real-vendor-parties`.

## QA / Validation

Final sweep: zero real-company names remain in any text file or filename under
`datasets/source/contract-intelligence/`. The gate passes across 161 files.

**Fault injection.** The gate was made to fail on purpose before being trusted, across all four
detection paths: a document filename naming a real company, a `vendor_name` column naming one, a
markdown document title naming one, and a `Supplier:` line naming one. All four were caught.

**Four defects were found and fixed during the work, three of them in my own tooling:**

1. A blanket token replacement would have rewritten `Azure Blob original` — a description of *our
   own* storage architecture — into a fictional vendor's name.
2. It would have rewritten `ABARVA_AZURE_DATABASE_URL`, `AZURE_LAB_DATABASE_URL` and
   `AZURE_CLIENT_DATABASE_URL_SKYHARBOR_GLOBAL` across 23 files, breaking every data-plane script in
   the repo. Protecting the identifier family cut the blast radius from 42 files to 19.
3. The PDF regenerator initially wanted to rebuild the three large prior-corpus agreements
   (1.5MB, 1.17MB, 943KB) from a short page-text summary, which would have silently destroyed them.
   They are now explicitly skipped: their parties are already fictional and their vendor mentions
   sit in an application-estate inventory table beside IBM Netezza.
4. `/\bWorkday/` never matched `CF-003_Workday_Inc__EXECUTED-AGREEMENT.pdf`, because underscore is a
   word character and there is no boundary before `W`. This silently passed a real violation, and
   made an earlier "zero remaining" verification unreliable. All matching now avoids `\b`, and the
   gate carries a comment explaining why.

`node scripts/release-check.mjs --base origin/main --head HEAD` — run locally.

## Rollout Plan

Merge to main. No runtime rollout: no image build, no ACA deploy, no migration, no flag, no data
load.

## Deployment Authority

Not applicable — cannot affect Container Apps, runtime images, flags, environment variables, worker
jobs, traffic, or DNS.

## Rollback Plan

Revert the commit. Nothing persists outside the repository.

## Audit Evidence

- The commit and its PR.
- `npm run validate:no-real-vendor-parties` — 161 files scanned, pass.
- Fault-injection results for all four detection paths.
- The mapping table and protect list in `rekey-cover-vendors.mjs`, which record every substitution
  made and every phrase deliberately preserved.

## Known Gaps

- **Branded product names were replaced inside packages where they were arguably inventory.**
  `Power BI Premium` in the Meridian analytics estate became `Northgate Insight Premium` even though
  its contracting party was already fictional. This costs some realism in that package. The trade
  was deliberate: over-replacing in an inventory is a cosmetic problem, under-replacing in a party
  role is a disclosure problem.
- **`scripts/source/` was deliberately left un-re-keyed apart from one builder.** The remaining
  matches include real code identifiers — `residualWorkdayRaw`, `workdayChecks`, and
  `workday_usage_and_bpo_dependency`, which looks like a data key that also exists in the database
  and datasets. Renaming it in scripts alone would break the contract with `src/`. The CI gate is
  the safety net if any of those scripts regenerate documents.
- **`scripts/source/repair-skyharbor-deloitte-workday-scope.ts` still names a real consultancy in
  its filename.** It is wired into `package.json` and referenced by an existing release record, so
  renaming it is a separate change. It is a script name, not a fabricated agreement, so it is not
  the same class of exposure.
- The gate covers `datasets/source/contract-intelligence/`. It does not yet scan tenant input
  packages, on the deliberate basis that inventory rows there may legitimately name real vendors.
