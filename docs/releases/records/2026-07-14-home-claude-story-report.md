# 2026-07-14-home-claude-story-report — Home Claude Story QA Report

## Release ID

`2026-07-14-home-claude-story-report`

## Status

`candidate`

## Plain-English Summary

Adds a detailed Home story-quality report that shows, tenant by tenant and page by page, what governed Home snapshot was sent to Claude, what Claude returned, what Home would render, and whether the result tells a credible client story with the right evidence boundaries.

## Layer Impact

- `global-control-lane`: Adds an internal QA/reporting command and a small audit helper around the existing Home Claude render path.
- `internal-admin`: Produces a local report artifact for reviewer/operator use. It does not expose a new product route.
- `ai-egress`: Reuses the audited Anthropic egress path already used by Home summary rendering.

## Client Applicability

- All clients: The report can assess every registry-active tenant that has Home/module-context data.
- Specific clients: None.
- Internal only: Yes, this is an internal QA artifact.
- Public/demo only: No.
- Feature flag: `HOME_SUMMARY_CLAUDE_RENDER_ENABLED=false` disables Claude calls; the report then records deterministic fallback status.

## Changes Included

- Adds `scripts/qa/home-claude-story-report.ts`.
- Adds `npm run audit:home:claude-story-report`.
- Exposes an audit envelope from `src/lib/home/home-summary-claude-render.ts`.

## QA / Validation

- Pass:
  - `npm run audit:home:claude-story-report`
    - 6 tenants
    - 6 Claude-applied reports
    - 6 pass / 0 watch / 0 fail
- Pass:
  - `npx tsc --noEmit --pretty false --project tsconfig.json`
  - `npx eslint scripts/qa/home-claude-story-report.ts src/lib/home/home-summary-claude-render.ts`
  - `npm run release:check`
  - `git diff --check`

## Rollout Plan

Merge through PR. No runtime data mutation, no Active Tenant Access update, no candidate promotion, and no module behavior change are required. The report is generated on demand by running `npm run audit:home:claude-story-report`.

## Deployment Authority

- Repo-owned deploy workflow: Standard ACA main deploy if merged.
- Shared runtime mutators: None.
- Approved image digest: Captured by ACA main deploy if merged.
- ACA runtime invariant: Required only after merge/deploy.
- Worker image invariant: Required only after merge/deploy.
- Feature/env flag update path: None in this PR.
- Live signed-in proof required: Not required for the report command itself; live Home proof remains separate.

## Rollback Plan

Revert the PR. Runtime Home behavior remains protected by the existing deterministic fallback if Claude reporting fails or is disabled.

## Audit Evidence

- Report artifact: `reports/home-claude-story/latest/home-claude-story-report.html`
- JSON artifact: `reports/home-claude-story/latest/home-claude-story-report.json`
- PR checks and local command output.

## Known Gaps

The report judges Home summary/story quality. It does not validate every downstream Intelligence, Moves, Source, or Tower workflow.
