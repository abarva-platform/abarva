# 2026-07-18-moves-gate2-executive-readout — Moves Gate Page: Executive Readout

## Release ID

`2026-07-18-moves-gate2-executive-readout`

## Status

`candidate`

## Plain-English Summary

`MOVES-GATE-2` from the Moves UX backlog: the gate/approve page should answer, before anyone clicks approve, five things — what changed, what Nexus learned, what evidence supports it, what remains uncertain, and what happens next. Today the page already had most of the underlying data (gate criteria, evidence counts, next-phase readiness) but it was scattered across three separate sections with no synthesis. This release adds a compact "executive readout" block — four cards (What Nexus learned / What evidence supports it / What remains uncertain / What happens next) — right after the gate approval intro, before the detailed gate-criteria table, built entirely from data already computed in this component (no new backend calls).

"What changed" (the fifth question) is intentionally **not** claimed here — see Known Gaps.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the shared Strategic Moves phase workspace for every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: new `.mxw-exec-readout` section (4 cards) rendered on every phase's `approve` substep, above the existing gate-criteria table, sourced from already-computed `readinessPack`, `evidenceCount`, `hardGateCriteria`, `softGateCriteria`, `openHardCriteria`. New CSS rules for `.mxw-exec-readout`/`.mxw-exec-label` matching existing file conventions, plus a responsive 1-column fallback at the existing 980px breakpoint.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: no changes needed in the end — the first implementation duplicated the existing "carries forward" list verbatim in the new section, which a test correctly caught as an exact-text collision; fixed by making the new card a count-based summary instead of repeating the full list, which resolved the real redundancy (not just the test).

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 20/20
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Not run: live signed-in browser proof (no valid local Clerk session in this environment).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open a real Move's Approve & Build tab post-deploy and confirm the readout renders real, non-placeholder data.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `MovesPhaseStandaloneClient.test.tsx` full pass.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **"What changed" is not implemented.** There is no existing data source in this component (or found in a scoped search) for "state at start of this phase" to diff against "state now" — gate criteria and evidence counts are only ever available as their current snapshot. Fabricating a plausible-looking diff without real before/after data would violate this codebase's evidence-boundary discipline, so it was left out rather than faked. A real implementation needs either a persisted phase-entry snapshot or a computed diff at the data layer — that's backend work, not a UI change, and is out of scope here.
- The "What evidence supports it" card currently shows only aggregate counts (evidence item count, hard-gate-criteria-met ratio), not a list of the specific evidence items — deeper evidence citation (which file, which claim) would need the same kind of work planned for `MOVES-EVIDENCE-3`.
- This is additive only — it does not change the approval mechanism, the gate criteria table, or the next-phase readiness section below it, all of which remain as they were.
