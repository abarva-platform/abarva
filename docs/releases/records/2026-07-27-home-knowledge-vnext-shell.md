# 2026-07-27-home-knowledge-vnext-shell — Home / Knowledge vNext preview shell

## Release ID

`2026-07-27-home-knowledge-vnext-shell`

## Status

`candidate`

## Plain-English Summary

Adds a new, isolated Home / Knowledge experience (Brief · Explore · Relationships
· Evidence & Gaps) built strictly against the merged Phase 3C-2D consumption
contracts. It is reachable only by platform admins at an internal preview route
and is served entirely from contract-valid **synthetic fixture** data. It changes
nothing for tenants: the existing `/home` is untouched, the feature is behind a
default-off flag, and no route or tenant is activated. The point of this slice is
to build the experience against the governed data boundary so that when the real
consumption APIs are published, the same components work unchanged — no rewiring.

## Layer Impact

Release lanes: **`experimental`** (feature-flagged, default-off, non-default
capability) and **`internal-admin`** (admin-only preview surface). Not
`global-control-lane`, not `client-data-lane`, not `public-demo`.

- **Products (layer 4):** a new Home/Knowledge projection surface (preview only).
  It owns no data; every screen is a projection of the consumption contracts.
- **Canonical / consumption (layer 3):** consumed read-only via a provider
  boundary. No schema, migration, publication, or loader changed.
- No change to Client Intake or Source Adapters.

## Client Applicability

- All clients: none (no behavior change).
- Specific clients: none.
- Internal only: platform admins can view the preview at `/knowledge-preview`.
- Public/demo only: no.
- Feature flag: `home_knowledge_vnext` — `policy: tenant`, `includeTenants: []`
  (default OFF for every tenant; no email allowlist).

## Changes Included

- `src/lib/knowledge/consumption-contracts/` — generated TS consumption contracts
  + zod validators (states, envelope, projections, relationships, metrics, aVa,
  handoff, provider).
- `src/lib/knowledge/consumption-client/` — `ContractFixtureConsumptionProvider`,
  `HttpConsumptionApiProvider`, aVa providers, runtime factory + React context.
- `src/lib/knowledge/fixtures/` — Airline + Healthcare `fixture_only` packs
  (synthetic `fixture-*-demo-new` namespaces) + ten scenario transforms.
- `src/components/knowledge/vnext/` — shell, four modes, aVa dock, evidence
  drawer, SVG graph, handoff preview, primitives, styles.
- `src/app/(maestro)/knowledge-preview/page.tsx` — admin-only preview route.
- `src/components/chrome/MaestroChrome.tsx` — `/knowledge-preview` added to
  `SHELL_SURFACE_PREFIXES` (product chrome, no second shell).
- `src/lib/features/registry.ts` — `home_knowledge_vnext` flag declared.
- Tests: contract, provider/scenario/aVa, legacy-boundary (47 tests).
- Docs: `docs/knowledge-vnext/IMPLEMENTATION_PLAN.md`,
  `docs/knowledge-vnext/BACKEND_API_GAP_REGISTER.md`.

## QA / Validation

- **Typecheck:** `tsc` clean over all new contracts, client, fixtures,
  components, and the route.
- **Unit tests:** 47 passing — fixtures validate against the contract; unknown
  availability states fail; missing baseline/version fields fail; candidate
  cannot be labeled published; withheld cannot leak; partial/withheld/not-loaded
  never coerce to zero; graph one/two-hop + candidate opt-in; aVa refuses without
  evidence and is unavailable when models are disabled; both providers satisfy
  the same interface; no forbidden legacy import.
- **Interactive verification** (temporary dev harness, since removed; the real
  route is admin-gated): all four modes render from the provider; evidence drawer
  opens from a number with full descriptor fields; `models_disabled` shows the
  page fully working with only aVa off; Proof depth reveals baseline/hash
  metadata; Escape closes the drawer; responsive at 390px docks aVa to the bottom;
  browser console clean.

## Rollout Plan

No runtime rollout. Merge to `main` via squash PR. The feature stays behind the
default-off flag and the admin-only route; it does **not** activate for any
tenant. Enabling a pilot tenant later requires the backend consumption endpoints
(see gap register), reconciliation parity, and a separate flag/env change through
the repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: n/a (no runtime image change in this slice).
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: `home_knowledge_vnext` stays OFF; any future flip
  is a governed registry change, not an ad-hoc env mutation.
- Live signed-in proof required: not for this slice (nothing activated). Required
  before any tenant flag flip.

## Rollback Plan

Delete the route file and revert the two edits (`MaestroChrome.tsx`,
`registry.ts`); the isolated `src/lib/knowledge/**` and `src/components/knowledge/**`
trees have no other importers. No data or migration to roll back.

## Audit Evidence

- This release record + `docs/knowledge-vnext/IMPLEMENTATION_PLAN.md` +
  `docs/knowledge-vnext/BACKEND_API_GAP_REGISTER.md`.
- Test suites: `src/lib/knowledge/**/__tests__/vnext-*.test.ts` (47 passing).
- Legacy-boundary scan test enforces no forbidden upstream imports.

## Known Gaps

- Published `/api/knowledge/consumption/*` endpoints, evidence-resolution
  endpoint, Cube semantic API, and audited aVa wiring are not built (gap
  register). Until then the experience runs on fixtures only.
- Playwright visual-regression suite, jsdom interaction tests, automated `axe`
  pass, and large-inventory virtualization are open (verified interactively /
  by construction in this slice).
- No production route or tenant is activated; no Azure/PostgreSQL/loader/parser/
  publication was modified.
