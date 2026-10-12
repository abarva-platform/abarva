# 2026-10-12 — Reference deck wording and layout for partial evidence

## Release ID

`2026-10-12-moves-deck-render-reliability`

## Status

`candidate`

## Plain-English Summary

The deck preview distinguishes approved figure tokens from visible words when
checking client language. A targeted wording retry receives the specific blocked
vocabulary, so it can correct the rejected title or answer without receiving
case prose. A smaller confirmation panel leaves room for known evidence on a
partially populated slide in PowerPoint and PDF.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck preview flag.
- Layer 4 (products): wording validation, the deck specification and editable
  PowerPoint/PDF layout. Canonical figures and their approved reads remain the
  source of truth. Models generate narrative; the server binds the figures.

## Client Applicability

- All clients: no change with the preview flag off.
- Specific clients: the enrolled synthetic demo workspace.
- Internal only: no.
- Public/demo only: the flagged reference-deck preview.
- Feature flag: `moves_reference_deck_v1` (existing).

## Changes Included

- Known, edition-allowed figure tokens are validated before the visible-copy
  vocabulary check. Internal terms in visible prose still fail; unknown tokens,
  invented figures, disallowed edition tokens and malformed wrappers still fail.
- An audited wording retry carries a blocked-vocabulary label from the existing
  fixed vocabulary list. It receives no original model sentence, tenant facts
  or client prose. Retry timeouts and the visible unavailable-word marker and
  fidelity penalty remain in force.
- A confirmation panel uses a compact presentation when another block shares
  the slide. The known evidence, one visible gap and source bindings are retained.
  A wholly empty exhibit keeps its full confirmation panel. PowerPoint and PDF
  consume the same presentation instruction.

## QA / Validation

- Node.js 24 focused specification, wording, rendered-deck, PDF-inspection and
  preview-route suites: pass, 61 tests across five existing suites.
- Reconciled auth, tenant/Move access, Azure read transaction context, program
  queries and transformers: pass, 85 tests across eight existing mock-isolated
  suites. These are local regression checks, not authenticated product proof.
- Regression controls reproduced the delivery-token vocabulary rejection and
  partial-evidence body overflow. The uncompact summary remains rejected by the
  physical overflow guard; rejected wording after retry remains visibly unavailable.
- Typecheck and changed-file ESLint: pass.
- Prior local synthetic PDF renders: pass; partial validation has 11 pages and both
  partial investment cases have 22 pages, with zero direct PDF inspection findings.
  PowerPoint files were also rendered through LibreOffice. The affected summary
  and context pages were inspected as images in both renderer paths; the known
  evidence, gap panel and answer bar remain readable without overlap.
- Manual, coverage census and tenancy fence census genuinely regenerated:
  pass after merging actual main `5afb6c4e5fbc6f95f604568ce0c8b8ceb0e7ef5d`.
  The covered-test-file count is 2848, identical to that main baseline; the new
  cases extend two existing covered suites. No count or filler adjustment.
- All seven repair product/test files match the preceding validated head after
  reconciliation. Physical, source and edition refusals and approved-ROM fences
  remain intact. Shared walk discovery: pass; this is not a signed-in walk.
- Library orphan, route/export reachability, manual/census/fence checks: pass.
- Release checks: pass; all 11 gates ran. Current-main reconciliation, genuine
  regeneration and the affected local gate rerun passed, including the focused
  suites, typecheck and changed-file lint.
- Complete exact-head CI and the final fresh fetched-ref collision guard: pending.
- Authenticated product and fresh-case artifact acceptance: pending.

## Rollout Plan

Regenerate the affected manual and coverage/fence censuses, run the affected
local gates and publish through a protected pull request. Require complete
successful CI on its exact current head and a fresh actual fetched-ref scan of
all open Moves PRs, including drafts and shared-census contenders, before landing.
An equal covered-test-file count blocks landing; do not adjust tests or counts
to avoid it. The repo-owned ACA main deploy workflow then builds and deploys the
approved digest. The subsequent authenticated journey must inspect actual files.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the main deploy workflow.
- ACA runtime invariant: web template and 100% traffic revision images must
  match the approved digest.
- Worker image invariant: all required workers must match that digest.
- Feature/env flag update path: no flag change requested.
- Live signed-in proof required: both editions and both deck formats after deploy.

## Rollback Plan

Revert this change through a protected PR and the repo-owned main deploy workflow.
No stored data or persisted artifact needs reversal.

## Audit Evidence

- This record, the PR diff, exact-head CI and final fetched-ref guard.
- Local synthetic regression results and actual PowerPoint/PDF renders.
- The subsequent main deploy runtime invariant and authenticated artifact proof.

## Known Gaps

- Missing financial, source or delivery inputs remain gaps. Rendering an
  incomplete case does not establish quality or artifact acceptance.
- Local fixture tests use mocked wording calls; actual model behavior requires
  authenticated proof after deployment.
- Fresh-case acceptance still requires all approved inputs, each actual
  PowerPoint/PDF score at least 90, zero fallback wording, and visual review.
- Workbook formulas, document citations and cross-format figure agreement need
  the populated case's actual files; HTTP success alone is not their acceptance.
