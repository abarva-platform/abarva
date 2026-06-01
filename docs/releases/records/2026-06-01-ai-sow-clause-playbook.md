# 2026-06-01-ai-sow-clause-playbook - AI SOW Clause Playbook

## Release ID

`2026-06-01-ai-sow-clause-playbook`

## Status

`candidate`

## Plain-English Summary

Adds a counsel-review draft playbook for AI-specific SOW/MSA clause themes:
advisor-not-decider positioning, client validation duty, hallucination
disclosure, reliance indemnity, liability cap treatment, and training warranty.

## Layer Impact

Internal-admin layer: adds legal/commercial operating guidance for AbarVa.

Global-control lane documentation: aligns contract-review posture with the AI
decision-support controls and ADR-0006.

## Client Applicability

- All clients: Intended for future client contract review.
- Specific clients: None.
- Internal only: Yes, until counsel approves contract language.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/legal/ai-sow-clause-playbook.md`.

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD` (no release-relevant files changed)
- Pass: ASCII scan for touched docs.

## Rollout Plan

Merge to `main`. This becomes an internal counsel-review aid only; no client
contract language is approved until counsel signs off.

## Rollback Plan

Revert the PR to remove the playbook and release record. No runtime or data
rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Release record:
  `docs/releases/records/2026-06-01-ai-sow-clause-playbook.md`.
- Added playbook:
  `docs/legal/ai-sow-clause-playbook.md`.

## Known Gaps

Counsel review and final approved MSA/SOW text remain open. This PR drafts the
playbook; it does not complete legal sign-off.
