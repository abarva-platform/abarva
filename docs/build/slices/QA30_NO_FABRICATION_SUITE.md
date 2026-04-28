# Slice Report: QA30 — No-Fabrication Regression Suite

Slice ID: QA30
Title: No-Fabrication Regression Suite — 5 Test Patterns
Wave: wave-25
Track: 10-demo-qa-production-hardening
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

---

## Summary

Implements a deterministic Jest regression suite that verifies AbarVa read models do not contain fabricated data: unsubstantiated dollar amounts, bare percentage claims, invalid confidence values, evidence entries without citation locators, or agent outputs without deterministic caveats.

## Files created

| File | Purpose |
|---|---|
| `src/__tests__/integration/qa/no-fabrication-regression.test.ts` | 5-pattern regression suite |

## Test patterns implemented

1. No unsubstantiated dollar amounts in sentinel detection titles, summaries, or actions
2. No bare percentage reduction/savings/improvement claims in sentinel detection text
3. All confidence values in `['low', 'medium', 'high']`
4. Every intelligence source basis has a non-empty `citationLocator`
5. Every sentinel detection has `createdFrom: 'deterministic_seed'` (caveat marker)

## Key constraints met

- No `any` TypeScript types in test file
- No network calls — tests run against deterministic lib functions
- Tests run via `npm test` with no additional configuration
- Apex Retail tenant used as the seed target (demo data only)
