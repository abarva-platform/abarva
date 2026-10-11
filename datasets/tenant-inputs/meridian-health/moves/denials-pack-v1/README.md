# Synthetic discovery pack

Synthetic — not real data — AbarVa demo

All organisations, cohorts, policies, interviews, costs and planning hypotheses
are invented. No real source material or engagement was used. Administrative
examples are neither payer standards nor clinical advice.

## What to upload

Upload only the eight numbered files, through the fresh Move's authenticated
step pages. `walk-notes.json` lists every actual P0–P5 step, upload reuse,
draft-fill paste blocks, manual fields and the owner's clicks. Do not upload
this README, the proposal or the validation proof as discovery evidence.

The cohort workbook holds eight submission quarters, 384 original-submission
cohorts and 1,536 reason cohorts. Denial rate counts only the first denial of an
original submission; corrected submissions never enlarge the denominator.
The final four quarters are the trailing-year basis. Every invented cohort
reaches final disposition within 90 days and is mature at the fixture's date.
Recovered cash, write-offs and contractual adjustments partition denied
allowed amounts. Gross charges are not a cash benefit basis.

The finance workbook separates labour expense from convertible cash benefit.
Its administrative expense per hour is not a delivery rate. Unit-hour proposals
and delivery factors are explicitly labelled in the inventory workbook;
delivery pricing must come exclusively from the versioned pricing-engine-v1
foundation and a reviewed pod with full rate provenance.

## Reproduce and check

Use Node 24 and the repository dependencies:

```sh
npx tsx scripts/moves/denials-pack/prepare.ts
npx tsx scripts/moves/denials-pack/verify.ts
npx jest --runInBand --runTestsByPath src/lib/programs/__tests__/moves-denials-pack.test.ts
```

`verify.ts` reads the actual DOCX, XLSX, Markdown and PDF bytes and checks every
cohort, summary, finance control, source link and policy mapping. It writes
`reconciliation-proof.json` with SHA-256 hashes of those eight files. Spreadsheet packaging uses the
namespace spelling accepted by the existing upload reader; validation reads the
delivered original bytes.
The existing upload parser also reads these original bytes in an offline
compatibility test. It extracts all summary rows, but only the first 200 non-empty
rows of each raw cohort sheet and returns explicit truncation warnings. Full
cohorts remain in the workbook; parsing is not complete retrieval, model readiness
or signed-in proof.

Authoring tools are offline lab scripts: `author-workbooks.mjs` uses the bundled
artifact-tool runtime; `author-documents.py` uses bundled python-docx/ReportLab.
Neither is in a product or loader path. `prepare.ts` writes an ignored scenario
intermediate; workbook inspection sidecars are also ignored.

## Approval boundaries and known gaps

- The owner creates a fresh Move. There is no Move ID or preallocated evidence
  citation in this pack. Gate pages and structured/read-only pages without a
  notes parser are labelled honestly; manual instructions never imply a parse.
- Notes yield proposals only. The owner chooses participants, links approved
  evidence, accepts drafts, confirms causes/ranking and signs off personally.
- Add the shared-foundation row before pasting ROM counts. Count its sources
  once, group use cases into releases, inspect pricing provenance and personally
  approve the estimate. Compare foundation-priced options A and B without changing
  counts or tuning rates; unapproved bands say "planning rates, not approved".
  The value case uses only the personally selected and approved option; the deck
  compares both. Report missing option-selection support rather than claiming an
  unrecorded choice. Do not rebuild any signed document.
- The rebind proposal contains proposed register rows only. IDs, Move scope,
  input approval and the ROM snapshot remain unbound. Reusing the earlier seed
  job requires an exact schema/scope review, live ID preflight and a separate
  named approval; this pack widens no existing load authorization.
- The proposed budget is a ceiling. The value case's only investment basis is
  the owner's current approved ROM; without it economics must refuse. No NPV,
  payback or ROI is claimed here.
- Rework is capacity at zero cash without a recorded role or contract release.
  Avoided write-offs count only as incremental collected net allowed revenue
  against a matched comparator, never as gross charges or existing recoveries.
- Days in receivables is a timing observation. The present value engine accepts
  whole-month cash lags; it cannot credit the proposed eight-day improvement as
  a full month or an additional annual revenue benefit. The conservative lag
  stays unchanged until a separately reviewed timing capability exists.
- The manifest uses the supported `internal` disclosure classification and
  explicitly declares synthetic origin. Its preparer declaration is not human
  load approval. Files are prepared, not loaded, indexed, cited or agent-ready.
- P5 prepares external execution and Tower measurement; it asserts neither
  launched execution nor realized value. The complete product walk remains
  the owner's future test.
