import { escapeHtml as esc } from '../board-grade/deck-shell';
import {
  buildQuarterlyBoardPack,
  type QuarterlyBoardPack,
  type QuarterlyBoardPackInput,
  type QuarterlyBoardPackSection,
} from './quarterly-board-pack-model';
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from '@/lib/ai-liability/human-decision-controls';

function renderRows(section: QuarterlyBoardPackSection): string {
  if (section.rows.length === 0) {
    return '<p class="muted">No rows are currently surfaced for this section.</p>';
  }
  return (
    '<div class="rows">' +
    section.rows
      .map(
        (row) =>
          `<article><strong>${esc(row.label)}</strong>` +
          `<span>${esc(row.value)}</span>` +
          (row.detail ? `<p>${esc(row.detail)}</p>` : '') +
          '</article>',
      )
      .join('') +
    '</div>'
  );
}

function renderSection(section: QuarterlyBoardPackSection): string {
  return (
    `<section class="section" id="${esc(section.id)}">` +
    `<header><span>${esc(section.ordinal)}</span><h2>${esc(section.title)}</h2></header>` +
    `<p class="summary">${esc(section.summary)}</p>` +
    renderRows(section) +
    '</section>'
  );
}

export function renderQuarterlyBoardPackHtml(
  input: QuarterlyBoardPackInput,
): string {
  return renderBoardPackHtml(buildQuarterlyBoardPack(input));
}

export function renderBoardPackHtml(pack: QuarterlyBoardPack): string {
  const nav = pack.sections
    .map(
      (section) =>
        `<a href="#${esc(section.id)}"><span>${esc(section.ordinal)}</span>${esc(section.title)}</a>`,
    )
    .join('');
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
    `<title>${esc(pack.title)}</title>` +
    '<style>' +
    ':root{--ink:#151515;--muted:#68635e;--line:#e3ded7;--paper:#fffdf8;--nav:#08152c;--blue:#2563eb}' +
    '*{box-sizing:border-box}body{margin:0;background:#f6f2eb;color:var(--ink);font-family:Inter,Arial,sans-serif;line-height:1.45}.shell{display:grid;grid-template-columns:292px 1fr;min-height:100vh}.rail{position:sticky;top:0;height:100vh;overflow:auto;background:var(--nav);color:white;padding:28px 22px}.rail h1{margin:0 0 10px;font-family:Georgia,serif;font-size:25px;line-height:1.05}.rail p{margin:0 0 18px;color:#cbd5e1;font-size:13px}.rail nav{display:grid;gap:7px}.rail a{color:white;text-decoration:none;border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:9px 10px;font-size:13px;display:flex;gap:8px}.rail a span{color:#93c5fd}.doc{padding:42px 54px 72px;max-width:1220px}.cover,.section{background:var(--paper);border:1px solid var(--line);border-radius:8px}.cover{padding:30px;margin-bottom:22px}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--blue);font-weight:800}.cover h1{font-family:Georgia,serif;font-size:43px;line-height:1;margin:10px 0}.meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.pill{background:white;border:1px solid var(--line);border-radius:999px;padding:8px 11px;font-size:13px}.section{padding:22px;margin:18px 0;break-inside:avoid}.section header{display:flex;gap:12px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px}.section header span{font-weight:800;color:var(--blue)}h2{margin:0;font-family:Georgia,serif;font-size:25px}.summary{color:#302b27}.rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rows article{background:white;border:1px solid var(--line);border-radius:7px;padding:12px}.rows strong{display:block;font-size:13px}.rows span{display:block;margin-top:4px;font-weight:700}.rows p{font-size:13px;color:var(--muted);margin:6px 0 0}.muted,.disclaimer{color:var(--muted);font-size:13px}@media print{.shell{display:block}.rail{display:none}.doc{padding:0}.rows{grid-template-columns:1fr}.section,.cover{page-break-inside:avoid}}' +
    '</style></head><body><div class="shell">' +
    `<aside class="rail"><h1>${esc(pack.title)}</h1><p>${esc(pack.clientLabel)}<br />${esc(pack.quarter)}</p><nav>${nav}</nav></aside>` +
    '<main class="doc"><section class="cover">' +
    '<div class="eyebrow">AbarVa - Tower - Quarterly Board Pack</div>' +
    `<h1>${esc(pack.title)}</h1>` +
    `<p>${esc(pack.sections[0]?.summary ?? 'Quarterly portfolio board pack.')}</p>` +
    '<div class="meta">' +
    `<span class="pill">Client: ${esc(pack.clientLabel)}</span>` +
    `<span class="pill">Quarter: ${esc(pack.quarter)}</span>` +
    `<span class="pill">Generated: ${esc(pack.generatedOn)}</span>` +
    `<span class="pill">Evidence gaps: ${pack.evidenceGapCount}</span>` +
    '</div></section>' +
    pack.sections.map(renderSection).join('') +
    `<p class="disclaimer">${esc(pack.disclaimer)} ${esc(AI_DECISION_SUPPORT_WATERMARK)} ${esc(HUMAN_DECISION_ATTESTATION_TEXT)}</p>` +
    '</main></div></body></html>'
  );
}
