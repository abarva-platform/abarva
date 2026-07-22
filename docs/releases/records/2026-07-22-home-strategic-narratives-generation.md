# 2026-07-22-home-strategic-narratives-generation — wire New Ways of Operating / change theses / industry movements

## Release ID

`2026-07-22-home-strategic-narratives-generation`

## Status

`candidate`

## Plain-English Summary

The explorer's "New Ways of Operating" (and "Change Theses" / "Industry Movements") item rendered as an empty "PARTIALLY LOADED · evidence required" state because the `home_knowledge_strategic_narratives` table — created by the v3 migration — had no generator. This wires it.

Rather than fold it into the existing pack call (which already produces 7 output sections and truncated the last one — strategic_narratives came back empty at 12k tokens), this adds a **dedicated, focused Claude call** for the forward-looking layer, with its own crystal-clear C-suite-consultant prompt. The one-scope-per-call split gives the strategic layer the full token budget and a sharper instruction set.

The dedicated prompt directs Claude to act as a senior C-suite strategy consultant writing a board pre-read, grounded in THIS tenant's loaded context, producing three narrative types:
- **industry_movement** (classification=industry_pattern): where the industry is moving that is relevant to the tenant; never claims the tenant has adopted it.
- **new_way_of_operating** (classification=strategic_inference): a plausible future operating pattern — current state → future shift, dependencies, evidence gate — explicitly a strategic option, not a proven outcome. This fills the "New Ways of Operating" surface.
- **change_thesis** (classification=strategic_inference): a supported thesis, current → target condition with the industry force behind it.

It inherits the overclaim ban (no "proven"/"value is real"/realized-value), requires honest confidence, and is non-fatal (a failed strategic call logs and returns [], so the rest of the pack still ships).

Proven cold-start against SkyHarbor/Airline (no pre-authored narrative): 14 strategic narratives (5 industry movements, 5 new ways of operating, 4 change theses), tenant-specific and grounded — e.g. "From three disruption desks to one governed recovery cockpit," naming the tenant's real Crew Gateway / PSS systems, framed as a strategic_inference at 0.55 confidence with a single decision-grade evidence gate.

## Layer Impact

- `client-data-lane`: populates the existing (previously orphaned) v3 `home_knowledge_strategic_narratives` table. No schema change — the table already exists and is applied on Azure.
- `global-control-lane`: adds a second scoped Claude call + focused prompt/tool; refactors the API-call retry loop into a reusable `invokeClaudeTool`.

## Client Applicability

- All clients: strategic narratives generate for any tenant on the `--use-claude` build path.
- Internal only: generator/prompt are offline operator tooling.
- Feature flag: None. No runtime read-path change.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`:
  - Dedicated `claudeStrategicSystemPrompt()` (C-suite consultant, three narrative types, tenant-grounded, overclaim ban) + `claudeStrategicTool()`.
  - `invokeClaudeTool()` reusable forced-tool-use call with retry/backoff; `callClaudeForStrategicNarratives()` (non-fatal).
  - normalization + column-map + DB write-path registration for `home_knowledge_strategic_narratives`.
  - Gated `HOME_KNOWLEDGE_DEBUG` diagnostic line (off by default).

## QA / Validation

- `pass` — `node --check` + `npx eslint` clean.
- `pass` — Live cold-start against SkyHarbor/Airline (`--use-claude`, DB write): 14 strategic narratives (5 industry_movement / 5 new_way_of_operating / 4 change_thesis), tenant-specific, grounded, correctly classified (industry_pattern vs strategic_inference), honest confidence (~0.5), no overclaim. Inspected the New Ways of Operating rows directly in the DB.
- `pass` — Root-cause fix verified: with strategic_narratives in the SINGLE pack call it returned 0 (truncated as the 7th/last section); the dedicated call returns 13-14 reliably.
- `pass` — Deterministic regression (no `--use-claude`): Meridian wrote `pass`, and `home_knowledge_strategic_narratives` = 0 rows — the table stays empty on the non-Claude path (no fabrication).
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`.
- `n/a` — No migration: the `strategic_narratives` table already exists on Azure (applied via the v3 migration earlier).

## Rollout Plan

Merge + deploy through the normal ACA lane. No migration to apply. Generation runs offline on the `--use-claude` build path; populates on the next generation run. Non-fatal: a failed strategic call leaves the rest of the pack intact.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: None — no schema, no runtime behavior change.
- Migration application: none required (table pre-exists on Azure).
- Feature/env flag update path: None (optional `HOME_KNOWLEDGE_STRATEGIC_MAX_TOKENS` / `HOME_KNOWLEDGE_DEBUG` env vars, both defaulted).
- Live signed-in proof required: No — no runtime-visible change in this PR.

## Rollback Plan

Revert the PR. Generation additions are inert unless `--use-claude` is passed; the second call is non-fatal. No schema to roll back.

## Audit Evidence

- Live cold-start generation inspected in the local DB (14 narratives, New Ways of Operating content quoted above).
- Truncation root-cause: single-call returned 0 strategic narratives; dedicated call returns 13-14.

## Known Gaps

- The dedicated strategic call is a second API call per tenant; a transient failure returns [] (non-fatal) and that run's strategic narratives are empty — a re-run repopulates them. Acceptable for the offline build; the population run should verify a non-zero count per tenant before approval.
- The other still-orphaned v3 tables (`enterprise_model_items`, `operating_model_items`, `dimension_visual_specs`, `relationship_explanations`, `module_implications`, `executive_takeaways`) remain unwired. Of these, `relationship_explanations`/`dimension_visual_specs` are groundable follow-ups; the office/division ones are NOT groundable from current source (see the field-contract groundability audit).
