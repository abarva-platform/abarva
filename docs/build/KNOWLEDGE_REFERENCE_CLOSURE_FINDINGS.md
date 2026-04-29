# Knowledge Reference Closure Findings

Date: 2026-04-29
Baseline: `origin/main` after PR #1082
Scope: read-only reference closure check, documented only. No corpus seed files were changed.

## Summary

A preflight check over `loadCorpus()` found nine pattern reference edges that point to missing pattern IDs. This is not a loader failure today because the loader validates solution and contradiction references, but does not yet validate all `PatternSeed.relatedPatternIds` or `PatternSeed.derivedFromPatternIds`.

Do not add a failing CI test until the corpus owner fixes or intentionally suppresses these edges.

## Broken References

| Source pattern | Field | Missing target |
| --- | --- | --- |
| `PAT-SRC-CAT-CMS-001` | `relatedPatternIds` | `PAT-SRC-CAT-MA-001` |
| `PAT-SRC-CAT-CDP-001` | `relatedPatternIds` | `PAT-SRC-CAT-MA-001` |
| `PAT-SRC-CAT-EHS-001` | `relatedPatternIds` | `PAT-SRC-CAT-ESG-001` |
| `PAT-SRC-CON-002` | `relatedPatternIds` | `PAT-SRC-RENEWAL-001` |
| `PAT-SRC-CON-003` | `relatedPatternIds` | `PAT-SRC-DECOM-001` |
| `PAT-SRC-PROC-007` | `relatedPatternIds` | `PAT-SRC-RENEWAL-001` |
| `PAT-SRC-PROC-007` | `derivedFromPatternIds` | `PAT-SRC-RENEWAL-001` |
| `PAT-SRC-VEN-DOCUSIGN-001` | `relatedPatternIds` | `PAT-SRC-RENEWAL-001` |
| `PAT-SRC-VEN-GITLAB-001` | `relatedPatternIds` | `PAT-SRC-CON-SLA-001` |

## Interpretation

These look like planned or renamed corpus IDs rather than runtime defects. The common missing targets are:

- `PAT-SRC-CAT-MA-001`: likely a marketing automation category pattern that is not present yet.
- `PAT-SRC-CAT-ESG-001`: likely an ESG/sustainability category pattern that is not present yet.
- `PAT-SRC-RENEWAL-001`: likely superseded by the process renewal-calendar pattern `PAT-SRC-PROC-007`, or intended as a future renewal doctrine pattern.
- `PAT-SRC-DECOM-001`: likely a decommission/exit-assistance doctrine pattern not currently loaded.
- `PAT-SRC-CON-SLA-001`: likely a contract SLA pattern whose current ID may differ.

## Recommended Fix Sequence

1. Corpus owner reviews whether each missing ID should be created, renamed to an existing ID, or removed.
2. If the target is planned but not authored yet, add a founder-data-gap note in the state tracker rather than leaving a broken edge.
3. After these nine edges are resolved, add an additive integrity test that checks:
   - `relatedPatternIds` are loaded pattern IDs.
   - `derivedFromPatternIds` are loaded pattern IDs.
   - `taggedContradictionIds` are loaded contradiction IDs.
4. Only then make reference closure a CI gate.

## Evidence Command

```bash
npx tsx -e "import { loadCorpus } from './src/lib/intelligence'; const corpus=loadCorpus({loadedAt:'audit'}); const patternIds=new Set(corpus.patterns.map(p=>p.id)); const contradictionIds=new Set(corpus.contradictions.map(c=>c.id)); const misses=[]; for (const p of corpus.patterns){ for (const id of p.relatedPatternIds||[]) if(!patternIds.has(id)) misses.push(p.id+' related '+id); for(const id of p.derivedFromPatternIds||[]) if(!patternIds.has(id)) misses.push(p.id+' derived '+id); for(const id of p.taggedContradictionIds||[]) if(!contradictionIds.has(id)) misses.push(p.id+' contradiction '+id);} console.log(JSON.stringify({patterns:corpus.patterns.length, misses}, null, 2));"
```

## Validation

`git diff --check` passed for this findings document.
