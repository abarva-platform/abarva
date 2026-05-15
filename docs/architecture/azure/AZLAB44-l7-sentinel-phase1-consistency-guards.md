# AZLAB44 - L7 Sentinel Phase 1 Consistency Guards

Status: implemented in repo  
Date: 2026-05-15  
Layer: L7 - Agent quality

## Why This Matters

The 2026-05-13 audit found that Sentinel could produce an otherwise strong consultant answer with a simple internal contradiction: ranking an `$8.8M` vendor above a `$13.6M` vendor while calling it the "true rank." PR #1932 added the first arithmetic-ranking guard. AZLAB44 extends that pattern into the first broader guard set.

The principle is simple: do not wait for a CXO to catch arithmetic, date, or citation contradictions that the product can catch deterministically before the answer is trusted.

## What Landed

`checkSentinelVoice()` now runs the existing voice checks plus Phase 1 consistency checks:

| Guard | What it catches | Example |
|---|---|---|
| G1 Sum reconciliation | Component dollar values that do not add to the stated total within rounding tolerance. | `$4M + $3M + $2M, totaling $10M` |
| G2 Date math | Relative date claims that conflict with an absolute date in the same sentence. | `in 8 months on Sep 30, 2026` when reference date is May 15, 2026 |
| G6 Pattern-citation validity | Pattern IDs outside the known demo/corpus registry. | `P-HC-099` |

The existing ranked-money guard remains active.

## Files

| File | Purpose |
|---|---|
| `src/lib/agent/voice-doctrine/sentinel.ts` | Adds the Phase 1 consistency guard dispatcher and implementations. |
| `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts` | Adds green/red tests for G1, G2, and G6. |

## Validation

```bash
npm run test:behaviors -- --testPathPatterns=voice-doctrine/__tests__/sentinel
npx eslint src/lib/agent/voice-doctrine/sentinel.ts src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts
npx tsc --noEmit -p tsconfig.json
```

The behavior suite passed with 131 tests. Jest still prints the existing duplicate-manual-mock warnings for markdown mocks; those warnings predate this slice and do not affect the guard behavior.

## Current Limits

The pattern-citation guard is intentionally conservative. It recognizes the currently used demo/corpus families (`F200`-style retail patterns, `P-HC-*`, `P-FS-*`, and common `PAT-*` families) and flags obvious unknown IDs. It should not become a strict corpus database lookup until the pattern registry is fully normalized across Intelligence, Source, and tenant demo seeds.

## Next Step

Wire guard telemetry into the C5 pilot dashboard so caught-violation rates and false-positive rates can be reviewed per guard before Phase 2 guards are enabled.
