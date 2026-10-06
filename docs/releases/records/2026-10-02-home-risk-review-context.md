# 2026-10-02-home-risk-review-context - Source-linked risk review

## Release ID

`2026-10-02-home-risk-review-context`

## Status

`candidate`

## Plain-English Summary

Home now presents a risk review queue when a source-linked enterprise context is available. The queue separates serious risks with partially effective controls from those whose control state is unknown, names the recorded accountable role and affected object, and links each item back to its source row. The same view appears in the walkthrough export. Record browsers no longer describe non-application families as applications.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Home derives a risk triage from admitted canonical object attributes and declared IDs. No intake, adapter, canonical data, or tenant state is changed.
- Presentation: Home chapter, record browser, HTML export, and PDF export.

## Client Applicability

- All clients: shared code; the queue is inactive without an admitted, source-linked enterprise context.
- Specific clients: none selected by code.
- Internal only: none.
- Public/demo only: the available reference context is labelled synthetic and not client-attested.
- Feature flag: none.

## Changes Included

- The existing enterprise context builder classifies high/critical severity with partial or unknown control state and resolves owners by declared ID.
- The attention chapter and Executive Brief display this triage with source dates and drill-through.
- The record browser uses risk-specific metrics and accurate control-state language.
- HTML and PDF exports carry the risk view and do not claim that a chapter lacks tables when a current context table exists.

## QA / Validation

- Generated-source context, component, record-browser, and export suites: 46 tests passed.
- TypeScript check passed with an 8 GB Node heap.
- Focused ESLint passed with one pre-existing React-hook warning in the record browser.
- Release gate, CI, and signed-in post-deploy proof are required before release.

## Rollout Plan

Squash-merge the approved PR, then use `.github/workflows/aca-main-deploy.yml` for the shared web image and traffic shift. Verify the exact image digest, active revision, worker images, and signed-in Home chapter/export behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded after the main deploy.
- ACA runtime invariant: required before a live claim.
- Worker image invariant: required before a live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through a PR and the repo-owned ACA main deploy workflow. The canonical record and assessment selection are unaffected.

## Audit Evidence

PR, CI, exact-SHA deploy, runtime invariant, generated-source test output, and signed-in Home/export inspection.

## Known Gaps

The review order is not a formal risk score. Control effectiveness is recorded, not independently attested here. Graph-backed dependency analysis, realized-value proof, temporal change, and current-context aVa answers remain separate work.
