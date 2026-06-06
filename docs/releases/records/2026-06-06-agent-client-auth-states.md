# 2026-06-06-agent-client-auth-states — Agent Client Crawl Auth States

## Release ID

`2026-06-06-agent-client-auth-states`

## Status

`candidate`

## Plain-English Summary

Adds a controlled local auth-state generator so QA agents can crawl signed-in client workspaces using one canonical Clerk user per client/persona. The change avoids shared session tokens and refuses to save a browser state when a Clerk user is not pinned to the expected single client.

## Layer Impact

- `internal-admin`: Adds operator tooling and a runbook for generating local Playwright storage states.
- `global-control-lane`: Touches auth-adjacent QA workflow only; no runtime route, middleware, or user-facing behavior changes.

## Client Applicability

- All clients: No production runtime behavior changes.
- Specific clients: Agent crawl personas cover Apex Retail, Meridian, First Capital, Northstar, SkyHarbor, and Lakeshore.
- Internal only: The script and runbook are internal QA/operator assets.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/auth/prime-agent-client-auth-states.ts`
- `docs/runbooks/agent-client-test-login-crawl-auth.md`
- `package.json` script `auth:agent-client-states`
- `.gitignore` now excludes `/.auth/`

## QA / Validation

- `npm run auth:agent-client-states -- --list` — pass after linking local `node_modules`; listed all configured personas without creating sessions.
- `./node_modules/.bin/tsc --noEmit --pretty false --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck scripts/auth/prime-agent-client-auth-states.ts` — pass.
- `npx tsc --noEmit --pretty false` — blocked in this clean worktree by pre-existing missing optional dependency typings: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `git diff --check` — pass.

## Rollout Plan

Merge to main through the normal PR path. Operators can then run the script locally with `CLERK_SECRET_KEY` and `BASE_URL` to generate local `.auth/agent-*.json` files. No Vercel deploy action is required for the script itself beyond normal repository deployment.

## Rollback Plan

Revert the PR to remove the script, runbook, package command, and `.gitignore` entry. Delete any locally generated `.auth/agent-*.json` files with `rm -rf .auth/agent-*.json`.

## Audit Evidence

- PR URL once opened.
- Local command output for `npm run auth:agent-client-states -- --list`.
- Release check output.
- Optional generated report under `reports/agent-client-auth/` from an operator machine; do not commit auth state files.

## Known Gaps

This does not provision missing Clerk users by itself. If a canonical user is missing, run `scripts/provision-cxo-personas.ts` for that client first.
