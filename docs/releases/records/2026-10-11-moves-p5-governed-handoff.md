# 2026-10-11 — Governed planned P5 outcome handoff

## Release ID

`2026-10-11-moves-p5-governed-handoff`

## Status

`candidate`

## Plain-English Summary

P5.2 can save receiving participants and measurement definitions for every current P4 lever, then accept a planned Tower handoff against the current signed measurement contract. The product derives planned cash from the deterministic P4 case. It records projected-only rows in the existing outcome ledger and confirms them through an independent read after commit. A changed contract, plan, input basis or receiving participant refuses acceptance. Repeat acceptance of the same basis retains the original rows, actor and time.

Generation captures a copy of the saved measurement plan before authoring starts. Deterministic rendering carries those definitions into the contract and Office companion; the immutable version records the tenant/Move, exact plan snapshot and hash, plus the generated HTML content hash. Sign-off, review and acceptance compare that version with the current saved plan. Editing a source, comparator, participant or cadence after signing refuses the handoff while preserving the signed bytes. Hashes and participant IDs stay in operational metadata rather than client-facing prose.

P5 completion requires current publication readback when the new flag is enabled. The acceptance and decision-trace links open a scoped Programs page at `/strategic-moves/[moveId]/tower-handoff`, which reads only the already-authorized exact-Move ledger projection. Tower also exposes the same planned readback through `?moveId=` under its existing module permission. The decision trace distinguishes unavailable state from an absent publication, and the baseline projection withholds prior Move rows while another Move loads or fails.

## Layer Impact

- Release lane: `global-control-lane`, restricted by a tenant feature flag.
- Layers 1 and 2: no intake, template, source adapter or shared dataset rebuild.
- Layer 3: one declared measurement step record and governed metadata on the existing outcome ledger; no schema migration. Planned figures come from the current deterministic approved P4 case. The ledger stores unknown baseline and realized amounts as null.
- Layer 4: P5 measurement acceptance, publication-aware completion, exact-Move Tower readback and trace status.
- Data-plane transaction seam: an opt-in `includeReads` option keeps policy, evidence and capture basis reads on the existing serializable publication transaction. Default callers keep their current independent read path.

## Client Applicability

- All clients: existing behavior remains with the new flag off.
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
- A flagged measurement contract must have a verifiable immutable plan binding and the exact definition block in its signed content. Missing, stale or cross-scope bindings refuse sign-off/review/acceptance. An edited upload cannot inherit this proof; the flagged path currently requires review and sign-off of a generated bound version. Flag-off generation and sign-off retain their prior behavior.
- Dataset declaration `moves_p5_outcome_handoff_v1`. Each row carries a policy-validated `GovernedObject` with `committed_not_indexed` readiness, no applicable agents and no indexing, retrieval, citation or agent-ready claim.
- Product labels describe a planned handoff. Execution, baseline confirmation and realized-value verification remain future governed work.

## QA / Validation

- PASS: baseline identity regressions fail before the fix and pass afterward; removing the identity key kills both regressions.
- PASS: four isolated stale-plan regressions fail before the currency check and pass afterward. Source, comparator, participant and cadence edits retain the signed version unchanged and refuse review/acceptance.
- PASS: 157 focused generation, persistence, sign-off and handoff tests, followed by additional content and receiver-provenance negative cases. This is local proof only; actual saved files remain pending.
- PENDING: current full combined suite, new invariant mutation probes and complete local QA after the signed-plan change. The earlier 936/18 and 40/41 runs are historical and do not establish the new invariant.
- PASS: real component renders at 1440 and 390 pixels, light and dark, with saved control selections and no horizontal overflow. Local synthetic fixtures do not establish runtime acceptance.
- PENDING: final changed-file lint, orphan/reachability checks, coverage and tenancy censuses, manual/check, all six context/corpus validators, Node 24 typecheck and release check. There is still exactly one new persistent test file.
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
