# 2026-10-02-home-current-context-answer-parity - Current-record answers

## Release ID

`2026-10-02-home-current-context-answer-parity`

## Status

`candidate`

## Plain-English Summary

Home aVa now answers supported business, priority, operating-model, and risk questions from the same admitted source-linked context that the page renders. It uses short bullets and source citations, and refuses graph, value-proof, dependency, and time-comparison requests when the current record does not support them. Risk review also leads with the specific recorded risk statement rather than only its category, and explains when a repeated role cannot establish item-level accountability.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake, adapters, canonical data, and tenant state: unchanged.
- Product projection: Home derives risk display names and a constant-owner warning from admitted source-linked rows.
- Presentation: Home risk chapter, aVa answer packet, HTML export, and PDF export.

## Client Applicability

- All clients: shared code, active only when a fully source-linked and accepted current enterprise context is available.
- Specific clients: none selected by code.
- Public/demo only: the available reference context remains labelled synthetic and not client-attested.
- Feature flag: none.

## Changes Included

- Current-record aVa answers cite the bundle's canonical record marker and selected source rows; a mismatched reviewed narrative is not passed into these answers.
- Unsupported graph, value, dependency, and change questions do not borrow old claims to appear complete.
- Risk chapter and export show the specific risk name without an embedded row identifier, and disclose a register-level owner default.

## QA / Validation

- Focused aVa, enterprise-context, chapter, and export suites pass.
- TypeScript, focused ESLint, Home ratchet, release check, and PR checks are required before merge.
- Post-deploy proof must inspect signed-in current-record answers, risk chapter, and export on the selected synthetic assessment.

## Rollout Plan

Squash-merge the approved PR, then deploy only through `.github/workflows/aca-main-deploy.yml`. Verify the exact digest against the web template, 100% traffic revision, required workers, and signed-in Home behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded after the main deploy.
- ACA runtime invariant: required before a live claim.
- Worker image invariant: required before a live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through a PR and the repo-owned ACA main deploy workflow. No tenant data or canonical records are changed.

## Audit Evidence

PR, CI, exact-SHA deploy, runtime invariant, source-linked test output, and signed-in Home/aVa/export inspection.

## Known Gaps

These answers cover only the current context structures that are source-linked and accepted. Realized-value proof, graph-backed dependencies, temporal change, and reconciliation of older chapter narrative remain separate work.
