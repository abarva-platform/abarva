# 2026-09-18-bounded-document-ingestion-parser

## Release ID

`2026-09-18-bounded-document-ingestion-parser`

## Status

`draft`

## Plain-English Summary

The ingestion parser now delegates supported binary documents to the established upload extractor instead of decoding binary bytes as text. The extractor's implementation is shared by Source and the standalone ingestion worker; Source retains its server-only wrapper. Empty and unsupported files fail explicitly rather than producing placeholder content.

## Release Lane

`global-control-lane`

## Layer Impact

The Layer 2 ingestion lane only. The parser prepares bounded text for downstream adapters; it does not change canonical records or product read models.

## Client Applicability

- All clients: document uploads processed by this parser.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

PDF, DOCX, XLSX, and PPTX delegate to the shared extraction core and inherit its page, worksheet, slide, and output limits. The existing Source module remains a thin server-only re-export with the same public exports. The ingestion wrapper checks filename, declared MIME, binary signature, and Office package structure before parsing; it also adds input and archive expansion limits plus explicit empty/unsupported failures. No schema, tenant data, or runtime configuration changes.

## QA / Validation

Reuse baseline: 4 failing and 7 passing parser tests. The format-mismatch test failed before the signature guard was added. Final focused suites: 35 tests passed. A plain-Node child process imported the consumer and delivered extracted PPTX text to its mocked pipeline without the `react-server` condition. Disabling the empty-output gate caused 3 parser tests to fail; disabling PDF signature recognition caused 2 to fail. TypeScript, scoped ESLint, and release check passed. An unrelated rehearsal suite still fails in CSV field mapping before document parsing.

## Rollout Plan

No rollout is authorized by this record. After review and approval, use the repository-owned ACA main deploy workflow. Verify the approved digest and run upload/readback proof before calling the parser live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: check when the ingestion worker is deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for an affected upload path.

## Rollback Plan

Revert the parser change through a new PR and redeploy the prior approved digest through the repository-owned workflow. Uploaded files and canonical data are not changed by this candidate.

## Audit Evidence

Focused Jest results, mutation result, TypeScript and ESLint results, release check output, and the eventual PR/deploy proof.

## Known Gaps

The landing-zone consumer classifies parser exceptions as transient, so permanently unreadable files may be retried. Office expansion checks use JSZip's uncompressed-size metadata; the 20 MB compressed and 40 MB declared-expanded limits do not bound peak parser memory or CPU, especially for complex PDFs and workbooks. The existing Source extractor limits rendered rows, sheets, slides, pages, and text, but XLSX still loads the full workbook before row limits are applied. No deployed worker or signed-in upload proof was run for this local candidate.
