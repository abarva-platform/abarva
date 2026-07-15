# Moves Knowledge Runtime

## Status

`KNOWLEDGE-LAYER-MOVES-RUNTIME-PR6` makes Moves the first controlled runtime consumer of the Enterprise Knowledge Layer. The integration is guarded by `ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME`, which defaults to `false`.

This is a supplier-consumer proof, not an automatic evidence attachment feature.

## Runtime Boundary

When the flag is disabled, the existing Moves generation path remains unchanged.

When the flag is enabled, Moves can ask the Enterprise Knowledge Layer for a phase-scoped context packet:

```text
Move phase action
  -> Enterprise Knowledge Layer request
  -> active context pack
  -> cache-backed phase sections
  -> Knowledge Context Preview artifact
  -> Claude-ready payload prepared for downstream generation input
```

The preview artifact is reviewable context. It is not attached as Move evidence automatically, and it is not active tenant data.

## Guardrails

The runtime helper must preserve these guardrails:

- Feature flag required.
- Default enabled is false.
- Existing Moves behavior is unchanged when the flag is false.
- No production tenant data writes.
- No Active Tenant Access update.
- No candidate promotion.
- No candidate reads by default.
- No source-adapter rows treated as active facts.
- No Claude call in the PR6 audit.
- Unsupported claims remain visible for review but excluded from the Claude-ready payload.

## Phase Contract

The helper supports P0 through P5 at the contract level:

- P0 Intake & Decision Framing
- P1 Charter & Baseline
- P2 Diagnose & Evidence Pressure-Test
- P3 Options & Business Case
- P4 Executive Decision & Commit
- P5 Execution Handoff

The PR6 proof exercises Meridian P2, Meridian P1, and a generic P0 scenario. It also runs a P0-P5 contract sweep.

## Preview Artifact

The Knowledge Context Preview artifact includes:

- what AbarVa knows
- relevant functions
- relevant systems
- relevant data domains
- relevant infrastructure
- relevant vendors and contracts
- relevant metrics
- relevant risks and controls
- evidence references
- confidence summary
- known gaps
- unsupported claims
- recommended next evidence
- candidate/source-adapter boundary
- Claude-ready context payload

Audit-only diagnostics are stored separately under `debugOnlyDiagnostics` and must not appear in the Claude-ready payload.

## Proof

Run:

```bash
npm run audit:moves-knowledge-runtime
```

The proof bundle is written to:

```text
reports/enterprise-knowledge-layer/moves-runtime-proof/
```

Required proof files:

- `summary.md`
- `summary.json`
- `meridian-agent-assist-p2-runtime.json`
- `meridian-finance-p1-runtime.json`
- `generic-vendor-onboarding-p0-runtime.json`
- `moves-runtime-context-proof.html`
