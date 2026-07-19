# 2026-07-19-source-event-shell-v2 — Source Event Shell V2

## Release ID

`2026-07-19-source-event-shell-v2`

## Status

`candidate`

## Plain-English Summary

Source event detail pages now render through a Source Shell V2 contract that separates the event journey, step workflow, file ledger, intelligence explorer, approvals handoff, and aVa docking behavior. The shell is aligned to the provided Source Event Shell HTML direction: broad workflow canvas, left journey/workspace rail, Intelligence Explorer as an event-scoped workspace, and one dockable aVa surface rather than the old duplicate floating launcher.

The aVa prompt and quality gate were also tightened so chat can use user responses conversationally but must not claim a response was saved, locked, registered, or written to the Source record unless a real write tool confirms it.

## Layer Impact

- `global-control-lane`: changes shared Source event rendering for tenants using `source_analytics`, plus shared aVa shell props for dock placement.
- `client-data-lane`: reads existing Source artifact registry rows and approvals inbox rows; no schema, migration, seed, or data mutation is introduced.

## Client Applicability

- All clients: yes, for Source event detail pages where `source_analytics` is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` remains the route gate.

## Changes Included

- Source event route passes existing registry artifacts and approvals inbox rows into the analytics shell.
- New pure Source Shell V2 view-model builder under `src/lib/source/source-event-shell-v2.ts`.
- Source analytics canvas renders the V2 shell: left journey/workspace rail, steps/files/intelligence/approvals workspaces, aVa left/right/top/bottom/hidden dock controls, and the real `AskAnythingBar`.
- aVa Source chat instructions now explicitly forbid false persistence claims for existing Source event chat.
- Source aVa answer quality gate blocks additional false “lock into intake/source record” language.
- Focused tests cover the shell contract and docked aVa/chat behavior.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` — passed, 12/12.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.
- Focused ESLint over touched Source shell/chat files — passed.
- `git diff --check` — passed.
- `npm run build -- --webpack` — passed. Webpack mode was used because Turbopack refuses the isolated worktree's symlinked `node_modules`.
- Local browser navigation to the Source event route reached the dev server but redirected to `/sign-in`; no signed-in local visual proof was claimed.

## Rollout Plan

Open a PR, review, merge to `main`, and deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run signed-in browser proof on `https://app.abarva.ai/source/events/<eventId>?stage=scope` and representative file-heavy / analytics-heavy stages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none; uses existing `source_analytics` flag.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The change is UI/router/read-model only and introduces no database migration or data mutation, so rollback does not require data repair.

## Audit Evidence

- Focused Jest output: 12/12 passing for Source Shell V2 contract and aVa/chat shell behavior.
- TypeScript output: clean.
- Focused ESLint output: clean.
- Production build output: clean under webpack mode.
- Local browser redirect evidence: dev route reached local server but auth redirected to `/sign-in`, so signed-in visual proof remains pending.

## Known Gaps

- Signed-in browser crawl is still required after deployment; local in-app browser was not authenticated.
- Broader Source IA cleanup is still open: whether Decisions / Approvals / Portfolio / Capabilities / Setup remain in the top secondary nav should be settled holistically rather than patched inside this event-shell slice.
- Old exported analytics subcomponents remain in the repo for compatibility/rollback; the event route now renders through Source Shell V2.
