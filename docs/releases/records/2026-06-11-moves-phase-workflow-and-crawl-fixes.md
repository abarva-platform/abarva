# 2026-06-11-moves-phase-workflow-and-crawl-fixes — Moves phase workflow (capture→save→approve→generate) + first-user-crawl fixes

## Release ID

`2026-06-11-moves-phase-workflow-and-crawl-fixes`

## Status

`candidate`

## Plain-English Summary

The first real walk of a Move through the tool (a SkyHarbor IROPS pilot) surfaced a
cluster of issues, all fixed here. Every Move phase now has the same governed
workflow: **capture the phase's inputs → Save the record → Approve (sign-off) →
Generate the board-grade artifact**, gated in that order, with the captured record
persisting durably (it survives a page reload, and the workflow keeps its place on
return). Origination now closes P0 in a single approval. The agent stopped dumping
deliverable text into chat (it creates governed documents instead) and answers
"are we done?" from real gate state. Each Move is evaluated against _its own_
archetype — an operations Move (IROPS) no longer gets software-lifecycle (DORA)
evidence requirements. An audit-write bug that failed AI generation for tenants
whose key isn't a UUID is fixed at the source. A Playwright regression suite now
guards all of the above.

## Layer Impact

- `global-control-lane`: phase-capture persistence route, generalized phase
  workflow UI, origination one-approval close, Nexus voice doctrine (documents-not-
  chat + gate-state answers + surface canonicalization), per-Move archetype
  resolution, AI-egress audit tenant-UUID resolution at the sink.
- `client-data-lane`: charter/phase records persisted to `engagements.charter` and
  `deliverables_v2` (in_review → signed_off); evidence uploads to the Move vault.
  No schema change in this release.

## Client Applicability

- All clients: yes (all Moves, all phases).
- Specific clients: exercised live on SkyHarbor Air (IROPS Digital AI + AI-PDLC).
- Internal only / public-demo only: no.
- Feature flag: none.

## Changes Included

- Phase workflow: `…/phase-capture/route.ts` (+ `charter-capture`), generalized
  `StrategicMovePhaseClient` (capture tracker, Save→Approve→Generate, reload-seed),
  progressive-disclosure panels.
- Origination: `origination-close.ts` + `approval.ts` (one approval closes P0),
  transformer banner copy.
- Agent: `voice-doctrine/nexus.ts` (documents-not-chat, gate-state, surface gate),
  `surface.ts` (canonicalize `strategic-moves-workspace`), markdown render in dock.
- Archetype: `archetypes/registry.ts` (`AI_OPERATIONS_DECISION_SUPPORT` +
  `resolveProgramArchetype`, ops outranks PDLC) and ~10 call sites.
- Audit: `egress-audit-writer.ts` resolves tenant key → client UUID at the sink;
  `enterprise_context_chunks_fts` migration guarded for fresh replay.
- File Cabinet evidence upload + vault backfill; phase-gate decision records.
- Tests: `tests/e2e/moves-charter-workflow.spec.ts` (5 regression guards, skips
  without creds).

## QA / Validation

- `npx tsc --noEmit`: no new errors (pre-existing `.next/dev` validator only).
- `npx eslint` on changed files: clean.
- Jest: archetype (33) + governance (gates) + egress-audit-writer (13) + Nexus
  voice (21) suites pass.
- Live state-verified on ACA (revisions through `allphase-d7dc9d352`), SkyHarbor:
  - P1 full chain: Save 5/5 → record signed_off → `program_charter` artifact in
    vault → advanced to `currentPhase: 2`.
  - P2: Save 4/4 → persisted through reload → reload-seed kept Approve enabled →
    signed_off; P2→P3 correctly gate-blocked on committed evidence (governance).
  - P4: phase-capture creates the `business_case` record in_review.
  - Archetype: IROPS Move readiness = "AI Operations Decision Support", no DORA.
  - Generate button: no `uuid` audit failure; artifact persisted.

## Rollout Plan

Merge to main; the change is already deployed on ACA (`ca-abarva-web-lab-eastus`,
revision `allphase-d7dc9d352` at 100%). No migration to apply (the only migration
touched is an additive idempotent guard). No feature flag.

## Rollback Plan

Shift ACA ingress back to the prior healthy revision — instant. No destructive
schema change; charter/phase records are additive JSONB + deliverable rows.

## Audit Evidence

- Branch/PR: `fix/move-crawl-punchlist`.
- Live revision: `ca-abarva-web-lab-eastus--allphase-d7dc9d352`.
- Verification memory: `feedback_verify_at_state_level` (state-level, not UI text).

## Known Gaps

- Heavier phase gates (P2+) require committed evidence uploads beyond the signed
  deliverable — by design; the workflow surfaces them as hard gaps.
- P3 design deliverable key (`design_spec`) chosen from the gate's accepted list;
  confirm when a Move first reaches P3.
- Chat-initiated document creation still routes the user to the Generate action
  (the round-trip tool confirmation is unreliable); Generate is the supported path.
- Composer focus ring is subtle; sponsor confirmation status renders inline in the
  name string (should be a separate badge).
