# Intelligence Knowledge Runtime

## Status

`KNOWLEDGE-LAYER-INTELLIGENCE-RUNTIME-PR8` adds a feature-flagged proof path for Intelligence to assemble progressive Enterprise Knowledge context before any future Claude synthesis path.

The flag is:

```text
ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_RUNTIME=false
```

The flag defaults to false. This PR does not change the default Intelligence ask path, default Claude prompt, routes, tenant data, Active Tenant Access, candidate promotion, or module runtime behavior.

## Purpose

Intelligence needs a governed context step before synthesis:

```text
User question
  -> intent classification
  -> active Enterprise Knowledge context
  -> fast context pack
  -> initial Claude-ready payload
  -> deep context pack
  -> enrichment and audit payload
  -> future flagged Claude call
```

This PR builds and proves that context assembly boundary. It does not call Claude.

## Runtime Contract

The helper is:

```ts
assembleIntelligenceRuntimeContext(...)
```

When the flag is disabled, it returns a disabled result and preserves existing Intelligence behavior.

When the flag is enabled, it returns:

- `request`
- `cacheBuild`
- `intelligenceContextPack`
- `fastContextPack`
- `deepContextPack`
- `streamingAssemblyTrace`
- `progressiveClaudePayload`
- `timing`
- `claudeCallPlanWhenEnabled`
- `guardrails`

The payload is prepared for a future flagged Claude path, but the audit does not send it to Claude.

## Guardrails

- Feature flag required.
- Default enabled is false.
- Existing Intelligence behavior is unchanged when the flag is false.
- Default Claude prompt is unchanged.
- No Claude call in this PR audit.
- No production tenant data write.
- No Active Tenant Access update.
- No candidate promotion.
- No candidate reads by default.
- No source-adapter rows treated as active facts.
- Unsupported claims are held for audit and excluded from model-visible payloads.
- Realized value claims remain blocked unless measured evidence supports them.

## Proof

Run:

```bash
npm run audit:intelligence-knowledge-runtime
```

Proof bundle:

```text
reports/enterprise-knowledge-layer/intelligence-runtime-proof/
```

Required files:

- `summary.md`
- `summary.json`
- `meridian-agent-assist-runtime.json`
- `meridian-finance-runtime.json`
- `harbortrust-fraud-runtime.json`
- `generic-vendor-onboarding-runtime.json`
- `intelligence-runtime-proof.html`
- `timing.json`
