# 2026-06-06 — Context/Corpus → Agent Visibility Audit prompt

## Release ID

`2026-06-06-context-corpus-audit-prompt`

## Status

`candidate`

## Plain-English Summary

Adds the Cursor audit/fix prompt for proving client-context → agent visibility: per-client × per-store ingestion completeness, the two-store (Supabase vs Azure) read-path reality, retrieval-scope checks (named rows vs overview counts), recall@k golden-question QA, the Anthropic-not-OpenAI provider gate, and a per-client × per-dimension depth/answerability assessment benchmarked to the function/pattern packs. Encodes the operator's hard rules: no shortcut fixes, and any new/missing data loaded only through the governed bulk/zip loader (blob → parse → commit → index → retrieval-proof). Documentation only.

## Layer Impact

- `global-control-lane`: documentation (an audit prompt). No runtime change.

## Client Applicability

- All clients: it audits every tenant with corpus/context rows. Internal only: Yes (operator tooling). Public/demo only: No. Feature flag: N/A.

## Changes Included

- `docs/build/codex-prompts/CONTEXT_CORPUS_AGENT_VISIBILITY_AUDIT_PROMPT.md`
- `docs/releases/records/2026-06-06-context-corpus-audit-prompt.md`

## QA / Validation

**Status: PASS** — documentation-only; prompt reviewed, grounded in verified 2026-06-06 read-only findings.

## Rollout Plan

Merge to main so the prompt is shareable with Cursor / the audit thread. No deploy.

## Rollback Plan

Revert the PR. No code, schema, or runtime state.

## Audit Evidence

- Prompt: `docs/build/codex-prompts/CONTEXT_CORPUS_AGENT_VISIBILITY_AUDIT_PROMPT.md`
- Grounded in read-only store inventory (Supabase) + Vercel/Azure env + network posture checks, 2026-06-06.

## Known Gaps

- Optional follow-ups noted in handoff: a worked example matrix row and exact SQL/CLI per matrix cell (incl. the operator-job pattern for the private Azure store).
