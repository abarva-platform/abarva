# Parser Robustness Matrix

This runbook covers T190: deterministic parser behavior for adversarial and
edge-case PDFs before pilot data loading.

## Policy

Parser failures must be boring, explicit, and safe. Corrupted, encrypted,
oversized, scanned-only, multilingual, or disguised-executable PDFs must not
silently parse, silently commit extracted facts, or fall through to an external
third-party parser without approval and consent.

## Required Cases

| Case                                          | Expected behavior                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Corrupted PDF                                 | Manual review; request a clean source file or manual evidence extraction.                                   |
| Encrypted PDF                                 | Manual review; request password or unlocked replacement through governed upload.                            |
| 1000-page or oversized PDF                    | Manual review; split or batch before processing to protect queue fairness and cost controls.                |
| Scanned-only PDF                              | Private OCR or private self-hosted fallback; commit blocked until OCR confidence and locators are reviewed. |
| Multilingual PDF outside supported review set | Private fallback plus language-aware human review before fact approval.                                     |
| PDF wrapper with executable content           | Quarantine before parsing; no fallback parser invocation.                                                   |

## Validation

```bash
npx jest src/lib/ingestion/__tests__/parser-robustness-matrix.test.ts \
  src/lib/ingestion/__tests__/parser-fallback-policy.test.ts --runInBand
npx eslint src/lib/ingestion/parser-robustness-matrix.ts \
  src/lib/ingestion/__tests__/parser-robustness-matrix.test.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

## Completion Boundary

This matrix is a repository-level QA harness. It does not prove live Azure
Document Intelligence, Marker, OCR, or LlamaParse behavior. T190 remains `In
progress` until live or preview upload tests execute representative files and
capture evidence that each case follows the expected behavior.
