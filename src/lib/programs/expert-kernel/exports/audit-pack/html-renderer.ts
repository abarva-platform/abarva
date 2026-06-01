import type { MoveBusinessCaseInput } from '../../../move-business-case';
import { escapeHtml as esc } from '../board-grade/deck-shell';
import {
  buildMoveAuditPack,
  type AuditPackSection,
  type MoveAuditPackResult,
} from './audit-pack-model';

function statusLabel(status: AuditPackSection['status']): string {
  const labels: Record<AuditPackSection['status'], string> = {
    supported: 'Supported',
    gap: 'Gap',
    blocked: 'Blocked',
  };
  return labels[status];
}

function renderItems(section: AuditPackSection): string {
  if (section.items.length === 0) {
    return '<p class="muted">No line items are bound for this section yet.</p>';
  }
  return (
    '<dl class="items">' +
    section.items
      .map(
        (item) =>
          `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`,
      )
      .join('') +
    '</dl>'
  );
}

function renderEvidence(section: AuditPackSection): string {
  return (
    '<ul class="evidence">' +
    section.evidence
      .map(
        (e) =>
          `<li><strong>${esc(e.source)}</strong><span>${esc(e.detail)}</span>` +
          `<small>${esc(e.asOf)}</small></li>`,
      )
      .join('') +
    '</ul>'
  );
}

function renderGaps(section: AuditPackSection): string {
  if (section.gaps.length === 0) {
    return '<p class="ok">No explicit audit gap in this section.</p>';
  }
  return (
    '<ul class="gaps">' +
    section.gaps.map((gap) => `<li>${esc(gap)}</li>`).join('') +
    '</ul>'
  );
}

function renderSection(section: AuditPackSection): string {
  return (
    `<section class="section ${section.status}">` +
    `<header><span class="ordinal">${esc(section.ordinal)}</span>` +
    `<h2>${esc(section.title)}</h2>` +
    `<span class="status">${statusLabel(section.status)}</span></header>` +
    `<p class="summary">${esc(section.summary)}</p>` +
    `<div class="grid"><div><h3>Recorded facts</h3>${renderItems(section)}</div>` +
    `<div><h3>Evidence</h3>${renderEvidence(section)}</div>` +
    `<div><h3>Gaps to close</h3>${renderGaps(section)}</div></div>` +
    '</section>'
  );
}

export function renderMoveAuditPackHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  return renderAuditPackHtml(buildMoveAuditPack(move, generatedOn));
}

export function renderAuditPackHtml(pack: MoveAuditPackResult): string {
  const verdict = pack.bound ? pack.verdict.toUpperCase() : 'NOT RUN';
  const sectionNav = pack.sections
    .map(
      (section) =>
        `<a href="#${esc(section.id)}"><span>${esc(section.ordinal)}</span>` +
        `${esc(section.title)}</a>`,
    )
    .join('');

  return (
    '<!doctype html>' +
    '<html lang="en"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
    `<title>${esc(pack.moveLabel)} - Per-Move Audit Pack</title>` +
    '<style>' +
    ':root{--ink:#171717;--muted:#6b645f;--line:#e2ded8;--paper:#fffdf8;--nav:#0d1b36;--blue:#2563eb;--amber:#b7791f;--red:#a43a2f;--green:#2f7d57}' +
    '*{box-sizing:border-box}body{margin:0;background:#f6f2eb;color:var(--ink);font-family:Inter,Arial,sans-serif;line-height:1.45}' +
    '.shell{display:grid;grid-template-columns:280px 1fr;min-height:100vh}.rail{background:var(--nav);color:white;padding:28px 22px;position:sticky;top:0;height:100vh;overflow:auto}' +
    '.rail h1{font-size:22px;line-height:1.1;margin:0 0 12px}.rail p{color:#cbd5e1;font-size:13px;margin:0 0 18px}.rail nav{display:grid;gap:7px}.rail a{color:white;text-decoration:none;font-size:13px;padding:9px 10px;border:1px solid rgba(255,255,255,.16);border-radius:7px;display:flex;gap:8px}.rail a span{color:#93c5fd}' +
    '.doc{padding:42px 54px 72px;max-width:1280px}.cover{background:var(--paper);border:1px solid var(--line);padding:30px;border-radius:8px;margin-bottom:24px}.eyebrow{color:var(--blue);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.cover h1{font-family:Georgia,serif;font-size:42px;line-height:1;margin:10px 0}.meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.pill{border:1px solid var(--line);border-radius:999px;padding:8px 11px;background:white;font-size:13px}.section{background:var(--paper);border:1px solid var(--line);border-radius:8px;margin:18px 0;padding:22px;break-inside:avoid}.section header{display:flex;gap:12px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px}.ordinal{font-weight:800;color:var(--blue)}h2{font-family:Georgia,serif;font-size:25px;margin:0;flex:1}h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.status{font-size:12px;font-weight:800;border-radius:999px;padding:5px 9px;background:#eef2ff}.gap .status{background:#fff7ed;color:var(--amber)}.blocked .status{background:#fee2e2;color:var(--red)}.supported .status{background:#dcfce7;color:var(--green)}.summary{font-size:15px;color:#302b27}.grid{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:18px}.items{display:grid;gap:10px;margin:0}.items div{border-top:1px solid var(--line);padding-top:9px}.items dt{font-weight:800;font-size:13px}.items dd{margin:2px 0 0;color:#3d3833;font-size:13px}.evidence,.gaps{margin:0;padding-left:18px}.evidence li,.gaps li{margin:0 0 10px}.evidence span,.evidence small{display:block;color:var(--muted);font-size:12px}.gaps li{color:#7f1d1d}.ok{color:var(--green);font-size:13px}.muted{color:var(--muted);font-size:13px}.disclaimer{color:var(--muted);font-size:12px;margin-top:24px}@media print{.shell{display:block}.rail{display:none}.doc{padding:0}.section,.cover{box-shadow:none;page-break-inside:avoid}.grid{grid-template-columns:1fr}}' +
    '</style></head><body>' +
    '<div class="shell">' +
    `<aside class="rail"><h1>${esc(pack.artifactLabel)}</h1>` +
    `<p>${esc(pack.tenantLabel)}<br />${esc(pack.moveLabel)}</p>` +
    `<nav>${sectionNav}</nav></aside>` +
    '<main class="doc">' +
    '<section class="cover">' +
    '<div class="eyebrow">AbarVa - Moves - Audit Pack</div>' +
    `<h1>${esc(pack.moveLabel)}</h1>` +
    `<p>${esc(pack.bound ? 'Audit-ready pack assembled from kernel and substrate evidence.' : pack.unboundReason)}</p>` +
    '<div class="meta">' +
    `<span class="pill">Client: ${esc(pack.tenantLabel)}</span>` +
    `<span class="pill">Generated: ${esc(pack.generatedOn)}</span>` +
    `<span class="pill">Verdict: ${esc(verdict)}</span>` +
    `<span class="pill">Evidence links: ${pack.evidenceCount}</span>` +
    `<span class="pill">Open gaps: ${pack.gapCount}</span>` +
    '</div></section>' +
    pack.sections.map(renderSection).join('') +
    `<p class="disclaimer">${esc(pack.disclaimer)}</p>` +
    '</main></div></body></html>'
  );
}
