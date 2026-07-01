# 2026-07-01-visual-excellence-p0-polish — Source and Moves visual language polish

## Release ID

`2026-07-01-visual-excellence-p0-polish`

## Status

`candidate`

## Plain-English Summary

This release removes avoidable internal labels from the Source and Moves entry experiences, keeps the public product demo page reachable without sign-in, and makes stale or unavailable routes read like a normal account-access boundary instead of an internal agent/debug page.

## Layer Impact

- `global-control-lane`: Updates shared user-facing route access and product-page copy that can affect all clients where Source, Moves, or unavailable routes render.
- `public-demo`: Keeps the public `/demo` marketing video page available to signed-out visitors while deeper product demo workspace routes remain sign-in protected.

## Client Applicability

- All clients: Source intake/queue copy, Moves new-opportunity copy, and unavailable-route language.
- Specific clients: None.
- Internal only: None.
- Public/demo only: `/demo` route access.
- Feature flag: None.

## Changes Included

- Source queue cards now present posture and evidence copy in buyer-facing language instead of internal category or posture tokens.
- Source intake labels are simplified from implementation-stage labels to plain starting-point labels.
- Moves new-opportunity entry copy now asks for the business problem first and refers to a Move brief instead of a P0 scaffold.
- Public `/demo` remains public; deeper `/demo/programs`, `/demo/explore`, and agent fixture routes remain auth-gated.
- Shared unavailable-route pages now use AbarVa/aVa language and remove legacy Atlas/Nexus route-not-found chrome.

## QA / Validation

- Pass: focused Jest for proxy, Source intake, Source queue, and Moves originate tests.
- Pass: focused ESLint on touched files.
- Pass: `npm run release:check`.
- Blocked: full `npx tsc --noEmit --pretty false --skipLibCheck` is blocked by pre-existing missing optional type packages outside this change (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`).
- Not run yet: signed-in browser smoke for Source queue, Source intake, Moves new opportunity, and unavailable-route language.
- Not run yet: signed-out mobile smoke for `/demo`.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main lane, wait for the healthy revision to receive 100% traffic, then verify the live routes in a signed-in browser session and public mobile viewport.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` on `main`.
- Shared runtime mutators: none.
- Approved image digest: pending deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives the exact merged SHA image with 100% ingress traffic.
- Worker image invariant: no worker/job change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback by restoring the previous ACA revision or reverting this commit and redeploying through the same ACA main lane. No database migrations, data-plane changes, or feature-flag changes are included.

## Audit Evidence

- PR URL: pending.
- CI/checks: pending.
- ACA revision/digest: pending deploy.
- Browser proof screenshots: pending.

## Known Gaps

Home, Intelligence, and Tower are intentionally out of scope because other agents are actively working there.
