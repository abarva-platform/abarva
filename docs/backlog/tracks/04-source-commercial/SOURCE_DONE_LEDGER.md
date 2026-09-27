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
| C-605 Approval actor attribution | NEW: the Event Owner's own intake decision must not be recorded as a distinct sponsor sign-off. | Signed-in proven for attribution. PR #8520, squash `7f0056d1e889687f1af6b8d14b636b9745c9541e`; applicable CI passed; official ACA run `36265046835` succeeded with digest-pinned web template, healthy 100%-traffic revision, and both delivery workers at `sha256:46dcabe31f3146eca5e29a2b012348770194772176a6713d0271aa02c533bb84`. Authenticated pending-approval readback displayed Event Owner and no mandatory co-approver. | An authorized human's decision remains unproven. This does not clear a separately governed Scope evidence gate. | AbarVa Product | Resolve the per-event Source V1 SELF policy without changing historical gate authority by implication. |
| C-606 Supplemental action Contract 360 detail | 360: open a governed action/coverage row in Contract 360 when no canonical contract header exists. | Signed-in proven for the action-to-detail handoff. The first summary-view fix in PR #8522 deployed but returned 404 live; corrective PR #8525 passed applicable CI, squash-merged as `2301644d96dbf0e75fc58f27de592a96cb61146d`, and official ACA run `36269953818` succeeded. Independent read-only proof found the web template, healthy 100%-traffic revision and both delivery workers pinned to `sha256:3b567cd25e1a30918e0448bc38b4eeb40eb8119738b43169716c3bd4c6c8fa41`. The exact previously failing action detail opened signed in with no substituted contract. | No canonical contract record or positive private data-plane readback is claimed. A distinct numeric-label gap surfaced in Story and is tracked as C-607. | AbarVa Product | Correct the numeric fact-class presentation, then continue the highest-value unblocked Source journey step. |
| C-607 Contract-value lineage in supplemental detail | 360: keep missing annual contract value distinct from committed spend, actual spend and opportunity amounts. | Signed-in proven for rendered fact labels. PR #8527 passed applicable CI and squash-merged as `7faac8f454de4acea6527886b9fa0083f2be9fd8`; official ACA run `36272416873` succeeded. Authenticated replay showed annual contract value as not established while committed and observed spend remained separately labeled. | No canonical amount readback or cross-tenant live probe is claimed. No Layer 3 value was written. | AbarVa Product | Continue the next unblocked Source journey step. |
| D-020 Stage 07 human scorecard authority | EVALUATION: let authorized humans define approved weighted criteria and record evidenced evaluator scores without AI finalization or award automation. | Deployed, positive signed-in score readback owed. PR #8532 passed applicable CI and squash-merged as `813537a0fdd7d06c0157931a8f990a53061d6eab`; official ACA run `36278748320` succeeded. Independent runtime read found web template, healthy 100%-traffic revision and both delivery workers pinned to `sha256:934a102192db54e7809b1fbfcf9b4514f876df097d9320e15073c06b84344c61`. Red-first, mutation, TypeScript and release checks passed. | Positive human scoring still requires a real evaluator and governed response evidence; the frozen event remains at an earlier evidence gate. | AbarVa Product | Complete Stage 07 positive readback on an eligible authorized event; do not infer acceptance from runtime proof. |
| U-543 terminal Value approver role | SHARED: keep a worked-example person's name out of the live Value view and model grounding. | Deployed. PR #8534 passed applicable CI and squash-merged as `abf5bb5e39e2798f4556c601391f1fad07a0c3ca`; official ACA run `36280818139` succeeded. Independent runtime proof found the web template, healthy 100%-traffic revision and both delivery workers pinned to `sha256:5cfb69620ec398af1be183fbd352008c09d0caf7967fa7891aea1919e1e4043a`. Red-first, mutation, Source suites, TypeScript, lint and release checks passed. | Positive signed-in Value readback remains owed; the frozen event is at Scope. Terminal gate semantics remain separate work. | AbarVa Product | Define terminal completion wording without inventing an onward stage; continue the higher-value Source release journey. |
| C-609 Evaluation advance authority | EVALUATION: require tenant-scoped approved criteria with frozen 100-point weights and evidenced locked human scores before either advance route writes. | Deployed, positive Evaluation readback owed. PR #8538 passed applicable CI and squash-merged as `6fb2f19572ba4097e6193c5969d348e02aaacf10`; official ACA run `36284084917` succeeded. Read-only runtime proof found the web template, healthy 100%-traffic revision and both delivery workers pinned to `sha256:99381d0270ec6a6ee7dafb77c1259b221b162108be1f4d952579db34a6b6c6a4`. Red-first and mutation checks passed. | A separate Event Owner approval of the completed scorecard is not modeled by this read gate. No human scoring or positive signed-in Evaluation advance is claimed; the frozen event remains at its earlier Scope gate. | AbarVa Product | Complete the owner scorecard decision and replay the exact gate on an eligible event. |
| C-608 Event-scoped SELF policy | NEW: let an assigned Event Owner make an auditable same-person decision without relabeling a historical signed-scope event. | Schema PR #8542 passed applicable CI and squash-merged as `60bc9c7702244915a4d7c38d90fb45725d4f4128`. Its official ACA deploy is running; merge is not a database apply. Separate code candidate threads explicit SELF through creation, tenant-scoped read, criterion/stage decisions and mounted fallback. Red-first route, audit-label and fallback tests passed 204/204 across 14 focused suites; TypeScript and scoped lint passed. | Schema deploy/runtime, separately authorized migration apply/readback, code PR/CI/merge, official app deploy/digest, and signed-in human decision remain owed. Historical signed-scope evidence stays binding. Later-stage criteria still require an end-to-end policy audit; no full-journey acceptance is claimed. | AbarVa Product | Complete schema-controlled rollout, then test one eligible SELF event; continue reviewing later-stage organizational-role defaults. |

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
