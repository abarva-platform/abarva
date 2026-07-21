# 2026-07-20-source-guidebook-markdown-rendering — SOURCE-GUIDEBOOK-003: real Markdown rendering for guidebook sections

## Release ID

`2026-07-20-source-guidebook-markdown-rendering`

## Status

`candidate` — code deployed and live (PR #5180, merged as
`7888cab375fde5224bb03f6b9b7100a46ef66deb`, ACA runtime invariant confirmed). Same
proof-state distinction as `SOURCE-GUIDEBOOK-001`: deployment/component/library-level
Markdown rendering are all proven; live signed-in server-to-database rendering
(`SOURCE-GUIDEBOOK-002`) is not.

## Plain-English Summary

`SOURCE-GUIDEBOOK-001` shipped the Guidebook workspace tab rendering
`SourceStageGuidebookSection.body` — typed and documented as Markdown — as plain
`white-space: pre-wrap` text. Authored content with numbered lists (the seeded
Strategy agenda) rendered with literal `1. `/`2. ` prefixes instead of a real ordered
list. This closes that gap: section bodies now render through `react-markdown` +
`remark-gfm` + `rehype-sanitize`, the same dependencies already bundled and used in
production for agent chat responses (`src/lib/agent/markdownRenderer.tsx`) — no new
dependency added. Styling uses this surface's own `ANALYTICS` tokens, not
`AgentMarkdown`'s chat-specific chart/citation overrides, which don't apply to
facilitator content.

This is `SOURCE-GUIDEBOOK-003` from the canonical Source backlog
(`docs/backlog/source-product-backlog.md`) — selected as the one safe, independent,
unblocked item across the Source and Moves canonical backlogs after reconciliation
(every other tracked Moves item is blocked on an owner decision).

## Layer Impact

- `global-control-lane`: `SourceAnalyticsCanvas.tsx`'s Guidebook workspace only. No
  other workspace, no schema, no API route touched.

## Client Applicability

- All clients: yes — no gate, no flag.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - New `GUIDEBOOK_MARKDOWN_COMPONENTS` — a small `react-markdown` component-override
    map (`p`/`ul`/`ol`/`li`/`strong`/`em`/`h1`-`h3`/`a`) styled with this file's own
    `ANALYTICS` tokens.
  - New `GuidebookSectionBody` component wrapping `ReactMarkdown` with
    `remarkGfm`/`rehypeSanitize`, replacing the previous plain
    `<p style={{whiteSpace:'pre-wrap'}}>{section.body}</p>`.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`:
  extended with an assertion that the section body renders through the
  `[data-mock="react-markdown"]` marker (this repo's global Jest mock for
  `react-markdown` is a hard passthrough with no real parsing — see QA / Validation
  for how real markup rendering was actually verified).
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean.
- `pass` — `npx eslint` on both changed files — 0 errors.
- `pass` — `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  — 2/2 passed.
- `pass` — full `src/lib/source/__tests__/source-event-shell-v2.test.ts` +
  `src/components/source/canvas/analytics/__tests__` sweep — 53/55, same 2
  pre-existing unrelated failures as the prior guidebook UI release (confirmed via the
  same clean-baseline comparison methodology) — zero regressions.
- `pass` — **real Markdown rendering verified against the real (unmocked) library and
  the real authored content**, not just the Jest mock. This repo's global Jest mock
  for `react-markdown` (`src/__tests__/__mocks__/react-markdown.tsx`) is a hard
  passthrough — a DOM test through it cannot prove list/emphasis markup renders
  correctly, only that `ReactMarkdown` is still the component in use (regression
  guard). Ran a one-off script using `react-dom/server`'s `renderToStaticMarkup` with
  the real `react-markdown`/`remark-gfm`/`rehype-sanitize` against the real seeded
  Strategy agenda text (`"1. Why now / trigger...\n2. Decision owner..."`). Result:
  real `<ol><li>...</li></ol>` output, 3 `<li>` elements, zero literal `"1. "` text
  remaining in the output. Script was temporary, not committed.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI change to one
existing, already-shipped workspace — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29793844800](https://github.com/abarva-platform/abarva/actions/runs/29793844800),
  conclusion `success`.
- Shared runtime mutators: none.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:eb5cd5a3a305f525b2e17408863c4b2119a54401770ca05d9978e574fd7e0c36`.
- ACA runtime invariant: **proven.** `az containerapp show` confirms the template
  image matches the digest above and the active revision is
  `ca-abarva-web-lab-eastus--m7888cab3` (matches merge commit
  `7888cab375fde5224bb03f6b9b7100a46ef66deb`).
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — same gap as `SOURCE-GUIDEBOOK-001`/`-002`; not
  performed for the same reason (Clerk one-time-email-code wall, no inbox access).

## Rollback Plan

Revert the merge commit. Reverting restores the prior plain-text rendering (a
regression in fidelity, not a defect — the underlying seeded content is unchanged).

## Audit Evidence

- PR: [abarva-platform/abarva#5180](https://github.com/abarva-platform/abarva/pull/5180),
  21/21 checks passed, squash-merged as `7888cab375fde5224bb03f6b9b7100a46ef66deb`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m7888cab3`, image digest
  `sha256:eb5cd5a3a305f525b2e17408863c4b2119a54401770ca05d9978e574fd7e0c36`.
- Typecheck/lint/test logs: clean (see QA / Validation).
- Real-library Markdown rendering evidence: see QA / Validation (script output
  recorded in this session's transcript, not committed as a file).

## Known Gaps

- **Live signed-in browser proof not yet performed** — same open item as
  `SOURCE-GUIDEBOOK-002`, not duplicated here.
- **No syntax highlighting or advanced Markdown features** (tables, footnotes) styled
  specifically for this surface — `remark-gfm` supports GFM tables/strikethrough if
  authored content ever uses them, but no dedicated styling was added since no
  authored content currently uses them.
