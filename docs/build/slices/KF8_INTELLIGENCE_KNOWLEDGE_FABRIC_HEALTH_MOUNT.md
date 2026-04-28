# KF8 Intelligence Knowledge Fabric Health Mount

Date: 2026-04-28
Branch: `intelligence/kf8-health-panel`
Scope: deterministic Intelligence Summary panel mount

## Objective

Mount the KF-7 Knowledge Fabric health read model in the tenant Intelligence Summary tab so operators can see primitive counts, source coverage, citation coverage, contradiction coverage, and write-mode caveats without opening a separate admin surface.

## Files

| File | Change |
|---|---|
| `src/lib/intelligence/knowledge-fabric-health-view.ts` | New panel view model wrapping the KF-7 read model for display. |
| `src/components/intelligence/KnowledgeFabricHealthPanel.tsx` | New server-renderable panel. |
| `src/components/intelligence/IntelligenceLensTabs.tsx` | Mount panel in Summary after context used and before recommended action. |
| `src/__tests__/integration/intelligence/knowledge-fabric-health-panel.test.tsx` | Render, mount, determinism, and hygiene tests. |

## Boundary

No route changes, no client state, no live retrieval, no Supabase, no graph/vector/object/ledger writes, no model SDKs, and no mutation of Knowledge Fabric stores. This is a deterministic UI mount only.

## QA

```bash
npx jest src/__tests__/integration/intelligence/knowledge-fabric-health-panel.test.tsx --runInBand
npx jest src/__tests__/integration/intelligence/knowledge-fabric-health.test.ts src/__tests__/integration/intelligence/intel4-lens-tabs.test.ts --runInBand
npx eslint --max-warnings=0 src/lib/intelligence/knowledge-fabric-health-view.ts src/components/intelligence/KnowledgeFabricHealthPanel.tsx src/components/intelligence/IntelligenceLensTabs.tsx src/__tests__/integration/intelligence/knowledge-fabric-health-panel.test.tsx
output=$(npx tsc --noEmit --pretty false 2>&1); filtered=$(printf '%s\n' "$output" | grep -v '\.next/types/validator.ts' || true); if [ -n "$filtered" ]; then printf '%s\n' "$filtered"; exit 1; fi
git diff --check
```
