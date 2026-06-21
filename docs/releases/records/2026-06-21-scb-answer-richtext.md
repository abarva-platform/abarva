# 2026-06-21-scb-answer-richtext — Rich-text Intelligence answers (markdown + tables)

## Release ID

`2026-06-21-scb-answer-richtext`

## Status

`candidate`

## Plain-English Summary

Makes the Intelligence v2 ("Lens") answer readable and richer: it now renders the answer as Markdown via the shared `AgentMarkdown` renderer — so paragraphs have proper spacing, and bold/lists/tables render — instead of a run-together plain string. The v2 Lens opts into light formatting by passing `format=rich`, which threads a `richText` flag to the synthesizer; when set, the synthesizer's "plain text only" convention is overridden to ALLOW blank-line paragraphs, sparing bold, and a compact table for benchmark ranges. Default is OFF — every other consumer of `/api/intelligence/ask` (v3 SentinelChat, AgentDock, GlobalSearch, etc.) is byte-identical plain text, so no surface that renders plain text starts showing raw markdown.

## Layer Impact

- **global-control-lane:** `IntelligenceV2Surface.tsx` renders Markdown + requests `format=rich`; the ask route parses `format`/`richText`; `askIntelligence` + `synthesizeStream` thread an optional `richText` flag that appends a formatting addendum to the system prompt. The synthesizer behavior is unchanged unless `richText` is true.

## Client Applicability

- All clients: The render improvement (markdown, paragraph spacing) applies to every tenant on the v2 Lens. The richer model formatting (tables/bold) applies wherever `format=rich` is requested — today only the v2 Lens.
- Specific clients: None bespoke.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — opt-in by surface via the `format=rich` query param (default plain text).

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` — render answer via `AgentMarkdown`; request `&format=rich`; table/paragraph CSS.
- `src/app/api/intelligence/ask/route.ts` — parse `format=rich` / `richText` (GET + POST) into `AskPayload.richText`.
- `src/lib/intelligence/ask/index.ts` — thread `richText` through `AskOptions` to `synthesizeStream`.
- `src/lib/intelligence/ask/synthesizer.ts` — `richText` arg; rich-text addendum appended AFTER the role prompt (overrides "plain text only") when set.

## QA / Validation

Validation: Pass (static) + live re-proof to follow. `tsc --noEmit` clean (0 errors) across all four touched files + the markdown renderer. Default-off safety: `richText` is undefined for every existing caller → `richTextAddendum` is empty → the system prompt and output are byte-identical to today. `AgentMarkdown` is the shared renderer already used by Moves/Atlas/Steward (react-markdown + remark-gfm + rehype-sanitize, XSS-safe). The live visual re-proof (Apex answer renders spaced paragraphs and, where the model emits one, a benchmark table) runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Then re-run the Apex proof and confirm spaced paragraphs + (where applicable) a benchmark table render.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves updated client bundle + synthesizer after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a (per-request `format` param).
- Live signed-in proof required: Yes — re-prove on Apex after deploy (visual).

## Rollback Plan

Revert the PR — restores the plain-string render + the unconditional plain-text prompt. No data/migration.

## Known Gaps

- True SVG charts/graphs are NOT included — those need the structured `AgentAnswer`/`AnswerChart` pipeline emitted into the stream (the W4 renderer lane); this change covers prose, bold, lists, and Markdown tables only.
- Whether the model emits a table depends on the question; the addendum encourages but does not force one.
- Re-proof on Apex pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-answer-richtext` → `main`.
- CI: `npm run release:check`, `tsc` clean (0 errors).
