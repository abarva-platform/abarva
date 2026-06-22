# 2026-06-22-home-react-surface-canonical-ask — Real React Home with the canonical AvaAsk

## Release ID

`2026-06-22-home-react-surface-canonical-ask`

## Status

`candidate`

## Plain-English Summary

Adds a **real React Home surface** (`HomeSurface`) whose "Ask about anything" is the **canonical AvaAsk** — it POSTs the shared `/api/intelligence/ask` engine and renders the answer through the one `AgentAnswerRenderer`, exactly like the Intelligence surface. This replaces the static `/home-v2` iframe and its **fake local answer** (`answerForAsk`, which globbed pre-baked facts with "Also:" and never called a model). It also introduces a **reusable `AvaAsk` component** so any surface can answer + render identically — one ask, one renderer, no surface-local logic.

It is a full **Context Explorer**: a left rail of the tenant's **loaded context dimensions** (from the binding — real per-tenant data, not the static page's single-tenant demo blob), a canvas overview (trust posture + signals + industry-corpus patterns), and per-dimension detail on click — with the canonical ask always at the top.

The new surface is **gated behind a new `home_react_surface` flag, default OFF**, so the live static Home is unchanged until the React surface is proven live.

## Layer Impact

`global-control-lane` — new shared control-plane UI (the reusable `AvaAsk` ask + `HomeSurface`) plus one new feature flag. Presentational/orchestration only; no client-data-lane, schema, migration, or answer-engine change. Behind a default-off flag, so the merge is inert at runtime.

## Client Applicability

Feature flag — `home_react_surface`, **default OFF**, tenant opt-in via `includeTenants` or the env override. No client receives the React Home until the flag is flipped; every tenant keeps the static Home until then.

- All clients: no (until flipped)
- Specific clients: opt-in via flag
- Internal only: no
- Public/demo only: no
- Feature flag: `home_react_surface` (default off)

## Changes Included

- `src/components/agent-answer/AvaAsk.tsx` (+ `__tests__/AvaAsk.test.tsx`) — the reusable canonical ask.
- `src/components/home/HomeSurface.tsx` (+ `__tests__/HomeSurface.test.tsx`) — the React Home Context Explorer: dimension rail + overview + per-dimension detail, all from the binding, plus the canonical ask.
- `src/app/(maestro)/home/page.tsx` — flag branch: React Home when `home_react_surface` is on, static iframe otherwise.
- `src/lib/features/registry.ts` — registered the `home_react_surface` flag.

## QA / Validation

- Jest (jsdom): `AvaAsk.test.tsx` — AvaAsk makes the canonical `POST /api/intelligence/ask` (rich + surfaceContext) and renders the streamed `AgentAnswer` table once, with exactly one "Ava ·" header (no double-render). `HomeSurface.test.tsx` — renders the overview (ask + real signals + the loaded-dimension rail) and opens a dimension's detail from the rail. Result: **passed** (3 tests).
- `tsc --noEmit` clean on all new/changed files.
- Live signed-in verification of the flipped flag is **not run** yet — it is the gate before any rollout.

## Rollout Plan

Merge to `main` with the flag default OFF → no runtime change (static Home stays). To activate: set `home_react_surface` for a tenant (`includeTenants` or the env override), verify signed-in, then platform-default once proven and retire `public/home-v2`. No migration, no worker/job change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`)
- Shared runtime mutators: none
- Approved image digest: produced by CI on merge
- ACA runtime invariant: web revision only; no worker/job or queue change
- Worker image invariant: unchanged
- Feature/env flag update path: `home_react_surface` via `registry.ts` `includeTenants` or env override
- Live signed-in proof required: yes — flip the flag for one tenant and confirm the canonical ask renders on `/home` before rollout

## Rollback Plan

The flag is default OFF, so the merge is inert — nothing to roll back at merge time. If the flag is later flipped and an issue appears, **unset the flag** for an instant revert to the static iframe (no deploy needed). The PR itself is also revertable (purely additive UI + a flag).

## Audit Evidence

- PR URL + CI runs (`jest` for the two new suites, `tsc`, `release:check`).
- The `AvaAsk` + `HomeSurface` test output (canonical POST asserted; single header; real context cards).
- Post-flip live `/home` capture confirming the canonical ask renders signed-in (added when the gate is run).

## Known Gaps

- The explorer renders the binding's **loaded context dimensions** (8 per tenant today) + signals + corpus — the real per-tenant data. This intentionally **retires** the static page's single-tenant demo blob (19 hand-authored assessments that were identical for every tenant); the React surface shows real per-tenant context instead. If a richer per-dimension current-state model is later wanted, it should be sourced from the data plane, not re-baked.
- Live flip + signed-in verification is the gate before rollout (flip `home_react_surface` for one tenant, confirm on `/home`, then platform-default + retire `public/home-v2`).
- The engine-side exhibit-quality issue (charts/tables scraped from prose) is tracked separately; Home uses the shared engine + renderer, so it inherits that fix automatically with no Home-specific code.
