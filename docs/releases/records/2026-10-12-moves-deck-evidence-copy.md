# 2026-10-12 — Evidence-bound reference-deck language and readable architecture

## Release ID

`2026-10-12-moves-deck-evidence-copy`

## Status

`candidate`

## Plain-English Summary

Reference-deck language must respect the evidence available to each exhibit.
Missing value, baseline, accepted-owner, approved-estimate or public-source inputs
cannot be described as completed evidence. Active and open assumptions have
separate counted bindings. The existing audited wording retry receives explicit
title and evidence requirements. Architecture labels use wider editable rows,
readable type and word-boundary summaries, with complete source detail in notes.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck preview flag.
- Layer 4: narrative validation, source-bound status/count projection, editable
  architecture layout and inspection of the actual PowerPoint/PDF output.
- Layers 1–3: unchanged. Current canonical records, tenant/figure visibility,
  approved estimate reads and audited model egress remain authoritative. Counts
  are derived from existing returned statuses and are not stored as new facts.

## Client Applicability

- All clients: existing preview-flag enrollment remains required.
- Specific clients: the enrolled synthetic demo workspace.
- Internal only: no.
- Public/demo only: the flagged reference-deck preview.
- Feature flag: `moves_reference_deck_v1` (existing; no flag change).

## Changes Included

- Server-derived availability prevents completed-evidence language when its
  basis is missing. Specification and rendered-file checks enforce the same
  boundary. Public-citation availability is not universal case-fact coverage.
- Active assumptions and currently open assumptions use distinct source keys
  and workbook bindings, including the existing redaction fence.
- Initial and targeted-retry prompts specify the existing minimum title length
  and single-sentence rule. Only keys, meanings and coarse read-state controls
  enter the audited model path; values and client source prose remain excluded.
- Persistent model rejection retains visible unavailable-word markers and
  fidelity penalties. Missing inputs retain their confirmation panels/penalties.
- Role-contact setup instructions do not establish business rationale or
  commitment. Substantive working scope/role hypotheses retain their qualifier.
- Architecture uses wider columns over two rows, fixed readable type, short
  labels and a separate governance band. Full allowed source detail and exact
  source identifiers remain in notes. Native geometry/content and PDF label
  presence are inspected before either preview format is returned.

## QA / Validation

- Focused wording, edition, renderer, PDF/native inspection, value-read,
  preview-route and approved-estimate tests: pass; 112 tests across nine suites on Node.js 24.
- Affected mock-isolated input scanner/upload tests after current-main
  reconciliation: pass; 26 tests across two existing suites.
- Planted-defect checks: pass; 20 defects detected and restored, covering title
  rules/retry controls, evidence/count/redaction gates, model prompt privacy,
  physical checks, architecture notes/type/width and failure markers.
- Local synthetic PowerPoint and independently generated PDF inspection: pass;
  readable architecture and long-table layouts reviewed as images. Eleven PDF
  variants have the expected 11/22-page editions and no extraction findings or
  words outside the page boundary. These are isolated synthetic fixtures.
- Node.js 24 typecheck and changed-file lint: pass.
- Manual, test coverage and tenancy censuses genuinely regenerated: pass.
  After merging main `55ee865cd0768b00446a04b1300f8d9416691de7`,
  the natural covered-test-file count is 2854, equal to that main. This change
  extends existing covered suites and adds no covered test file.
- Library orphan, route/export reachability and manual/census/fence checks:
  pass. All 11 release gates passed after current-main reconciliation;
  exact-head CI and fetched-ref collision clearance remain required before landing.
- Deployment, authenticated populated-case output and client visual acceptance:
  pending. Local fixtures, mock approvals and HTTP success are not acceptance.

## Rollout Plan

Publish an own controlled draft PR after current-main reconciliation and local
gates. Require every exact-head check to finish successfully, verified expected
event-gated skips, a fresh complete actual fetched-ref census scan across every
open Moves/shared-census PR including drafts, and immediate inventory/head/main
rechecks before readiness and protected squash merge. Equal counts block landing;
do not change counts, relocate tests or add filler to avoid another candidate.

Only the repo-owned main deploy workflow builds the image and shifts traffic.
Verify the approved digest across web template, single 100% traffic revision and
required workers, plus route health. The designated case owner alone generates
fresh unsigned case outputs after current-input reconciliation. No protected
signed document is rebuilt or replaced by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the repo-owned main workflow.
- ACA runtime invariant: web template and 100% traffic revision match that digest.
- Worker image invariant: all required worker images match that digest.
- Feature/env flag update path: no flag change requested.
- Live signed-in proof required: both actual editions in PowerPoint and PDF from
  the fresh populated case with complete current approved inputs and estimate.

## Rollback Plan

Revert through a protected PR and the repo-owned main deploy workflow. No stored
input, approval, canonical record or signed artifact is changed by this release.

## Audit Evidence

- This record, scoped source/test diff, local gate logs and synthetic renders.
- Exact-head CI, actual fetched-ref guard and immediate landing rechecks.
- Subsequent runtime digest invariant and fresh actual case artifact evidence.

## Known Gaps

- Narrative checks enforce explicit read-state/count contradictions and source
  scope; they do not replace human review of every possible natural-language
  inference. Persistent model failure stays visible and penalized.
- Missing canonical inputs and a separately governed baseline remain missing.
  This release does not populate a case or create an approved estimate.
- Separate format requests can draft different language. Review every actual
  format independently; a figure-ledger hash does not prove narrative parity.
- Fresh acceptance still requires every actual PowerPoint/PDF at least 90, zero
  fallback, complete approved figures, slide-by-slide visual acceptance, actual
  document citations/workbook formulas and final demo files outside the repo.
- Preserve the published merge/deployment cutoffs and named-fix exception rules.
