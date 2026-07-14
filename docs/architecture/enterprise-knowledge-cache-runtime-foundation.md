# Enterprise Knowledge Cache Runtime Foundation

## Purpose

The enterprise knowledge cache is the shared runtime substrate between the
knowledge-layer assembler and module-specific product surfaces. It prepares
read-only context artifacts that modules can consume later without rebuilding
the full semantic pack on every request.

This foundation is a supplier contract. It does not change Home, Intelligence,
Moves, Source, or Tower runtime behavior by itself.

## Cache Families

The cache foundation produces four deterministic cache families:

| Cache family | Purpose | Primary consumer pattern |
| --- | --- | --- |
| Entity profile cache | Stores business-readable entity profiles with evidence, gaps, readiness, and lineage. | Home browsing, module previews, later entity drilldowns. |
| Relationship slice cache | Stores validated and candidate relationship slices with relationship type counts, readiness, and evidence references. | Cross-domain reasoning, dependency inspection, phase/context previews. |
| Fast context pack cache | Stores a compact module-ready packet for low-latency orientation and first response assembly. | Home summary, Intelligence progressive first pass, Moves phase preview. |
| Deep context pack cache | Stores the expanded packet with profiles, facts, relationships, evidence, gaps, caveats, and Claude-ready governed payload. | Deeper module reasoning, audit review, later evidence attachment decisions. |

## Required Metadata

Every cache object carries:

- tenant key,
- cache scope,
- active or candidate mode,
- source version,
- context version,
- generated timestamp,
- evidence references,
- confidence summary,
- known gap summary,
- cache TTL policy,
- assembly trace reference,
- full assembly trace.

This lets operators answer which source version, context version, and assembler
trace produced a module-visible context object.

## Truth Boundary

The cache foundation preserves the active/candidate separation:

- active mode is the default,
- candidate preview is explicit only,
- active cache builds must not include candidate context,
- unsupported claims stay in audit fields and are excluded from the Claude-ready payload,
- source-adapter-only facts are not promoted into active truth by cache construction,
- no tenant data is written,
- no Active Tenant Access pointer is updated,
- no candidate is promoted,
- no module runtime behavior changes.

## Claude-Ready Payload

The cache can carry a Claude-ready context payload, but this PR does not call
Claude. The payload is the governed model-visible subset of the context pack. It
excludes:

- audit-only diagnostics,
- inactive candidate context unless explicitly requested,
- unsupported claims,
- source-adapter-only facts unless explicitly requested.

Modules can later pass this payload into the audited AI egress path after a
separate runtime integration PR.

## Timing Proof

The audit command builds deterministic fixture caches and writes:

- `reports/enterprise-knowledge-layer/cache-proof/summary.md`
- `reports/enterprise-knowledge-layer/cache-proof/summary.json`
- `reports/enterprise-knowledge-layer/cache-proof/cache-timing.json`
- `reports/enterprise-knowledge-layer/cache-proof/meridian-finance-cache.json`
- `reports/enterprise-knowledge-layer/cache-proof/meridian-agent-assist-cache.json`
- `reports/enterprise-knowledge-layer/cache-proof/harbortrust-fraud-cache.json`
- `reports/enterprise-knowledge-layer/cache-proof/generic-fallback-cache.json`
- `reports/enterprise-knowledge-layer/cache-proof/enterprise-knowledge-cache-proof.html`

Run:

```bash
npm run audit:enterprise-knowledge-cache
```

The proof must show that entity profiles, relationship slices, fast context
packs, deep context packs, metadata, truth boundaries, and timing were produced
without module behavior changes or data writes.

## Follow-On Work

The next workload may create feature-flagged module previews that read these
cache objects. That follow-on work must keep defaults unchanged and must not
call Claude, write tenant data, promote candidates, or change module behavior
unless explicitly enabled by its feature flag.
