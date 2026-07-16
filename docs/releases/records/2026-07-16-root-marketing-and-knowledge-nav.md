# 2026-07-16-root-marketing-and-knowledge-nav — Root Marketing and Knowledge Nav

## Release ID

`2026-07-16-root-marketing-and-knowledge-nav`

## Status

`candidate`

## Plain-English Summary

The bare `app.abarva.ai/` route now remains the public marketing and request-access landing page, even when the visitor has an existing Clerk session. Signed-in users still enter the product through `/sign-in` and `/auth-redirect`. Inside the authenticated product shell, the `Knowledge` nav item and NEXUS brand now use fast App Router navigation to `/home` instead of forcing a full browser reload. Legacy/compatibility shell primitives are also aligned so pages that still mount older chrome do not show `Home`, `Programs`, `Control Tower`, or tenant-specific Apex routes in shared navigation.

Live signed-in proof after PR #4875 showed the nav links were corrected, but authenticated `/home` could still hang before the first response because optional Knowledge enrichment loaders ran inline with page render. This follow-up bounds those optional loaders and uses the deterministic governed Home summary as the fallback so product navigation can always land on Knowledge.

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
- `src/app/(maestro)/home/page.tsx`: bounds optional module-context, V7 browser, inventory, source-file, and Claude summary enrichment so `/home` renders even if a data/enrichment path is slow.
- `src/components/shell/__tests__/topbar-nav-home-admin.test.ts`: verifies the Knowledge nav contract.
- `src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts`: verifies optional Knowledge enrichment is timeout-bounded and does not re-enter the runtime module-context loader as the fallback.
- `src/__tests__/integration/design/abarva-app-shell.test.ts`: verifies shell config routes are global product routes, not tenant-specific fallbacks.
- `src/__tests__/integration/design/abarva-ui-primitives.test.ts`: verifies the compatibility top-nav surface list starts with `Knowledge`.

## QA / Validation

- Pass: `npx eslint src/app/page.tsx src/proxy.ts src/components/navigation/NexusTopNav.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts`
- Pass: `npx eslint src/components/AbarvaNav.tsx src/components/abarva/AbarVaTopNav.tsx src/components/abarva/AbarVaShellNav.tsx src/components/chrome/ClientChrome.tsx src/components/shell/AppRail.tsx src/components/shell/CommandPalette.tsx src/lib/design/abarva-shell.ts src/lib/home/top-nav-items.ts src/__tests__/integration/design/abarva-app-shell.test.ts src/__tests__/integration/design/abarva-ui-primitives.test.ts`
- Pass: `npm run test:nav -- --runTestsByPath src/components/shell/__tests__/topbar-nav-home-admin.test.ts`
- Pass: `npm run test:nav -- --runTestsByPath src/components/navigation/__tests__/NexusTopNav.test.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts src/__tests__/integration/design/abarva-app-shell.test.ts --runInBand`
- Pass: `npm run test:nav -- --runTestsByPath src/__tests__/integration/design/abarva-ui-primitives.test.ts --testNamePattern AbarvaTopNav --runInBand`
- Pass after PR #4875 deploy: repo-owned ACA main deploy workflow published merge SHA `4163b569ab2ac9d5a010c4464cc8b28b6049652d` to revision `ca-abarva-web-lab-eastus--m4163b569`, image digest `sha256:ba7383dc8027187332fb96fc0711bf2d335e9d4e9aeae3ef095b1033710d8fbe`, 100% traffic, and healthy `/api/health`.
- Failed after PR #4875 deploy: signed-in browser proof found `/tower`, `/intelligence`, `/source`, and `/strategic-moves` loaded, and their visible Knowledge links pointed at `/home`, but authenticated `/home` itself timed out before first response. Root cause: optional Home/Knowledge enrichment loaders were awaited inline with page render.
- Blocked baseline: full `src/__tests__/integration/design/abarva-ui-primitives.test.ts` still has unrelated pre-existing failures around typography, agent list, and brand import expectations.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `git diff --check -- src/app/page.tsx src/proxy.ts src/components/navigation/NexusTopNav.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts docs/releases/records/2026-07-16-root-marketing-and-knowledge-nav.md`
- Pass: local webpack dev check on `http://localhost:3911/` returned `200 OK` and rendered the marketing/request-access page.
- Pending follow-up: deploy the bounded `/home` render fix, then rerun signed-in browser proof that direct `/home` loads and clicking `Knowledge`/NEXUS brand from other product surfaces reaches `/home`.

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
