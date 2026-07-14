# Intelligence Progressive Context Pack

## Purpose

Intelligence should not be chat over retrieved rows. It should answer executive questions by assembling the right governed enterprise context before Claude reasons.

The first runtime design target is progressive context assembly:

```text
question
  -> classify executive intent
  -> resolve entities and domains
  -> build FastContextPack
  -> build initial Claude payload
  -> stream the first answer
  -> enrich with DeepContextPack
  -> render evidence, gaps, caveats, and next evidence
```

## Latency Targets

- Intent classification: less than 500ms
- Entity resolution: less than 1s
- Fast context pack: less than 2s
- Claude first token: 5-8s
- Deep evidence enrichment: 10-15s
- Artifact generation: async after the answer

## Pack Types

### FastContextPack

The fast pack is the compact payload that should be enough to start the answer.

It includes:

- tenant summary,
- executive intent,
- inferred archetype,
- top entity profiles,
- top relationships,
- top risks,
- top metrics,
- known gaps,
- confidence summary.

### DeepContextPack

The deep pack enriches the answer after the first response can begin.

It includes:

- expanded relationship graph slice,
- evidence references,
- source lineage,
- spend/vendor/program context,
- process and data context,
- unsupported claims,
- recommended next evidence,
- caveats.

### ProgressiveClaudePayload

The model-visible payload is split into:

- `initialPayload`: compact, first-response context with no unsupported claims.
- `enrichmentPayload`: evidence and relationship detail that can be used after the initial answer.
- `auditPayload`: unsupported claims, truth boundary, and assembly trace for rendering and audit, not as supported facts.

## Cache Requirement

Runtime Intelligence must not rebuild context from raw tenant rows on every question.

These should be cacheable or precomputed:

- tenant knowledge summary,
- domain summaries,
- entity profiles,
- relationship graph slices,
- evidence confidence summaries,
- archetype-to-domain maps,
- common question packs.

## Boundary

This PR is dry-run/design proof only.

- No runtime Intelligence answer path changes.
- No Claude call.
- No production tenant data writes.
- No Active Tenant Access update.
- No candidate promotion.
- No module runtime behavior change.
- No Home, Moves, Source, or Tower behavior change.

## Proof Outputs

```text
reports/enterprise-knowledge-layer/intelligence-pack-proof/
  summary.md
  summary.json
  meridian-agent-assist-readiness.json
  meridian-finance-analytics-strategy.json
  harbortrust-fraud-copilot-readiness.json
  generic-enterprise-fallback.json
  intelligence-context-pack-proof.html
```

## Validation Command

```bash
npm run audit:intelligence-context-pack-dry-run
```

The audit verifies:

- four dry-run scenarios are generated,
- every pack is `moduleKey=intelligence`,
- every scenario has fast and deep pack sections,
- fast packs stay compact,
- deep packs carry relationship/evidence enrichment,
- unsupported claims do not leak into the initial Claude payload,
- audit payloads preserve unsupported claims,
- cache plan forbids raw-row runtime rebuild,
- truth boundaries remain non-destructive,
- no use-case-specific branching is introduced in source logic.
