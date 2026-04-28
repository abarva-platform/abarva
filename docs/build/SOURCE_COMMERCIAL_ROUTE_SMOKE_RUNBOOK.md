# QA23: Source Commercial Route Smoke Verification Runbook

**Wave:** wave-16
**Slice:** QA23
**Branch:** wave16/qa23-source-commercial-route-smoke

## What It Checks

QA23 verifies the Wave-16 Source commercial route via a two-tier test strategy:

1. **Static manifest (Suite A)** — 10 tests that always pass in any worktree. Validates that the `WAVE16_ROUTE_DESCRIPTORS`, `WAVE16_COMPONENT_DESCRIPTORS`, and `WAVE16_LIB_DESCRIPTORS` are correctly structured and that the smoke report builder returns the correct metadata.

2. **Integration-phase file checks (Suite B)** — 10 tests. Wave-16 new files gracefully skip (with a console warning) when absent; Wave-15 files assert existence since they are already in main. The source event detail page is always checked for existence and non-empty content.

3. **Content checks (Suite C)** — 2 tests. Verifies the event page contains no live-data calls and that `SourceCommercialEventSection` (if present) carries a deterministic data caveat.

## When to Run

- **Lane worktree (standalone):** Suites A and C static assertions always pass. Suite B Wave-16 file checks skip gracefully.
- **Integration branch (after cherry-pick of SRC27–SRC30):** All tests should pass including file existence and content assertions.
- **Before merge:** Run in integration branch to confirm all 22 tests pass with zero skips.

## How to Run

```bash
cd /Users/anand/Projects/nexus-qa23
node_modules/.bin/jest src/__tests__/integration/qa/source-commercial-route-smoke.test.ts --no-coverage
```

## TypeScript Check

```bash
node_modules/.bin/tsc --noEmit 2>&1 | grep "error TS" | head -20
```

## ESLint Check

```bash
node_modules/.bin/eslint --max-warnings=0 \
  src/lib/qa/source-commercial-route-smoke.ts \
  src/__tests__/integration/qa/source-commercial-route-smoke.test.ts
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/qa/source-commercial-route-smoke.ts` | Manifest constants + report builder |
| `src/__tests__/integration/qa/source-commercial-route-smoke.test.ts` | 22-test smoke suite |
