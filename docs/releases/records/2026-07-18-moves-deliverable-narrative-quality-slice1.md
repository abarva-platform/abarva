# 2026-07-18-moves-deliverable-narrative-quality-slice1 — Moves Deliverables: Partner-Level Section Guidance (Slice 1)

## Release ID

`2026-07-18-moves-deliverable-narrative-quality-slice1`

## Status

`candidate`

## Plain-English Summary

The orchestrated Moves deliverable pipeline (`moves_orchestrated_deliverables` flag, live today for tenants **skyharbor** and **lakeshore**) builds its generation prompts from `deliverable-structures.ts`. Each document type has a per-section `intent` string, and this is confirmed to be the only per-section content that actually reaches the live prompt (`prompt-builder.ts:158-161` renders `${title} — ${intent} [${groundingMode}]`; a sibling field, `expertLatitude`, exists in the data model but is never read anywhere in prompt construction).

One deliverable type — the P1 Charter — already has real, partner-level `intent` text (a 4-part success-criteria methodology, explicit guidance on handling unmeasurable metrics, institutional memory about a past scope-creep mistake). Every other structure had thin, generic `intent` text — 3-8 word noun phrases like "The financial case." or "Control families and required approvals." — that read like a table-of-contents template, not guidance.

This release rewrites every section's `intent` string across the 4 highest-stakes, highest-leverage structures — **business_case** (10 sections), **target_architecture** (9 sections, also used for `target_state_architecture` and `solution_design`), **roadmap** (9 sections, also used for `execution_roadmap`), and **estimate_model** (8 sections, also used for `financial_model`) — to Charter's density and specificity: what makes a strong vs. weak version of each section, the real methodology a practitioner would apply, a concrete failure mode to avoid, and cross-references to other sections in the same document. This is content authoring into an already-wired, already-live field — no schema change, no new plumbing.

Also added: `target_architecture` previously had no bespoke fabrication-guardrail case in `artifactHonestyDiscipline()` (it silently used the generic default) despite being exactly the kind of document that invites specific-sounding-but-fabricatable technical claims (a named vendor product, a compliance certification, a control-maturity level). Added a dedicated case, matching the shape of the existing business_case/estimate_model/roadmap cases, covering all three deliverableType spellings that route to this structure.

## Layer Impact

- `global-control-lane`: `deliverable-structures.ts` and `prompt-builder.ts` are shared orchestrator files, not tenant-specific.

## Client Applicability

- All clients: no — only affects clients on the `moves_orchestrated_deliverables` flag.
- Specific clients: **skyharbor, lakeshore** (the only tenants currently enrolled in this flag).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_orchestrated_deliverables` (pre-existing, unchanged by this release).

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`: rewrote the `intent` string (3rd positional arg to the shared `s()` helper) for all 36 sections across `MOVES_BUSINESS_CASE`, `MOVES_TARGET_ARCHITECTURE`, `MOVES_ROADMAP`, `MOVES_ESTIMATE`. No section keys, `requiredSectionKeys`, or `groundingMode` values changed — confirmed via diff and a section-count check (116 total `s(...)` calls across the file, unchanged before/after). `MOVES_CHARTER` untouched (already good; two tests assert its exact `intent` regex).
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: added `case "target_architecture": case "target_state_architecture": case "solution_design":` to `artifactHonestyDiscipline()`, a new honesty-mode paragraph guarding against unfounded vendor/pattern/certification/maturity claims in architecture documents.

## QA / Validation

- Pass: `npx eslint` on both touched files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Pass: `npx jest src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/generation-plan.test.ts` — 17/17 (structural-shape and Charter-intent-regex tests, unaffected since only non-Charter `intent` text changed).
- Pass: `npx jest src/lib/deliverables/orchestrator` (full directory sweep) — 130/132; the 2 failures (`persistence.test.ts`, `renderers.test.ts`) are a pre-existing, unrelated Source/RFP naming-drift issue ("SkyHarbor Air" vs "Airline Demo") — confirmed via `git stash` to reproduce identically on clean `origin/main`.
- Manual read-through: all 36 rewritten `intent` strings read against the "would a partner have written this" bar established by three pre-validated worked examples (business_case.financials, target_architecture.security_controls, estimate_model.confidence) during planning. Each carries specific methodology, a named failure mode, and cross-references to sibling sections in the same document, matching Charter's proven density (~90-150 words/section) rather than generic best-practices filler.
- This is content-quality work; no automated test can verify prose quality — the manual read-through above is the real check, and the only true verification is observing actual generation output.
- Not run: live signed-in browser proof (no valid local Clerk session in this environment). No UI renders `intent` directly — this only changes prompt content fed into the next live generation for skyharbor/lakeshore.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag change (existing flag stays as-is), no worker job. Effective immediately for the next orchestrated generation request for `business_case`, `target_architecture`/`target_state_architecture`/`solution_design`, `roadmap`/`execution_roadmap`, or `estimate_model`/`financial_model` on skyharbor or lakeshore.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — generate one of the 4 covered deliverable types for skyharbor or lakeshore post-deploy and confirm the output reads noticeably more specific and grounded (real methodology, named failure modes addressed) than a generic template, not just structurally present.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind — purely prompt-content strings.

## Audit Evidence

- This PR's diff.
- `brief-library.test.ts` / `generation-plan.test.ts` full pass (17/17); full orchestrator directory sweep (130/132, 2 pre-existing unrelated failures confirmed via `git stash`).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **`sourcing_strategy` remains on the fully generic `defaultBrief()` fallback — deliberately, not touched here.** Investigated during planning: the map file's own comment states this is intentional ("sourcing brief has no dedicated structure, uses the generic board brief"), and the fix initially considered (repoint the registry key to `sourcing_strategy_memo`) would not actually work — `generate-phase/route.ts` hardcodes `module: 'moves'` for every deliverable in a batch, but `SOURCE_STRATEGY_MEMO` is registered under `module: "source"`, so the lookup would still miss. It would also silently drop `sourcing_strategy`'s existing bespoke honesty-mode language. A real fix (a new `MOVES_SOURCING_STRATEGY` structure, or making `generate-phase` module-aware per deliverable) is separate, larger design work.
- **The other 9 orchestrator structures** (discovery_report, root_cause_worksheet, operating_model, solution_design's own future dedicated structure if built, tower_metrics_plan, mobilization_plan, handoff_pack, value_measurement_contract, executive_playback) still have thin, generic `intent` text. Natural follow-on slice using the same proven pattern.
- **No cross-phase narrative continuity exists anywhere in this pipeline.** No deliverable's prompt is ever handed the prior phase's actual approved content — each is generated independently. `phaseOrStage: 'build'` is a hardcoded dead literal in `build-request.ts:41`. This is a real, separate, larger architectural gap (evidence assembly and request-building changes), not attempted in this slice.
- The `expertLatitude` field remains unused/dead across the entire file — not wired into the prompt in this release, since `intent` alone already proves sufficient (Charter's density lives entirely in `intent`). Left as-is rather than adding an unused second channel.
