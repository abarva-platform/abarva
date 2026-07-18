# 2026-07-18-moves-deliverable-narrative-quality-slice2 — Moves Deliverables: Partner-Level Guidance, Complete Coverage

## Release ID

`2026-07-18-moves-deliverable-narrative-quality-slice2`

## Status

`candidate`

## Plain-English Summary

Completes the deliverable narrative-quality work started in [2026-07-18-moves-deliverable-narrative-quality-slice1](./2026-07-18-moves-deliverable-narrative-quality-slice1.md), which deliberately scoped to 4 of 14 orchestrator structures and explicitly deferred the rest as a "natural follow-on slice." This release closes that gap — every Moves deliverable type in the orchestrated pipeline now has real, partner-level per-section guidance, matching the density and specificity already proven for the P1 Charter and the Slice 1 structures.

Two categories of work:

1. **Rewrote all 6 remaining existing-but-thin structures**: `discovery_report` (also serves `root_cause_worksheet`), `operating_model` (serves `operating_model_design`), `value_model` (serves `tower_metrics_plan`), `mobilization_plan`, `handoff_pack` (serves `handoff_package`), `executive_playback` — 46 sections total, each rewritten from a 3-8 word placeholder to real guidance: what makes the section strong vs. weak, the methodology to apply, a named failure mode, cross-references to sibling sections. Three sections in these structures already had genuinely good content from earlier work (`discovery_report.readiness`, `operating_model.change`, `value_model.measurement_model` — all tied to the Charter's success-criteria commitment model) and were left untouched.
2. **Built two entirely new structures that didn't exist at all**: `sourcing_strategy` and `value_measurement_contract`. These aren't thin-content cases — investigation found no dedicated orchestrator structure existed for either key, so both were silently falling through to the fully generic, template-generated `defaultBrief()` fallback (`"Standard {section} content for this artifact."`) despite being real, gate-relevant P3/P5 deliverables with real registry TOC guidance already defined (`deliverable-registry.ts`). Built both from scratch — 9 and 7 sections respectively — grounded in that existing registry TOC, at the same authoring bar as everything else in this initiative. Both already had bespoke fabrication-guardrail cases in `artifactHonestyDiscipline()` from before this release; no changes needed there.

Net result: every one of the 14 canonical Moves phase deliverable types (P1 charter through P5 handoff/value-contract) now resolves to a real, dedicated, partner-authored structure — zero remaining silent falls to the generic template fallback within the Moves module.

## Layer Impact

- `global-control-lane`: `deliverable-structures.ts` is a shared orchestrator file, not tenant-specific.

## Client Applicability

- All clients: no — only affects clients on the `moves_orchestrated_deliverables` flag.
- Specific clients: **skyharbor, lakeshore** (the only tenants currently enrolled).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_orchestrated_deliverables` (pre-existing, unchanged).

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`:
  - Rewrote `intent` strings for 46 sections across `MOVES_DISCOVERY`, `MOVES_OPERATING_MODEL`, `MOVES_VALUE`, `MOVES_MOBILIZATION`, `MOVES_HANDOFF`, `MOVES_EXECUTIVE_PLAYBACK`. No section keys, `requiredSectionKeys`, or `groundingMode` values changed on any existing structure — confirmed via diff and a section-count check (132 total `s(...)` calls after this release vs. 116 before, exactly matching the 16 new sections added by the two brand-new structures below; no existing sections were added or removed).
  - Added two new structures: `MOVES_SOURCING_STRATEGY` (`deliverableType: "sourcing_strategy"`, 9 sections) and `MOVES_VALUE_MEASUREMENT_CONTRACT` (`deliverableType: "value_measurement_contract"`, 7 sections), both `module: "moves"`. Registered both in the `DELIVERABLE_STRUCTURES` export array (now 16 entries, up from 14).
  - No changes to `orchestrated-deliverable-map.ts`, `prompt-builder.ts`, or any generation call site — the two new structures are picked up automatically by `getDeliverableStructure("moves", <key>)` the moment they're registered; no other file needed to change.

## QA / Validation

- Pass: `npx eslint src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/lib/deliverables/orchestrator` — 130/132; the 2 failures (`persistence.test.ts`, `renderers.test.ts`) are the same pre-existing, unrelated Source/RFP naming-drift issue confirmed via `git stash` multiple times already this session — not touched by this change.
- `brief-library.test.ts` iterates generically over every entry in `DELIVERABLE_STRUCTURES` (no hardcoded count), so it automatically validated both new structures' shape — passed without modification.
- Structural-integrity check: exactly 132 sections after this change (116 + 16 new), 16 structures registered (14 + 2 new) — confirmed no accidental section loss/duplication across the large diff.
- This is content-quality work; no automated test verifies prose quality — every rewritten and newly-authored section was read against the same "would a partner have written this" bar established in Slice 1, including the two brand-new structures being grounded in the registry's own pre-existing TOC guidance rather than invented from scratch.
- Not run: live signed-in browser proof (no valid local Clerk session in this environment). No UI renders `intent` directly — this only changes prompt content fed into the next live generation for skyharbor/lakeshore, and — for `sourcing_strategy`/`value_measurement_contract` specifically — changes those two deliverable types from generic-template output to real structured output for the first time.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag change, no worker job. Effective immediately for the next orchestrated generation request for any of the 8 deliverable types touched (6 rewritten + 2 newly structured) on skyharbor or lakeshore.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — generate at least one of the 8 covered deliverable types (prioritize `sourcing_strategy` or `value_measurement_contract`, since those go from generic-template to real structured output for the first time) for skyharbor or lakeshore post-deploy, and confirm the output reflects the new structure's real section list and guidance rather than the old generic template.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind — purely prompt-content strings and two new structure definitions.

## Audit Evidence

- This PR's diff.
- `brief-library.test.ts` and full orchestrator directory sweep (130/132, 2 pre-existing unrelated failures confirmed via `git stash`).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **`root_cause_worksheet`, `operating_model_design`, `tower_metrics_plan`, `handoff_package` share a structure with a sibling registry key** (e.g. `root_cause_worksheet` uses the same `discovery_report` structure as the discovery report itself) — this was already true before this release and is unchanged; it means these two document types currently read identically in section shape, which may or may not be desirable long-term. Not addressed here — this release closes the "thin content" and "no structure at all" gaps, not the "shared vs. dedicated structure per registry key" question.
- **Cross-phase narrative continuity still does not exist** — no deliverable's prompt is ever handed the prior phase's actual approved content; each is generated independently. Unchanged from Slice 1's Known Gaps, still a real, separate, larger architectural gap.
- **The consulting-logic phase restructuring discussed this session** (P3A approach options → P3B solution concept options → P3C detailed design → P3D review; P4A layered roadmap → P4B approval → P4C ROM → P4D business case → P4E investment approval, plus new deliverable types like a genuine Approach Decision Paper and Solution Concept Options paper) remains a discussed vision, not built. This release completes narrative-quality coverage for the *existing* 14 canonical deliverable types; it does not add new deliverable types beyond the 2 that were structurally missing.
