# 2026-10-12 — Readable reference-deck tables and shared workflow space

## Release ID

`2026-10-12-moves-deck-table-fit`

## Status

`candidate`

## Plain-English Summary

Reference-deck tables allocate width to their actual content and height to wrapped
text. They retain editable cells and readable type rather than depending on a
presentation editor to shrink overflowing text. A two-row workflow leaves room
for its supporting evidence or confirmation panel. Approved estimate tables use
human-readable driver and source labels while preserving exact source keys in
their notes and figure ledger.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck preview flag.
- Layer 4 (products): editable PowerPoint and PDF layout, specification labels,
  and inspection of rendered table geometry and type size.
- Layers 1–3: no change. Canonical figures, tenancy, visibility, approved estimate
  reads and audited model egress remain authoritative.

## Client Applicability

- All clients: no change with the existing preview flag off.
- Specific clients: the enrolled synthetic demo workspace.
- Internal only: no.
- Public/demo only: the flagged reference-deck preview.
- Feature flag: `moves_reference_deck_v1` (existing; no flag change).

## Changes Included

- Shared table layout weights columns by content, sizes each row for wrapping,
  and retains every supplied cell and figure binding. Arial/Helvetica table
  faces provide portable metrics; type stays at 10 points or larger.
- Native table text uses explicit padding, top alignment and line spacing.
  Rendered-file inspection detects insufficient cell height and undersized type;
  these findings refuse both preview formats before returning a file.
- A workflow sharing the body uses closer row spacing. The confirmation panel,
  all flow stages, source line and answer bar remain visible.
- Approved estimate keys stay in notes and the ledger. Visible columns use the
  canonical driver labels and an approved-delivery-estimate source label.
- Existing overflow, source, edition, figure, tenant and editability refusals
  remain in force. No row deletion, invented value or extra model path is added.

## QA / Validation

- Local focused renderer, wording, inspection, preview and approved-estimate
  boundary tests: pass, 97 tests across nine suites on Node.js 24.
- Mutation checks: pass, 18 planted defects detected; all changes restored.
- Actual local synthetic PowerPoint and PDF files: pass for long answers,
  assumptions, approved estimate rows and a workflow with missing evidence.
  Native PowerPoint files were rendered through LibreOffice and inspected as
  images alongside the separately generated PDFs. This is local layout evidence.
- Direct PDF background separation: pass with a two-line headline; reverting
  the compact panel size is detected from actual PDF drawing coordinates.
- Direct PDF inspection: pass; long validation has 11 pages and long investment
  and workflow-plus-gap cases have 22 pages, with no extraction findings.
- Node.js 24 typecheck and changed-file lint: pass.
- Manual, coverage census and tenancy census genuinely regenerated: pass.
  Covered-test-file count is 2852 versus main 2851, exactly one new covered
  layout suite reached by the existing orchestrator CI sweep.
- Library orphan, route/export reachability and manual/census/fence checks:
  pass. Release checks: pass; all 11 gates ran.
- Actual main `025fbcfeb098c0f2c6efe00f9f9751c9cec5daf4` merged before
  publication, including Home admission and operator packaging. The deck product
  and test files remain unchanged across reconciliation. Documentation and
  censuses genuinely regenerated; the affected tests, typecheck, reachability
  and all 11 release gates passed again after reconciliation.
- Exact-head CI, fetched-ref collision guard, deployment and authenticated
  populated-case acceptance: pending.

## Rollout Plan

Regenerate affected documentation and censuses, run local gates, and publish an
own protected PR. Require complete successful exact-head CI, current-main
applicability, a fresh complete actual fetched-ref collision scan of all open
Moves PRs including drafts and shared-census contenders, and clean branch/release
records before squash merge. Equal covered-file counts block landing; do not
adjust counts or tests to avoid a contender. Only the repo-owned main deploy
workflow builds the shared image and shifts traffic. Verify the resulting digest
invariant and actual signed-in exports separately.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the main deploy workflow.
- ACA runtime invariant: web template and 100% traffic revision images must
  match the approved digest.
- Worker image invariant: all required workers must match that digest.
- Feature/env flag update path: no flag change requested.
- Live signed-in proof required: both editions and both file formats from a
  populated case with current approved inputs.

## Rollback Plan

Revert through a protected PR and the repo-owned main deploy workflow. No stored
data or signed artifact is modified by this release.

## Audit Evidence

- This record, the protected PR, exact-head checks and actual fetched-ref guard.
- Synthetic long-text and approved-estimate tests, planted-defect checks,
  rendered PowerPoint/PDF files and visual inspection.
- Subsequent deployment image invariant and signed-in artifact evidence.

## Known Gaps

- Conservative font metrics are a layout safeguard, not a substitute for visual
  review in the presentation client. Oversized input still fails closed.
- Local words and approvals are synthetic test fixtures. They establish no
  model, authenticated input, approval or artifact acceptance claim.
- Full demo acceptance requires complete approved inputs, each actual deck at
  least 90, no wording fallback, visual acceptance and cross-format figure proof.
- The populated case's document citations, workbook formulas and saved final
  files remain a separate acceptance step.
