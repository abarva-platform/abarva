# 2026-07-16-root-marketing-and-knowledge-nav — Root Marketing and Knowledge Nav

## Release ID

`2026-07-16-root-marketing-and-knowledge-nav`

## Status

`candidate`

## Plain-English Summary

The bare `app.abarva.ai/` route now remains the public marketing and request-access landing page, even when the visitor has an existing Clerk session. Signed-in users still enter the product through `/sign-in` and `/auth-redirect`. Inside the authenticated product shell, the `Knowledge` nav item and NEXUS brand now use fast App Router navigation to `/home` instead of forcing a full browser reload. Legacy/compatibility shell primitives are also aligned so pages that still mount older chrome do not show `Home`, `Programs`, `Control Tower`, or tenant-specific Apex routes in shared navigation.

## Layer Impact

- `public-demo`: The root route is restored as a public marketing/request-access surface instead of being intercepted into the authenticated app router.
- `global-control-lane`: Shared auth routing no longer treats `/` as an authenticated workspace entry point. Signed-in app entry through `/sign-in` and `/auth-redirect` is preserved.
- `global-control-lane`: Shared authenticated NEXUS top navigation uses client-side navigation for product surfaces, including `Knowledge` back to `/home`.
- `global-control-lane`: Compatibility shell navigation, side rail, and command palette now use the same Knowledge/Moves/Source/Tower route contract instead of stale labels or tenant demo fallbacks.

## Client Applicability

- All clients: Root landing and signed-in product navigation behavior applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Root marketing behavior is public/demo.
- Feature flag: None.

## Changes Included

- `src/proxy.ts`: stops redirecting signed-in `/` requests to `/auth-redirect`.
- `src/app/page.tsx`: renders the marketing/request-access landing page directly instead of probing signed-in workspace routing.
- `src/components/navigation/NexusTopNav.tsx`: restores Next `Link` navigation for internal product nav and the NEXUS brand link.
- `src/components/AbarvaNav.tsx`: sends the legacy wordmark to `/home` and labels the first signed-in nav entry `Knowledge`.
- `src/components/abarva/AbarVaTopNav.tsx`: adds `Knowledge` as the first surface and defaults the wordmark destination to `/home`.
- `src/components/abarva/AbarVaShellNav.tsx`: aligns compatibility surface labels and routes with the canonical product nav.
- `src/components/chrome/ClientChrome.tsx`: aligns client-viewer navigation labels/routes with Knowledge, Moves, and Tower.
- `src/components/shell/AppRail.tsx`: aligns the rail's home entry with `Knowledge`.
- `src/components/shell/CommandPalette.tsx`: aligns command search entries with Knowledge, Moves, and Tower.
- `src/lib/design/abarva-shell.ts`: removes tenant-specific Apex fallback hrefs from the shared shell config.
- `src/lib/home/top-nav-items.ts`: aligns the metadata pendant label with `Knowledge`.
- `src/components/shell/__tests__/topbar-nav-home-admin.test.ts`: verifies the Knowledge nav contract.
- `src/__tests__/integration/design/abarva-app-shell.test.ts`: verifies shell config routes are global product routes, not tenant-specific fallbacks.
- `src/__tests__/integration/design/abarva-ui-primitives.test.ts`: verifies the compatibility top-nav surface list starts with `Knowledge`.

## QA / Validation

- Pass: `npx eslint src/app/page.tsx src/proxy.ts src/components/navigation/NexusTopNav.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts`
- Pass: `npx eslint src/components/AbarvaNav.tsx src/components/abarva/AbarVaTopNav.tsx src/components/abarva/AbarVaShellNav.tsx src/components/chrome/ClientChrome.tsx src/components/shell/AppRail.tsx src/components/shell/CommandPalette.tsx src/lib/design/abarva-shell.ts src/lib/home/top-nav-items.ts src/__tests__/integration/design/abarva-app-shell.test.ts src/__tests__/integration/design/abarva-ui-primitives.test.ts`
- Pass: `npm run test:nav -- --runTestsByPath src/components/shell/__tests__/topbar-nav-home-admin.test.ts`
- Pass: `npm run test:nav -- --runTestsByPath src/components/navigation/__tests__/NexusTopNav.test.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts src/__tests__/integration/design/abarva-app-shell.test.ts --runInBand`
- Pass: `npm run test:nav -- --runTestsByPath src/__tests__/integration/design/abarva-ui-primitives.test.ts --testNamePattern AbarvaTopNav --runInBand`
- Blocked baseline: full `src/__tests__/integration/design/abarva-ui-primitives.test.ts` still has unrelated pre-existing failures around typography, agent list, and brand import expectations.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `git diff --check -- src/app/page.tsx src/proxy.ts src/components/navigation/NexusTopNav.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts docs/releases/records/2026-07-16-root-marketing-and-knowledge-nav.md`
- Pass: local webpack dev check on `http://localhost:3911/` returned `200 OK` and rendered the marketing/request-access page.
- Not run: deploy through the repo-owned ACA main deploy workflow.
- Not run: live signed-in browser proof that `https://app.abarva.ai/` renders the marketing/request-access page and does not pivot to `/auth-redirect`.
- Not run: live signed-in browser proof that clicking `Knowledge` from Tower returns to `/home` without a full document reload.
- Pending in this PR: signed-in browser proof after deploy.

## Rollout Plan

Merge to main, deploy through the approved Azure Container Apps main workflow, verify the ACA runtime invariant, then run signed-in browser checks for `Tower → Knowledge`, `Intelligence → NEXUS brand`, `Source → Knowledge`, and `Moves → Knowledge`.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the root-route, proxy, top-nav, and compatibility-shell changes and redeploy through the approved ACA main workflow. This restores the prior behavior where signed-in root visits are routed into `/auth-redirect` and older chrome may display stale Home/Programs/Control Tower labels.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Deployment evidence: Pending.
- Browser screenshot/proof: Pending.

## Known Gaps

This record documents the candidate change only. It is not yet merged, deployed, or live-proven.
