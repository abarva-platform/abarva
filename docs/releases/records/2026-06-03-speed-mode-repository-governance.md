# 2026-06-03-speed-mode-repository-governance — Speed Mode Repository Governance

## Release ID

`2026-06-03-speed-mode-repository-governance`

## Status

`candidate`

## Plain-English Summary

This release records the temporary speed-mode governance posture for the public `abarva-platform/abarva` repository. The repository keeps pull requests, but disables merge queue and required CI checks so agents can move faster during active build-out while GitHub Actions runner queues are slow.

## Layer Impact

- `global-control-lane`: Changes how every future code and docs PR becomes eligible to merge during build mode.
- `internal-admin`: Documents the operator guidance for Codex, Claude, Cursor, and human maintainers.

## Client Applicability

- All clients: Indirectly affected through faster product iteration.
- Specific clients: None.
- Internal only: Directly affects maintainers and agent execution flows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updates `AGENTS.md` to describe speed-mode repository governance.
- Current active ruleset requires PRs only, with squash merge enforced by the ruleset. Local validation remains expected by operating discipline, but GitHub does not require CI checks in speed mode.
- Current active ruleset does not require merge queue.
- Repository auto-merge is enabled so agents can use `gh pr merge --auto --squash`.

## QA / Validation

- PASS: Active repository ruleset verified through GitHub API.
- PASS: Repository `allow_auto_merge` verified as enabled through GitHub API.
- PASS: `git diff --check` run for this documentation PR.
- PASS: `npm run release:check -- --base origin/main --head HEAD` run for this documentation PR.

## Rollout Plan

The GitHub repository settings are already active. This PR only records the operating posture in repo guidance so future agents follow the new flow.

## Rollback Plan

Re-enable the merge-queue rule and restore the fuller required-check list in the GitHub ruleset. Update `AGENTS.md` back to pilot-hardening mode when closer to a customer pilot or major production release.

## Audit Evidence

- GitHub ruleset ID: `17227397`.
- Repository: `https://github.com/abarva-platform/abarva`.
- Active required checks: none in speed mode; local validation remains expected before merge.

## Known Gaps

Vercel checks are not currently required because the repo transfer changed the GitHub integration surface. Re-authorize Vercel for `abarva-platform/abarva` before adding Vercel contexts back to required checks.
