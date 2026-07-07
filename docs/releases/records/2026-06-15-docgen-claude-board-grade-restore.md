# 2026-06-15-docgen-claude-board-grade-restore — Restore Claude for Board-Grade Deliverables

## Release ID

`2026-06-15-docgen-claude-board-grade-restore`

## Status

`candidate`

## Plain-English Summary

Board-grade Move and Source deliverables are restored to the agreed Anthropic Claude standard. The Deliverable Intelligence Orchestrator still uses the six-pass architect, evidence mapping, full draft, red-team, board-grade rewrite, and render-package flow, but the audited model caller now goes through Anthropic egress rather than OpenAI. SkyHarbor is enrolled in the orchestrated Move deliverable flag so validation exercises the real multi-pass path instead of the deterministic fallback.

## Layer Impact

- `global-control-lane`: shared document-generation policy and the orchestrator model caller now resolve Claude model ids and call audited Anthropic egress for deliverable orchestration.
- `ai-egress-lane`: board-grade deliverable passes use `preflightAnthropicDirectClient` and Anthropic Messages calls with per-pass token budgets.
- `experimental`: the Move orchestrator remains tenant-gated, with SkyHarbor enrolled for live validation and other tenants still opt-in.

## Client Applicability

- All clients: central model policy now defaults board-grade and package deliverables to Claude model ids when the orchestrator is used.
- Specific clients: SkyHarbor is enrolled in `moves_orchestrated_deliverables` to validate live board-grade Move generation.
- Internal only: none.
- Public/demo only: none.
- Feature flag: `moves_orchestrated_deliverables`.

## Changes Included

- `src/lib/ai/document-generation-policy.ts` resolves `ABARVA_CLAUDE_*` model environment variables with Claude defaults.
- `src/lib/deliverables/orchestrator/model-caller.ts` calls `preflightAnthropicDirectClient` and `client.messages.create`.
- `src/lib/features/registry.ts` enrolls SkyHarbor in the orchestrated Move deliverable flag.
- Focused tests update the model-policy, model-caller, and feature-flag contracts.

## QA / Validation

- PASS — Focused Jest tests for model policy, audited model caller, and feature-flag behavior: 3 suites / 24 tests passed.
- PASS — ESLint on touched TypeScript files.
- PASS — `git diff --check`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main, build the Azure Container Apps lab image, deploy it to `ca-abarva-web-lab-eastus`, and regenerate the SkyHarbor Move deliverable with committed evidence so the six-pass Claude orchestrator is visible in trace output and File Cabinet artifacts.

## Rollback Plan

Disable `moves_orchestrated_deliverables` for SkyHarbor to return the live path to the deterministic renderer immediately. If needed, revert this PR to restore the previous OpenAI caller, but the intended architectural standard is Claude for board-grade deliverables.

## Audit Evidence

- PR for this release record.
- CI results for focused tests, ESLint, and release check.
- Post-deploy SkyHarbor generation trace showing six Anthropic-backed passes.
- File Cabinet artifact metadata showing durable output after generation.

## Known Gaps

Live SkyHarbor proof still requires deployment plus a regenerated deliverable with committed evidence. This PR fixes the code path and flag enrollment; it does not itself run production generation.
