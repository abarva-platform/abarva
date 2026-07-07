# 2026-07-06-home-know-v7-routing-fix — Fix Home KNOW (V7) routing: tenant-name collision + identity/advisory intents

## Release ID

`2026-07-06-home-know-v7-routing-fix`

## Status

`candidate`

## Plain-English Summary

The live Home aVa KNOW route (`/api/home/know/ask`) is served by the **V7** engine (`src/lib/home/know/v7-home-ask.ts`), not the V6 engine. The two prior records (`…enterprise-profile-grounding`, `…advisory-handoff`) fixed the V6 engine, which this route does not call — so they had no live effect. This record fixes the V7 engine, where the actual defects were.

Three defects in V7 `classifyQuestion`:

1. **Tenant-name collision (root cause).** The `data_estate` rule matched a bare `lake` token (intended for "data lake"/"lakehouse"). The tenant is named **Lake**shore, so *every* question containing "Lakeshore" — including "Who is Lakeshore?" — matched `/lake/` and was routed to the data-assets dimension, producing a generic data-asset list instead of a company description. Fixed by word-bounding the data tokens (`\b(data|analytics|teradata|tableau|databricks|lakehouse)\b`) so a company name never collides with a dimension keyword.
2. **No identity/orientation routing.** "Who is <company>", "what do we know / what's loaded", "tell me about the business" had no rule and (once the lake bug is fixed) only reached the enterprise profile by default. Added explicit identity rules ahead of the keyword ladder → `loaded_context` (which already renders a real company profile via `buildEnterpriseProfileParagraphs`). A leader-role exclusion keeps "who is the CIO" out.
3. **Advisory questions answered on Home.** "Why is X a good problem", "what should we do", "recommend / prioritize / worth it" should hand off to Intelligence (Home is the context browser). Added an advisory rule → the existing `handoff_intelligence` topic (`handoffTarget: intelligence`).

Also: `buildEnterpriseProfileParagraphs` now drops non-positive `revenue_usd` so a holding company with $0 direct revenue never reads "$0 revenue" (the routing fix exposes this prose for the first time for holdco tenants).

## Layer Impact

- `global-control-lane`: Home KNOW V7 question classification + enterprise-profile prose for all tenants. No schema, data-plane, or flag change.

## Client Applicability

- All clients: Yes. The `lake` collision hit Lakeshore specifically; the identity/advisory routing and $0-revenue guard are general.
- Feature flag: None.

## Changes Included

- `src/lib/home/know/v7-home-ask.ts`:
  - `classifyQuestion`: added identity/orientation rules and an advisory→`handoff_intelligence` rule ahead of the keyword ladder; word-bounded the `data_estate` token set (removed bare `lake`, kept `lakehouse`).
  - `buildEnterpriseProfileParagraphs`: render `revenue` only when `revenue_usd` parses to a positive number.

## QA / Validation

- **Routing smoke — PASS:** ported the V7 `classifyQuestion` and ran a case table against the actual questions:
  - "Who is Lakeshore, and why is Legal Contract Intake a good CXO demo problem?" / "Who is Lakeshore?" / "What do we know about Lakeshore…" / "What context is loaded about Lakeshore…" → `loaded_context` (was `data_estate` via the `lake` collision).
  - "Why is Legal Contract Intake a good CXO demo problem?" / "What should we do about legal contract intake?" → `handoff_intelligence` (was `vendors_contracts`).
  - "Show the data assets and analytics estate" / "What is our data lakehouse?" → `data_estate` (real data questions still route correctly).
  - "What vendors do we have contracts with?" → `vendors_contracts`; "Show the systems and apps" → `apps_systems` (unchanged).
- **Typecheck — PASS:** CI "Typecheck + reasoning-layer tests".
- **Live signed-in proof — NOT-RUN (pending deploy):** on `ca-abarva-web-lab-eastus`, confirm "Who is Lakeshore / what's loaded" returns the enterprise profile (industry, employees, IT budget, no "$0 revenue"), and an advisory question shows the Intelligence handoff.

## Rollout Plan

Merge to `main` → "ACA main deploy" builds from the merge SHA → deploy to `ca-abarva-web-lab-eastus` → 100% traffic to the new healthy revision → verify live. No migration, worker, flag, or env change.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% before verification.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Home identity answer + advisory handoff on `app.abarva.ai`.

## Rollback Plan

Revert the PR (ACA main deploy ships the prior image) or shift ACA traffic back to the previous revision. No state involved.

## Audit Evidence

- PR URL: (added on open)
- CI: "Typecheck + reasoning-layer tests", "Release record and impact note".
- Routing smoke output: in the PR description / session transcript.
- Live proof: `app.abarva.ai` Home screenshots (identity → profile; advisory → Intelligence handoff), after deploy.

## Known Gaps

- The prior V6 records (`…enterprise-profile-grounding`, `…advisory-handoff`) fixed an engine the live route does not call. They are harmless (the V6 code remains valid) but ineffective; this V7 record supersedes them for the live surface. The V6 engine could be removed in a later cleanup.
- Home KNOW V7 reads the `intelligence_v7` read-model (per-tenant, DB-backed), not live `enterprise_context` uploads. Grounding new narrative context into Home still requires updating the tenant's V7 read-model.
- "Who is the CIO?" falls through to the default `loaded_context` (enterprise profile) rather than a leader view — unchanged from origin/main; not addressed here.
