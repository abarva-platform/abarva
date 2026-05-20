// Source · Deal Pack · self-contained CSS.
//
// Every byte of styling lives here. NO external fetch — no Google Fonts
// @import, no CDN, no remote stylesheet. System font stack only so the
// Deal Pack opens offline in any browser.
//
// Pure module — exports a single CSS string consumed by the aggregator.

export const DEAL_PACK_STYLES = `
:root {
  --bg: #F8F7F4;
  --paper: #FFFFFF;
  --fg: #0C1A3A;
  --ink: #0C1A3A;
  --ink-soft: #2A3754;
  --muted: #706D66;
  --rule: #D8D5CC;
  --rule-soft: #E8E5DC;
  --accent: #1F7A6F;
  --accent-soft: #E6F3F1;
  --warning: #B57A00;
  --warning-soft: #FBF1D8;
  --critical: #9C2E2E;
  --critical-soft: #F7E4E0;
  --soft: #F4F2EC;
  --serif: Georgia, 'Times New Roman', 'Iowan Old Style', serif;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
    Arial, sans-serif;
  --mono: 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); }
body {
  font-family: var(--sans);
  font-size: 14.5px;
  line-height: 1.55;
}
a { color: #1B5BB8; text-decoration: none; }
a:hover { text-decoration: underline; }

/* Outer shell */
.dp-shell {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  min-height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
  background: var(--bg);
}
.dp-shell__topbar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: var(--ink);
  color: #F4F2EC;
  position: sticky;
  top: 0;
  z-index: 10;
}
.dp-topbar__brand {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 17px;
  letter-spacing: -0.01em;
}
.dp-topbar__crumbs {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(244, 242, 236, 0.72);
}
.dp-topbar__crumbs strong { color: #F4F2EC; font-weight: 600; }

/* Left rail TOC */
.dp-toc {
  position: sticky;
  top: 49px;
  align-self: start;
  max-height: calc(100vh - 49px);
  overflow-y: auto;
  border-right: 1px solid var(--rule);
  background: var(--bg);
  padding: 20px 16px 32px;
  font-size: 13px;
}
.dp-toc__label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 18px 0 8px;
}
.dp-toc__label:first-child { margin-top: 0; }
.dp-toc__list { list-style: none; padding: 0; margin: 0; }
.dp-toc__list li { margin: 0; }
.dp-toc__list a {
  display: block;
  padding: 6px 8px;
  color: var(--ink-soft);
  border-radius: 4px;
  border-left: 2px solid transparent;
  transition: background 0.12s ease, color 0.12s ease;
}
.dp-toc__list a:hover {
  background: var(--soft);
  text-decoration: none;
}
.dp-toc__list a.is-active {
  background: var(--accent-soft);
  border-left-color: var(--accent);
  color: var(--ink);
  font-weight: 600;
}
.dp-toc__sub {
  padding-left: 16px;
  font-size: 12.5px;
  color: var(--muted);
}
details.dp-toc__details { margin: 4px 0; }
details.dp-toc__details > summary {
  cursor: pointer;
  padding: 6px 8px;
  color: var(--muted);
  font-weight: 500;
  list-style: none;
}
details.dp-toc__details > summary::-webkit-details-marker { display: none; }
details.dp-toc__details > summary::before { content: '\\25B8 \\00A0'; font-size: 9px; color: var(--muted); }
details.dp-toc__details[open] > summary::before { content: '\\25BE \\00A0'; }

/* Main column */
.dp-main {
  padding: 28px 36px 64px;
  background: var(--bg);
  min-width: 0;
}

/* Headline strip */
.dp-headline {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 24px 28px;
  margin-bottom: 28px;
  box-shadow: 0 1px 0 rgba(12, 26, 58, 0.04);
}
.dp-headline__eyebrow {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}
.dp-headline__title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: 26px;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 4px;
  line-height: 1.15;
}
.dp-headline__subtitle {
  color: var(--ink-soft);
  font-size: 15px;
  margin: 0 0 18px;
}
.dp-headline__rows {
  display: grid;
  grid-template-columns: 160px 1fr;
  row-gap: 8px;
  column-gap: 16px;
  font-size: 14px;
  margin-top: 6px;
}
.dp-headline__rows dt {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  align-self: center;
}
.dp-headline__rows dd {
  margin: 0;
  color: var(--ink);
}
.dp-headline__pending {
  background: var(--warning-soft);
  border: 1px solid rgba(181, 122, 0, 0.4);
  color: #5B3F00;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13.5px;
  margin: 12px 0 0;
}
/* Kernel-hold headline: the Source expert-judgment kernel holds the
   award. The pack must read unmistakably as a hold, not a go. */
.dp-headline--hold {
  border-left: 4px solid #B5450C;
}
.dp-headline__blockers {
  margin-top: 16px;
  border-top: 1px solid var(--rule);
  padding-top: 12px;
}
.dp-headline__blockers ul {
  margin: 4px 0 12px;
  padding-left: 18px;
  font-size: 13px;
}
.dp-headline__blockers li {
  margin-bottom: 5px;
}

/* Stage section */
.dp-stage {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 24px 28px;
  margin-bottom: 22px;
  box-shadow: 0 1px 0 rgba(12, 26, 58, 0.04);
}
.dp-stage__heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--rule-soft);
}
.dp-stage__number {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
}
.dp-stage__title {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 20px;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.01em;
}
.dp-stage__intent {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}
.dp-stage__empty {
  background: var(--warning-soft);
  border: 1px dashed rgba(181, 122, 0, 0.5);
  color: #5B3F00;
  padding: 14px 18px;
  border-radius: 6px;
  font-size: 13.5px;
}
.dp-stage__empty strong { color: #5B3F00; }

/* Artifact subsection */
.dp-artifact {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--rule-soft);
}
.dp-artifact:first-of-type { margin-top: 8px; padding-top: 0; border-top: 0; }
.dp-artifact__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.dp-artifact__code {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--soft);
  padding: 2px 7px;
  border-radius: 3px;
}
.dp-artifact__title {
  font-family: var(--sans);
  font-size: 15.5px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}
.dp-artifact__status {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--muted);
  margin-left: auto;
}
.dp-artifact__status.is-authored { color: var(--accent); }
.dp-artifact__status.is-scaffold { color: var(--warning); }

/* Markdown body inside artifact */
.dp-body { color: var(--ink); font-size: 14px; }
.dp-body h1 { font-size: 17px; margin: 18px 0 8px; font-weight: 600; }
.dp-body h2 { font-size: 15.5px; margin: 16px 0 6px; font-weight: 600; color: var(--ink); }
.dp-body h3 { font-size: 14px; margin: 14px 0 6px; font-weight: 600; color: var(--ink-soft); }
.dp-body h4, .dp-body h5, .dp-body h6 { font-size: 13.5px; margin: 12px 0 4px; font-weight: 600; color: var(--ink-soft); }
.dp-body p { margin: 8px 0; }
.dp-body ul, .dp-body ol { padding-left: 22px; margin: 8px 0; }
.dp-body li { margin: 3px 0; }
.dp-body blockquote {
  margin: 12px 0; padding: 6px 14px; border-left: 3px solid var(--accent);
  color: var(--ink-soft); background: var(--soft); font-style: italic;
}
.dp-body code {
  background: var(--soft); border-radius: 3px; padding: 1px 5px;
  font-family: var(--mono); font-size: 12.5px;
}
.dp-body pre {
  background: var(--soft); padding: 10px 14px; border-radius: 5px;
  border-left: 3px solid var(--rule); overflow-x: auto; font-size: 12.5px;
}
.dp-body pre code { background: none; padding: 0; }
.dp-body table {
  border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px;
}
.dp-body th, .dp-body td {
  padding: 6px 10px; border: 1px solid var(--rule); text-align: left;
  vertical-align: top;
}
.dp-body th { background: var(--soft); font-weight: 600; }
.dp-body hr { border: 0; border-top: 1px solid var(--rule); margin: 18px 0; }

/* Structured tables emitted by inline renderers */
.dp-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0 14px; }
.dp-table th, .dp-table td {
  padding: 7px 10px; border: 1px solid var(--rule);
  text-align: left; vertical-align: top;
}
.dp-table th {
  background: var(--ink); color: #F4F2EC; font-weight: 600;
  font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase;
}
.dp-table tr.is-locked td { background: var(--soft); color: var(--ink-soft); }
.dp-table tr.is-warning td { background: var(--warning-soft); }
.dp-table tr.is-critical td { background: var(--critical-soft); }
.dp-table td.is-num { text-align: right; font-variant-numeric: tabular-nums; }
.dp-table caption {
  text-align: left; padding: 0 0 4px; font-size: 12.5px;
  color: var(--muted); font-weight: 600;
}
.dp-pill {
  display: inline-block; padding: 1px 7px; border-radius: 10px;
  font-family: var(--mono); font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.dp-pill--p0 { background: var(--critical-soft); color: var(--critical); }
.dp-pill--p1 { background: var(--warning-soft); color: var(--warning); }
.dp-pill--p2 { background: var(--soft); color: var(--ink-soft); }
.dp-pill--present { background: var(--accent-soft); color: var(--accent); }
.dp-pill--missing { background: var(--critical-soft); color: var(--critical); }
.dp-pill--partial { background: var(--warning-soft); color: var(--warning); }
.dp-pill--na { background: var(--soft); color: var(--muted); }

/* Evidence + Decision ledgers */
.dp-ledger {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 24px 28px;
  margin-bottom: 22px;
}
.dp-ledger__title {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 18px;
  margin: 0 0 14px;
}
.dp-ledger__empty {
  font-size: 13px; color: var(--muted); font-style: italic;
}

/* Glossary */
.dp-glossary dt {
  font-weight: 600; color: var(--ink);
  font-family: var(--mono); font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-top: 8px;
}
.dp-glossary dd { margin: 2px 0 0 0; font-size: 13.5px; color: var(--ink-soft); }

.dp-footer {
  margin-top: 32px;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
  color: var(--muted);
  font-size: 12px;
  font-style: italic;
}

/* Smooth-scroll for anchor links */
html { scroll-behavior: smooth; }

@media (max-width: 900px) {
  .dp-shell { grid-template-columns: 1fr; }
  .dp-toc { position: static; max-height: none; border-right: 0; border-bottom: 1px solid var(--rule); }
  .dp-main { padding: 24px 18px 48px; }
}

@media print {
  body { background: white; }
  .dp-shell { display: block; max-width: none; }
  .dp-shell__topbar { position: static; }
  .dp-toc { display: none; }
  .dp-main { padding: 0 16px; }
  .dp-stage, .dp-headline, .dp-ledger { box-shadow: none; page-break-inside: avoid; }
  .dp-stage { border: 1px solid var(--rule); }
}
`.trim();
