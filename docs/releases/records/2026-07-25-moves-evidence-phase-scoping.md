# 2026-07-25-moves-evidence-phase-scoping — Scope generation evidence to the target phase, remove the artificial evidence cap

## Release ID

`2026-07-25-moves-evidence-phase-scoping`

## Status

`candidate`

## Plain-English Summary

Follow-up to Workstream 1 (`2026-07-24-moves-evidence-generation-context`). The user's own theory
of how evidence should carry across phases was validated by research and is implemented here:
once a Move phase gates, its raw uploaded evidence should stop being re-injected into every later
phase's generation prompt. What should carry forward is that phase's own finished, approved
artifact — via the existing `loadPriorDigests` mechanism, which already threads a phase's citations
and digest forward. Re-surfacing raw P2 evidence files verbatim inside the P3/P4/P5 prompts was
never the intended design; it was simply never scoped.

Two separate call sites fed raw evidence into generation prompts, both previously unscoped by
phase and both capped at an arbitrary count (8, then 20) that had crept in as if it were a business
rule:

1. `SolutionContext.evidencePackets`, populated via `assembleMoveSolutionContext`'s
   `loadEvidencePackets` source.
2. `moves-generate-deps.ts`'s `retrieveCurrentState`, which independently appended an
   `evidenceBlock` built from the same underlying query.

Both are now scoped to `args.targetPhase` — the phase currently being generated only sees its own
approved evidence, not evidence from every earlier phase of the Move. The old numeric limits (8,
20) are removed; per the user's explicit direction, evidence volume within a single phase is not a
business constraint (a phase can legitimately accumulate dozens of files) and must never be the
reason a real, approved evidence item is excluded from that phase's generation. In their place,
`listProgramEvidenceForPrompt` now takes an optional `phase` filter and a single
`EVIDENCE_QUERY_SAFETY_CEILING = 500` — documented as a pure runaway-query guard, not a cap on how
much evidence a phase may have.

The one caller that legitimately wants whole-Move evidence — `nexus.ts`'s conversational context
assembly for the Nexus front-agent chat, which is not phase-generation — now calls the same
function with no phase filter (explicitly whole-Move, matching the function's own documented
tooling/inspection exception) and keeps its existing 12-item cap for prompt size, which was always
a prompt-conciseness choice for chat, not a business rule, and is preserved unchanged in behavior.

## Layer Impact

- **global-control-lane**: `SolutionContextSources` (both `loadEvidencePackets` and
  `retrieveCurrentState`) and `listProgramEvidenceForPrompt` are shared generation-context
  infrastructure used by every Move regardless of tenant; the phase-scoping and cap removal apply
  uniformly.

## Client Applicability

- All clients: yes — this changes what evidence Moves' P1–P5 generation prompts see for every
  tenant. No client-visible UI changes; the effect is that P3+ generation prompts will contain less
  (correctly scoped) raw evidence text than before, backed by more of it through prior-phase
  digests instead.

## Changes Included

- `src/lib/programs/evidence-context.ts` — `listProgramEvidenceForPrompt`'s second parameter
  changed from `limit = 8` to `phase?: number`; added `EVIDENCE_QUERY_SAFETY_CEILING = 500`
  replacing the old numeric caps on both the review-decision query and the evidence-items query;
  the evidence-items query now conditionally filters `WHERE phase = $phase` when a phase is given.
- `src/lib/programs/evidence-packets.ts` — `loadEvidencePacketsForMove`'s `phase` parameter is now
  required (was `limit = 20`, optional).
- `src/lib/programs/assemble-solution-context.ts` — `SolutionContextSources.retrieveCurrentState`
  gains a 4th `phase?: number` parameter; `SolutionContextSources.loadEvidencePackets`'s `phase`
  parameter is now required (was already added in Workstream 1, unchanged shape here); both call
  sites in `assembleMoveSolutionContext` now pass `args.targetPhase` through.
- `src/lib/deliverables/moves-generate-deps.ts` — `retrieveCurrentState`'s `evidenceBlock`
  construction now passes the phase argument through to `listProgramEvidenceForPrompt` instead of
  the stale literal `20` (which, after the signature change, would otherwise have been silently
  misinterpreted as `phase === 20` and returned nothing).
- `src/lib/programs/nexus.ts` — `assembleContext`'s evidence load now calls
  `listProgramEvidenceForPrompt` with no phase filter (explicitly whole-Move, for the conversational
  agent, not phase generation), keeping the existing top-12 cap applied client-side for prompt size.
- Tests updated for the new signatures: `src/lib/programs/__tests__/evidence-context.test.ts`
  (safety-ceiling limit assertions, new phase-scoping test case),
  `src/lib/deliverables/__tests__/moves-generate-deps.test.ts` (asserts phase passed through
  instead of the old literal `20`).

## QA / Validation

- `npx eslint` on all changed files — pass (clean).
- `npx tsc --noEmit` (full project, `NODE_OPTIONS=--max-old-space-size=8192` — default heap OOMs on
  this machine regardless of this change) — pass (clean).
- `npx jest` on `evidence-context.test.ts`, `evidence-flexible-extraction.test.ts`,
  `moves-generate-deps.test.ts`, `assemble-solution-context.test.ts`, `generate-artifact.test.ts`,
  `nexus.test.ts` — pass (31/31).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live signed-in proof — **attempted, blocked on missing test data, not a code failure.** Signed in
  as the Meridian tenant and called `GET
  /api/programs/workspace/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/evidence-readiness` (a read-only
  endpoint that queries the same `program_evidence_items` ⋈ `program_evidence_reviews
  (decision='approved')` join this fix relies on) against the real MEMBER AI ASSIST Move. Result:
  `requiredCovered: 0`, `requiredMissing: 4`, every family's `evidenceIds: []` — **zero approved
  evidence rows currently exist for this Move**, across any phase. This confirms the pre-fix
  finding from the original audit (15 files visible in the vault UI were never captured into
  `program_evidence_items` because they went through the old ungoverned upload path) and further
  confirms nothing has been re-uploaded through the now-governed pipeline since. There is
  currently no real cross-phase evidence data on this Move to prove phase-scoping against — the
  fix is unit-tested (including a dedicated phase-scoping test case) and deployed, but an
  end-to-end live proof needs at least one approved evidence item in two different phases, which
  does not yet exist. Flagging back to the requester rather than fabricating upload activity on a
  Move that is under an active fabrication-incident dispute.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration — pure application-code change to prompt assembly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — run
  [30141969949](https://github.com/abarva-platform/abarva/actions/runs/30141969949), `success`.
- Shared runtime mutators: none (no `az containerapp` commands run directly)
- ACA runtime invariant: **verified** — workflow's own "Verify ACA runtime invariant" step
  confirmed `expectedImage == templateImage == activeImage` at
  `acrabarvalab001.azurecr.io/abarva/web@sha256:c88b514fa866a1e463be67094c8e4f957bcaeb0f866a0b8826b238b66d68a83e`,
  and both `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` read back the same digest
  after update.
- Live signed-in proof required: yes — attempted; blocked on missing test data (see QA/Validation).
  Deploy itself is proven live; the phase-scoping *behavior* against real cross-phase evidence is
  not yet demonstrated because no such evidence currently exists on any accessible Move.

## Rollback Plan

Revert the merge commit. No schema/data changes to roll back — `program_evidence_items.phase` is a
pre-existing column, not newly added here.

## Audit Evidence

- PR: [#5575](https://github.com/abarva-platform/abarva/pull/5575), merged `f3fffc0`
- Deploy: [run 30141969949](https://github.com/abarva-platform/abarva/actions/runs/30141969949),
  image digest `sha256:c88b514fa866a1e463be67094c8e4f957bcaeb0f866a0b8826b238b66d68a83e`
- Evidence-state check: `GET /api/programs/workspace/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/evidence-readiness`
  on the real MEMBER AI ASSIST Move (signed in as the Meridian tenant), 2026-07-25 — returned
  `requiredCovered: 0`, all families `evidenceIds: []`.

## Known Gaps

- `move-context-extract.ts`'s own evidence-attachment subsystem (feeds the Executive Context Review
  UI panel) still has no phase filter — explicitly deferred, same as noted in the Workstream 1
  release record, not touched in this change.
- Citations wiring into the rendered Source Register appendix and "Approve evidence" UI surfacing
  in `FileCabinetPanel.tsx` remain open, as noted in Workstream 1.
- Workstreams 2–6 (structured gate inputs, authoritative deliverable lifecycle, document mechanics,
  workshop feedback loop, Tower handoff contract) remain explicitly sequenced after this one, per
  the user's direction.
