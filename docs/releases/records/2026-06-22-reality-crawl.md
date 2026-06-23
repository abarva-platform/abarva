# 2026-06-22-reality-crawl — Reality-crawl harness (the deep test, not the shape probe)

## Release ID

`2026-06-22-reality-crawl`

## Status

`candidate`

## Plain-English Summary

Adds the **reality-crawl** harness — the deep test the tenant-matrix gate is *not*. The matrix gate fires one question per column and checks the shape; this fires the whole question bank (58 tough questions across `data`, `strategy`, `table`, `chart`, `graph`, `honesty`, `fence` — expandable to hundreds) at every tenant, **captures every full `AgentAnswer` response** (prose + typed exhibits + experts + citations + latency) to an **auditable per-tenant corpus you can read**, and **scores each by category** — including whether a "show me a table/chart/graph" question actually returned that **typed exhibit**. Output: `out/reality-crawl/<tenant>.jsonl` (the corpus), `summary.json`, and a tenant × category pass-rate report with the worst failures surfaced for human review. An optional LLM judge (quality/usefulness/honesty) runs on failures when `ANTHROPIC_API_KEY` + `JUDGE=1` are set. This is the "100 tough questions" pressure test done right — captured and scored, not probed — and distinct from "MATRIX PASSED", which only proves the shape on one question.

## Layer Impact

`internal-admin` lane — an operator QA / verification harness only. No product surface, client-data-lane, schema, flag, or runtime behavior change.

## Client Applicability

Not applicable — internal QA tooling run by an operator against the deployed app. No client receives anything.

- All clients: no
- Specific clients: no
- Internal only: yes (operator QA harness)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/qa/reality-crawl.mjs` — the capture + score + report harness.
- `scripts/qa/reality-crawl-bank.mjs` — the question bank (data-driven; expand by adding rows).
- `.gitignore` — ignore the generated `out/` corpus.

## QA / Validation

- `node --check` passes for both scripts; the bank loads (58 questions, 7 categories). Deterministic scoring per category, incl. exhibit-type presence. Run signed-in per tenant against the deployed app. Status: **passed** (syntax + bank load) / not run (live is the operator's signed-in step).

## Rollout Plan

Merge to `main`. No runtime rollout — a QA harness run on demand. No migration, image, flag, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none (QA harness only)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no for this PR; the harness *is* a proof tool, run by an operator

## Rollback Plan

Revert the files. No runtime impact (QA harness only).

## Audit Evidence

- PR URL + `node --check` output.
- When run: the per-tenant `out/reality-crawl/<tenant>.jsonl` corpus, `summary.json`, and the pass-rate report.

## Known Gaps

The bank is 58 (v1) — expand to hundreds by adding rows (the harness/scorer are data-driven). Exhibit checks read the `AgentAnswer.tables/charts/graphs` arrays (the engine output); rendered-visual presence remains the matrix gate's `visual` column. The LLM judge is optional (off without `ANTHROPIC_API_KEY`) and currently judges only the failures, to bound cost.
