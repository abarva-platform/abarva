# 2026-06-21-source-d04-d07-templates — Wire d04_app_inv and d07_ticket_synth prompt templates

## Release ID

`2026-06-21-source-d04-d07-templates`

## Status

`candidate`

## Plain-English Summary

d04 (Application Inventory) and d07 (Ticket History Synthesis) are referenced as
optional upstreams in both d05_scope_memo and d09_rfp_pack but had no generation
templates. The d09 quality gate evaluates on Exhibits 08/13/14/15 that map to these
artifacts — their absence left d09 capped at 7/10 even with full evidence uploads.

This adds both prompt templates to the registry, following the same pattern as d02
and d03. d04 synthesizes the application/system estate from scope memo + uploaded
evidence. d07 synthesizes ITSM ticket volumetrics and SLA patterns from uploaded
SLA/incident evidence. Both use DEFAULT_MODEL (Sonnet 4.6, 24k max tokens) and are
consumed by d09 in §3–§5 and §5–§7 respectively.

## Layer Impact

**Lane:** `global-control-lane` — prompt registry additions only. No schema changes,
no migration, no API surface change. No existing behavior altered.

- `src/lib/source/agent-generation/prompt-registry.ts`: +d04_app_inv, +d07_ticket_synth entries in REGISTRY.

## Client Applicability

All clients: yes. Any Source event can now generate d04 and d07, unblocking a
complete d01→d02→d04→d05→d07→d09 artifact chain.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `docs/releases/records/2026-06-21-source-d04-d07-templates.md`

## QA / Validation

- ESLint / tsc: additive entries in an existing Record, no new types.
- Live proof: after deploy, fire d04 and d07 on event
  `17e32d94-1e22-49c9-ac5d-9ffd76d98e01` (MDR & SOC Outsourcing 2026), then
  re-fire d09 and confirm quality gate passes (≥8/10 across all dimensions).

## Rollout Plan

1. Merge PR to main.
2. ACA auto-deploys via `aca-main-deploy`.
3. Retry d04 → d07 → d09 on the test event.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- No migration; no feature flag; no env var change required.
- Live signed-in proof required: d04 + d07 generation on at least one event post-deploy,
  then d09 quality gate pass (≥8/10).

## Known Gaps

- d04 and d07 for events with no uploaded evidence or scope memo will fall back to
  model-derived assumptions marked [ASSUMED — client to validate]. This is by design;
  the templates make the assumption-vs-evidence boundary explicit.
- Exhibits 08 (locked pricing assumptions) and 14 (transition blackout calendar) are
  not satisfied by d04/d07 — they require separate client uploads. The d09 quality gate
  may still dock on those two exhibits until the evidence uploads are provided.
- No section-conformance registry entries for d04/d07 yet; `formatRequiredSectionsForPrompt`
  is not called in these templates (inline section list used instead, matching d02/d03 pattern).

## Rollback Plan

Revert the commit. No persisted state affected — generated artifact bodies can remain
in the DB harmlessly even if the templates are removed.

## Audit Evidence

- d09 quality gate detail (pre-fix): "Generation is not yet wired for d04_app_inv /
  d07_ticket_synth. Supported codes are listed in the prompt registry."
- PR branch: `feat/source-d04-d07-templates`
