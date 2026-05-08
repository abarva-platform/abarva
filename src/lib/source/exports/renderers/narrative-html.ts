// Source · narrative html renderer
//
// HTML companion to narrative-docx.ts. Same per-artifact configs (the
// docx configs are reused by reference) — eyebrow / header label /
// confidentiality note — wrapped around a cover block and the
// markdown→HTML walker.
//
// The output is a single self-contained HTML document with inlined
// AbarVa typography styles. No external assets, no fetch, no scripts —
// safe to email or post-mortem print to PDF.
//
// Pure: payload + config → HTML string.

import 'server-only';

import { markdownToHtml } from './markdown-to-html';
import {
  DECISION_BRIEF_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from './narrative-docx';

/** Re-export the docx configs as the html configs — shape is identical. */
export type NarrativeHtmlConfig = NarrativeDocxConfig;
export type NarrativeHtmlPayload = NarrativeDocxPayload;

export {
  DECISION_BRIEF_DOCX_CONFIG as DECISION_BRIEF_HTML_CONFIG,
  RFP_PACK_DOCX_CONFIG as RFP_PACK_HTML_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG as SCOPE_MEMO_HTML_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG as SELECTION_MEMO_HTML_CONFIG,
};

/** AbarVa typography styles inlined into every HTML export. */
const STYLE_BLOCK = `
  :root {
    --bg: #F8F7F4;
    --fg: #0C1A3A;
    --muted: #706D66;
    --rule: #D8D5CC;
    --accent: #2DD4C8;
    --warning: #F4B400;
    --soft: #F4F2EC;
  }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
  body {
    font-family: 'DM Sans', -apple-system, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.55;
    padding: 48px 32px;
  }
  .source-doc { max-width: 760px; margin: 0 auto; }
  .source-doc__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .source-doc__title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 32px;
    line-height: 1.15;
    font-weight: 400;
    color: var(--fg);
    margin: 0 0 16px;
  }
  .source-doc__meta {
    color: var(--muted);
    font-size: 13px;
    margin: 4px 0;
  }
  .source-doc__scaffold-warning {
    margin: 24px 0;
    padding: 12px 16px;
    background: rgba(244, 180, 0, 0.12);
    border: 1px solid rgba(244, 180, 0, 0.4);
    border-radius: 6px;
    font-size: 13px;
    color: #5B3F00;
  }
  .source-doc__scaffold-warning strong { color: #5B3F00; }
  .source-doc__divider {
    border: 0;
    border-top: 1px solid var(--rule);
    margin: 32px 0;
  }
  .source-doc__body h1 { font-size: 24px; margin-top: 32px; }
  .source-doc__body h2 { font-size: 20px; margin-top: 28px; }
  .source-doc__body h3 { font-size: 17px; margin-top: 24px; }
  .source-doc__body h1, .source-doc__body h2, .source-doc__body h3,
  .source-doc__body h4, .source-doc__body h5, .source-doc__body h6 {
    color: var(--fg); font-weight: 600; line-height: 1.3;
  }
  .source-doc__body p { margin: 12px 0; }
  .source-doc__body blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 3px solid var(--accent);
    color: var(--muted);
    font-style: italic;
    background: var(--soft);
  }
  .source-doc__body ul, .source-doc__body ol { padding-left: 24px; margin: 12px 0; }
  .source-doc__body li { margin: 4px 0; }
  .source-doc__body code {
    background: var(--soft); border-radius: 3px; padding: 1px 5px;
    font-size: 13px; font-family: 'Menlo', 'Consolas', monospace;
  }
  .source-doc__body pre {
    background: var(--soft); padding: 12px 16px; border-radius: 6px;
    border-left: 3px solid var(--rule);
    overflow-x: auto;
  }
  .source-doc__body pre code { background: none; padding: 0; font-size: 12px; }
  .source-doc__body table {
    border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px;
  }
  .source-doc__body th, .source-doc__body td {
    padding: 8px 12px; border: 1px solid var(--rule); text-align: left;
  }
  .source-doc__body th { background: var(--fg); color: #FAF7F1; font-weight: 600; }
  .source-doc__body a {
    color: #1B5BB8; text-decoration: underline;
  }
  .source-doc__body hr {
    border: 0; border-top: 1px solid var(--rule); margin: 24px 0;
  }
  .source-doc__footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
  }
  @media print {
    body { background: white; padding: 24px 0; }
    .source-doc { max-width: none; }
    .source-doc__scaffold-warning { background: white; border: 1px solid var(--warning); }
    .source-doc__body table { page-break-inside: avoid; }
    .source-doc__body pre { page-break-inside: avoid; }
  }
`.replace(/\s{2,}/g, ' ');

/** Build the full HTML document. Pure: payload+config → string. */
export function buildNarrativeHtml(
  payload: NarrativeHtmlPayload,
  config: NarrativeHtmlConfig,
): string {
  const eyebrow = escapeHtml(config.eyebrowFor(payload.tenantName));
  const title = escapeHtml(payload.eventName);
  const eventCode = escapeHtml(payload.eventCode);
  const issuedBy = payload.issuedBy ? escapeHtml(payload.issuedBy) : null;
  const generatedAt = escapeHtml(payload.generatedAt);
  const body = markdownToHtml(payload.body || '');
  const headerLabel = escapeHtml(config.headerLabel);
  const confidential = escapeHtml(config.confidentialityNote);
  const docTitle = escapeHtml(`${config.documentTitle} · ${payload.eventCode}`);

  const scaffoldWarning = payload.bodyIsAuthored
    ? ''
    : `<div class="source-doc__scaffold-warning"><strong>Template scaffold</strong> — body has not been authored yet. The content below is the canonical ${headerLabel} scaffold; replace with the actual authored content before circulating.</div>`;

  const issuedByLine = issuedBy
    ? `<p class="source-doc__meta">Issued by: ${issuedBy}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle}</title>
  <meta name="generator" content="AbarVa · Sentinel" />
  <meta name="x-source-artifact-code" content="${escapeHtml(config.artifactCode)}" />
  <style>${STYLE_BLOCK}</style>
</head>
<body>
  <article class="source-doc">
    <header class="source-doc__header">
      <div class="source-doc__eyebrow">${eyebrow}</div>
      <h1 class="source-doc__title">${title}</h1>
      <p class="source-doc__meta">Tenant: ${escapeHtml(payload.tenantName)}</p>
      <p class="source-doc__meta">Event code: ${eventCode}</p>
      ${issuedByLine}
      <p class="source-doc__meta">Generated: ${generatedAt}</p>
      ${scaffoldWarning}
    </header>
    <hr class="source-doc__divider" />
    <main class="source-doc__body">
      ${body}
    </main>
    <footer class="source-doc__footer">
      ${confidential} · Source canvas · ${eventCode} · scaffolded by AbarVa Sentinel · generated ${generatedAt}
    </footer>
  </article>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** HTML MIME. */
export const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';
