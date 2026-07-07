# 2026-06-01 — Pilot Readiness Plan + Codex Autonomous Execution Docs

## Release ID

`2026-06-01-plan-codex-execution-docs`

## Status

`candidate`

## Plain-English Summary

Adds two planning artifacts under `docs/planning/`:

1. `ABARVA_PILOT_READINESS_PLAN.xlsx` — master pilot-readiness tracker (~330 tasks across 14 categories: Business Setup, Contract & Legal, Architecture, AI Liability Defense, Engineering Governance, Internal Rehearsal, Pressure Test, Adversarial Test, Operational Readiness, Sales, Commercial, IP & Trademark, Startup Credits, Employer Conflict). Each task tagged with Priority (P0-P3), Ease bucket, Phase (Pre-Resign / Post-Resign / Anytime), Cost estimate, How-To, and dependencies. Workbook also includes Pricing Model, Cost Model, per-prospect Business Cases (PHS, Surekha, Delta), Security Pack, Redline Brief, Risk register, Governance Framework, Codex Queue.

2. `CODEX_AUTONOMOUS_EXECUTION.md` — multi-agent execution plan for autonomous Codex worker agents. Covers Authority Grant, Parallelism Map, Coordination Protocol, and detailed prompts for Waves 1-6 (31 individual tasks) plus a wave-summary PR template. Each task prompt is self-contained: branch convention, files touched, files-not-to-touch, parallel group, read-first list, acceptance criteria, release record lane, merge authority.

Neither file is loaded by application runtime — these are planning artifacts only.

## Layer Impact

- **`internal-admin`** only.
- No application code, no schema, no infrastructure, no client-facing routes touched.
- No runtime behavior changes.

## Client Applicability

- All clients: not applicable (planning-only docs)
- Specific clients: none
- Internal only: ✅ AbarVa engineering + ops + sales
- Public/demo only: none
- Feature flag: not required

## Changes Included

- Added: `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx`
- Added: `docs/planning/CODEX_AUTONOMOUS_EXECUTION.md`
- Added: this release record

No code, no schema, no migrations, no infra.

## QA / Validation

- `xlsx` opens cleanly in Numbers / Excel; sheets navigate; formulas calculate; conditional formatting renders
- `md` renders correctly in GitHub web view; internal links resolve; code blocks formatted
- No CI gates required (docs-only)

## Rollout Plan

- Merge to `main` — files immediately accessible to anyone with repo read access (including Codex worker agents)
- No deploy, no migration, no runtime activation
- Codex agents starting Wave 1 can read `docs/planning/CODEX_AUTONOMOUS_EXECUTION.md` directly from main

## Rollback Plan

- `git revert` of the merge commit removes both files cleanly
- No data, no schema, no infra to roll back

## Audit Evidence

- PR URL: (set when opened)
- Diff: 2 new files under `docs/planning/`, 1 release record
- No tests required

## Known Gaps

- Waves 7-9 in the execution doc are sketched at category level but not yet expanded to per-task prompts. Will expand when Wave 6 is in flight.
- The xlsx is a binary artifact and diffs poorly in PR review; readers should download to inspect. Future plan tracking should consider migrating the in-repo source-of-truth to a markdown/JSON format and treating the xlsx as a generated artifact.

## Notes

- These files were authored during a planning conversation; no employer-confidential information, methodologies, or client data is referenced
- Files were produced on personal time + personal MacBook (Phase = `Anytime` per the plan's own taxonomy)
