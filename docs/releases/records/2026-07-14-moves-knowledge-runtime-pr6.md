# 2026-07-14-moves-knowledge-runtime-pr6 — Moves Knowledge Runtime

## Release ID

`2026-07-14-moves-knowledge-runtime-pr6`

## Status

`candidate`

## Plain-English Summary

This release candidate makes Moves the first controlled runtime consumer of the Enterprise Knowledge Layer, but only behind the non-default `ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME` flag. When enabled, Moves can build a phase-aware context pack and a reviewable Knowledge Context Preview artifact before downstream generation. When the flag is disabled, existing Moves behavior remains unchanged.

## Layer Impact

- `global-control-lane`: adds a shared Enterprise Knowledge consumer helper for Moves, documentation, audit proof, and report bundle.
- Moves runtime: unchanged by default. The helper is available only when `ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME=true`; no route or product call site is flipped in this PR.
- Data behavior: no tenant data writes, no Active Tenant Access update, no candidate promotion, and no active promotion.
- AI egress: no Claude call in this PR proof. The Claude-ready context payload is prepared as governed input material but is not sent by the audit.

## Client Applicability

- All clients: yes, as dormant shared foundation.
- Specific clients: proof fixtures exercise Meridian Health P1/P2 and a generic P0 vendor-onboarding framing scenario.
- Internal only: audit command and proof bundle.
- Public/demo only: no.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME=false` by default.

## Changes Included

- `src/lib/enterprise-knowledge/moves/moves-knowledge-runtime.ts`
- `src/lib/enterprise-knowledge/moves/moves-context-pack-dry-run.ts`
- `src/lib/enterprise-knowledge/moves/index.ts`
- `scripts/audit/build-moves-knowledge-runtime-proof.ts`
- `docs/architecture/moves-knowledge-runtime.md`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/*`
- `package.json` script: `audit:moves-knowledge-runtime`

## QA / Validation

- Pass: `npm run audit:moves-knowledge-runtime`
- Pass: `npm run audit:knowledge-module-preview`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-naming`
- Pass: `./node_modules/.bin/tsc --ignoreConfig --noEmit --pretty false --target es2022 --module nodenext --moduleResolution nodenext --strict --types node src/lib/enterprise-knowledge/contracts/index.ts src/lib/enterprise-knowledge/cache/index.ts src/lib/enterprise-knowledge/moves/index.ts scripts/audit/build-moves-knowledge-runtime-proof.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge by PR only. No ACA deployment is required because the feature flag defaults to false, no runtime route or product call site is flipped, and no tenant data is mutated. A future rollout that enables the flag must use the approved ACA deployment path and signed-in runtime proof.

## Deployment Authority

- Repo-owned deploy workflow: not required for this dormant helper.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not required for this proof-only release.
- Worker image invariant: not applicable.
- Feature/env flag update path: no flag update in this PR; future enablement must use the approved deployment path.
- Live signed-in proof required: no, because no runtime route or module behavior changed by default.

## Rollback Plan

Revert the PR. Since no data is written, no candidate is promoted, and no live call site is enabled by default, rollback is code-only.

## Audit Evidence

- `reports/enterprise-knowledge-layer/moves-runtime-proof/summary.md`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/summary.json`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/meridian-agent-assist-p2-runtime.json`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/meridian-finance-p1-runtime.json`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/generic-vendor-onboarding-p0-runtime.json`
- `reports/enterprise-knowledge-layer/moves-runtime-proof/moves-runtime-context-proof.html`

## Known Gaps

This is controlled runtime helper proof only. It does not attach Move evidence, does not flip the production Moves route, does not call Claude, and does not enable the feature flag in ACA.
