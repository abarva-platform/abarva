# Source Commercial Convergence Developer Guide

## Purpose
This guide defines the canonical commercial import flow so Source executive decision paths stay converged and deterministic.

## Canonical Commercial Flow
1. Use `src/lib/source/commercial-signals.ts` to converge pricing, BAFO, and risk outputs into one canonical commercial signal contract.
2. Use `src/lib/source/commercial-mission-adapter.ts` to convert commercial mission queue output into canonical Source agent missions.
3. Use `src/lib/source/executive-decision-summary.ts` as a thin synthesis layer over:
   - commercial signals
   - unified/canonical agent missions

## What to Use
- Use `buildSourceCommercialSignals(...)` for canonical commercial posture/tradeoff inputs.
- Use `buildSourceCommercialAgentMissions(...)` for canonical mission consumption and duplicate-safe mission merging.
- Use `buildSourceExecutiveDecisionSummary(...)` for deterministic executive decision posture synthesis.

## What Not to Import Directly in Executive Paths
Do **not** directly import these modules from executive synthesis/panel paths:
- `bafo-negotiation-model`
- `pricing-normalization-model`
- `commercial-risk-detection`
- `bafo-negotiation`
- `pricing-normalization`

These remain implementation/detail modules and should be consumed behind canonical adapters/contracts.

## Wave-14 Module Positioning
Wave-14 modules remain available and valid, but should be used through converged adapters:
- `commercial-signals` adapts BAFO/pricing/risk into one contract.
- `commercial-mission-adapter` maps commercial queue output into canonical Source agent mission shape.

## Future Deprecation Guidance
- Keep legacy/parallel model modules intact until all downstream paths consume canonical adapters.
- Prefer adding guard tests over direct refactors when hardening import boundaries.
- When deprecating direct model imports, do so only after:
  - import-boundary guard tests are green
  - convergence smoke coverage is green
  - no executive path imports bypass adapters

