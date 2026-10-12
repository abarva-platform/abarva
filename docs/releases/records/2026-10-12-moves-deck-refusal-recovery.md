# 2026-10-12 — Reference-deck refusal recovery and safe diagnostics

## Release ID

`2026-10-12-moves-deck-refusal-recovery`

## Status

`candidate`

## Plain-English Summary

Native answer labels and answer sentences are checked separately, so a layout
label cannot change the meaning of a confirmation task or conceal a factual
claim. Unavailable wording asks the team to confirm the counted basis rather
than asserting an absent annual value. The existing audited title retry receives
a concrete binding requirement. Expected lineage refusals carry safe rule and
request metadata, and companion workbooks distinguish those refusals from an
unexpected server failure.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck preview flag.
- Layer 4: physical narrative inspection, deterministic unavailable wording,
  audited retry controls and read-only preview/workbook response diagnostics.
- Layers 1–3: unchanged. Canonical inputs, source and figure visibility, current
  approved estimates, tenant access and audited model egress remain authoritative.

## Client Applicability

- All clients: existing preview-flag enrollment remains required.
- Specific clients: the enrolled synthetic demo workspace.
- Internal only: no.
- Public/demo only: the flagged reference-deck preview.
- Feature flag: `moves_reference_deck_v1` (existing; no enrollment change).

## Changes Included

- The native inspector separates the exact rendered answer label from the
  answer. Both the physical label and physical prose remain subject to evidence
  checks. Unsupported declarative claims and references to an absent figure
  remain blocked, including when the rendered file differs from its specification.
- The unavailable one-step answer asks for confirmation of the counting basis.
  Missing values remain visible, and all unavailable-word markers and fidelity
  penalties remain. No missing figure, source or approval is supplied by this fix.
- The existing targeted retry explains that a required title binding must remain
  an exact permitted token even when the server will render a missing-input
  qualifier. Persistent rejection remains unavailable; no title or binding guard
  is relaxed and no additional model call path is introduced.
- Typed lineage errors expose only fixed rule codes and slide indexes. Source
  labels, values, finding messages and authored wording are excluded from the
  diagnostic response. Known wording status and request IDs remain observable;
  a score not yet measured stays absent rather than becoming zero.
- Companion workbooks return an expected lineage refusal as HTTP 422. Approved
  estimate mismatches remain HTTP 409, and unexpected failures remain HTTP 500.
  Responses remain private and non-cacheable; successful files remain in memory.

## QA / Validation

- Focused renderer, wording, edition, PDF/native inspection, preview/workbook,
  value-read, legacy-quality and approved-estimate tests: pass; 158 tests in
  12 existing suites. The old label classification, unavailable-value fallback
  and missing diagnostics failed the added cases before repair.
- Affected mock/static access, query/transformer, capture, artifact, data-plane,
  governance, source and upload/privacy tests: pass; 487 tests in 17 existing
  suites after reconciliation with the connection-selection repair on main.
- Planted defects: pass; 15 behavioral defects caught and restored, including
  physical claim bypass, missing-value assertions, title binding/retry controls,
  markers, safe diagnostics, unknown scores and approved-estimate refusals.
- Physical synthetic output: pass. Four empty/failed-value controls have 11/22
  pages in native PowerPoint rendered through LibreOffice and in separate PDFs.
  Direct PDF checks and independent word coordinates have no findings outside
  the page. Changed answer and adjacent confirmation slides were viewed as images.
  Four actual companion XLSX files were reopened and their governed cells and
  blank value cells checked; unavailable inputs do not create formulas or values.
- Node.js 24 typecheck and changed-file lint: pass. Library orphan, route/export
  reachability, manual/census/fence checks and all six corpus validators: pass.
  All 11 release gates: pass, with a final check after this updated record.
- Main generated manual and censuses taken, then genuinely regenerated: pass.
  The natural covered-test-file count is 2858 after reconciling main
  `f7faba79593eac62802285e1466da3e17c0b52f1`. Its two newly landed projection
  suites account for the rise from the older committed 2856 inventory. This
  repair extends existing covered suites and adds no test file; its delta from
  measured main is zero. No count is adjusted.
- Exact published-head CI, delegated source review and fresh complete actual
  fetched-ref collision clearance: pending; the candidate remains draft and
  unarmed until every release guard passes.
- Deployment and authenticated same-case acceptance: pending. Synthetic controls
  remain incomplete and penalized; they are not populated-case acceptance.

## Rollout Plan

The scoped predecessor has landed and was reconciled by merging actual main,
taking its generated artifacts, genuinely regenerating all three and running
affected local gates. Publish an own draft PR, obtain the exact delegated source
review and require every current-head check to complete successfully with only
verified event-gated skips.
Run a fresh complete actual fetched-ref census guard across every open Moves and
shared-census PR, including drafts, and recheck inventory, heads, main, clean
branch, record, source review and CI immediately before readiness and protected
squash merge. No count tuning, test relocation, draft withdrawal or exclusion.

Only the repo-owned main deploy workflow builds the shared image or shifts traffic.
Verify repair ancestry and its approved digest across web template, single 100%
traffic revision and every required worker, plus current health. The case owner
alone performs the authorized fresh unsigned output journey. Preserve signed
documents and the merge/deployment cutoffs and named-fix exception rules.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the repo-owned main workflow.
- ACA runtime invariant: web template and 100% traffic revision match that digest.
- Worker image invariant: every required worker image matches that digest.
- Feature/env flag update path: no flag or environment change requested.
- Live signed-in proof required: actual current case outputs in both editions and
  formats, with current approved inputs and selected estimate.

## Rollback Plan

Revert through a protected PR and the repo-owned main deploy workflow. This change
does not modify stored input, approvals, canonical data or protected artifacts.

## Audit Evidence

- Scoped source/test diff, this record, offline gate logs and synthetic files.
- Exact delegated source review, current-head CI and fresh fetched-ref proof.
- Subsequent runtime invariant and actual same-case artifact evidence.

## Known Gaps

- A model can still fail title, source, edition or evidence rules after retry;
  that failure remains visible and penalized. No future wording score is guaranteed.
- Explicit contradiction checks are not general natural-language entailment.
  Every independently requested format still needs its own actual review.
- Historical generic failure labels do not establish an uncaptured server cause
  or rejected title. New diagnostics cannot retrospectively reconstruct them.
- Missing canonical inputs and approvals remain missing. A successful synthetic
  workbook or HTTP response does not establish an accepted populated case.
- Final acceptance still requires every actual deck at least 90 with zero
  fallback, approved figures and full visual review, actual document citations,
  workbook formulas and cross-format figures, and final files outside the repo.
