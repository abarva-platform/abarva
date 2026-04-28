# Intelligence Wave I2 Plan

## Scope

- Catalog entries: `INT-DTL-VALIDATED`, `INT-DTL-INREVIEW`, `INT-DTL-CANDIDATE`, `INT-DTL-DEPRECATED`
- Out of scope: signals, graph browser, quality lens

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `src/components/intelligence/SentinelPatternDetail.tsx` | modify | canonicalize detail layout |
| `src/components/intelligence/PatternDetailPage.tsx` | modify | align shell-era validated page with canonical detail |
| `src/components/intelligence/DeprecatedPatternDetailPage.tsx` | modify | bring deprecated state under same contract |
| `src/components/intelligence/EvidenceDatasetDrawer.tsx` | modify | prepare provenance-adjacent evidence behavior |
| `src/components/intelligence/SentinelPatternContentPanel.tsx` | modify | authored content consistency |

## Component dependency graph

detail route -> pattern detail read model -> content panel + evidence drawer + rail

## Knowledge fabric contract changes

- introduce canonical provenance display contract
- no graph-schema change required

## Test plan

- validated, in-review, candidate, deprecated detail renders
- evidence drawer visible and deterministic
- provenance ribbon or equivalent display assertions

## Risk & mitigation

- Risk: three overlapping detail implementations drift further apart
- Mitigation: pick `SentinelPatternDetail` as the canonical base and treat the rest as variants

## Auto-approval claim

- likely eligible, but held if provenance display expands beyond the approved surfaces
