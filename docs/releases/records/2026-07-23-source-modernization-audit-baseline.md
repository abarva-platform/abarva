# 2026-07-23-source-modernization-audit-baseline — Commit the Source-vs-Moves audit as the modernization baseline

## Release ID

`2026-07-23-source-modernization-audit-baseline`

## Status

`released` — documentation only, no runtime behavior changes.

## Plain-English Summary

A comprehensive, code-grounded audit of the Source module against the newly-hardened Moves
standard (typed artifact contracts, explicit stage boundaries, shared word/token budgets, evidence
lineage, distinct draft/review/approve/publish states) is committed as the durable baseline for
Source modernization. Per explicit decision, this PR contains **only** the audit document, a new
Architecture Decision Record recording the modernization sequencing, and an index update — no
runtime code changes, so the audit's own value as a defensible, citable record is not buried inside
a later implementation PR.

The audit's headline finding: Source's lifecycle scaffolding, stage gates, artifact registry, and
governed chat-answer layer (vendor-coverage, value-waterfall, artifact-quality) are further along
than a UI-only review would suggest. The most consequential real gap is that vendor proposal
evidence is extracted by a generic regex line-matcher with hardcoded confidence constants and no
human-review gate — meaning Source can reach a sourcing decision without a governed chain back to
actual supplier evidence. A companion section records a parallel, client-facing "Delta demo"
product vision (pricing normalization/scenario/outlier analytics, a negotiation cockpit,
provenance-labeled industry insight) explicitly sequenced *after* that evidence gap closes, not
instead of it.

## Layer Impact

- `global-control-lane`: documentation only. No schema, route, permission, or runtime behavior
  change of any kind.

## Client Applicability

- All clients: n/a — no runtime surface changes.
- Specific clients: n/a.
- Internal only: yes — this is an internal engineering/architecture artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md` — the full audit: architecture map,
  artifact inventory, before/after matrix, pipeline drift report, evidence-ingestion audit,
  recommended shared contracts, prioritized roadmap, live-proof plan, and a "Differentiated Client
  Value" section recording the Delta procurement demo vision as an explicitly-sequenced parallel
  track.
- `docs/architecture/adr/ADR-0013-source-modernization-baseline.md` — records the decision to
  commit the audit as a standalone baseline and the fixed PR sequence (integrity fixes → proposal
  ingestion foundation → stage/artifact contracts → storytelling/visuals + differentiated client
  value → a separate security-architecture workstream for the RLS finding → existing-contract
  engine consolidation).
- `docs/architecture/adr/README.md` — index entry for ADR-0013.

## QA / Validation

- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` (after adding this
  release record; the gate initially and correctly flagged the ADR/README changes as
  release-relevant with no record present).
- `not applicable` — no code changed; no test suite, typecheck, or lint surface affected.
- `not applicable` — no live signed-in proof required; nothing in the product runtime changed.

## Rollout Plan

Merge to `main` via PR. The repo-owned ACA main-deploy workflow will run (it runs on every push to
`main`) but has nothing to build or deploy differently — this PR touches no application code, no
migration, no config.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — runs, but ships no
  behavior change.
- Shared runtime mutators: none.
- Approved image digest: n/a — no image content changes from this PR.
- ACA runtime invariant: n/a.
- Worker image invariant: n/a.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the merge commit. Purely additive documentation — no data, schema, or runtime state to roll
back.

## Audit Evidence

- PR: to be recorded on open.
- This record itself, plus the committed audit and ADR, are the audit evidence for this release.

## Known Gaps

- The audit is a dated snapshot with exact code references, not a living document. As PRs 2-5 (per
  ADR-0013) land, they should close specific findings from this audit and reference it, rather than
  this document being edited in place — matching the existing multi-dated-audit convention already
  present under `docs/audits/`.
