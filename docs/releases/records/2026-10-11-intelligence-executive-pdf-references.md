# 2026-10-11-intelligence-executive-pdf-references — Readable compact references

## Release ID

`2026-10-11-intelligence-executive-pdf-references`

## Status

`candidate`

## Plain-English Summary

Intelligence PDF reviews place sources and follow-up questions side by side beneath the answer. Compact reference spacing reduces pages containing only references. Browser, HTML and PDF source metadata show readable titles without leading internal record codes. Claude-authored prose and exhibit labels are preserved, even if they contain a code; those issues must be addressed by the generation prompt.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: source metadata display and executive PDF layout.
- No intake, adapter, canonical data, schema, corpus admission, generation-output filter or data-load change.

## Client Applicability

- All signed-in Intelligence clients using model-authored answers and session exports.
- No feature flag or environment update.

## Changes Included

- Two-column sources and follow-ups in PDF with compact, readable reference styles.
- Source metadata display removes a leading canonical record-code prefix when followed by a title separator.
- Canonical source metadata, provenance, raw response, authored prose and exhibit values remain unchanged.
- Existing vector matrices, graphs and numeric plots are retained.

## QA / Validation

- PASS: 16 tests across four focused suites, Node 24 TypeScript and changed-file ESLint.
- Rendered vector PDF fixture inspected, including reference layout.
- PASS: refreshed coverage census and all eleven release-control gates.
- NOT RUN: latest native ten-question export requires ACA deployment and signed-in proof.

## Rollout Plan

Squash merge after local QA. Deploy through the ACA main workflow. Verify approved web and worker digests, then run the same ten questions and visually inspect every page of the native PDF.

## Deployment Authority

- Repo-owned deploy workflow and only shared runtime mutator: `.github/workflows/aca-main-deploy.yml`.
- Approved digest, full-traffic revision and worker invariants: captured after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: readable sources, vector visuals and actual native export.

## Rollback Plan

Revert through a PR and the repo-owned ACA main workflow. No data rollback.

## Audit Evidence

Candidate diff, preservation tests, rendered PDF fixture, QA logs, PR, runtime invariant and private signed-in export proof.

## Known Gaps

Long source titles or follow-ups may still wrap across pages. Output quality is governed by the generation prompt; this presentation change never repairs authored text or malformed protocols.
