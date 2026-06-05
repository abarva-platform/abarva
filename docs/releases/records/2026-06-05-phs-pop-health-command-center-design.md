# 2026-06-05-phs-pop-health-command-center-design — PHS Population Health Command Center Design Package

## Release ID

`2026-06-05-phs-pop-health-command-center-design`

## Status

`candidate`

## Plain-English Summary

Adds the controlled design and execution package for the Meridian / PHS-inspired
Population Health and Clinical Performance Command Center demo. The package
keeps the story Moves-led, Databricks-backed, evidence-first, and honest: no
opportunity, value claim, Source event, or phase advancement should appear unless
the required evidence, artifacts, gates, and approvals exist.

## Layer Impact

`global-control-lane`: Adds design, QA, and execution-control documentation for
a shared demo pattern that can later be implemented in Moves, Setup/Admin, and
agent generation flows.

`client-data-lane`: Adds Meridian / PHS demo packet materials and loader
contract expectations. This release does not load, erase, or mutate live tenant
data.

## Client Applicability

- All clients: The evidence-first gating pattern is reusable.
- Specific clients: The design package is for the Meridian / PHS-inspired demo.
- Internal only: Yes, until implementation and pilot readiness are approved.
- Public/demo only: Demo design package only.
- Feature flag: None.

## Changes Included

- Added the PHS human approval packet Markdown, prompt source, and DOCX under
  `docs/build/meridian-phs-demo/`.
- Added the PHS Moves design package under
  `docs/build/moves-design/phs-population-health-command-center/`.
- Added an autonomous execution brief under `docs/build/codex-handoff/`.
- Added a read-only PHS Phase 0 manifest validator and tests under
  `src/lib/context-ingestion/`.
- Added 55 PHS agent-grounding golden questions under
  `tests/agent-grounding/curriculum/`.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-phase0-manifest.test.ts --runInBand`.
- PASS: `npx jest tests/agent-grounding/__tests__/curriculum.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-phase0-manifest.ts src/lib/context-ingestion/__tests__/phs-phase0-manifest.test.ts`.
- PASS: JSONL coverage smoke confirms 55 PHS golden questions across Sentinel, Atlas, Nexus, Source, and Steward.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: markdown/package structural review confirms the package includes README, market research, demo spine, artifact contracts, design review, architecture setter, business case setter, mobilization setter, and loader contract findings.

## Rollout Plan

Merge as a design/control package. No runtime rollout, data load, migration, or
production tenant mutation occurs in this PR.

## Rollback Plan

Revert the PR. This removes only docs and design artifacts.

## Audit Evidence

- Packet source: `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_PROMPT_SOURCE_2026-06-05.md`.
- Design package: `docs/build/moves-design/phs-population-health-command-center/`.
- Execution brief: `docs/build/codex-handoff/2026-06-05-PHS_POP_HEALTH_COMMAND_CENTER_EXECUTION.md`.

## Known Gaps

Governed loader templates, live OpenAI generation, artifact persistence, browser
crawl proof, and production deployment are explicitly deferred to follow-on PRs
after this design package lands. This PR adds the manifest contract only; it
does not write to the database or load tenant data.
