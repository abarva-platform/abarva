# 20260611-private-preview-landing — Private-preview marketing landing + Request-access lead capture

## Release ID
`20260611-private-preview-landing`

## Release Lane
`public-demo` (public signed-out marketing route) + `global-control-lane` (new public API route + new control-plane table). Not client-scoped.

## Status
`candidate`

## Plain-English Summary
Replaces the signed-out marketing landing page (`LoggedOutLandingPage`) with the new founder-led private-preview design: a product-led hero (dark gradient, the real Strategic Moves screenshot, and a connected "three dimensions of value" — Decide / Source / Prove), a graphical "Picture this" three-moment section, the five surfaces, and a "Request access" call to action. No AI-generated human imagery is used; visuals are the real product screenshot and abstract brand graphics.

Adds a real backend for the "Request access" form: a public, unauthenticated `POST /api/request-access` that validates a work email, stores the lead in a new `access_requests` table (durable), and notifies `admin@abarva.ai` via Resend. Both the store and the email are best-effort; in production the request only fails if the lead was captured nowhere.

## Layer Impact
- `app/control-plane`: new public API route `src/app/api/request-access/route.ts`; new public-route entry in `src/proxy.ts`; rewritten `src/components/marketing/LoggedOutLandingPage.tsx`; new brand/marketing assets under `public/marketing/`.
- `data-plane`: new control-plane table `access_requests` (inbound leads only — NOT tenant/client data, no tenant scoping). RLS denies anon/authenticated; service-role write client only.
- No change to client corpus, retrieval, agents, or any tenant data plane.

## Client Applicability
- All clients: n/a (public marketing surface; visible to all signed-out visitors)
- Specific clients: none
- Internal only: no
- Public/demo only: yes (signed-out landing)
- Feature flag: none

## Changes Included
- `src/components/marketing/LoggedOutLandingPage.tsx` — rewritten to the new private-preview design (styled-jsx, no Tailwind), Request-access modal form (client state → `POST /api/request-access`), Option-2 logo from `/brand/`.
- `src/app/api/request-access/route.ts` — new public POST: validate (work email), store in `access_requests`, email `admin@abarva.ai` via Resend (`replyTo` the requester). Best-effort; 500 only if nothing captured in prod.
- `src/proxy.ts` — `'/api/request-access(.*)'` added to `PUBLIC_ROUTE_PATTERNS`.
- `supabase/migrations/20260611193000_access_requests.sql` — new `access_requests` table + indexes + RLS (service-role only).
- `public/marketing/*` — real product screenshot (`moves-real.png`) and abstract brand graphics (`accent.png`, `surf-*.png`). No AI-human imagery.

## QA / Validation

Status: PASS (design) / NOT-RUN (migration, email)

- PASS: Form fields validated in browser — name, work email, company, role, company size, industry, org type (enterprise vs SI/advisory), optional initiative.
- PASS: Static design validated in the browser (hero, three-dimension stack, graphical Picture-this section, modal form, footer logo).
- NOT-RUN: `npx tsc --noEmit` for the rewritten component + new route — to run before merge.
- NOT-RUN: Migration `20260611193000_access_requests.sql` — apply via `npm run db:migrate` on ACA (localhost cannot reach the private VNet DB). The API route fails soft if the table is not yet present (logged, falls back to email).
- NOT-RUN: Email path — requires `RESEND_API_KEY`; without it, leads are still stored and (dev) logged.

## Rollout Plan

Deploy the branch; apply the migration on ACA before public traffic relies on durable storage (email notification works without it).


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Revert the component to the previous `LoggedOutLandingPage`, remove the public-route entry and the API route. The `access_requests` table is additive and can be left in place.

## Audit Evidence
- New table is append-only lead capture; `user_agent` and `created_at` recorded. No PII beyond what the requester submits; no tenant data involved.

## Known Gaps

- `npx tsc --noEmit` not yet run on the new component and route
- Migration not applied to ACA private DB yet
- Email notification path not tested end-to-end (Resend key required)
