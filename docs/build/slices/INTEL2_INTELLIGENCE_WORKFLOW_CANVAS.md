# INTEL2 · Intelligence Sentinel Workflow Canvas

**Slice ID:** INTEL2
**Title:** Intelligence Sentinel Workflow Canvas
**Status:** code_complete
**Wave:** wave-21
**Lane:** F
**Date:** 2026-04-26

## Blueprint Followed

INTELLIGENCE_PAGE_BLUEPRINT.md — Sentinel-primary command surface. Covers:
- Sentinel brief strip (agent label, tenant, confidence, caveat)
- Active pattern strip (top 3 deterministic seed patterns for apex-retail)
- Mode tabs (Summary / Evidence / Programs / Actions / Signals)
- Next action area (Sentinel recommended next action)
- Deterministic seed caveat footer

## Design Canon

- Background: #FBFAF7 (off-white, per AbarVa canon)
- Sentinel brief panel: #0F1E3F (dark navy), white text
- Accent: #1B2B5C (dark blue), never teal (#14B8A6 absent from component)
- Font: DM Sans, sans-serif
- No sparkles, no emoji, no decorative icons
- Pattern strip uses left border accent (#1B2B5C), white card body
- Next action block uses #F0F2F7 background

## Agent-Centric Enforcement

Per AGENT_CENTRIC_ENFORCEMENT_REVIEW.md:
- Sentinel is primary and named explicitly (agentLabel: 'Sentinel')
- Context used is disclosed (contextUsed array surfaced in brief)
- Confidence level is explicit (confidenceLevel: 'medium' | 'low')
- Missing evidence is disclosed (missingEvidence array)
- Unsupported claims are enumerated (unsupportedClaims array)
- Recommended next action is always present
- Deterministic seed caveat is displayed in Sentinel brief and footer
- Non-generic: apex-retail returns rich AMS scenario data; other tenants return low-confidence brief with explicit tenantRichnessCaveat
- No false live intelligence claimed

## Files

- `src/lib/intelligence/intelligence-workflow-canvas-view.ts` — View model: types, buildSentinelBriefView, buildIntelligenceWorkflowCanvasView
- `src/components/intelligence/IntelligenceWorkflowCanvas.tsx` — React component (server-compatible, no client hooks)
- `src/__tests__/integration/intelligence/intelligence-workflow-canvas.test.ts` — 12 deterministic tests, no jsdom

## Deviations

None. Blueprint followed exactly. Live mode switching (client state) deferred — activeMode is a prop; wiring to interactive tabs is a follow-on slice. Evidence/Programs/Actions/Signals mode content panels deferred to subsequent slices per blueprint workflow sequence.

## Test Coverage

12 assertions:
- buildSentinelBriefView('apex-retail') non-null
- agentLabel === 'Sentinel'
- topPatternLabel non-empty
- contextUsed >= 1 item
- deterministicSeed === true
- deterministicSeedCaveat contains 'Deterministic'
- confidenceReason non-empty
- meridian confidenceLevel === 'low'
- arcturus affectedPrograms empty
- apex-retail patternStrip.length > 0
- meridian patternStrip.length === 0
- availableModes has 5 entries
- Component file exists
- Component does not contain '#14B8A6'
- Component contains 'SENTINEL'
