# 2026-09-09-source-response-evidence-binding — Source Response Evidence Binding

## Release ID

`2026-09-09-source-response-evidence-binding`

## Status

`candidate`

## Plain-English Summary

Source response review now reads normalized vendor submissions across authorized aliases of the
same tenant and uses those persisted response rows to populate completeness, evidence,
clarification, negotiation, and evaluation-readiness views. Rich proposal documents also yield a
small governed set of commercial and staffing candidate facts when the source document presents
labels and values in adjacent table cells.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 — Client intake: expands the synthetic reference RFP to 110 controlled requirements.
- Layer 2 — Source adapters: recognizes common adjacent label/value structures in proposal text.
- Layer 4 — Source: binds persisted normalized response packages into the response-review surface.

## Client Applicability

- All clients: yes, when they use normalized response workbooks or proposal-document intake.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Read normalized response facts using the canonical same-tenant alias set.
- Derive response profiles, exhibit coverage, evidence cards, clarifications, and evaluator
  readiness from persisted normalized requirement rows.
- Preserve an explicit synthetic-demo declaration from the submitted workbook through persistence
  and rendering instead of assuming that every normalized response has the same evidence class.
- Parse annual run price, transition cost, productive FTE, location mix, and submitted TCV from
  adjacent DOCX table labels without treating the values as accepted facts.
- Generate the 110-row synthetic managed-services RFP requirement matrix from a deterministic
  script.

## QA / Validation

- PASS — focused Jest suites for tenant alias reads, normalized workbook/profile derivation, and
  proposal fact extraction.
- PASS — TypeScript validation.
- PASS — ESLint on touched TypeScript files.
- PASS — deterministic regeneration of the 110-row reference requirement matrix.
- PASS — proposal extractor exercised against four rendered reference proposal documents.
- PASS — `git diff --check`.

## Rollout Plan

Merge by pull request. The repository-owned ACA main deploy workflow builds and deploys the exact
merge SHA. After deployment, re-read the existing normalized response packages, re-ingest the
proposal documents to create reviewable candidate facts, and complete signed-in response-stage
proof before advancing the event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active revision, and 100% traffic revision must use that digest.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy through the repository-owned workflow. Existing uploaded files
and normalized facts remain in the governed registry; the prior response surface will ignore the
new derived profile path. Candidate facts created after deployment remain reviewable and can be
rejected without altering accepted evidence.

## Audit Evidence

- Pull request and squash-merge SHA.
- Focused Jest, TypeScript, ESLint, matrix-regeneration, and release-check output.
- ACA deploy run and digest-pinned runtime readback.
- Signed-in response cockpit, package, citation, and evaluator-readiness proof.

## Known Gaps

Numeric values parsed from proposal documents remain candidate facts until an authorized reviewer
accepts them. The model does not assign final evaluation scores.
