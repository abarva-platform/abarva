# QA27 — Apex Retail Source → Program Storyline Verification

| Field        | Value                                             |
|--------------|---------------------------------------------------|
| Slice ID     | QA27                                              |
| Wave         | wave-19                                           |
| Lane         | G                                                 |
| Type         | qa                                                |
| Status       | code_complete                                     |
| Branch       | wave19/qa27-apex-storyline-verification           |
| Owner agent  | Steward (QA lane)                                 |

---

## Summary

QA27 adds a deterministic integration test suite that verifies the Apex Retail
demo storyline is coherently connected across the **Source** surface (commercial
event + vendor analysis signals) and the **Program** surface (APX-CDP-2026 CDP
Activation program).

The suite is designed to **pass now** (pre-integration) with checks for
not-yet-merged Wave 19 slices returning `status: 'deferred'`, and to **pass
fully** after SRC32 / LINK1 / SRC33 / PROG15 / PROG16 / MW9 integrate.

---

## Files Added

| File | Purpose |
|------|---------|
| `src/lib/qa/apex-source-program-storyline-verification.ts` | Verification runner + `runApexStorylineVerification()` |
| `src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts` | Jest test suite (QA27) |
| `docs/build/APEX_SOURCE_PROGRAM_STORYLINE_VERIFICATION.md` | Verification report template |
| `docs/build/slices/QA27_APEX_SOURCE_PROGRAM_STORYLINE_VERIFICATION.md` | This slice doc |

---

## Checks

14 checks across two surfaces:

- **Source surface (CH-01–CH-03, CH-07–CH-08, CH-14):** scenario module
  existence, buildability, caveat chain, index re-export, vendor seed markers.
- **Program surface (CH-04–CH-06, CH-13):** flagship view module, APX-CDP-2026
  default, Apex Retail tenant label, deliverable export contract.
- **Cross-surface link (CH-09–CH-12):** LINK1 contract, SRC33 event route,
  PROG15 seed, PROG16 link view — all deferred pending Wave 19 integration.

---

## Pre-integration Deferred Checks

| Slice  | Check ID | Reason for deferral                                 |
|--------|----------|-----------------------------------------------------|
| SRC32  | CH-03    | Apex Retail source event seed not yet merged        |
| LINK1  | CH-09    | Source↔program link contract not yet merged        |
| SRC33  | CH-10    | Apex source event route not yet merged              |
| PROG15 | CH-11    | Apex CDP program seed not yet merged                |
| PROG16 | CH-12    | Apex program-source link view not yet merged        |

---

## Validation

```bash
# TypeScript
npx tsc --noEmit --pretty false

# Tests
npx jest src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts --no-coverage

# ESLint
npx eslint --max-warnings=0 src/lib/qa/apex-source-program-storyline-verification.ts src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts
```

---

## Promotion Criteria

Promote `status` from `code_complete` → `verified` after:

1. All 14 Jest tests pass.
2. `overallStatus` in the report is `partial` (pre-integration) or `pass` (post-integration).
3. TypeScript: `tsc --noEmit` clean.
4. ESLint: `--max-warnings=0` clean.
