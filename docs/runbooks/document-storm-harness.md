# Document Storm Harness

This runbook covers T178: 100 large PDFs uploaded simultaneously by 10 users.

## What The Harness Proves

- The storm fixture has exactly 100 large PDFs across 10 users.
- Parser concurrency is capped globally.
- Parser concurrency is capped per user so one actor cannot monopolize the
  queue.
- Excess valid uploads are deferred with retry guidance instead of dropped.
- Oversized or 1000-page uploads are rejected before queue admission.

## Local Validation

```bash
npx jest src/lib/ingestion/__tests__/document-storm-control.test.ts --runInBand
npx eslint src/lib/ingestion/document-storm-control.ts \
  src/lib/ingestion/__tests__/document-storm-control.test.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

## Completion Boundary

This repository slice adds the executable scheduling/fairness contract. T178
remains `In progress` until the same 100-file / 10-user storm is run against the
preview or production upload path with real auth, storage, queue metrics, parser
workers, and tenant-fairness evidence.
