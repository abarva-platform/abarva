# 2026-10-12-home-ava-record-count-language

## Release ID

`2026-10-12-home-ava-record-count-language`

## Status

`candidate`

## Plain-English Summary

Home's deterministic row-count answer accepts ordinary availability wording, a request for the
record source and concise bullet formatting. The answer uses the same server-resolved record
source as the page and cites that exact record marker. It does not send raw records to a model.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4: count-question routing and source-label presentation only.
- Layers 1, 2 and 3: no intake, adapter, schema, source review or canonical data mutation.
- No change to model context admission, source-readiness or release approvals.

## Client Applicability

- All clients: authenticated Home users whose selected record includes the requested families.
- Specific clients: none singled out.
- Internal only: no new admin capability.
- Public/demo only: no new public route or fixture data.
- Feature flag: none; existing authorization and exact record-token fence remain unchanged.

## Changes Included

Count parser accepts bounded formatting/source clauses and data-assets/integrations spelling.
The API passes its resolved source, not a caller-provided substitute. Missing families remain
unknown; a missing source label makes an otherwise supported answer partial. Filtered counts,
unique vendors, financial judgments and historical comparisons do not become whole-family totals.

## QA / Validation

- Focused answer/API tests: 50 passed, including the full conversational request, source states,
  missing source, filtered counts, interpretation and historical-comparison refusals.
- Full Node 24 typecheck and changed-file lint passed.
- Home ratchet: 756/784 tests; the same 12 baselined suites and no movement. No baseline edited.
- Release control: 11/11 local gates passed. Current-head CI and deployment remain separate gates.
- Signed-in current-record baseline captured privately; the corrected production answer is not
  claimed until the exact release deploys and the same question passes in the browser.

## Rollout Plan

PR, squash merge on required green checks and repo-owned digest-pinned ACA main deployment.
Rerun the exact conversational count/source question in signed-in Home; verify page counts,
source label, rendered citations and artifact agree. No data build or selector change required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: exact main image resolved by the workflow.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required worker jobs match the same approved digest.
- Feature/env flag update path: no shared flag or env change.
- Live signed-in proof required: exact conversational question and record-source/count agreement.

## ACR Build Policy

`acrabarvalab001` remains Premium. Shared web images are built only through the repo main workflow
using Docker Buildx with `cache-from: type=gha` and `cache-to: type=gha,mode=max`.
No ad-hoc build, push or prune is included; active and rollback digests remain preserved.

## Rollback Plan

Revert through a PR and the same ACA workflow. Simple deterministic count questions remain
supported by the prior implementation; no data rollback or deletion is needed.

## Audit Evidence

PR/CI, local regression output, deployment/runtime parity and signed-in answer/source/artifact
screenshots. Retain tenant-specific browser evidence privately, not in the public repo.

## Known Gaps

Row counts are not unique vendors, portfolio completeness or business outcomes. This does not
refresh canonical data, publish new insights, certify narrative coherence or complete visual PDF
parity. General questions still require separately admitted, cited evidence.
