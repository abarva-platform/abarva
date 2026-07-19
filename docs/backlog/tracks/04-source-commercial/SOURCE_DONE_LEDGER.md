# Source Done Ledger

Last updated: 2026-07-19

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

## Current Source Release Chain

| Item | User-facing intent | Current state | Evidence | Remaining gate |
| --- | --- | --- | --- | --- |
| Slice 1 requirement coverage | Show honest requirement coverage on the legacy canvas without overclaiming satisfaction. | Signed-in proven | PR #5036; production crawl accepted before subsequent Source shell work. | None. Superseded visually by Source shell v2 on event routes. |
| Slice 2a hard-gate provenance, engine A | Block hard gates from client-stated-only evidence. | Deployed | PR #5041; lint, typecheck, focused tests, directory sweep, release check; deployment approved separately. | Keep covered by future gate regression tests. |
| Slice 2b second-engine provenance | Close the `gate-auto-assessment` bypass by reusing/aligning the hard-gate provenance rule. | Planned | Planning handoff: `/Users/anand/Downloads/source-slice2b-second-engine-provenance-2026-07-18.md`. | Implement/test/release/proof. |
| Source shell v2 | Replace the old Source event shell with the new workflow shell, stage workspace, dockable aVa, files, intelligence, and approvals lanes. | Signed-in proven | PR #5065; merge SHA `e04f80b7b8b61f9bfb98af213aec093871f0816c`; ACA revision `ca-abarva-web-lab-eastus--me04f80b7`; signed-in FS Demo crawl across all 11 stages. | Preserve with route/static regression coverage. |
| Old Source event shell route | Prevent event routes from falling back to `UniversalCanvasShell`. | Candidate PR | This slice removes the event-detail fallback branch and adds static route guards. | Merge, deploy, signed-in proof that event stages still render Source shell v2. |
| Source aVa truth contract | Make every aVa response clear about whether user input was persisted, chat-only, or used as evidence. | Planned | Live screenshot showed aVa saying "lock it into the intake record" without proof of a write. | Implement response/write contract tests before allowing "locked in" language. |
| Dynamic Intelligence Explorer | Make the Intelligence Explorer stage-aware and evidence-aware instead of a generic insight tab. | Planned | Source shell v2 exposes the workspace lane; insights need stronger data binding per stage. | Define data contract, wire per-stage insight builders, prove on signed-in event. |
| Slice 2c source event facts into gate readiness | Bridge persisted `source_event_facts` into gate readiness. | Planned | Named as the largest evidence-backbone scope after 2b. | Needs isolated design and DB/read-model tests. |
| aVa/artifact evidence parity | Ensure aVa and artifact generation read the same evidence/provenance semantics. | Planned | Flagged as plausible but not fully verified. | Audit first; do not assume parity. |
| Archetype rules for SaaS + BPO | Add non-AMS rules so Source intelligence is not AMS-only. | Planned | Needed before broad value-signal generalization. | Define archetype contracts and cross-tenant proof. |

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

## Next Execution Order

1. Archive old Source event shell route and lock the route guard.
2. Implement Slice 2b second-engine provenance.
3. Implement aVa truth contract for persisted versus chat-only user responses.
4. Wire Dynamic Intelligence Explorer by stage.
5. Bridge `source_event_facts` into gate readiness.
6. Add aVa/artifact evidence parity.
7. Add SaaS + BPO archetype rules and cross-tenant proof.
