# INTEL3 — Sentinel Evidence / Source Basis Brief

**Wave:** wave-21
**Lane:** G
**Status:** code_complete

## Summary

Lands the Sentinel Evidence Brief view model and UI component — a structured, disclosure-first read model and card component that exposes which evidence Sentinel has used, what is missing, which claims are unsupported, and what the recommended next action is. This addresses the Evidence/Source Basis Drawer section of the Intelligence Page Blueprint.

## Files

### `src/lib/intelligence/sentinel-brief-evidence-view.ts`

View model and builder function for the Sentinel evidence brief. Exports:

- `EvidenceItem` — individual evidence record with `evidenceId`, `label`, `status`, `source`, `note`, and `deterministicSeed: true`
- `SentinelEvidenceBriefView` — full brief including confirmed evidence, missing evidence, unsupported claims, affected work, confidence level, context used, recommended next action, and seed caveat
- `buildSentinelEvidenceBriefView(tenantSlug, surface?)` — deterministic builder; returns rich evidence for `apex-retail`, thin/insufficient state for all other tenants

Tenant behavior:
- `apex-retail`: `evidenceConfidenceLevel: 'medium'`, 3 confirmed evidence items, 3 missing evidence items, 2 unsupported claims, 2 affected work items
- All other tenants: `evidenceConfidenceLevel: 'insufficient'`, 0 confirmed evidence, 2 thin missing evidence items

### `src/components/intelligence/SentinelEvidenceBrief.tsx`

React component rendering the evidence brief card. Design canon compliant:
- Background: `#FBFAF7` (warm off-white)
- Navy dark-blue accent: `#1B2B5C`
- Dark ink text: `#0A0C12`
- Font: `DM Sans, sans-serif`
- No teal (`#14B8A6`)
- Missing evidence block: amber warning strip (`#FFF7ED` / `#F59E0B`)
- Recommended action block: light blue-grey (`#F0F2F7`)
- Caveat: muted grey (`#9AA3B2`)

## Test

`src/__tests__/integration/intelligence/sentinel-evidence-brief.test.ts` — 14 assertions covering:
- View model returns non-null for apex-retail
- tenantSlug, contextUsed, evidenceConfidenceLevel, evidenceConfidenceReason populated
- confirmedEvidence length (3), missingEvidence length (3) for apex-retail
- All evidence items carry `deterministicSeed: true`
- deterministicSeedCaveat contains 'seed' or 'Deterministic'
- meridian returns `evidenceConfidenceLevel: 'insufficient'`
- arcturus confirmedEvidence is empty
- Component file exists, contains 'SENTINEL', does not contain teal color

## Agent-Centric Compliance

- Context-first: `contextUsed` array discloses exactly which seed sources were used
- Confidence declared: `evidenceConfidenceLevel` + `evidenceConfidenceReason` — not hidden
- Missing inputs flagged: `missingEvidence` array with per-item notes
- Unsupported claims flagged: `unsupportedClaims` array — Sentinel does not claim what it cannot support
- Next action specific: `recommendedNextAction` is actionable, not generic
- Deterministic seed disclosed: `deterministicSeedCaveat` present on every view

## Blueprint reference

INTELLIGENCE_PAGE_BLUEPRINT.md — Evidence/Source Basis Drawer section:
> "Open: View Evidence Basis → shows which seed data underpins each pattern."

Agent-Centric Enforcement Review requirements met:
- Explicit confidence/missing-context declaration
- Non-generic, pattern-specific recommended action
- Low-context disclosure for thin tenants

## Design canon

- Warm off-white base (#FBFAF7)
- DM Sans body font
- Dark navy (#1B2B5C) for Sentinel identity labels
- No teal, no sparkles, no full-page dark mode
- Amber strip for missing evidence warnings

## Non-goals

- No live signal ingestion
- No model calls
- No production_ready promotion
- No auth modification
- No route mount (component is available for additive wiring)
