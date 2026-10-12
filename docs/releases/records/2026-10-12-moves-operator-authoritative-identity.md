# 2026-10-12 — Authoritative operator identity and assigned access

## Release ID

`2026-10-12-moves-operator-authoritative-identity`

## Status

`candidate`; no live identity, permission, Move, seed or approval mutation has been executed by this workstream.

## Plain-English Summary

Recognize the declared automated account from its authenticated server profile when optional session metadata is absent. Refuse a malformed dedicated profile or a different authenticated actor. An existing unbound viewer may be reconciled only under verified profile authority, one unchanged client membership, no administrator permission and no existing participant assignment. Preserve the person ID and existing drafts. Use exact PostgreSQL tuple revisions and prior field predicates, an atomic transaction, mandatory identity audit and readback. Read assigned program access through explicit tenant-filtered queries and distinguish an unavailable read from a real permission denial. Preserve the already assigned operator participant during origination.

## Layer Impact

- Release lanes: `global-control-lane` for shared authentication and authorization reads; `client-data-lane` for the existing restricted identity provisioner.
- Layer 1: no client intake, source file, pricing reference or benchmark change.
- Layer 2: authenticated account profile remains the identity authority; no client adapter change.
- Layer 3: the existing provisioner may update the same person link and one membership and append its identity audit, under the exact dedicated profile. No Move, participant or draft is written by reconciliation.
- Layer 4: program access reads use canonical Postgres predicates. Origination preserves the operator's existing participant rather than inserting an ordinary contact for the same person.

## Client Applicability

- All clients: normal Clerk sessions now read the authoritative profile before classification. Successful ordinary-session role and name behavior is covered by regression tests; profile lookup failure is unavailable and cannot trigger generic provisioning. Program-policy read errors are unavailable rather than absent.
- Specific clients: dedicated identity reconciliation remains limited to the one enrolled synthetic tenant and the unchanged exact operator profile.
- Internal only: delegated proof-account identity handling.
- Public/demo only: no public route or data exposure added.
- Feature flag: existing `moves_synthetic_e2e_operator_v1`; no enrollment or flag change.

## Changes Included

- Server profile recognition with exact authenticated actor, approval reference and profile hash; no session-token template change.
- No dedicated identity authority from a claimed or email-resolved person ID.
- Same-person reconciliation with explicit prior role, graph marker, tuple revision, sole membership and zero-participant checks.
- Exact approved Programs capabilities, no user administration, and all Source capabilities disabled.
- Serializable transaction, field/revision compare-and-swap, required audit and transaction-scoped readback; no automatic retry.
- Explicit active-client program predicates followed by assigned-participant predicates; creation permission remains independent of existing assignments.
- Unavailable creation-policy read returns 503; a real create=false policy remains 403.
- Operator role and permissions survive sponsor/lead/co-sponsor selection without a duplicate contact row.

## QA / Validation

- Pass: actual red-before profile, reconciliation, canonical-query and participant contracts recorded privately; 124 focused tests across 10 suites pass on Node 24.19.
- Pass: Node 24 typecheck and scoped ESLint.
- Pass: library orphan, route reachability and export reachability checks; no new unreachable code.
- Fail, historical: initial full behavior coverage was 85.91% lines/statements; all 2,228 tests passed. After isolating unrelated fixture dependencies it was 89.20%, then 89.21%. Untouched main at `061c036865c42165e03b4c534f097c1cee5d1afe` passed at 90.00%; no baseline exception applied.
- Fail, historical: the first complete run after separating behavior and integration fixtures reached 90.01%, but one named-suite CI registration check failed. Registration was corrected by moving the named integration contracts into the required catalog job, which retains its full Programs directory sweep.
- Pass: stable-source complete behavior gate against reconciled main `65c5764107fec53f0c703bee33123844222af35b`: 214 suites and 2,253 tests; lines/statements 90.01%, functions 71.96%, branches 72.79%. Thresholds and exclusions are unchanged.
- Fail, historical: the first published catalog run found a new typed-policy `error.message` passthrough in the no-driver-message guard. The call now uses the authored unavailable sentence and fixed public code. The assertion is unchanged; all 246 Programs suites and 3,860 tests pass after the correction.
- Pass: PostgreSQL parser precision reproduced without a connection; tuple-revision fixtures avoid JavaScript timestamp precision loss and retain drift refusal.
- Pass: 14 semantic mutations killed, with sources restored. Wrong actor, person fallback, missing authority, person count/revision, client scope, existing assignment, CAS failure, absent audit, query error, tenant predicate and duplicate participant are covered.
- Pass: five genuine new test files are reached by CI: three behavior suites in the required floor sweep, plus native SQL and complete origination contracts explicitly named in the required catalog. Final clean-tree census is 2,846 covered files versus 2,841 on actual main. The transient generated probe is absent from the persistent delta. Tenancy census and manual regenerated with no diff and checked.
- Pass: all 11 release-control checks on the final candidate record.
- Fail, pending: final actual-main complete coverage and exact-head published CI are not yet complete at this candidate stage. They must be complete before release.
- Visual: no layout or component change; actual signed-in failure/recovery and performance proof belong to the executing owner after deployment.

## Rollout Plan

Publish the controlled PR after local gates, reconcile actual main without rebase, and obtain exact-head CI plus a fresh fetched-ref scan of every open Moves/shared-census contender including drafts. The release coordinator owns merge order. Only the repo-owned main ACA workflow may deploy or shift traffic. The sole execution owner verifies serving SHA and web/worker digests, uses the unchanged approved account, and independently reads its stored identity, membership and audit before resuming the preserved draft. No creation retry is authorized by this release record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this workstream.
- Approved digest and runtime/worker invariant: assigned and verified after the controlled main deployment.
- Feature/env change: none.
- Live signed-in proof required: exact actor and client, preserved person/draft, one member with approved Programs rights and no admin/Source rights, zero participants before creation, exact identity audit, one operator participant after normal creation, and assigned-only access.

## Rollback Plan

Revert the code through a PR and the canonical deploy workflow. A completed identity reconciliation is an audited data change; do not automatically undo it, delete the person or reset any Move. Any later identity correction needs the exact stored-state review and authorized operator path. Preserve drafts, participant history and signed artifacts.

## Audit Evidence

Controlled PR/head and exact-head CI; genuine coverage and tenancy census; local red/green and mutation receipts; authorized owner's private actor/profile/native readbacks. Private identities, credential transport and runtime proof remain outside the public repository.

## Known Gaps

Exact-head published CI and coordinated release order are pending. The code is not deployed or live-proven. Normal-JIT identity reconciliation, actual creation/access, signed-in performance and end-to-end acceptance require the sole owner's independent runtime evidence. The shared server-profile dependency must be checked for ordinary-session recovery and latency after deployment. No seed, ROM, financial figure or artifact has been approved by this code preparation.
