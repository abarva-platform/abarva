# 2026-05-25-sentinel-reasoning-tenant-scope — Tenant-Scoped Sentinel Reasoning Stages

## Release ID

`2026-05-25-sentinel-reasoning-tenant-scope`

## Status

`candidate`

## Plain-English Summary

The Meridian full-module stress run found a second tenant leakage path after the system-prompt pin was fixed: Sentinel's IT-productivity reasoning state machine still contained deterministic Apex wording in streamed stage content. A Meridian user could therefore see phrases like "Apex application portfolio" even when the authenticated tenant was Meridian. This release replaces that deterministic copy with tenant-aware labels, prevents Apex-only AS/400 blocker fallbacks from loading for non-Apex tenants, and removes the Apex default from Sentinel ask routing.

## Layer Impact

- `agent-reasoning-lane`: Sentinel IT-productivity stages now label portfolio context from the resolved tenant instead of a hardcoded Apex string.
- `client-data-lane`: Apex AS/400 blocker fallback edges are gated to Apex tenant context only, preventing contaminated APX context from being emitted for non-Apex tenants.
- `app-control-lane`: `/api/intelligence/ask` no longer initializes Sentinel classification or reasoning with an Apex fallback when tenant context is unresolved.
- `ops-release-lane`: The Sentinel tenant-pin smoke test now guards the state machine and ask route in addition to the synthesizer prompt and generic chat route.

## Client Applicability

- All clients: yes
- Specific clients: Meridian Health receives the immediate P0 fix verified by the stress run; Apex Retail and First Capital receive safer tenant isolation.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/agents/sentinel-reasoning/state-machine.ts`
- `src/app/api/intelligence/ask/route.ts`
- `scripts/smoke/sentinel-tenant-pin.spec.ts`

## QA / Validation

- `npm run smoke:sentinel-tenant-pin` passed.
- `eslint src/app/api/intelligence/ask/route.ts src/lib/agents/sentinel-reasoning/state-machine.ts scripts/smoke/sentinel-tenant-pin.spec.ts` passed using the shared workspace dependency tree.
- `jest src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts --runInBand` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge to `main`, let the production post-deploy crawl run, then rerun the Meridian full-module stress report against the deployed build.

## Rollback Plan

Revert the merge commit if the post-deploy crawl or Meridian rerun fails. No migrations are included.

## Audit Evidence

- PR URL and post-deploy crawl run will be attached after merge.
- Meridian stress report rerun will live under `audit-artifacts/full-module-stress-meridian-2026-05-25-0747/`.

## Known Gaps

The full-module stress runner still reports zero LLM dollars because the current `ai_egress_audit` schema exposed to the run does not include cost/tokens columns. It records call counts and schema columns instead.
