# 2026-10-09 — P2 gate: a generated Discovery Report is judged by its words, not by the inputs stored beside it

## Release ID

`2026-10-09-moves-p2-report-judged-by-its-words`

## Status

`candidate`

## Plain-English Summary

Four hard P2 → P3 checks read the latest Discovery Report version as text:
`p2_readiness_cleared`, `discovery_baseline_attested`,
`discovery_stakeholders_named`, and the report arm of
`discovery_notes_ingested`. That text was the version's `content` joined with
`JSON.stringify(structured_data)`.

For a report the Moves generator wrote, `structured_data` is not the report.
It is the generator's record: `solution_context` (everything generation read,
including the Move's whole P2 capture — current-state gaps and open questions)
and `golden_bar` (the quality measurement, whose `missingExactEvidenceTerms`
lists the terms the report does NOT contain). Approving a generated report
signs that same version as-is, so this is what the gate reads after sign-off.

The gate therefore judged the report by its inputs, in both directions:

1. A current-state finding in the capture ("lineage unverified", "hold on new
   feeds") read as the report's own hard gap. `p2_readiness_cleared` refused
   with a sentence telling the reviewer to regenerate or edit the report so it
   clears P2 — and a regenerated report re-embeds the same capture, so the
   remedy could not work. The visible report never contained the words.
2. "Stakeholder" or "baseline" anywhere in the inputs — or in the list of
   terms the report is missing — credited the report with naming them.

This change reads only `content` for a version whose `structured_data.source`
is the generator's stamp. The generated HTML (including its pre-gate draft
banner) is the report. Versions written any other way — a client-approved
upload, or anything else — keep their structured data in the text, since this
module does not own their shape.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Moves P2 → P3 gate's reading of the Discovery Report.
- Canonical model: no schema, data or tenant change.

## Client Applicability

- All clients: yes. A generated, approved Discovery Report no longer fails P2
  on wording that appears only in its stored inputs, and no longer passes a
  check on wording that appears only there.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/discovery-report-readiness.ts`: `GENERATED_REPORT_SOURCE`
  and `isGeneratedReportRecord`; `discoveryReportTextFromLatestVersion` omits
  the structured data of a generated version.
- `src/lib/programs/__tests__/discovery-report-readiness.test.ts`: a generated
  version reads as its content only (both directions); an empty generated
  version is empty; non-generated structured data is still read; the
  generator's own source stamp is pinned against the writer.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`: a generated,
  signed report that clears P2 in its words, with "unverified" and "hold on"
  only in its stored capture, leaves no hard check open.

## QA / Validation

- PASS: new cases. Mutants: always reading structured data (5 failures), never
  reading it (3), wrong source literal in the reader (killed by the gate case
  and the writer pin). 3 of 3 killed.
- PASS: `npx jest src/lib/programs src/lib/solutions src/app/api/programs src/lib/deliverables`
  — 550 suites, 8005 tests.
- PASS: `tsc -p tsconfig.json --noEmit` (exit 0). ESLint and Prettier clean on
  the three files.
- NOT RUN: signed-in walk (see Deployment Authority).

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or data
job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: on a Move at P2, generate the Discovery
  Report, approve it as-is, and confirm the gate's P2 checks reflect only what
  the report says.

## Rollback Plan

Revert this change through a pull request; the gate again reads the
generator's stored record as report text.

## Audit Evidence

- Pull request and CI results.
- The mutant runs above.

## Known Gaps

- The positive checks may now need the words in the report body where the
  inputs used to supply them. The P2 answer arms of the baseline,
  stakeholder and notes checks are unchanged and still apply.
- The report text is still lowercased HTML matched by phrase; the structured
  P2 step named in earlier P2 readiness records replaces that.
- The draft banner inside generated HTML is report-visible and is still read;
  a context item it lists as "not yet captured" still counts as a gap, by
  design.
