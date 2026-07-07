# 2026-06-07-setup-admin-loader-design — Setup/Admin loader design + exemplar

## Release ID
`2026-06-07-setup-admin-loader-design`

## Status
`candidate` (design + templates; no runtime change)

## Plain-English Summary
A design for making the Admin data loader produce realistic, proportional, deep, and
answerable context — so attaching it to Sentinel/Nexus is downstream. Includes the
per-dimension template anatomy, two intake lanes (structured + ad-hoc-doc-with-review),
a proportionality engine (exec counts / IT budget / KPI counts scale to org size +
industry), a visible intake state machine, and a retrieval-proof definition-of-done.
Ships one fully-worked exemplar (Leadership & Org + KPI register) with how-to-fill,
realism ranges, a provider+payer metric catalog, and golden questions.

## Layer Impact
- `internal-admin`: the Admin loader capability (design + templates).
- `client-data-lane`: defines how client context data is intake-shaped/validated (design only here; no schema or data change in this PR).

## Client Applicability
- Internal only (loader design); applies to all clients once implemented.

## Changes Included
- `docs/build/setup-admin-loader/DESIGN.md`, `README.md`, `org-profile.template.csv`, `realism-ranges.md`.
- `templates/leadership-org/*`, `templates/kpi-register/*` (incl. provider/payer metric catalog).

## QA / Validation
- **PASS** — `git diff --check`; `release:check` (see PR CI). Design/templates only.
- Retrieval-proof loop is specified (golden questions per template); execution is the
  implementation follow-up.

## Rollout Plan
No runtime rollout. Implement the framework on the exemplar dimension, prove via the
golden-question loop, then replicate to the remaining dimensions.

## Rollback Plan
Not applicable — documentation/templates only.

## Audit Evidence
`docs/build/setup-admin-loader/*`.

## Known Gaps
- Exemplar covers Leadership/Org + KPIs; remaining ~22 dimensions to follow the same anatomy.
- UI/loader implementation (state machine, validation warnings, ad-hoc review queue) is the next build.
