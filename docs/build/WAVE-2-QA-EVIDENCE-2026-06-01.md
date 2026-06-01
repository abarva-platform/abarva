# Wave 2 QA Evidence · Probabilistic Value Modeling · 2026-06-01

## Status

Candidate QA packet for Wave 2 probabilistic value modeling. Feature slices A1, A2, B1, and B2 now have a cross-slice contract test, answer-quality fixtures, and a browser artifact test. This packet is L1-L5 evidence only; L6 human go/no-go remains a separate founder/pilot review.

## Coverage Summary

| Layer | Evidence | Current status |
|---|---|---|
| L1 Unit | Distribution, input-wrapper, value-forecast sampler, renderer, and component focused tests | Passed locally |
| L2 Integration | `wave-2-probabilistic-contract.test.ts` walks effort estimate → value forecast → Monte Carlo forecast → board-grade renderer | Passed locally |
| L3 Contract | TypeScript compile plus explicit contract assertions for P10/P50/P90, probabilities, variance drivers, and renderer sections | Passed locally |
| L4 Browser | Playwright opens the generated board-grade deck with no app auth or tenant data and exercises slide navigation | Pending local run in this QA PR |
| L5 Answer quality | Good/bad JSONL fixtures for probabilistic forecast answers and raw-ID/vague-answer rejection | Passed locally |
| L6 Human | Founder/pilot walkthrough of rendered Apex/Meridian/SkyHarbor sample Moves | Not run in this PR |

## Issue Register

| Priority | Issue | Status |
|---|---|---|
| P2 | B2 renderer is passive; no live Move page route is wired to show the card yet | Deferred to next wiring slice after renderer merge |
| P3 | Jest reports pre-existing duplicate manual mock warnings for markdown/GFM mocks | Accepted as pre-existing; focused suites pass |
| P3 | Playwright artifact test proves browser behavior for the generated deck, not authenticated app route behavior | Accepted for this passive renderer slice; authenticated route test belongs to the wiring PR |

## Validation Log

| Command | Result |
|---|---|
| `npx jest src/lib/programs/expert-kernel/probabilistic/__tests__/wave-2-probabilistic-contract.test.ts src/lib/eval/answer-quality/__tests__/wave2-probabilistic-fixtures.test.ts --runInBand` | Passed: 2 suites, 5 tests |
| `npx playwright test tests/e2e/wave-2/probabilistic-forecast-artifact.spec.ts --reporter=list` | Passed: 1 browser test |
| `npx eslint src/lib/programs/expert-kernel/probabilistic/__tests__/wave-2-probabilistic-contract.test.ts src/lib/eval/answer-quality/__tests__/wave2-probabilistic-fixtures.test.ts tests/e2e/wave-2/probabilistic-forecast-artifact.spec.ts --max-warnings=0` | Passed |
| `npx tsc --noEmit --pretty false` | Passed |
| `npm run release:check -- --base origin/main --head HEAD` | Passed after this evidence update |
| `git diff --check` | Passed |

## Go/No-Go Memo

L1-L5 QA is designed to block regressions in the three things a CXO will notice immediately: the forecast must show a range, the answer must explain the range in plain language, and the artifact must not expose raw internal identifiers. L6 is not declared here because no authenticated production route is wired in this QA slice.

## Rollback Path

Revert the QA PR. It adds tests, fixtures, and documentation only.
