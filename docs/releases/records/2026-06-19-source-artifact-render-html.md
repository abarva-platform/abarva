# 2026-06-19-source-artifact-render-html — Render generated HTML docs instead of their source

## Release ID

`2026-06-19-source-artifact-render-html`

## Status

`candidate`

## Plain-English Summary

Opening a generated Source deliverable in the artifact viewer showed a wall of raw
HTML source (`<!DOCTYPE html> … <style> …`) instead of the formatted document.
The drawer printed the artifact body as escaped text, but for an HTML-format
deliverable that body is a complete, self-contained HTML document. This detects a
full HTML document and renders it in a sandboxed iframe, so the user sees the
actual memo (headings, tables, the gate schedule) rather than its code. Non-HTML
bodies (markdown/plain text) still render as text, now preserving line breaks.
Found live during First Capital QA on the generated Strategy Memo.

## Layer Impact

- `global-control-lane`: one component (`SourceArtifactDrawer.tsx`). Presentation
  only — no data/API change. The HTML is rendered in a `sandbox=""` iframe (no
  scripts, opaque origin), so injected document content cannot run code or reach
  the app context.

## Client Applicability

- All clients: yes — anyone viewing an HTML-format Source artifact.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `fix/source-artifact-render-html`. `isFullHtmlDocument` + `htmlToPlainText`
  helpers; HTML bodies render via `<iframe srcDoc sandbox="">`; summary blurb shows
  a plain-text excerpt for HTML; text bodies gain `white-space: pre-wrap`.

## QA / Validation

- `eslint` on the changed file → **PASS** (exit 0).
- Typecheck — **runs in CI**.
- Post-deploy live re-verification on the First Capital artifact viewer
  (`c8cdad34…/artifacts/03eee721…`) — **pending** the deploy.

## Rollout Plan

Merge to main → ACA build/deploy → re-pin traffic. (Verified ahead of merge via a
direct image build/deploy to the lab app, per the deploy-authority churn.)

## Rollback Plan

Revert the commit. Presentation-only; nothing persistent.

## Audit Evidence

- PR: (filled on open) `fix/source-artifact-render-html`
- Before: viewer showed raw `<!DOCTYPE html>…` source text. After: formatted
  document rendered in a sandboxed iframe.

## Known Gaps

Markdown-format artifacts render as plain (pre-wrapped) text, not formatted
markdown — a possible follow-up. DOCX artifacts are download-only. The iframe uses
a fixed viewport height with internal scroll (no content-height auto-resize, which
would require a client component).
