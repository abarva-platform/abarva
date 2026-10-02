# 2026-10-02-home-enterprise-context-export - Preserve enterprise context in walkthrough export

## Release ID

`2026-10-02-home-enterprise-context-export`

## Status

`candidate`

## Plain-English Summary

When Home displays a source-linked business context alongside a prior, unreconciled interpretation, its HTML and PDF walkthrough exports now include that same context. The export names the synthetic evidence basis and preserves business scale, segments, priorities, functions, ownership, source dates, and known attribution gaps.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Home export rendering only. The source and selected Home bundle do not change.
- Canonical model and adapters: no changes.

## Client Applicability

- All clients: export code is shared but inert where a source-linked enterprise context is absent.
- Specific clients: none selected by this code.
- Internal only: none.
- Public/demo only: the first available context is an explicitly labelled synthetic reference.
- Feature flag: none.

## Changes Included

- `src/lib/home/export/enterprise-context.ts` maps the existing deterministic Home context to export sections.
- `src/lib/home/export/walkthrough-export.tsx` renders those sections in HTML and PDF.
- Export tests use the generated versioned source to verify context and family-count parity.

## QA / Validation

- Walkthrough export suite: 8 passed, including generated-source context in both formats.
- Typecheck and focused lint: passed locally.
- PDF structure is tested; live PDF visual and extracted-text proof after assessment promotion remain pending.

## Rollout Plan

Merge through PR and deploy by the repo-owned ACA main workflow. Verify the runtime invariant and then inspect both signed-in export formats against the same record marker shown on Home. No data-plane operation is required by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the successful main deploy.
- ACA runtime invariant: required before a live claim.
- Worker image invariant: required before a live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes, for HTML and PDF against an admitted context.

## Rollback Plan

Revert the export rendering through a PR and the repo-owned main deploy workflow. The Home record and assessment selection are unaffected.

## Audit Evidence

PR, CI, exact-SHA ACA deploy, runtime-invariant output, generated-source export test, and signed-in HTML/PDF proof are required before marking released.

## Known Gaps

Architecture and data-flow exhibits remain summaries rather than exported diagrams. This change does not make an unreconciled prior narrative current and does not alter aVa behavior.
