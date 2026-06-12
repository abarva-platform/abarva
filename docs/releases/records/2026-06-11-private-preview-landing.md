# 20260611-private-preview-landing — Private-preview marketing landing + Request-access lead capture

## Release ID
`20260611-private-preview-landing`

## Release Lane
`public-demo` (public signed-out marketing route) + `global-control-lane` (new public API route + new control-plane table). Not client-scoped.

## Status
`candidate`

## Plain-English Summary
Replaces the signed-out marketing landing page (`LoggedOutLandingPage`) with the new founder-led private-preview design: a product-led hero (dark gradient, a no-PII Strategic Moves screenshot, and a connected "three dimensions of value" — Decide / Source / Prove), a graphical "Picture this" three-moment section, the five surfaces, and a "Request access" call to action. No AI-generated human imagery is used; visuals are the product screenshot and abstract brand graphics. The hero copy now addresses the accountable CXO directly instead of using generic AI-ambition framing.

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
- `src/components/marketing/LoggedOutLandingPage.tsx` — rewritten to the new private-preview design (styled-jsx, no Tailwind), Request-access modal form (client state → `POST /api/request-access`), Option-2 logo from `/brand/`, and CXO-accountable opening copy.
- `src/app/api/request-access/route.ts` — new public POST: validate (work email), store in `access_requests`, email `admin@abarva.ai` via Resend (`replyTo` the requester). Default sender is the verified `support@send.abarva.ai` subdomain, with `RESEND_FROM_EMAIL` available as an Azure env override. Best-effort; 500 only if nothing captured in prod.
- `src/proxy.ts` — `'/api/request-access(.*)'` added to `PUBLIC_ROUTE_PATTERNS`.
- `supabase/migrations/20260611193000_access_requests.sql` — new `access_requests` table + indexes + RLS (service-role only).
- `public/marketing/*` — no-PII product screenshot (`moves-real.png`) and abstract brand graphics (`accent.png`, `surf-*.png`). No AI-human imagery.

## QA / Validation
- PASS — form fields cover name, work email, company, role, company size, industry, org type (enterprise vs SI/advisory), optional initiative.
- PASS — `npx jest src/app/api/request-access/__tests__/route.test.ts --runInBand`; verifies the verified `send.abarva.ai` default sender and `RESEND_FROM_EMAIL` override.
- PASS — `npx eslint src/app/api/request-access/route.ts src/app/api/request-access/__tests__/route.test.ts`.
- PASS — static design validated in the browser during implementation (hero, three-dimension stack, graphical Picture-this section, modal form, footer logo).
- PASS — `moves-real.png` was replaced with the no-PII clean screenshot asset (`~/Downloads/_moves-clean.png`), showing only "Sample Enterprise · CXO" and no personal name, avatar, or sign-out control.
- PASS — live Azure migration applied and verified against `abarva_control`; `access_requests` exists.
- PASS — live Azure revision served `/`, `/signed-out`, and `/api/health` with 200 responses and Azure/Postgres health.
- PASS — live `POST /api/request-access` rejected a free-email test with 422 and accepted a timestamped work-email test with 200 `{ ok: true }`.
- PASS — fresh revision logs showed no request-access store/email failures and no Vercel or Supabase host strings.

## Rollout Plan
1. Apply `supabase/migrations/20260611193000_access_requests.sql` to the Azure/Postgres control plane through the private ACA/VNet migration job.
2. Set `RESEND_API_KEY` as an Azure Container Apps secret and bind `RESEND_API_KEY=secretref:resend-api-key`.
3. Set `RESEND_FROM_EMAIL` to `AbarVa Preview <support@send.abarva.ai>` unless the root `abarva.ai` domain is separately verified in Resend.
4. Deploy the branch image to Azure Container Apps and route traffic through the normal active revision process.
5. Browser-test `/`, `/signed-out`, valid request-access submit, invalid/free-email submit, durable `access_requests` row creation, and real Resend notification delivery.

Rollout through PR #3412 completed on 2026-06-12. This follow-up polish updates the CXO opening copy and no-PII product screenshot only.

## Rollback Plan
Revert the component to the previous `LoggedOutLandingPage`, remove the public-route entry and the API route, then redeploy the prior image. The `access_requests` table is additive and can be left in place; if legal/ops requires removal, export any captured leads first and then drop the table in a separate controlled data-plane rollback.

## Known Gaps
- The route is public by design; abuse protection beyond work-email validation/rate limiting is not part of this slice.

## Audit Evidence
- New table is append-only lead capture; `user_agent` and `created_at` recorded. No PII beyond what the requester submits; no tenant data involved.
