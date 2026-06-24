# 2026-06-24-home-know-llm-synthesis — Home KNOW LLM Synthesis Graft

## Release ID

`2026-06-24-home-know-llm-synthesis`

## Status

`candidate`

## Plain-English Summary

This release adds an optional phrase-only Claude synthesis pass to Home KNOW answers. The existing Home retrieval, semantic read-model views, facts, gaps, tables, charts, citations, and response contract stay deterministic. When the SkyHarbor-only feature flag is enabled, Home can ask Claude Opus to rewrite only the short answer prose from the already-computed facts and gaps, then falls back to the existing template prose if the model call fails or returns unsafe/mechanical language.

## Layer Impact

- `global-control-lane`: Adds the shared Home KNOW synthesis module and a feature-flagged prose swap in the Home KNOW engine.
- `experimental`: The runtime behavior is tenant-gated to SkyHarbor only while answer quality is evaluated.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor only through `home_know_llm_synthesis`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `home_know_llm_synthesis`, tenant policy, `includeTenants: ['skyharbor']`.

## Changes Included

- Added `src/lib/home/know/home-know-synthesis.ts`.
- Wired `buildHomeKnowResponse` to replace only `prose` with validated Claude phrase synthesis when the flag is enabled.
- Added `home_know_llm_synthesis` to `src/lib/features/registry.ts`.
- Added feature-flag coverage for SkyHarbor and the dashed `skyharbor-air` data-plane tenant key.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS: `npx jest src/lib/features/__tests__/is-feature-enabled.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/lib/home/know/__tests__/home-know-synthesis.test.ts --runInBand` (39 tests).
- PASS: `npx eslint src/lib/home/know/home-know-synthesis.ts src/lib/home/know/home-know-engine.ts src/lib/features/registry.ts src/lib/features/__tests__/is-feature-enabled.test.ts`.
- PASS: `npm run audit:control-plane-purity:check`.
- NOT RUN YET: DB-connected post-deploy acceptance: `BASE_URL=<env> HOME_KNOW_COOKIE=<skyharbor session> ANTHROPIC_API_KEY=<key> node scripts/qa/eval-home-know-quality.mjs`.
- Acceptance target for post-deploy proof: at least six of eight answers verdict `executive` or `acceptable`, zero deterministic hard fails, and Q5 remains `answerStatus: "handoff"`.

## Rollout Plan

Merge to `main` after review and gates, deploy through the repo-owned Azure Container Apps workflow, then run the Home KNOW quality eval against production with a signed-in SkyHarbor session.

## Deployment Authority

- Repo-owned deploy workflow: ACA `aca-main-deploy`.
- Shared runtime mutators: Next.js app image only.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required by deploy workflow.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Static feature registry; optional env allowlist `ABARVA_FEATURE_HOME_KNOW_LLM_SYNTHESIS_TENANTS`.
- Live signed-in proof required: Yes, after deploy.

## Rollback Plan

Turn off the `home_know_llm_synthesis` tenant flag or revert this release commit and redeploy the prior ACA image. No database migration or data-plane mutation is included.

## Audit Evidence

- Codex run logs for local tests and release checks.
- Post-deploy Home KNOW quality eval output.
- ACA deploy run and health evidence after merge.

## Known Gaps

The graft is prose-only. It does not change retrieval, semantic read models, table/chart/gap construction, or Home UI rendering.
