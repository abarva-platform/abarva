// PR-OV2-3c: Archetype primer HTML renderer.
//
// Server-only module that renders an `ArchetypePrimer` (PR-OV2-3a contract,
// rendered in-app by `Phase0Primer.tsx` per OV2-3b) as a complete,
// self-contained HTML document a tenant-admin can download from
// /programs/<id> at the moment of approval and email to their team.
//
// Design source: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.6 + D.0.7 (open question 4) — the user's direction was "It
// could provide them an HTML browsing they can download with instructions".
// This module is the second consumption mode of the same primer contract:
//   1. In-app section (OV2-3b · Phase0Primer.tsx)
//   2. Downloadable HTML brief (THIS slice)
//
// Section ordering MUST mirror Phase0Primer.tsx so the in-app and
// downloadable views feel like the same document: header → P1 outcome →
// P1 steps → SMEs → templates → workshops → data assets → prep checklist
// → footer.
//
// Constraints:
//   - Self-contained: inline CSS only, no external fonts, no images, no JS.
//   - Brand-faithful: AbarVa paper background, Georgia/serif titles,
//     system-stack body. Uses `BrandColors` / `BrandTypography` values
//     copied as inline CSS literals (the primer document is rendered on
//     the server and shipped as a frozen artifact — it must not depend on
//     a runtime token loader).
//   - HTML-safe: every interpolated primer field is run through the
//     `escapeHtml` helper. The contract is open and future authors might
//     legitimately include `<` characters in prose.
//   - File size target: < 50 KB for a typical primer (CDP fixture lands
//     in the 15-25 KB range).

import 'server-only';

import { getPhasePack } from '@/lib/programs/phase-packs';
import type { PhaseStep } from '@/lib/programs/phase-packs/types';
import type {
  ArchetypePrimer,
  PrimerDataAsset,
  PrimerDataAssetFormat,
  PrimerEngagementWindow,
  PrimerPrepItem,
  PrimerSME,
  PrimerTemplate,
  PrimerTemplateKind,
  PrimerWorkshop,
} from './types';

// ── Public API ───────────────────────────────────────────────────────────────

export interface PrimerHtmlOptions {
  /** Optional brand subtitle line above the header. Defaults to 'AbarVa · Programs · Phase 0 prep'. */
  brandSubtitle?: string;
  /** Optional generated-at timestamp. Defaults to new Date(). */
  generatedAt?: Date;
}

/**
 * Render an `ArchetypePrimer` as a complete, self-contained HTML document.
 * The returned string starts with `<!DOCTYPE html>` and contains all CSS
 * inline. No external assets, no JavaScript.
 *
 * The visual design mirrors the in-app `Phase0Primer.tsx` renderer so the
 * downloadable brief and the in-app section feel like the same document.
 */
export function renderArchetypePrimerHtml(
  primer: ArchetypePrimer,
  options?: PrimerHtmlOptions,
): string {
  const brandSubtitle = options?.brandSubtitle ?? 'AbarVa · Programs · Phase 0 prep';
  const generatedAt = options?.generatedAt ?? new Date();

  // P1 step decomposition is sourced from the canonical phase pack so the
  // downloadable brief does not drift from the in-app renderer (which
  // also reads from `getPhasePack(1)`).
  const p1Pack = getPhasePack(1);
  const p1Steps: ReadonlyArray<PhaseStep> = p1Pack?.steps ?? [];

  const title = `${primer.displayName} — Phase 0 prep`;

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    renderHead(title, brandSubtitle),
    renderBody(primer, p1Steps, brandSubtitle, generatedAt),
    '</html>',
  ].join('\n');
}

// ── HTML escape helper ───────────────────────────────────────────────────────

/**
 * Escape a string for safe interpolation as HTML text content or attribute
 * value. Handles the five XML-significant characters and is sufficient for
 * the static-document use-case (no JS execution context).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Vocabulary maps (mirrors Phase0Primer.tsx) ───────────────────────────────

const ENGAGEMENT_WINDOW_LABEL: Record<PrimerEngagementWindow, string> = {
  kickoff: 'Kickoff',
  'data-discovery': 'Data discovery',
  baseline: 'Baseline',
  'synthesis-prep': 'Synthesis prep',
};

const TEMPLATE_KIND_LABEL: Record<PrimerTemplateKind, string> = {
  workshop_facilitator_guide: 'Facilitator guide',
  interview_script: 'Interview script',
  capture_template: 'Capture template',
  baseline_spreadsheet: 'Baseline spreadsheet',
  document: 'Document',
};

const DATA_FORMAT_LABEL: Record<PrimerDataAssetFormat, string> = {
  CSV: 'CSV',
  spreadsheet: 'Spreadsheet',
  PDF: 'PDF',
  'text-summary': 'Text summary',
  'structured-export': 'Structured export',
};

// ── <head> ───────────────────────────────────────────────────────────────────

function renderHead(title: string, brandSubtitle: string): string {
  // The CSS encodes the AbarVa palette + typography directly. We do NOT
  // import `BrandColors` at render time as inline CSS values because the
  // tokens module is meant for product UI; the brief is a frozen artifact
  // and the literal hex codes here are the documented brand canon.
  return [
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="generator" content="AbarVa Programs">',
    `<meta name="description" content="${escapeHtml(brandSubtitle)}">`,
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    PRIMER_CSS,
    '</style>',
    '</head>',
  ].join('\n');
}

const PRIMER_CSS = `
  :root {
    --paper: #F8F7F4;
    --ink: #000000;
    --navy: #0c1a3a;
    --slate: #5F5E5A;
    --stone: #888780;
    --signal: #0066CC;
    --card-bg: #FFFFFF;
    --card-border: rgba(12,26,58,0.12);
    --card-border-soft: rgba(12,26,58,0.08);
    --row-divider: rgba(12,26,58,0.06);
    --chip-bg: rgba(12,26,58,0.06);
    --chip-border: rgba(12,26,58,0.10);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.5;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    max-width: 880px;
    margin: 0 auto;
    padding: 48px 32px 64px;
  }
  .eyebrow {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--slate);
    font-weight: 600;
  }
  .brand-subtitle {
    margin-bottom: 20px;
  }
  header.primer-header {
    display: grid;
    gap: 8px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--card-border-soft);
  }
  header.primer-header h1 {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 400;
    font-size: 32px;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  header.primer-header .subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--slate);
    line-height: 1.55;
    max-width: 640px;
  }
  section.card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(12,26,58,0.04);
    padding: 20px 22px;
    margin-bottom: 16px;
  }
  section.card h2.section-title {
    margin: 0 0 4px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--slate);
    font-weight: 600;
  }
  section.card .section-hint {
    margin: 0 0 14px;
    font-size: 12.5px;
    color: var(--slate);
    line-height: 1.5;
  }
  .outcome-prose {
    margin: 6px 0 0;
    font-size: 15.5px;
    line-height: 1.65;
    color: var(--ink);
  }
  ol.steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0;
  }
  ol.steps li {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--row-divider);
  }
  ol.steps li:last-child { border-bottom: none; }
  ol.steps .step-num {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--slate);
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  ol.steps .step-label {
    font-size: 14px;
    color: var(--ink);
    line-height: 1.45;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--chip-bg);
    border: 1px solid var(--chip-border);
    color: var(--navy);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 600;
    white-space: nowrap;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }
  .sub-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border-soft);
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sub-card .role {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--slate);
    font-weight: 600;
  }
  .sub-card p { margin: 0; }
  .sub-card .rationale {
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--ink);
  }
  .sub-card .escalation {
    font-size: 12px;
    line-height: 1.45;
    color: var(--slate);
    font-style: italic;
  }
  .sub-card .meta-line {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--slate);
    font-weight: 600;
    margin-top: 2px;
  }
  ul.list-rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul.list-rows > li {
    padding: 12px 0;
    border-bottom: 1px solid var(--row-divider);
    display: grid;
    gap: 6px;
  }
  ul.list-rows > li:last-child { border-bottom: none; }
  .row-title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .row-title .name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  .row-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--slate);
  }
  .row-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
    align-items: center;
    margin-top: 2px;
  }
  .row-meta .label {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 9.5px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--slate);
  }
  .row-meta .id {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    color: var(--navy);
  }
  ul.prep-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0;
  }
  ul.prep-list > li {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid var(--row-divider);
  }
  ul.prep-list > li:last-child { border-bottom: none; }
  ul.prep-list .checkbox {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1.5px solid var(--stone);
    background: var(--paper);
    margin-top: 2px;
  }
  ul.prep-list .prep-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.4;
    display: block;
  }
  ul.prep-list .prep-rationale {
    font-size: 13px;
    color: var(--slate);
    line-height: 1.5;
    display: block;
    margin-top: 2px;
  }
  footer.primer-footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid var(--card-border-soft);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--slate);
    font-weight: 600;
  }
  @media print {
    body { background: #fff; }
    section.card { box-shadow: none; }
  }
`.trim();

// ── <body> ───────────────────────────────────────────────────────────────────

function renderBody(
  primer: ArchetypePrimer,
  p1Steps: ReadonlyArray<PhaseStep>,
  brandSubtitle: string,
  generatedAt: Date,
): string {
  return [
    '<body>',
    '<div class="page">',
    renderHeader(primer, brandSubtitle),
    renderOutcomeSection(primer.p1OutcomeStatement),
    renderStepsSection(p1Steps),
    renderSmesSection(primer.smes),
    renderTemplatesSection(primer.templates),
    renderWorkshopsSection(primer.workshops),
    renderDataAssetsSection(primer.dataAssets),
    renderPrepSection(primer.prepChecklist),
    renderFooter(generatedAt),
    '</div>',
    '</body>',
  ].join('\n');
}

// 1. Header
function renderHeader(primer: ArchetypePrimer, brandSubtitle: string): string {
  return [
    '<div class="eyebrow brand-subtitle">',
    escapeHtml(brandSubtitle),
    '</div>',
    '<header class="primer-header">',
    `<div class="eyebrow">PHASE 0 PREP · ${escapeHtml(primer.patternId)}</div>`,
    `<h1>Welcome to ${escapeHtml(primer.displayName)}</h1>`,
    '<p class="subtitle">Your program is approved. Here is exactly what comes next — the team you&rsquo;ll need, the templates you&rsquo;ll use, the data to gather, and the prep to do before P1 starts.</p>',
    '</header>',
  ].join('\n');
}

// 2. P1 outcome
function renderOutcomeSection(statement: string): string {
  return [
    '<section class="card" data-section="p1-outcome">',
    '<h2 class="section-title">Section 1 · Phase 1 outcome</h2>',
    `<p class="outcome-prose">${escapeHtml(statement)}</p>`,
    '</section>',
  ].join('\n');
}

// 3. P1 steps (from canonical pack)
function renderStepsSection(steps: ReadonlyArray<PhaseStep>): string {
  const stepRows = steps
    .map((step, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      return [
        `<li data-step-id="${escapeHtml(step.id)}">`,
        `<span class="step-num">${escapeHtml(num)}</span>`,
        `<span class="step-label">${escapeHtml(step.label)}</span>`,
        `<span class="chip">${escapeHtml(step.complexity)}</span>`,
        '</li>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="p1-steps">',
    `<h2 class="section-title">Section 2 · Steps you&rsquo;ll work through in P1</h2>`,
    '<p class="section-hint">From the canonical P1 Discovery pack. Complex steps require off-platform work (workshop / interview / baseline).</p>',
    steps.length > 0 ? `<ol class="steps">${stepRows}</ol>` : '<p class="section-hint">No P1 steps registered.</p>',
    '</section>',
  ].join('\n');
}

// 4. SMEs
function renderSmesSection(smes: ReadonlyArray<PrimerSME>): string {
  const cards = smes
    .map((sme) => {
      const escalation = sme.escalationHint
        ? `<p class="escalation">Escalation: ${escapeHtml(sme.escalationHint)}</p>`
        : '';
      return [
        `<div class="sub-card" data-sme-role="${escapeHtml(sme.role)}">`,
        `<div class="role">${escapeHtml(sme.role)}</div>`,
        `<p class="rationale">${escapeHtml(sme.rationale)}</p>`,
        escalation,
        `<div class="meta-line">Engaged at · ${escapeHtml(ENGAGEMENT_WINDOW_LABEL[sme.neededAt])}</div>`,
        '</div>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="smes">',
    `<h2 class="section-title">Section 3 · Team / SMEs you&rsquo;ll need</h2>`,
    `<p class="section-hint">In approximately the order they&rsquo;re engaged across P1.</p>`,
    `<div class="grid-2">${cards}</div>`,
    '</section>',
  ].join('\n');
}

// 5. Templates
function renderTemplatesSection(templates: ReadonlyArray<PrimerTemplate>): string {
  const rows = templates
    .map((tpl) => {
      const dodIds = tpl.satisfiesEvidenceItems
        .map((id) => `<span class="id">${escapeHtml(id)}</span>`)
        .join(' ');
      return [
        `<li data-template-id="${escapeHtml(tpl.id)}">`,
        '<div class="row-title">',
        `<span class="name">${escapeHtml(tpl.title)}</span>`,
        `<span class="chip">${escapeHtml(TEMPLATE_KIND_LABEL[tpl.kind])}</span>`,
        '</div>',
        `<p class="row-desc">${escapeHtml(tpl.description)}</p>`,
        '<div class="row-meta">',
        '<span class="label">Satisfies ·</span>',
        dodIds,
        '</div>',
        `<div class="row-meta"><span class="label">Template id</span> <span class="id">${escapeHtml(tpl.id)}</span></div>`,
        '</li>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="templates">',
    `<h2 class="section-title">Section 4 · Templates you&rsquo;ll use</h2>`,
    '<p class="section-hint">The agent surfaces these inline as you work through P1 steps.</p>',
    `<ul class="list-rows">${rows}</ul>`,
    '</section>',
  ].join('\n');
}

// 6. Workshops
function renderWorkshopsSection(workshops: ReadonlyArray<PrimerWorkshop>): string {
  const cards = workshops
    .map((ws) => {
      const usesIds = ws.usesTemplates
        .map((id) => `<span class="id">${escapeHtml(id)}</span>`)
        .join(' ');
      const attendees = ws.attendees.map(escapeHtml).join(' · ');
      return [
        `<div class="sub-card" data-workshop-id="${escapeHtml(ws.id)}">`,
        '<div class="row-title" style="justify-content: space-between;">',
        `<span class="role">${escapeHtml(ws.title)}</span>`,
        `<span class="chip">${escapeHtml(String(ws.durationHours))}h</span>`,
        '</div>',
        `<p class="rationale">${escapeHtml(ws.description)}</p>`,
        '<div class="meta-line">Attendees</div>',
        `<div class="rationale">${attendees}</div>`,
        '<div class="row-meta">',
        '<span class="label">Uses ·</span>',
        usesIds,
        '</div>',
        '</div>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="workshops">',
    '<h2 class="section-title">Section 5 · Workshops to schedule</h2>',
    '<p class="section-hint">Schedule these before P1 kickoff. Calendar lock is the gating step.</p>',
    `<div class="grid-2">${cards}</div>`,
    '</section>',
  ].join('\n');
}

// 7. Data assets
function renderDataAssetsSection(assets: ReadonlyArray<PrimerDataAsset>): string {
  const rows = assets
    .map((asset) => {
      return [
        `<li data-data-asset-id="${escapeHtml(asset.id)}">`,
        '<div class="row-title">',
        `<span class="name">${escapeHtml(asset.label)}</span>`,
        `<span class="chip">${escapeHtml(DATA_FORMAT_LABEL[asset.format])}</span>`,
        '</div>',
        `<p class="row-desc">${escapeHtml(asset.rationale)}</p>`,
        `<div class="row-meta"><span class="label">Needed at · ${escapeHtml(ENGAGEMENT_WINDOW_LABEL[asset.neededAt])}</span></div>`,
        '</li>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="data-assets">',
    '<h2 class="section-title">Section 6 · Data to gather before kicking off</h2>',
    '<p class="section-hint">Extracts have lead time. Request these at P1 kickoff, not Day 1.</p>',
    `<ul class="list-rows">${rows}</ul>`,
    '</section>',
  ].join('\n');
}

// 8. Prep checklist
function renderPrepSection(items: ReadonlyArray<PrimerPrepItem>): string {
  const lis = items
    .map((item) => {
      return [
        `<li data-prep-id="${escapeHtml(item.id)}">`,
        '<span class="checkbox" aria-hidden="true"></span>',
        '<div>',
        `<span class="prep-label">${escapeHtml(item.label)}</span>`,
        `<span class="prep-rationale">${escapeHtml(item.rationale)}</span>`,
        '</div>',
        '</li>',
      ].join('');
    })
    .join('\n');

  return [
    '<section class="card" data-section="prep-checklist">',
    '<h2 class="section-title">Section 7 · Prep checklist</h2>',
    '<p class="section-hint">Concrete actions to take BEFORE Phase 1 starts. This document is a read-only brief — checkboxes are visual only.</p>',
    `<ul class="prep-list">${lis}</ul>`,
    '</section>',
  ].join('\n');
}

// 9. Footer
function renderFooter(generatedAt: Date): string {
  // Stable ISO timestamp avoids locale-dependent strings in the artifact.
  const stamp = generatedAt.toISOString();
  return [
    '<footer class="primer-footer">',
    `Generated by AbarVa · ${escapeHtml(stamp)} · brought to you by Phase 0 prep`,
    '</footer>',
  ].join('\n');
}
