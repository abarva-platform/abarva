# 2026-06-22-brain-proof-kit — Progress tracker + HTML report generator + Codex runbook

## Release ID

`2026-06-22-brain-proof-kit`

## Status

`candidate`

## Plain-English Summary

Makes the Brain Contract executable by Codex with proof. Adds: (1) a **progress tracker** (`docs/build/BRAIN_CONTRACT_PROGRESS.md`) — the conformance matrix (invariant × tenant) Codex keeps live in every PR, so progress has a single source of truth; (2) an **HTML report generator** (`scripts/qa/reality-crawl-report.mjs`) — turns the captured reality-crawl corpus + screenshots into one self-contained auditable page (pass-rate matrix, every question→answer expandable with failures highlighted, the typed exhibits each answer returned, judge notes, and embedded signed-in screenshots); (3) the **Codex runbook** (`docs/build/BRAIN_CONTRACT_CODEX_RUNBOOK.md`) — pre-flight (fetch `origin/main` first + the exact file list), the steps, mandatory progress tracking, and the required HTML proof report with screenshots and proof of results/failures/fixes. Docs + QA tooling only.

## Layer Impact

`internal-admin` lane — operator/agent QA tooling + governance docs. No product surface, client-data-lane, schema, flag, or runtime behavior change.

## Client Applicability

Not applicable — internal tooling and documentation. No client receives anything.

- All clients: no
- Specific clients: no
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/qa/reality-crawl-report.mjs` — corpus + screenshots → self-contained HTML proof report.
- `docs/build/BRAIN_CONTRACT_PROGRESS.md` — the live conformance-progress tracker.
- `docs/build/BRAIN_CONTRACT_CODEX_RUNBOOK.md` — the executable Codex runbook.

## QA / Validation

- `node --check scripts/qa/reality-crawl-report.mjs` passes. Docs reviewed for accuracy against the live gate/harness columns and file paths. Status: **passed** (syntax + review).

## Rollout Plan

Merge to `main`. No runtime rollout — tooling + docs. No migration, image, flag, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none (tooling/docs)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no for this PR; the runbook *requires* it for the work it governs

## Rollback Plan

Revert the files. No runtime impact (tooling/docs only).

## Audit Evidence

- PR URL + `node --check` output.
- When run: the generated `out/reality-crawl/report.html` (pass-rate matrix + answers + screenshots).

## Known Gaps

Screenshots are produced by Codex's Playwright pass (to `out/reality-crawl/shots/<tenant>/<id>.png`); the report embeds whatever is present. The report generator reads the corpus produced by `reality-crawl.mjs`. The progress tracker's seed cells are expected-starting-state and must be replaced by the first real gate run.
