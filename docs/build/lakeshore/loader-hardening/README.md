# Lakeshore Loader Hardening Proof Pack

## Purpose

This pack states what the Data Loads workflow must prove before Lakeshore
context is considered live. It exists because the Lakeshore package includes
tabular files, structured files, and documents; a polished setup page is not
enough unless every format has an explicit parse, validation, approval, commit,
audit, rollback, and embedding path.

## Files

| File | Purpose |
| --- | --- |
| `lakeshore-loader-hardening-matrix.json` | Format-by-format control matrix for the Lakeshore package |
| `scripts/lakeshore/verify-loader-hardening-matrix.mjs` | Verifies the matrix covers every manifest format and references existing control files |

## Formats Covered

The Lakeshore manifest currently uses:

- CSV
- XLSX
- JSON
- JSONL
- Markdown
- PDF
- DOCX
- PPTX

The verifier fails if a new format appears in
`docs/build/lakeshore/loaded/manifest.json` without a matching hardening entry.

## Required Live Proof

For a true pilot-grade data load, operators must prove:

1. tenant scope is Lakeshore-only;
2. sensitive upload guard runs before processing;
3. malware scanning is configured or fail-closed;
4. parser method and fallback warning are captured per file;
5. template validation runs before commit;
6. a preview exists before commit;
7. consent/attestation is recorded;
8. approval is recorded;
9. commit writes audit evidence;
10. rollback or unload plan exists;
11. Data Trust shows record counts and last-loaded timestamps;
12. embeddings run after commit.

## Validation

```bash
npm run lakeshore:loader-hardening:verify
```

This is an offline verifier. It does not mutate data and does not claim the
live load has happened. It checks that the package and control plan line up so
the live load can be audited.

## Completion Boundary

This proof pack is complete when it is merged and the verifier passes. Lakeshore
loader hardening is complete only after PR #2997 lands and the live proof
sequence in `lakeshore-loader-hardening-matrix.json` is executed with evidence.
