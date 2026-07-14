# 2026-07-14-home-story-quality-claude-render — Home Story Quality And Claude Render

## Release ID

`2026-07-14-home-story-quality-claude-render`

## Status

`candidate`

## Plain-English Summary

Home now treats the executive briefing as a client-facing story, not a diagnostics page. Active Home summaries and dimension explanations can be rendered through the audited Claude path from governed Home summary snapshots, while deterministic fallback copy remains available when Claude is disabled or unavailable. The Context Confidence page now explains why AbarVa collects enterprise dimensions, which modules use them, what can be safely answered, and what still needs validation.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: Home primary content leads with executive briefing, Context Confidence, dimension purpose, module usage, key records, and collapsed technical diagnostics.
- AI egress: Active Home summary rendering may call the audited Anthropic path when `ANTHROPIC_API_KEY` is present and `HOME_SUMMARY_CLAUDE_RENDER_ENABLED` is not disabled.
- Data serving: The Claude render consumes only the governed `HomeSummarySnapshot`; it does not read raw files, mutate tenant data, promote candidates, or change module runtime consumption.
- QA: Home smoke/content QA now validates story quality by tenant, dimension, and visible story block, not only rendering.

## Client Applicability

- All clients: Yes, for Home runtime and Home content QA behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `HOME_SUMMARY_CLAUDE_RENDER_ENABLED=false` disables Claude rendering and uses deterministic fallback.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/lib/home/home-summary-snapshot.ts`
- `src/lib/home/home-summary-runtime.ts`
- `src/lib/home/home-summary-claude-render.ts`
- `src/components/home/__tests__/HomeSurface.test.tsx`
- `scripts/qa/home-full-smoke-quality.ts`

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false --project tsconfig.json`
- Pass: `npm test -- src/components/home/__tests__/HomeSurface.test.tsx --runInBand --silent`
- Pass: `npm run audit:home:content-quality`
- Pass: `git diff --check`
- Pending before merge: `npm run release:check`
- Pending after merge: ACA deploy, runtime invariant, health, signed-in crawl, and Home page screenshot/browser proof.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the resulting main SHA to `app.abarva.ai`. No database migration, data load, tenant promotion, or Active Tenant Access update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: Existing runtime environment controls `HOME_SUMMARY_CLAUDE_RENDER_ENABLED`; no env change is required by this PR.
- Live signed-in proof required: Yes, Home route plus standard post-deploy crawl.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. If a faster mitigation is needed, set `HOME_SUMMARY_CLAUDE_RENDER_ENABLED=false` to force deterministic Home summary rendering while keeping the UI and QA changes in place.

## Audit Evidence

- PR URL: pending.
- QA output: `reports/home-smoke-quality/latest` from `npm run audit:home:content-quality`.
- Deploy evidence: pending ACA main deploy run after merge.
- Browser proof: pending signed-in crawl after deploy.

## Known Gaps

- Claude rendering is bounded to structured summary text and visual specs; it does not generate arbitrary HTML/SVG/CSS.
- Candidate preview remains deterministic and inactive by default.
- Full signed-in browser crawl is pending until the release is merged and deployed.
