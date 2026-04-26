# PROD5 Deployment Status Surface Integration

Status: code_complete
Owner: Steward
Date: 2026-04-26

## What Changed

PROD5 surfaces the PROD4 deployment-status read model inside the platform Admin Production Readiness page as a calm, Apple-like server component. The component renders honestly when tokens are absent — it never shows fake green and never claims live polling.

- New component `src/components/admin/DeploymentStatusCard.tsx` (Server Component) that consumes a `ProductionReadinessDeploymentSignal` from `@/lib/admin/deployment-status-ingestion`.
- New integration test at `src/__tests__/integration/admin/deployment-status-card.test.ts` covering view-model rendering, no-fake-green serialization, no-secret exposure, no model / API calls, and AbarVa canon hygiene.
- Slice documentation at `docs/build/slices/PROD5_DEPLOYMENT_STATUS_SURFACE_INTEGRATION.md`.

## Why The Card Renders Honestly

PROD4 wired the deployment-status ingestion contract and an internal API route, but the read model was not visible to platform admins. PROD5 closes that visibility gap without lying:

- The chip uses a single dark-blue accent for every state — `unavailable`, `configured`, and `error`. There is no green chip; PROD5 V1 cannot prove a successful deploy because no provider polling is wired.
- The eyebrow reads `DEPLOYMENT STATUS · PROD5` and the title reads `GitHub / Vercel deployment signal`.
- Each provider row prints the provider name, the `liveStatus` chip, and a "Last checked" line that renders `—` when `checkedAt` is null.
- The card carries an explicit limitation note (`Tokens not configured. Live polling deferred to PROD6.`), a deterministic next action (`Configure GITHUB_STATUS_TOKEN and VERCEL_STATUS_TOKEN to enable live status. Live polling is deferred to PROD6.`), and a disclaimer (`No fake green. liveStatus reflects honest token presence.`).

## Server Component Discipline

`DeploymentStatusCard.tsx` is a pure Server Component:

- No `'use client'` directive.
- No React hooks.
- No `process.env.*TOKEN`, no `process.env.*SECRET`, no `process.env.*KEY` reads anywhere in the component.
- No `fetch`, no model SDK import, no auth import, no tenant runtime import.
- No local hex literals; all chrome reads from `@/lib/design/abarva-theme` (canon §L acceptance gate #8).

The card consumes the `ProductionReadinessDeploymentSignal` from the read model only. The caller is responsible for sourcing the signal — typically by calling `summarizeDeploymentStatus()` from a server context.

## Integration With The Live Panel

`ProductionReadinessLivePanel.tsx` and `ProductionReadinessTracker.tsx` are intentionally not modified in PROD5. Reasons:

- The live panel is a `'use client'` component with its own fetch loop; mounting a server component inside it would either force a synchronous server fetch on render (incorrect) or require a parallel client wrapper (out of scope for PROD5).
- The PROD4 deployment-status payload is delivered by a separate route (`GET /api/admin/production-readiness/deployment-status`) and is not yet folded into the main `/api/admin/production-readiness` response. Mounting the card from the existing live panel would require either dual-fetching from the panel or a server data-merge inside the page entry point, both of which would expand the blast radius beyond PROD5's contract.
- The page entry (`src/app/(maestro)/platform/admin/production-readiness/page.tsx`) is owned by PROD3 / PROD4 and modifies authenticated server flow; PROD5 does not change auth behavior.

PROD5 therefore lands the component and its honesty test now. Mounting the card on the live page is **deferred to a follow-up slice** that will:

- Either fold the PROD4 deployment-status signal into the main readiness API response, or
- Render the card alongside `ProductionReadinessLivePanel` in the page entry, passing the PROD4 signal as a prop, or
- Wrap the card in a small client shell that polls the deployment-status route on the same cadence as the live panel.

Each of those paths is a separate slice with its own validation surface.

## What V1 Does Not Do

- No call to `api.github.com`.
- No call to `api.vercel.com`.
- No model invocation.
- No auth changes.
- No tracker promotion.
- No secret exposure: the component never reads any token / secret / key env var directly.
- No fake green chip: the chip uses one dark-blue accent regardless of state because PROD5 V1 cannot verify a green deploy.

## Determinism Guarantees

- Rendering is a pure function of the input `ProductionReadinessDeploymentSignal`.
- The component does not call `Date.now()`, `new Date()`, or `Math.random()`.
- All copy is deterministic per `liveStatus` value.

## AbarVa Visual Canon Compliance

- `COLORS`, `FONT`, `BORDER`, `RADIUS`, `SPACING`, and `TYPE` are imported from `@/lib/design/abarva-theme`.
- No local hex literals.
- No local `const COLORS = …`.
- Calm typography: `TYPE.h2` for the card title, `TYPE.body` for the summary, `TYPE.eyebrow` for the eyebrow and labels, `TYPE.caption` for the meta lines.
- No decorative emoji, no large icons, no clutter.

## Test Coverage

`src/__tests__/integration/admin/deployment-status-card.test.ts` asserts:

- The unavailable signal renders the eyebrow, title, both provider rows, the chip text `unavailable`, and the disclaimer.
- The chip text never contains the literal value `live`.
- The `Last checked` row renders the `—` placeholder when `checkedAt` is null.
- The next-action copy mentions `GITHUB_STATUS_TOKEN` and `VERCEL_STATUS_TOKEN`.
- The serialized signal output never carries `liveStatus: "live"`.
- The component source imports the canon tokens from `@/lib/design/abarva-theme`.
- The component source contains no local hex literals, no local `const COLORS =`, no `'use client'`, and no React hooks.
- The component source contains no `process.env.*TOKEN` / `*SECRET` / `*KEY` reads.
- The component source contains no `fetch`, no `api.github.com`, no `api.vercel.com`, and no `anthropic` / `openai` references.
- The component source does not import auth, source, sentinel, atlas, nexus, agent, supabase, or clerk modules.

## Validation

Required validation:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/deployment-status-card.test.ts`
- `npx jest src/__tests__/integration/admin/production-readiness-live-refresh.test.ts`
- `npm run build`

## Future PROD6+

Out of scope for PROD5 and reserved for a subsequent slice:

- Real polling of GitHub Actions check runs.
- Real polling of Vercel deployments and check states.
- Folding the deployment-status signal into the main readiness API response.
- Mounting the card alongside `ProductionReadinessLivePanel` in the platform admin page.
- Promotion of `production_deployment` once external signals are reviewed.

## Explicitly Out Of Scope

- No real GitHub API integration.
- No real Vercel API integration.
- No model calls.
- No auth changes.
- No migrations.
- No tracker promotion.
- No live mounting of the card on the platform admin page.
- No exposure of token values anywhere in the runtime, response, logs, or tests.
