# KF-7 Knowledge Fabric Health Read Model

Date: 2026-04-28
Branch: `intelligence/kf7-fabric-health-read-model`
Scope: deterministic read model only

## Objective

Create a safe Knowledge Fabric health read model that lets Intelligence report primitive counts, provenance coverage, citation coverage, contradiction coverage, and known caveats without touching graph, vector, object, or ledger stores.

## Files

| File | Change |
|---|---|
| `src/lib/intelligence/knowledge-fabric-health.ts` | New deterministic read model built from `loadCorpus`, `corpusToPrimitives`, and `detectContradictions`. |
| `src/__tests__/integration/intelligence/knowledge-fabric-health.test.ts` | New regression tests for counts, determinism, coverage, and writer isolation. |
| `docs/build/slices/KF7_KNOWLEDGE_FABRIC_HEALTH_READ_MODEL.md` | This slice note. |

## Boundaries

This slice does not mount UI. It does not call `indexCorpus`, `createKnowledgeFabric`, `resolveKnowledgeFabricWriteMode`, Supabase, model SDKs, `fetch`, or any graph/vector/object/ledger writer. The default loaded-at value is fixed so the default read model is deterministic.

## Contract

`buildKnowledgeFabricHealthView()` returns:

| Field | Meaning |
|---|---|
| `createdFrom` | Constant provenance marker: `deterministic_knowledge_fabric_health_seed`. |
| `primitiveCounts` | Counts for Pattern, Signal, Solution, and Contradiction primitives. |
| `sourceCoverage` | Direct `sourceId` coverage across all primitives. |
| `citationCoverage` | Citation-style evidence coverage across primitive families. |
| `contradictionCoverage` | Corpus contradiction count plus deterministic detector findings. |
| `coverageGaps` | Human-readable gaps with severity and rationale. |
| `storeWriteStatus` | Always `not_live` for this slice. |

## QA

Run locally:

```bash
npx jest src/__tests__/integration/intelligence/knowledge-fabric-health.test.ts --runInBand
npx eslint --max-warnings=0 src/lib/intelligence/knowledge-fabric-health.ts src/__tests__/integration/intelligence/knowledge-fabric-health.test.ts
output=$(npx tsc --noEmit --pretty false 2>&1); filtered=$(printf '%s\n' "$output" | grep -v '\.next/types/validator.ts' || true); if [ -n "$filtered" ]; then printf '%s\n' "$filtered"; exit 1; fi
git diff --check
```

## Exit criteria

The read model is deterministic, test-covered, writer-isolated, and ready for a later UI slice to mount into the Intelligence health or admin surface.
