# 2026-06-26-home-local-dossier-claude-synthesis — Home Local Dossier Synthesis Trace

## Release ID

`2026-06-26-home-local-dossier-claude-synthesis`

## Status

`candidate`

## Plain-English Summary

Extends the already-enabled Home KNOW Claude synthesis path to the local dimension dossier fallback. Lakeshore currently has rich local dossier material but no curated Semantic2 dossier rows for several dimensions, so Home was returning before the Anthropic synthesis boundary and the operator trace could not capture the real prompt or raw response. This release uses the same existing synthesis function, prompt, validator, fallback, and tenant flag for that local dossier branch.

## Layer Impact

- `global-control-lane`: Home KNOW now applies the existing `home_know_claude_synthesis` feature to both curated Semantic2 dossiers and local dimension dossiers.
- `client-data-lane`: No data-plane writes, migrations, schema changes, or tenant data changes.

## Client Applicability

- All clients: Only clients enabled for `home_know_claude_synthesis` are eligible.
- Specific clients: SkyHarbor and Lakeshore per the existing feature registry.
- Internal only: Operator trace remains gated behind `x-abarva-debug-home-know`.
- Public/demo only: None.
- Feature flag: Existing `home_know_claude_synthesis` and `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED` controls remain unchanged.

## Changes Included

- `src/lib/home/know/home-know-engine.ts` now invokes `synthesizeHomeConsultantText` after local dimension dossier validation when `home_know_claude_synthesis` is enabled, mirroring the curated Semantic2 dossier branch.

## QA / Validation

- PASS: `npx eslint src/lib/home/know/home-know-engine.ts src/lib/home/know/home-consultant-text-synthesis.ts src/app/api/home/know/ask/route.ts src/lib/home/know/home-know-contract.ts`
- PENDING POST-DEPLOY: signed-in Lakeshore Home prompt capture for six questions proving `trace.finalPrompt` and `trace.claudeRaw` are non-null where Claude synthesis is attempted.

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, then rerun the Lakeshore signed-in Home prompt capture against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps `aca-main-deploy`.
- Shared runtime mutators: GitHub Actions workflow owns image build, ACA update, worker image update, and traffic shift.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: `app.abarva.ai` must route 100% traffic to the new healthy revision.
- Worker image invariant: Worker image update handled by the deploy workflow; no worker code path is changed.
- Feature/env flag update path: No feature or environment flag changes.
- Live signed-in proof required: Yes, Lakeshore Home prompt capture with operator debug header.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image/revision. No database rollback is required.

## Audit Evidence

- PR and CI checks.
- `aca-main-deploy` run.
- Prompt-visible evidence bundle under `~/Downloads/abarva-home-prompt-visible-<timestamp>/`.

## Known Gaps

This release does not create curated Semantic2 dossier rows for Lakeshore. It makes the existing local dimension dossier path use the same Claude synthesis and traceability as the curated path.
