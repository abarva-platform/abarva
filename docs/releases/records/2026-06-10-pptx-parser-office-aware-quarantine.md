# 2026-06-10-pptx-parser-office-aware-quarantine — PPTX text extraction + office-aware sensitive-data quarantine

## Release ID

`2026-06-10-pptx-parser-office-aware-quarantine`

## Status

`candidate`

## Plain-English Summary

Two follow-ups that close the Known Gaps from the current-state document path
(`2026-06-10-current-state-doc-path`) and its quarantine fix
(`2026-06-10-current-state-ingest-quarantine`):

1. **Real PPTX parsing.** Previously a `.pptx` upload had no dedicated parser and
   landed as `review_required` **metadata-only** (no slide text). It now extracts
   the visible text from every slide (PowerPoint stores text runs in `<a:t>`
   elements inside a ZIP package) using `jszip`, so operating-model decks commit
   real, cited slide content for review.

2. **Office-aware quarantine.** DOCX / PPTX / XLSX files are ZIP containers, so a
   raw-byte sensitive-data scan only sees **compressed** bytes — PHI/PII inside an
   office file could evade the scan-before-write guard. The document path now adds
   a second layer: after the document is parsed in memory (nothing written yet),
   the **decoded text** is re-scanned with the same `evaluateSensitiveUpload`
   guard. On a hit the upload is quarantined (`sensitive_data_quarantined`, 422)
   and no evidence/review row is written. Plain text/CSV is still caught by the
   existing pre-parse scan (Layer 1).

## Layer Impact

- `global-control-lane`: the shared evidence-ingestion parser gains a PPTX
  extractor; the current-state document-ingest path gains a post-extract
  sensitivity re-scan. Additive — no schema change, existing parsers unchanged.

## Client Applicability

- All clients: yes. Specific clients: n/a. Internal only: no. Public/demo only:
  no. Feature flag: none.

## Changes Included

- `src/lib/programs/evidence-ingestion.ts` — `PPTX_MIME`, `extractTextFromSlideXml`
  (pure, exported, entity-decoding + paragraph/line breaks), `extractPptxText`
  (jszip; slides ordered numerically), wired into the parser selector
  (`parse_method: "pptx-jszip"`).
- `src/lib/programs/current-state-doc-ingest.ts` — `QuarantinedDocumentError`,
  `assessExtractedTextSensitivity` (office-aware re-scan), post-extract scan in
  `ingestCurrentStateDoc` before any write; `IngestDocArgs.declaredClassification`.
- `src/app/api/v1/programs/[programId]/current-state/ingest-doc/route.ts` — passes
  declared classification; catches `QuarantinedDocumentError` →
  `sensitiveUploadRejectedResponse` (Layer 2).
- `src/lib/programs/__tests__/current-state-doc-ingest.test.ts` — +5 tests
  (slide-XML extraction incl. entities/breaks/empty; office-aware quarantine of
  SSN-in-text; allow clean text). Suite 15/15.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx jest current-state-doc-ingest` — 15/15 pass.
- `npx eslint` on changed files — clean.
- PPTX parser verified locally against the committed synthetic deck
  (`skyharbor-operating-model-2026-05.pptx`): 2 slides extracted, full text incl.
  "platform changes require VP Engineering sign-off".
- Pending: deploy to ACA lab + live re-check — upload the real `.pptx` to
  `current-state/ingest-doc` and confirm slide text commits (not metadata-only);
  upload an office file with an embedded SSN and confirm Layer-2 quarantine (422).

## Rollout Plan

1. Merge to main (after surfacing).
2. Build + deploy app image to `ca-abarva-web-lab-eastus` from main; shift traffic
   after Healthy. No migration.

## Rollback Plan

- Redeploy the prior revision (`--main-2cd934c99`). Code-only; reverting restores
  prior behavior (PPTX → metadata-only; no Layer-2 scan). No data/schema impact.

## Audit Evidence

- PPTX evidence rows carry `parse_method: "pptx-jszip"` and the extracted slide
  text/citation like other formats. Layer-2 quarantine returns the same
  `dataProtection` payload as Layer-1 and writes nothing on a hit.

## Known Gaps

- `jszip` decompresses the whole package in memory; very large decks are bounded
  only by the existing upload size limits.
- Notes slides and embedded objects (charts/images/SmartArt text) are not
  extracted — only slide body text runs (`<a:t>`).
- The office-aware scan covers the **document** path. The structured CSV route
  (`current-state/ingest`) scans the raw CSV text directly (not compressed), so it
  was already effective and is unchanged.
- Detection remains a conservative pattern + declared-classification filter (not
  full DLP); the human review gate remains the second line for document families.
