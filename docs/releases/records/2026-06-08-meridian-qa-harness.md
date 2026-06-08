# 2026-06-08-meridian-qa-harness — Meridian Sentinel 80-question evidence QA harness + scorer

## Release ID

`2026-06-08-meridian-qa-harness`

## Status

`candidate`

## Plain-English Summary

Adds an internal-only QA harness that runs the live Intelligence answer engine
(`askIntelligence`) against an authored 80-question set for the Meridian Health
tenant and grades each answer on 12 evidence-quality dimensions (specificity,
Meridian-context usage, healthcare-corpus usage, citation presence/correctness,
missing-evidence honesty, next-action quality, executive clarity, no raw-id
leakage, no cross-tenant leakage, clinical/regulatory caution, value-model
rigor). Scoring is a hybrid: deterministic checks for the mechanical dimensions
(citations, leakage, source-type usage) plus a Claude judge for the qualitative
dimensions. It emits a JSONL result log, a self-contained HTML scorecard, and a
recommended-fixes markdown listing systemic gaps. It is a measurement tool only:
it does not change any product runtime behavior and does not mutate the data
plane.

## Layer Impact

- `internal-admin` lane: AbarVa-only evidence-quality measurement tooling. The
  harness runs read-only against Meridian retrieval and writes only to a local
  reports directory. No runtime/control-plane or client-data-lane behavior
  changes.

## Client Applicability

- All clients: No.
- Specific clients: No client-facing change. Reads Meridian tenancy
  (`6e419b6e-950d-4d34-a4fc-06c3e451a6c4`) for measurement only.
- Internal only: Yes — operator-run QA harness.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/qa/meridian-sentinel-qa.ts` — tsx harness: drives
  `askIntelligence` for Meridian, collects answer + sources + coverageReport,
  scores 12 dimensions, writes `qa-results.jsonl`, `qa-scorecard.html`, appends
  `recommended-fixes.md`. Args: `--limit N`, `--out <dir>`.
- `src/scripts/qa/scoring.ts` — network-free deterministic scorers
  (raw-id-leak detector, cross-tenant-leak detector, source-bucket classifier,
  citation/usage scoring, judge-score normalization, overall averaging).
- `src/scripts/qa/__tests__/scoring.test.ts` — offline unit tests for the
  deterministic scorers (runnable in CI without network).
- `docs/releases/records/2026-06-08-meridian-qa-harness.md` — this record.

## QA / Validation

- Unit test: `npx jest src/scripts/qa/__tests__/scoring.test.ts --no-coverage`
  — passed (16/16).
- TypeScript: `npx tsc --noEmit` — 0 errors in the new files
  (`src/scripts/qa/*`); pre-existing unrelated @azure-rest / @axe-core typing
  noise ignored per lane policy.
- ESLint: `npx eslint src/scripts/qa/scoring.ts
src/scripts/qa/meridian-sentinel-qa.ts
src/scripts/qa/__tests__/scoring.test.ts` — 0 errors, 0 warnings.
- Live 80-question run: NOT RUN by the author. The harness needs the in-VNet
  Azure Postgres data plane + `ANTHROPIC_API_KEY`, so the lead runs it headless
  via the private operator-job. The HTML scorecard / JSONL / recommended-fixes
  are the live-run evidence and will be attached when produced.

## Rollout Plan

No runtime rollout. Merge to main makes the script available to operators. It is
executed manually (or in the operator-job) on demand; it never runs in the web
request path.

## Rollback Plan

Revert the commit / delete `src/scripts/qa/`. No migrations, no data writes, no
feature flags — rollback is purely removing the script files. Generated report
artifacts under `reports/` can be deleted independently.

## Audit Evidence

- PR URL: (to be added on open) branch `cursor/meridian-qa-harness`.
- Commit: `feat(qa): Meridian Sentinel 80-question evidence QA harness + scorer`.
- Unit-test output: jest 16/16 pass.
- eslint/tsc output: clean on changed files.
- Live-run evidence (operator-job): `qa-results.jsonl`, `qa-scorecard.html`,
  `recommended-fixes.md` under
  `reports/meridian-sentinel-citation-hardening-2026-06-08/`. Each judge call is
  audited via `getAuditedAnthropicClient` (workflow `meridian-qa-judge`,
  dataClass `confidential`).

## Context Ingestion Evidence

Not applicable. This release adds no ingestion/loader/Blob/worker/parser/
embedding/commit path. It is a read-only retrieval-QA measurement harness; it
reads existing Meridian context via `askIntelligence` and writes only local
report files. No client data-plane rows are created or modified.

## Known Gaps

- The live 80-question run has not been executed by the author (no in-VNet DB /
  Anthropic locally). Pass/fail of the corpus is pending the operator-job run.
- Deterministic `meridian_context_usage` / `healthcare_corpus_usage` infer
  evidence from source _type_ counts, not semantic correctness of the cited
  fact; the Claude judge covers qualitative correctness but is itself fallible
  and fails open (deterministic-only) on error.
- `citation_correctness` is a proxy (renderable cite ratio), not a verification
  that each cited fact actually supports the claim.
- The cross-tenant-leak regex is a denylist of known tenant names; a novel
  tenant name would not be caught.
- The judge model id (`claude-opus-4-7`) mirrors current repo usage; if the
  canonical judge model changes, update `JUDGE_MODEL`.
