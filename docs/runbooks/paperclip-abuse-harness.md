# Paperclip Abuse Harness

This runbook covers T201: adversarial paperclip upload abuse testing.

## Threats Covered

- Rapid-fire uploads: 50 uploads inside a 60 second actor window.
- Oversized file: byte size above the shared paperclip cap.
- Page-count abuse: 1000-page PDF that can starve parser capacity.
- Disguised executable: executable content presented as a PDF.

## Expected Behavior

| Threat                   | Expected behavior                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 50 uploads in 60 seconds | Rate-limit before storage, parsing, or queue admission.                                              |
| File above byte cap      | Reject before storage, parsing, or queue admission.                                                  |
| 1000-page PDF            | Hold for manual review; do not enqueue for parser work until split, batched, or explicitly approved. |
| Executable wrapper       | Quarantine before storage or parsing.                                                                |
| Normal PDF               | Continue to the standard sensitive-data and parser controls.                                         |

## Local Validation

```bash
npx jest src/lib/agent/__tests__/paperclip-abuse-guard.test.ts --runInBand
npx eslint src/lib/agent/paperclip-abuse-guard.ts \
  src/lib/agent/__tests__/paperclip-abuse-guard.test.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

## Completion Boundary

This repository slice adds the executable abuse-policy matrix. T201 remains `In
progress` until the same cases are run against the live or preview paperclip
route with real auth, storage, parser queue, and quarantine/audit evidence.
