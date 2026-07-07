# 2026-07-05-source-archetype-advisory-d11-d24 — Archetype advisor intelligence extends to d11 + d24

## Release ID

`2026-07-05-source-archetype-advisory-d11-d24`

## Status

`candidate`

## Plain-English Summary

Follow-on to the archetype-advisory wiring. That slice injected each event's
archetype-specific commercial intelligence (pricing traps, negotiation levers by
RFP/BAFO timing, vendor assumptions to challenge, evaluation disqualifiers) into the
Strategy Memo (d01) and RFP Package (d09). This extends the same injection to the two
remaining advisor-loaded deliverables that exist today: the Vendor Response Control Pack
(d11) and the Decision Brief (d24). So the response-control pack and the executive
decision brief now also carry archetype-specific advisor intelligence instead of a
generic voice, using the block already assembled by the context-binder.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients. Prompt-only
  change — d11 and d24 inject the existing `ctx.archetypeAdvisory` block. No context-binder
  change, no new data, schema, seed, or migration.

## Client Applicability

- All clients: yes (events whose category maps to a shipped archetype)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts` — d11 and d24 `buildUserMessage`
  inject the `ctx.archetypeAdvisory` block (guarded; skipped when empty) before their
  final draft instruction, matching the d01/d09 pattern.

## QA / Validation

- `agent-generation` suite → **10 suites / 54 tests pass**. **pass.**
- `npx tsc --noEmit` (full project, to completion) → **EXIT 0, 0 source errors**. **pass.**
- `npx eslint` on the changed file → clean. **pass.**
- Not live-proven: archetype-specific insight appearing in a real generated d11/d24 needs
  a signed-in walkthrough (folded into the Lakeshore AMS proof). **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs on merge; record the revision.
No migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — prompt-only.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — verify an AMS event's d11/d24 carry AMS-specific
  advisory on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the two injections returns
d11/d24 to their prior voice with no data effect. No schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- `body_generation_metadata` records template id/version on generated d11/d24.

## Known Gaps

- BAFO pack (d22) isn't generatable yet, so it can't carry the advisory until a d22
  template exists — separate slice.
- Two target archetypes still unshipped: the BPO family (HR / Finance / Supply Chain) and
  Cloud/FinOps — their categories resolve to null → generic voice until authored.
- Still qualitative-only; feeding the archetype into the live quantified value/should-cost
  engine is the next workstream.
