# 2026-06-05-phs-claude-pilot-model-policy — PHS Claude Pilot Model Policy

## Release ID

`2026-06-05-phs-claude-pilot-model-policy`

## Status

`candidate`

## Plain-English Summary

The PHS/Meridian execution brief now names Claude as the pilot-facing model for
live CXO synthesis and artifact generation. OpenAI remains allowed for offline
QA, comparison, and regression evidence, but it is not treated as pilot-ready
until it passes the same Meridian/PHS hard-question quality bar.

## Layer Impact

- `global-control-lane`: updates the shared execution rule for the PHS command
  center build and model-quality reporting.
- `client-data-lane`: preserves the existing requirement that Meridian/PHS data
  must flow through the Setup/Admin loader and not through seed-side shortcuts.

## Client Applicability

- All clients: response-quality and model-provider reporting discipline applies
  as a reusable control pattern.
- Specific clients: Meridian/PHS execution lane.
- Internal only: execution brief and QA policy.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- `docs/build/codex-handoff/2026-06-05-PHS_POP_HEALTH_COMMAND_CENTER_EXECUTION.md`
  now replaces the OpenAI-only live execution rule with a Claude-first pilot
  policy and explicit OpenAI QA-only boundary.
- The Phase 3/Phase 5 definitions of done now require model-provider recording,
  Meridian/PHS-specific hard-question coverage, and CXO digestibility evidence.

## QA / Validation

- Pass: `git diff --check`
- Pending: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. This is a documentation/control-plane policy change only; there
is no runtime deployment dependency beyond the normal Vercel main deployment.

## Rollback Plan

Revert the documentation PR if the team intentionally returns to OpenAI-only
pilot execution.

## Audit Evidence

- Meridian/PHS OpenAI QA canary report:
  `reports/2026-06-05-meridian-phs-hard-question-qa-v2/report.html`
- PHS execution brief:
  `docs/build/codex-handoff/2026-06-05-PHS_POP_HEALTH_COMMAND_CENTER_EXECUTION.md`

## Known Gaps

The Claude-backed Meridian/PHS 50-question pilot capture still needs to run and
be recorded after the pilot model path is configured.
