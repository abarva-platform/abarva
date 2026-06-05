# Lakeshore Auth Persona And Tenant-Pinning Proof

Run date: 2026-06-05  
Agent lane: Agent E — Lakeshore auth/persona and tenant-pinning proof  
Target: `https://app.abarva.ai`  
Branch: `codex/agent-e-lakeshore-auth`  
Base commit: `a879c5bc428e2e043290df87eb855e44ebaab83e`

## Scope

This proof verifies that Lakeshore demo users exist, resolve to the Lakeshore tenant, ignore hostile client overrides, and do not silently fall back to Apex or Meridian. Corpus expansion was intentionally out of scope.

## Commands Run

```bash
git status --short --branch
git worktree list
git fetch origin --prune
git rev-parse origin/main
```

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --dry-run
```

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --apply --skip-ban
```

```bash
npx jest tests/unit/access-routing.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts --runInBand
git diff --check
npm run release:check -- --base origin/main --head HEAD
```

```bash
set -a; source /Users/anand/Projects/nexus/.env.local; set +a
BASE_URL=https://app.abarva.ai npx playwright test \
  tests/e2e/tenant-isolation/protected-route.spec.ts \
  tests/e2e/tenant-isolation/cross-tenant-probe.spec.ts \
  tests/e2e/tenant-isolation/logout-redirect.spec.ts \
  --project=chromium --reporter=line
```

A final live Playwright/Clerk probe also tested demo-code ticket issuance, server-ticket sign-in, hostile `?client=apexretail` navigation across core modules, `/api/intelligence/ask`, and sign-out.

## Live Identity Proof

| Persona | Clerk user | Banned | Clerk role | Clerk clientId | Clerk tenantKey | DB membership | Key capabilities |
|---|---:|---:|---|---|---|---:|---|
| `cio@lakeshore-holdings.example.com` | yes | no | `maestro` | `lakeshore` | `lakeshore-holdings` | yes | Source create/upload/generate |
| `cfo@lakeshore-holdings.example.com` | yes | no | `maestro` | `lakeshore` | `lakeshore-holdings` | yes | Source create/upload/generate |
| `admin@lakeshore-holdings.example.com` | yes | no | `admin` | `lakeshore` | `lakeshore-holdings` | yes | Source create/upload/generate/admin |

The admin persona was missing before this lane. It was created with the existing Lakeshore-scoped provisioning script after dry-run showed the exact planned actions.

## Live Route Proof

Signed-in persona: `cfo@lakeshore-holdings.example.com`  
Adversarial override: `?client=apexretail` plus `abarva_active_client=apexretail`

| Route | Result |
|---|---|
| `/home?client=apexretail` | Rendered Lakeshore Holdings; no Apex Retail or Meridian Health text in body sample. |
| `/source?client=apexretail` | Redirected to `/source/queue`; rendered Lakeshore Holdings; no Apex Retail or Meridian Health text in body sample. |
| `/tower?client=apexretail` | Rendered Lakeshore Holdings Tower; no Apex Retail or Meridian Health text in body sample. |
| `/strategic-moves?client=apexretail` | Rendered Lakeshore Holdings Strategic Moves; no Apex Retail or Meridian Health text in body sample. |

## Live Intelligence Ask Proof

Request intentionally sent:

```json
{
  "query": "For tenant-pinning QA, identify the active client for this answer and state whether Apex or Meridian context should be used.",
  "requestedClient": "apexretail",
  "surfaceContext": {
    "activeClient": "apexretail",
    "clientKey": "apexretail",
    "page": "agent-e-auth-proof"
  }
}
```

Result:

- Status: `200`
- Answer named `Lakeshore Holdings` as the active client.
- Answer stated that neither Apex nor Meridian context should be used.

Sanitized answer sample:

> The active client for this answer is Lakeshore Holdings, and neither Apex nor Meridian context should be used.

## Tenant-Isolation E2E Proof

Production e2e result:

- `17 passed`
- Covered protected route rendering for Apex Retail, Meridian Health, SkyHarbor Air, and Lakeshore Holdings.
- Covered all 12 pairwise hostile-client probes across those four tenants.
- Covered unauthenticated protected-route redirect to sign-in.

## Sign-Out Proof

After Clerk sign-out, direct navigation to `/home` redirected to:

`https://app.abarva.ai/sign-in?redirect=%2Fhome`

## Local Unit Proof

Focused Jest result:

- `2 passed`
- `76 passed`

Coverage added:

- Lakeshore email-domain inference.
- Lakeshore locked-role inference.
- Lakeshore stale-metadata override.
- Lakeshore hostile `?client=` stripping.
- Lakeshore Source event slug ownership.
- Lakeshore canonical `/tenant/lakeshore-holdings` route slug resolution.

## Gaps

No blocking Lakeshore auth/persona/tenant-pinning gap remains in this lane. The runtime code changes still need PR review, merge, and deployment before the fallback protections are live in production; the live demo works today because Clerk metadata and DB membership are now correct.
