# 2026-10-10-source-prior-decision-current-readiness

## Release ID

`2026-10-10-source-prior-decision-current-readiness`

## Status

Candidate. Local validation is recorded below; merge, deployment, and signed-in proof are separate gates.

## Plain-English Summary

A previously approved stage is now shown as a prior decision, not as proof that today's evidence is complete. Responses uses the same six forward-gate checks in its decision summary and checklist. The recorded decision remains accessible, while the permanent approval-status dock is removed from approved-stage views so it cannot obscure working content. Open-check counts use singular or plural correctly.

## Release Lane

`global-control-lane`

## Layer Impact

Layer 4: Source presentation. Existing stage evidence, artifact review, approval ledger, and response gate results are projected consistently. No canonical records, approval decisions, stage transitions, schemas, ingestion paths, authentication, RLS, or tenant boundaries change.

## Client Applicability

- All clients: Source event current-stage views, especially previously approved stages with current evidence gaps.
- Specific clients: None; no tenant-specific behavior.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `SourceAnalyticsCanvas.tsx`: qualifies prior decisions, shows known approval metadata, retains the approval-record action, accounts for required evidence gaps, and suppresses the fixed dock for recorded decisions.
- `CommercialActiveCanvasStrip.tsx`: current evidence and response gate checks take precedence over a completed input checklist; recorded decisions do not invite another approval.
- `VendorResponseForwardGate.tsx`: reuses its existing check builder in the surrounding stage summary; pluralizes open checks without changing gate eligibility.
- Existing canvas and forward-gate suites cover historical decisions, missing evidence, preserved history navigation, absent fixed overlays, current readiness, and singular/plural/all-complete checklists.

## Design Authority

`docs/design/source-end-to-end-redesign-brief.md:54`: "a gate item is green because the evidence reached its target state".

`docs/design/source-end-to-end-redesign-brief.md:104` names structured response intake as the prerequisite for response analysis. This slice advances the on-page intelligence promise at line 14 by displaying the current evidence verdict. It retains existing page anatomy and tokens; the sticky continuation action remains available for unapproved stages. A historical status notification is not a continuation action.

## QA / Validation

- Red first: rendered assertions reproduced the contradictory historical panel and plural defect before implementation; a separate red assertion reproduced the commercial summary's misleading next action.
- All 62 Source canvas suites passed: 376 tests. Typecheck, focused ESLint, staged secret scan, and whitespace checks passed. Release gates and CI are required before merge.
- Mutation checks killed removal of response-gate status, omission of required-evidence gaps, restoration of the approved-stage fixed dock, removal of pluralization, and disregard of current evidence in commercial readiness.
- Current signed-in baseline captured privately. Post-deploy signed-in replay is required; baseline screenshots do not certify this candidate.

## Rollout Plan

Squash-merge the reviewed PR after applicable CI passes. The repo-owned main deploy workflow builds and serves the release. Verify runtime digest parity, then replay the Responses view and approval-history navigation without writing event data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only; no ad-hoc Azure updates.
- Approved image digest: Determined by the main deploy; never a mutable branch tag.
- ACA runtime invariant: Template and healthy 100%-traffic revision must use the approved digest.
- Worker image invariant: Both required delivery workers must match that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Prior decision and current blocked response gate agree; approval history remains readable; no fixed recorded-decision overlay; plural and disabled evaluation controls render correctly.

## Rollback Plan

Revert this presentation-only PR through a reviewed PR and the repo-owned main deploy workflow. No database rollback or historical decision edits are needed.

## Audit Evidence

PR diff, applicable CI, mutation results, main deployment run, runtime invariant readback, and private signed-in before/after evidence. No private event identifiers, client narrative, or approval rationale belong in this public record.

## Known Gaps

This does not validate past approval rationale, reconstruct absent responses, certify scoring quality, or establish financial lineage. A completed historical event is not a demonstration of a newly approved or evaluated response set. Phone layouts and dark-mode expansion are outside this slice.
