# 2026-06-01-sync-ai-rules — Sync AI Tool Rules From AGENTS.md

## Release ID

`2026-06-01-sync-ai-rules`

## Status

`candidate`

## Plain-English Summary

This change adds a governance script that generates Cursor and GitHub Copilot AI instruction files from `AGENTS.md`, then seeds both generated files. It keeps `AGENTS.md` as the source of truth and documents the regeneration workflow.

## Layer Impact

Ops-release-lane developer governance only. The change affects AI-tool instruction files and a local generation script; it does not change runtime behavior, product UI, authentication, data access, migrations, or infrastructure.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa maintainers and AI-assisted development workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/governance/sync-ai-rules.ts`
- `.cursor/rules`
- `.github/copilot-instructions.md`
- `docs/runbooks/sync-ai-rules.md`
- `docs/releases/records/2026-06-01-sync-ai-rules.md`
- `package.json`

## QA / Validation

- Pass: `npm run sync-ai-rules`
- Pass: second `npm run sync-ai-rules` produced no generated-file diff.
- Pass: confirmed `AGENTS.md` was not modified.
- Pass: `npx eslint scripts/governance/sync-ai-rules.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. Future `AGENTS.md` changes should run `npm run sync-ai-rules` and commit the generated outputs.

## Rollback Plan

Revert the commit to remove the sync script, generated derivative files, package script, runbook, and release record.

## Audit Evidence

- Pull request for `codex/sync-ai-rules`
- Local validation commands listed above
- CI checks on the pull request

## Known Gaps

This PR does not change the content of `AGENTS.md`; it only distributes the current canonical instructions into derivative tool files.
