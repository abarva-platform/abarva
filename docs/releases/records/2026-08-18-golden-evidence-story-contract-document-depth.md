# 2026-08-18-golden-evidence-story-contract-document-depth — Story Contract PDFs Expanded to Full Agreement Structure

## Release ID

`2026-08-18-golden-evidence-story-contract-document-depth`

## Status

`candidate`

## Plain-English Summary

The two executed-agreement PDFs in the golden contract evidence packet (CTR-061 Northgate, CTR-090
Vantage) were each 6 pages — a dense but visually thin synthetic contract summary next to the
packet's three unrelated legacy-vendor documents (114–338 clause extractions, 100+ pages each) that
happen to sit in the same package. For a demo meant to show a best-in-class product, a 6-page "executed
agreement" undersells what the product can read.

Both documents are now 26 pages, restructured as a full enterprise-agreement shape: cover, recitals,
definitions, the original 9 material sections (scope, fees, usage, SLA, renewal, benchmarking, audit,
security, change orders), and new standard sections (payment terms, data protection, IP, indemnification
and liability, insurance, assignment, force majeure, dispute resolution, general provisions and
signatures) plus a new exhibit restating the application/business-function scope. Every added section
reuses facts already established elsewhere in the packet (contract overview, pricing schedule,
application scope, or standard non-numeric boilerplate) — no new dollar figure, date, or claim was
introduced. The liability cap references the existing actual-annual-spend baseline rather than a new
number. Signatories are role references only (per the packet's own privacy instruction), not personal
names.

While regenerating, the same CSV line-ending defect fixed earlier in this packet
(`2026-08-18-golden-evidence-loader-idempotent-doc-tables`) recurred in the regeneration tooling itself:
both `regenerate-contract-pdfs.mjs` and the new `regenerate-story-contract-pdfs.mjs` wrote
`Papa.unparse(...) + "\n"`, appending a bare LF after Papa.unparse's CRLF-separated rows. That is very
likely what corrupted this packet's CSV the first time, before this session started. Both scripts now
append `\r\n` to match Papa.unparse's own row separator.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (contract evidence ingestion) demo dataset only. No product route, UI, or read
  path changed.
- Canonical model: No schema/migration change. Row counts for `contract_pdf_page_text.csv` and
  `contract_pdf_document_inventory.page_count` changed for the two target files only; all other files
  and rows in the packet are untouched.

## Client Applicability

- All clients: No — this packet only serves the synthetic demo airline tenant.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `datasets/source/contract-intelligence/skyharbor-golden-20260808/synthetic/contract_pdf_page_text.csv`
  — CTR-061 and CTR-090 page rows expanded from 6 to 26 each; all other file rows unchanged.
- `datasets/source/contract-intelligence/skyharbor-golden-20260808/synthetic/contract_pdf_document_inventory.csv`
  — `page_count` and `source_file_sha256` updated for the two target files.
- `datasets/source/contract-intelligence/skyharbor-golden-20260808/documents/CTR-061_Northgate_Executed_Agreement_SYNTHETIC.pdf`
  and `.../CTR-090_Vantage_Executed_Agreement_SYNTHETIC.pdf` — regenerated at 26 pages each.
- `scripts/data/contract-packet/regenerate-story-contract-pdfs.mjs` (new) — unconditionally regenerates
  these two specific PDFs from their page text; the existing regeneration script only rewrites a PDF
  whose on-disk bytes still name a real vendor, which these never did.
- `scripts/data/contract-packet/regenerate-contract-pdfs.mjs` — fixed the same trailing-newline defect
  in its own CSV rewrite.

## QA / Validation

- Full-packet parse check (all 18 CSVs in the package): 0 errors, 1,792 total rows (up from 1,752 —
  net +40 from the two expanded files).
- `pdfinfo` on both regenerated PDFs: 26 pages each, letter size, valid PDF 1.3, react-pdf producer.
- `pdftotext` spot-check of the first three pages of the CTR-061 PDF: renders cleanly, banner and
  section text intact.
- `node --check` on both modified/added `.mjs` scripts.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image (the packet is baked into the image via the Dockerfile's `datasets/` COPY). The golden-evidence
loader is then re-run as an ACA Job per `docs/ops/aca-data-build-job-rule.md` — no change to how or
where it is invoked; the loader's own delete-before-insert step (already fixed in
`2026-08-18-golden-evidence-loader-alias-scoped-retag`) reclaims and replaces the prior 6-page rows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before re-running the operator job.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — this only affects packet content an operator-run loader reads;
  it does not itself change a product route.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. The prior 6-page PDFs and page-text rows are recoverable from git history; no
destructive operation is involved.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the re-run apply-pass with the expanded page/doc counts.

## Known Gaps

- The three unrelated legacy-vendor PDFs in this same packet (Crestline, NimbusWorks, AeroLake) remain
  `supplemental_unmapped_to_current_register` and still account for the large majority of the packet's
  total clause-extraction count. That imbalance is unchanged by this record; it is a labeling/citation
  concern for whoever narrates the demo, not a data defect.
