# 2026-10-11 — Governed planned P5 outcome handoff

## Release ID

`2026-10-11-moves-p5-governed-handoff`

## Status

`candidate`

## Plain-English Summary

P5.2 can save receiving participants and measurement definitions for every current P4 lever, then accept a planned Tower handoff against the current signed measurement contract. The product derives planned cash from the deterministic P4 case. It records projected-only rows in the existing outcome ledger and confirms them through an independent read after commit. A changed contract, plan, input basis or receiving participant refuses acceptance. Repeat acceptance of the same basis retains the original rows, actor and time.

Generation captures a copy of the saved measurement plan before authoring starts. Deterministic rendering carries those definitions into the contract and Office companion; the immutable version records the tenant/Move, exact plan snapshot and hash, plus the generated HTML content hash. Sign-off, review and acceptance compare that version with the current saved plan. Editing a source, comparator, participant or cadence after signing refuses the handoff while preserving the signed bytes. Hashes and participant IDs stay in operational metadata rather than client-facing prose.

The shared document sign-off route carries the reviewed version ID, content hash and applicable plan receipt into the real mutation. The mutation verifies that receipt and compares the current-version pointer in the final update. Concurrent generation refuses approval instead of signing a newer version with an older review or restoring an older pointer. The durable approval records the verified receipt.

P5 readback also verifies that durable approval receipt against the current signed version ID, content and plan. A signed status alone cannot substitute for a verified review of that version; an absent or stale approval receipt refuses the handoff.

P5 completion requires current publication readback when the new flag is enabled. The acceptance and decision-trace links open a scoped Programs page at `/strategic-moves/[moveId]/tower-handoff`, which reads only the already-authorized exact-Move ledger projection. Tower also exposes the same planned readback through `?moveId=` under its existing module permission. The decision trace distinguishes unavailable state from an absent publication, and the baseline projection withholds prior Move rows while another Move loads or fails.

## Layer Impact

- Release lane: `global-control-lane`, restricted by a tenant feature flag.
- Layers 1 and 2: no intake, template, source adapter or shared dataset rebuild.
- Layer 3: one declared measurement step record, immutable contract-plan and approval receipts on existing document records, and governed metadata on the existing outcome ledger; no schema migration. Planned figures come from the current deterministic approved P4 case. The ledger stores unknown baseline and realized amounts as null.
- Layer 4: P5 measurement acceptance, publication-aware completion, exact-Move Tower readback and trace status.
- Data-plane transaction seam: an opt-in `includeReads` option keeps policy, evidence and capture basis reads on the existing serializable publication transaction. Default callers keep their current independent read path.
- CI dependency boundary: the Home tenant-fence workflow now triggers on the compatibility transaction module that its reader loads through that shared seam.

## Client Applicability

- All clients: the shared reviewed-version sign-off fence prevents approval of a changed version. The new P5 surfaces and measurement-plan checks remain restricted by the tenant feature flag.
- Specific clients: approved synthetic demo scope only.
- Internal only: no.
- Public/demo only: synthetic validation; no real-client rollout is authorized.
- Feature flag: `moves_p5_tower_handoff_v1`, tenant policy with the approved synthetic scope included. The step-page mount still requires the existing capture and step-page flags.

## Changes Included

- `p5_measurement_handoff`: receiving participant ID and role, source reference, cohort/comparator, method, cadence, first review trigger, exclusions and open conditions per P4 lever. Both text readers emit only the team's saved words.
- `GET/POST /api/v1/programs/[programId]/tower-handoff`: authenticated tenant and exact-Move access; financial visibility for review; gate and publication permission for acceptance; existing P4/P5 hard checks; current signed document ID/version/content hash, saved-plan hash and P4 input basis; receiving participants revalidated against current permissions.
- Deterministic physical UUIDs, real commit timestamps, original actor provenance and repeat idempotence. The write and basis reads share a transaction; post-commit readback uses the independent reader.
- The adapter uses the existing physical `value_category` and `measurement_unit` columns. Readback verifies the projected amount, unknown baseline and realized amounts, source references, document claims, ownership and governed metadata against the current basis. Published rows also recheck current P4/P5 hard prerequisites.
- The scoped browser page requires Programs module access, authenticated tenancy, exact-Move access, assigned-Move grants and financial visibility. It reads only the existing handoff API projection; general Tower permissions and user metadata are unchanged.
- A flagged measurement contract must have a verifiable immutable plan binding and the exact definition block in its signed content. Missing, stale or cross-scope bindings refuse sign-off/review/acceptance. An edited upload cannot inherit this proof; the flagged path currently requires review and sign-off of a generated bound version. Flag-off generation and P5 plan handling retain their prior behavior; the shared version fence applies to all document approvals through this route.
- The final sign-off update compares the reviewed current version. The real mutation rereads and verifies the version/content/plan receipt, rechecks an applicable saved plan and refuses changed or unavailable state without sign-off or approval lifecycle events.
- Dataset declaration `moves_p5_outcome_handoff_v1`. Each row carries a policy-validated `GovernedObject` with `committed_not_indexed` readiness, no applicable agents and no indexing, retrieval, citation or agent-ready claim.
- Product labels describe a planned handoff. Execution, baseline confirmation and realized-value verification remain future governed work.

## QA / Validation

- PASS: baseline identity regressions fail before the fix and pass afterward; removing the identity key kills both regressions.
- PASS: four isolated stale-plan regressions fail before the currency check and pass afterward. Source, comparator, participant and cadence edits retain the signed version unchanged and refuse review/acceptance.
- PASS: current-main reconciliation followed by 1208 tests across 31 affected suites, including the signed-plan checks, durable approval receipt, actual mutation interleavings, shared persistence and inherited speed/deck seams. This is local proof only; actual saved files remain pending.
- PASS: both actual-mutation version-race regressions fail before the guard and pass afterward. The route-to-real-mutation fixture covers both interleavings, changed content, changed saved plan, changed plan receipt and unavailable reads. The final focused handoff/sign-off run passes 128 tests across three suites without database or runtime writes, including the matching durable approval receipt requirement.
- PASS: 61 of 62 deliberate mutation probes are killed on the reconciled code. The one redundant passive-clear survivor is independently covered by the render-time Move guard, whose removal is killed before passive effects run. All mutant source edits run in a separate temporary copy.
- PASS: release check and pinned read-only peer review, including ten independent actual-mutation scenarios with an in-memory adapter. No blocking findings remain in the reviewed plan/version/receipt fence. This does not establish independent human approval or runtime acceptance.
- PASS: real component renders at 1440 and 390 pixels, light and dark, with saved control selections and no horizontal overflow. Local synthetic fixtures do not establish runtime acceptance.
- PASS: Node 24 typecheck including tests, changed-file lint (41 source files), no new library orphans, route/export reachability, manual/check, regenerated coverage/tenancy censuses and all six context/corpus validators. A fresh exported-tree census verifies actual main at 2833; this candidate genuinely regenerates to 2834 for exactly one new persistent test file.
- PENDING: controlled PR, exact-head CI, fetched-ref collision scan, merge, repo-owned deployment and signed-in acceptance.

## Rollout Plan

Merge only after local gates and completed exact-head CI, with a fresh coverage-count scan of every open Moves PR, including drafts. Deploy through the repo-owned main ACA workflow and prove digest parity. The sole approved execution owner then saves the fresh Move plan, reviews/signs current P5 documents, accepts the planned handoff, reads its exact-Move Tower projection and completes P5 through the existing governed gate. Capture document/version hashes, actor, row IDs and terminal state in private proof.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may build the shared web image or move shared ACA traffic. Support performs no runtime publication, data job, flag command, ad-hoc build or deployment. Runtime writes belong to the already-authorized execution owner through the product path.

## Rollback Plan

Disable `moves_p5_tower_handoff_v1` through the approved release lane, or roll back to the previous approved digest via the repo-owned workflow. Existing ledger rows are preserved as auditable planned records; no cleanup or deletion is implied. Rebaseline or retirement requires a separate governed decision. The default transaction path remains unchanged.

## Audit Evidence

Release record, dataset manifest, explicit step-record registry, tests and generated census/manual artifacts in this PR. Private QA and runtime proof remain outside the public repository. The manifest declaration records delegated implementation honestly; it carries no bulk-load or serving approval and attributes no action to another person.

## Known Gaps

Fresh Move identity, approved input binding, P4/P5 documents, terminal gate readback, deployment and signed-in Tower proof are pending. These rows are planned cash projections; they do not validate a baseline, prove execution or establish realized value. Changed publication inputs fail closed and require a future governed rebaseline; this release does not silently supersede a prior handoff.

Previously signed contracts without the immutable saved-plan proof cannot publish through the new flagged handoff. A governed new unsigned version is required; this release does not update or re-sign existing signed bytes. Edited replacements need a future explicit binding contract before this flagged path can accept them. Actual signed text, Office bytes and current plan still require operator acceptance and final read-only cross-review.

The version fence depends on the existing immutable-version contract; verified content and plan receipts are checked before the guarded pointer update. Later capture changes require fresh review and the existing acceptance currency checks. Other internal sign-off callers retain their current-version semantics while also gaining the final pointer comparison; this release does not claim a reviewed-content receipt for callers that do not provide one. Disabling the P5 flag does not undo the shared version fence; reverting that guard requires the approved code/digest rollback lane.
