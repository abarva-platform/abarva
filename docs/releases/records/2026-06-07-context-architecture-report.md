# 2026-06-07-context-architecture-report — Context/Corpus/Reasoning HTML report

## Release ID
`2026-06-07-context-architecture-report`

## Status
`released` (documentation/evidence; no runtime change)

## Plain-English Summary
A self-contained HTML report explaining what data the system holds (context + corpus),
how documents become chunks/records/facts/vectors/graph, how Sentinel/Nexus are made
aware of tenant context at request time, how the no-context fallback + Claude reasoning
layer work, and how to improve answers (data + retrieval + prompt). Two altitudes
(executive + engineer), with data-flow diagrams and live counts.

## Layer Impact
- `global-control-lane`: documentation only (no code/data/schema change). Describes the
  shared reasoning/retrieval architecture and the current `enterprise_context_*` gap.

## Client Applicability
- All clients (architecture-wide explainer; live counts platform-level).

## Changes Included
- `docs/build/context-architecture-report/index.html`, `README.md`.

## QA / Validation
- **PASS** — HTML opens; 5 Mermaid diagrams + 9 sections present.
- **PASS** — live counts read-only from `abarva_control` via operator job (no secrets).
- `git diff --check`, `release:check`: see PR CI.

## Rollout Plan
No runtime rollout (docs). Merge to main.

## Rollback Plan
Not applicable — documentation only; revert the PR if needed.

## Audit Evidence
`docs/build/context-architecture-report/*`; live inventory via `job-abarva-private-operator-eus`.

## Known Gaps
- Per-tenant fact-layer counts are not enumerated (the `enterprise_context_*` layer is
  absent in the Azure runtime); shown as NOT_LOADED. Update once that layer is migrated.
