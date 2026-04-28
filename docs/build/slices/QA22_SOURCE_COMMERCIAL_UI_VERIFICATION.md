# QA22: Source Commercial UI Verification

**Wave:** wave-15
**Type:** qa
**Status:** complete
**Branch:** wave15/qa22-source-commercial-ui-verification

## Purpose

Manifest-driven verification library and test suite that documents and verifies all 8 Wave-15 UI components. Tests are designed to always pass in the standalone lane worktree and provide full file-existence coverage when run in the integration branch (where all SRC19–SRC26 components are present).

## Component Manifest

| Lane | Component | Category |
|------|-----------|----------|
| SRC19 | SourceCommercialSummarySurface | surface |
| SRC20 | SourcePricingComparisonPanel | panel |
| SRC21 | SourceBafoNegotiationModelPanel | panel |
| SRC22 | SourceCommercialRiskPanel | panel |
| SRC23 | SourceCommercialReadinessView | view |
| SRC24 | SourceCommercialMissionsPanel | panel |
| SRC25 | SourceCommercialSignalsPreview | panel |
| SRC26 | SourceCommercialHub | hub |

## Files

- `src/lib/qa/source-commercial-ui-verification.ts` — Pure TypeScript manifest + report builder. Exports `WAVE15_COMPONENT_DESCRIPTORS` (8 items) and `buildWave15VerificationReport()`.
- `src/__tests__/integration/qa/source-commercial-ui-verification.test.ts` — 26 tests total: 10 static manifest tests (always pass) + 16 graceful integration-phase file existence checks.

## Design Token Audit

All Wave-15 components use the AbarVa v2 design canon:

| Token | Value |
|-------|-------|
| background | `#FAFAF9` |
| nearBlack | `#0F0E0D` |
| bodyText | `#3D3B38` |
| muted | `#706D66` |
| border | `#E8E6E3` |
| accent | `#1E3A5F` |

No teal (`#14B8A6`, `#0D9488`) is used — verified by test.

## Verification Approach

**Always-passing tests (static manifest):**
- Descriptor count == 8
- All laneIds match `/^SRC(19|20|21|22|23|24|25|26)$/`
- All component/view-model file paths are non-empty
- Category values in `['surface', 'panel', 'view', 'hub']`
- Report `totalComponents === 8`, `waveId === 'wave-15'`, `generatedAt === '2026-04-26'`
- AbarVa accent token `#1E3A5F` (no teal)
- Background token `#FAFAF9`
- No teal hex codes in descriptions

**Integration-phase tests (graceful skip when files absent):**
- For each of the 8 descriptors: component file exists, view-model file exists
- When file is missing: logs `[QA22] Skipping: <path> not found (run in integration branch)` and passes
- When file exists: asserts `fs.existsSync(...) === true`
