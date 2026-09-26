# Source Done Ledger

Last updated: 2026-09-26

## Purpose

This ledger is the Source backlog control plane. A Source item is not "done" just
because code exists, a PR merged, or an ACA image deployed. The only terminal
state is signed-in browser proof on `https://app.abarva.ai` for the affected
tenant and route.

## State Vocabulary

| State | Meaning |
| --- | --- |
| Planned | Scope is named, but no candidate code is ready. |
| Candidate PR | Code is in a PR and locally validated, but not merged. |
| Merged | PR is merged to `main`; no runtime claim is implied. |
| Deployed | Repo-owned ACA main deploy has shifted traffic to the merge SHA/digest. |
| Signed-in proven | Authenticated browser crawl confirms the expected product behavior live. |
| Archived | Route/component is not reachable from the product path; rollback requires a code change. |

## Historical July Source Release Chain

The table below preserves the July baseline. Its `Candidate PR` and `Planned` rows are historical statuses, not a current queue. Use the dated chain below for current Source V1 execution.

| Item | User-facing intent | Current state | Evidence | Remaining gate |
| --- | --- | --- | --- | --- |
| Slice 1 requirement coverage | Show honest requirement coverage on the legacy canvas without overclaiming satisfaction. | Signed-in proven | PR #5036; production crawl accepted before subsequent Source shell work. | None. Superseded visually by Source shell v2 on event routes. |
| Slice 2a hard-gate provenance, engine A | Block hard gates from client-stated-only evidence. | Deployed | PR #5041; lint, typecheck, focused tests, directory sweep, release check; deployment approved separately. | Keep covered by future gate regression tests. |
| Slice 2b second-engine provenance | Close the `gate-auto-assessment` bypass by reusing/aligning the hard-gate provenance rule. | Deployed | PR #5043; release record `2026-07-18-source-second-engine-provenance`; focused local proof re-run on 2026-07-19: 34/34 across governance, auto-assessment, and persistence. Included in later ACA deploys through `main`. | Fresh signed-in semantic proof remains desirable when a non-destructive event fixture is available. |
| Source shell v2 | Replace the old Source event shell with the new workflow shell, stage workspace, dockable aVa, files, intelligence, and approvals lanes. | Signed-in proven | PR #5065; merge SHA `e04f80b7b8b61f9bfb98af213aec093871f0816c`; ACA revision `ca-abarva-web-lab-eastus--me04f80b7`; signed-in FS Demo crawl across all 11 stages. | Preserve with route/static regression coverage. |
| Old Source event shell route | Prevent event routes from falling back to `UniversalCanvasShell`. | Signed-in proven | PR #5068; merge SHA `62e89dd884ad6b10ca258227737d4770fd6dfbc5`; ACA revision `ca-abarva-web-lab-eastus--m62e89dd8`; signed-in FS Demo crawl confirmed all 11 Source stages render Source shell v2 with no old timeline shell. | Keep static route guards current while Source shell evolves. |
| Source aVa truth contract | Make every aVa response clear about whether user input was persisted, chat-only, or used as evidence. | Candidate PR | This candidate adds deterministic write-claim repair to the Source aVa quality gate and legacy event ask endpoint. | Merge, deploy, signed-in proof that aVa no longer claims chat-only facts were saved. |
| Dynamic Intelligence Explorer | Make the Intelligence Explorer stage-aware and evidence-aware instead of a generic insight tab. | Planned | Source shell v2 exposes the workspace lane; insights need stronger data binding per stage. | Define data contract, wire per-stage insight builders, prove on signed-in event. |
| Slice 2c source event facts into gate readiness | Bridge persisted `source_event_facts` into gate readiness. | Deployed | PR #5057; release record `2026-07-19-source-event-facts-gate-readiness`; focused tests 56/56; included in later ACA deploys through `main`. | Fresh signed-in proof should verify fact-backed evidence appears without being mislabeled as uploaded or usable evidence. |
| aVa/artifact evidence parity | Ensure aVa and artifact generation read the same evidence/provenance semantics. | Planned | Flagged as plausible but not fully verified. | Audit first; do not assume parity. |
| Archetype rules for SaaS + BPO | Add non-AMS rules so Source intelligence is not AMS-only. | Planned | Needed before broad value-signal generalization. | Define archetype contracts and cross-tenant proof. |

## Current Source V1 Completion Chain

| Item | Motion and user outcome | State and evidence | Remaining gate | Proposal disposition | Next |
| --- | --- | --- | --- | --- | --- |
| C-603 Event Owner on creation | NEW: assign the authenticated creator event-scoped decision authority without granting financial visibility. | Deployed. PR #8516, squash `3c4c291d016bd94b26e378f62d32111e8f164bb7`; 35 applicable CI checks passed and three skipped; official ACA run `36262364185` succeeded. Read-only runtime proof: web template, healthy 100%-traffic revision, and both delivery workers at `sha256:66d26f4d436f3dd3c25a1c9b0c964fdb7a0729487e8b2dbc18e0367b20a287c1`. Focused local suites 55/55 and negative adapter mutations passed. A signed-in synthetic intake created an event and showed the creator's self-approval notice. | Private participant-row readback and an authorized human's successful decision are not proven. Existing events were not backfilled; evidence gates remain in force. | AbarVa Product | Correct the approval screen's actor attribution; then prove an authorized Event Owner decision without fabricating one. |
| C-605 Approval actor attribution | NEW: the Event Owner's own intake decision must not be recorded as a distinct sponsor sign-off. | Candidate PR. Red-first rendered and transport tests found the false claim; component suite 12/12, approval route 26/26, scoped lint, typecheck, and release check pass; restoring the old payload claim fails the negative test. | PR/CI, merge, official deploy, runtime invariant, and signed-in readback remain owed. This does not clear a separately governed Scope evidence gate. | AbarVa Product | Release this narrow correction, then resolve the per-event Source V1 SELF policy without changing historical gate authority by implication. |

## Hard Gates For Every Future Source Slice

1. Focused tests prove the exact behavior changed.
2. `npx eslint` on touched files passes.
3. `npx tsc --noEmit --pretty false` passes or failures are proven pre-existing.
4. `npm run release:check` passes with a release record when release-relevant.
5. PR is merged to `main`; never push directly to `main`.
6. Repo-owned ACA main deploy succeeds for runtime changes.
7. ACA runtime invariant passes: template image, active revision image, and 100%
   traffic revision match the approved digest.
8. Signed-in browser proof confirms the affected Source route/workflow.

## Historical July Execution Order

This ordering is retained for audit only. The current Source V1 completion chain above governs active selection.

1. Merge/deploy/prove the Source aVa truth contract.
2. Wire Dynamic Intelligence Explorer by stage.
3. Add aVa/artifact evidence parity.
4. Add SaaS + BPO archetype rules.
5. Run cross-tenant/archetype proof across AMS, SaaS, BPO, and Lakeshore.
6. Decide whether Decisions/Portfolio/Capabilities remain top-level Source pages or collapse into the Source operating shell.
