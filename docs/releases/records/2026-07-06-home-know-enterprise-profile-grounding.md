# 2026-07-06-home-know-enterprise-profile-grounding — Home KNOW grounds identity questions on the enterprise profile

## Release ID

`2026-07-06-home-know-enterprise-profile-grounding`

## Status

`candidate`

## Plain-English Summary

When a user asks Home's aVa a "who is this company / tell me about the business / why is X a good demo problem" question, the answer used to be weak and off-target: it routed on a stray keyword and returned a generic list (e.g. data-asset names) instead of actually describing the company. Two things caused this:

1. **Routing.** The Home KNOW question classifier walked a keyword ladder. A program named "Legal Contract Intake" contains the word "contract", so the question "Who is Lakeshore, and why is Legal Contract Intake a good CXO demo problem?" was captured by the vendor/contract rule and never reached the enterprise-profile topic.
2. **Prose.** Even the enterprise-profile ("loaded_context") answer was meta — it said "X is using the V6 Home contract pack, with N evidence areas and M records" and never read the company name, industry, business model, revenue, employee count, or loaded initiatives that are already present in the tenant's V6 profile evidence.

This change adds an identity/orientation routing rule that fires **before** the keyword ladder (so "who is …", "tell me about the business", "why is … a good demo problem" resolve to the enterprise profile), and rewrites the enterprise-profile prose to compose a real company description from the governed V6 profile record plus the tenant's loaded initiatives. It is general across all tenants — it reads whatever the tenant's V6 profile and programs evidence contain; no client-specific text is hard-coded.

## Layer Impact

- `global-control-lane`: Home KNOW answer composition (`src/lib/home/know/v6-home-ask.ts`) is shared app/control-plane behavior for every tenant that uses the Home KNOW surface. The question classifier and the enterprise-profile prose branch change for all clients. No schema, data-plane, or RLS change.

## Client Applicability

- All clients: Yes — the routing rule and prose branch apply to every tenant answered by the V6 Home KNOW contract. Each tenant grounds on its own V6 profile/programs evidence.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None (behavior change is on the existing deterministic Home KNOW path).

## Changes Included

- `src/lib/home/know/v6-home-ask.ts`
  - `classifyQuestion`: added three identity/orientation rules ahead of the keyword ladder — `who is/are <company>` (excluding leader-role phrasings like "who is the CIO"), `tell me about / introduce / overview of / describe the / what does … do` the company/business/holding/group, and `<good|why|best …> <demo|use case|example|candidate|pilot problem>` — each routing to `loaded_context` (enterprise profile).
  - `answerParagraphsByTopic` `loaded_context` branch: replaced the meta "using the V6 Home contract pack" prose with a composed company description built from the V6_01 enterprise-profile record (company name, industry/sub-industry, business model, employee count, and a cleaned strategic-priorities rollup) plus the tenant's loaded V6_09 initiatives (name + phase). Directive/data-thin tokens (`do_not_add_…`) and the duplicated `total_employees` key are filtered out of the rollup.

## QA / Validation

- **Typecheck — PASS:** `npx tsc --noEmit -p tsconfig.json` in a worktree off `origin/main` with `node_modules` symlinked — 0 errors in app code (`src/**`), only pre-existing optional-dep resolution noise.
- **Deterministic prose smoke — PASS:** faithfully ported `classifyQuestion` + the new `loaded_context` prose and ran it against the real `datasets/lakeshore-holdings-synthetic-v6/templates/V6_01_enterprise_profile.csv` and `V6_09_programs_initiatives.csv`:
  - `"Who is Lakeshore, and why is Legal Contract Intake a good CXO demo problem?"` → topic `loaded_context` (was `vendors_contracts`).
  - `"Who is the CIO?"` → not captured by the new identity rule (leader-role exclusion fires; falls through unchanged).
  - `"What vendors do we have contracts with?"` → topic `vendors_contracts` (unchanged).
  - Prose output for Q1 now reads: "Lakeshore Holdings is a Diversified private holding company — portfolio-company operator with corporate shared services, with 11,800 employees. Holding company with four named operating companies…" followed by the revenue/IT-budget rollup ($7.12B portfolio, $190.6M IT) and named loaded initiatives including "Legal contract lifecycle foundation (pilot)".
- **Live signed-in proof — NOT-RUN (pending deploy):** to be captured on `ca-abarva-web-lab-eastus` after deploy (Home aVa KNOW ask, Lakeshore tenant) before demo recording.

## Rollout Plan

Merge to `main` → GitHub "ACA main deploy" builds the image from the merge SHA and deploys it to `ca-abarva-web-lab-eastus` → assign 100% traffic to the new healthy revision → verify `https://app.abarva.ai` Home KNOW answer live. No migration, no worker, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows` "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none (pure application-layer logic; no DB/worker/flag mutation).
- Approved image digest: recorded at deploy time from the ACA revision.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% before verification.
- Worker image invariant: n/a (no worker change).
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Home aVa KNOW answer for the Lakeshore tenant on `app.abarva.ai`.

## Rollback Plan

Revert the PR and let "ACA main deploy" ship the prior image, or shift 100% ACA traffic back to the previous healthy revision. No data migration is involved, so rollback is a pure image/traffic operation with no state constraints.

## Audit Evidence

- PR URL: (added on open)
- CI run: "Typecheck + reasoning-layer tests" + "Next bundle budget" on the PR.
- Deterministic smoke output: captured in the PR description / session transcript.
- Live proof: `app.abarva.ai` Home KNOW screenshot for the Lakeshore identity question (added after deploy).

## Known Gaps

- Home KNOW remains sourced from the on-disk per-tenant V6 dataset pack (`datasets/<tenant>-synthetic-v6/`), not from live `enterprise_context` uploads. Ad-hoc CSV context uploaded through the admin context-layer path is retrievable by Intelligence but is **not** read by Home KNOW; grounding new narrative context into Home requires updating the tenant's V6 profile/programs evidence. This change makes Home KNOW use that V6 evidence well but does not wire Home KNOW to the live upload path — that remains a separate, larger item.
- The "why is X a good demo problem" second clause is answered by naming the loaded initiatives and their governance fields, not by a bespoke thesis narrative; the richer decision thesis lives on Moves/Intelligence for that initiative.
