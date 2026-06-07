# 2026-06-07-context-architecture-report — Context layer / corpus / RAG architecture report (HTML)

## Release ID

`2026-06-07-context-architecture-report`

## Status

`released`

## Plain-English Summary

Adds a single self-contained HTML report explaining, for a layman, what data lives in the context
layer (by dimension) and in the corpus/patterns, how documents are parsed into chunks/registry/DB/
graph/vector/index, how Sentinel and Nexus become context-aware in real time (the Context Broker +
config), what happens with no context (the Claude-only fallback), the role of the reasoning layer,
and how to improve the agents over time. Includes four data-flow diagrams and live counts. Docs only.

## Layer Impact

- **global-control lane (docs only):** an explanatory HTML artifact under `docs/build/`. No app,
  runtime, schema, or data changes.

## Client Applicability

- All clients: No
- Internal only: Yes (internal engineering/product reference; Lakeshore used only as a synthetic example)
- Feature flag: None

## Changes Included

- `docs/build/context-architecture/AbarVa_Context_Architecture_Report.html` (new) — self-contained
  HTML (inline CSS + 4 inline SVG data-flow diagrams).

## QA / Validation

- Status: **passed**. HTML structure + all 4 inline SVGs validated as well-formed (tag balance checked,
  SVG XML parses); the binding diagram was rendered to PNG and visually reviewed. No code paths touched.

## Rollout Plan

Docs only. No runtime rollout.

## Rollback Plan

Revert the commit. Nothing to unwind.

## Audit Evidence

- File: `docs/build/context-architecture/AbarVa_Context_Architecture_Report.html`.
- Counts sourced from the read-only verification runbook `docs/runbooks/azure-corpus-db-verification-2026-06-07.md`.

## Known Gaps

- Counts reflect the lab data plane on 2026-06-07; they will drift as more tenants/corpus load.
