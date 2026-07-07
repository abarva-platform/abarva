# 2026-06-08-intelligence-v3-live-substrate-stage-wiring — Wire Intelligence V3 non-corpus stages to live substrate for Skyline clients

## Release ID

`2026-06-08-intelligence-v3-live-substrate-stage-wiring`

## Status

`candidate`

## Plain-English Summary

Intelligence V3 now uses live, client-specific substrate for non-corpus stages on Skyline-style clients instead of defaulting to empty fixtures in those flows. The non-Meridian live path for `by-function`, `patterns`, `vendors`, `peer-activity`, `my-strategy`, and related stages now consumes the provided `ByFunctionData`, `VendorsData`, `PeerActivityData`, and `MyStrategyData` when `isLiveBound` is true.

Meridian behavior is preserved for its expected sparse path, and Apex/First Capital retain their existing specialized behavior.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence V3 page orchestration logic for multiple tenants. It changes what stage workspaces use as their substrate source (live-backed vs fallback fixtures).
- `client-data-lane`: No schema or migration changes; this is consumption logic only. It enables already-produced Azure-backed data to render where available.

## Client Applicability

- All clients: No direct behavior change for clients that already run on the existing special-casing paths.
- Specific clients: Skyline-like clients (for example SkyHarbor) now get live stage data when `isLiveBound` and live payloads are provided.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/components/intelligence-v3/IntelligenceV3Page.tsx`
  - Adds explicit `shouldUseLiveSubstrateForSkyline` gating.
  - Wires non-corpus stages (`by-function`, `patterns`, `vendors`, `peer-activity`, `my-strategy`) to live-mapped payloads when live substrate exists.
  - Keeps Meridian and Apex/First Capital paths intact to preserve intended asymmetry.
- `src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx`
  - Adds/updates assertions covering live-bound non-corpus rendering for Skyline-like tenants, including non-Meridian peer activity and strategy/corpus behavior.

## QA / Validation

- PASS: Re-authored on current `origin/main` on 2026-06-13 instead of merging the stale branch directly.
- PASS: `npx jest src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx --runInBand` — 10/10 tests passed.
- PASS: `npx eslint src/components/intelligence-v3/IntelligenceV3Page.tsx src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx`.
- PASS: `git diff --check`.
- NOT RUN: Live signed-in browser QA. This PR is UI substrate routing only; live Azure context evidence is covered by the context-layer evidence package and a separate deploy/browser pass if this PR ships.

## Rollout Plan

Merge this PR on `main` so the updated component and tests become the shared source of truth for Intelligence V3 rendering. No separate deploy config, migration, or environment variable change is required.

## Rollback Plan

- Revert this PR commit to restore previous stage-substrate behavior for Skyline-like clients.
- Because no DB or infra changes were made, rollback is purely code-level and safe.

## Audit Evidence

- Jest + ESLint output above.
- Manual inspection of `IntelligenceV3Page` stage rendering paths against the new `SkyHarbor` fixtures in `IntelligenceV3Page.corpus.test.tsx`.

## Known Gaps

- Does not add any new data-loader, tenant-seeding, or retrieval index changes.
- Pattern-binding and broader answer-quality hardening are handled in separate lanes/PRs.
