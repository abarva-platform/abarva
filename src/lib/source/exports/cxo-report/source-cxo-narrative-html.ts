import 'server-only';

import type { SourceCxoNarrativeReport, SourceCxoSlide } from './source-cxo-narrative-report';

export const SOURCE_CXO_HTML_CONTENT_TYPE = 'text/html; charset=utf-8';

export function renderSourceCxoNarrativeHtml(report: SourceCxoNarrativeReport): string {
  const menu = report.slides
    .map(
      (slide, i) => `
        <button class="menu-item" type="button" data-goto="${i + 1}">
          <span class="menu-num">${String(i).padStart(2, '0')}</span>
          <span><strong>${escapeHtml(shortTitle(slide.title))}</strong><em>${escapeHtml(slide.message)}</em></span>
        </button>`,
    )
    .join('');
  const slides = report.slides.map((slide, i) => renderSlide(slide, i + 1, report.slides.length)).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(report.eventName)} — Source CXO Narrative Report</title>
<meta name="generator" content="AbarVa Source CXO Narrative Report" />
<meta name="x-source-event-code" content="${escapeHtml(report.eventCode)}" />
<meta name="x-source-generated-at" content="${escapeHtml(report.generatedAt)}" />
<style>${styles()}</style>
</head>
<body>
<div class="deck">
  <nav class="menu" aria-label="Deck navigation">
    <div class="menu-head">
      <div class="brand">AbarVa · Source</div>
      <h1>CXO Narrative Report</h1>
      <p>${escapeHtml(report.tenantName)} · ${escapeHtml(report.eventCode)}</p>
    </div>
    <div class="menu-list">${menu}</div>
    <div class="menu-foot"><strong>${escapeHtml(report.verdict)}</strong><span>${escapeHtml(report.verdictDetail)}</span></div>
  </nav>
  <main class="stage">${slides}</main>
</div>
<div class="deck-controls"><button id="prev" type="button">‹ Prev</button><span id="counter">1 / ${report.slides.length}</span><button id="next" type="button">Next ›</button></div>
<script>
(function(){
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var items=Array.prototype.slice.call(document.querySelectorAll('.menu-item'));
  var cur=1,total=slides.length;
  function show(n){
    cur=Math.max(1,Math.min(total,n));
    slides.forEach(function(s,i){s.classList.toggle('is-active',i+1===cur);});
    items.forEach(function(it,i){if(i+1===cur){it.setAttribute('aria-current','true');}else{it.removeAttribute('aria-current');}});
    var c=document.getElementById('counter'); if(c)c.textContent=cur+' / '+total;
    var st=document.querySelector('.stage'); if(st)st.scrollTop=0;
  }
  items.forEach(function(it,i){it.addEventListener('click',function(){show(i+1);});});
  document.getElementById('prev').addEventListener('click',function(){show(cur-1);});
  document.getElementById('next').addEventListener('click',function(){show(cur+1);});
  document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){show(cur+1);} if(e.key==='ArrowLeft'){show(cur-1);}});
  show(1);
})();
</script>
</body>
</html>`;
}

function renderSlide(slide: SourceCxoSlide, n: number, total: number): string {
  const metrics = slide.metrics
    .map(
      (m) => `<div class="metric ${m.status ? `is-${m.status}` : ''}">
        <span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><em>${escapeHtml(m.note)}</em>
      </div>`,
    )
    .join('');
  const table = slide.table ? renderTable(slide.table) : '';
  const notes = slide.notes.length
    ? `<ul class="notes">${slide.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
    : '';
  return `<section class="slide ${n === 1 ? 'is-active' : ''}" id="${escapeHtml(slide.id)}">
    <div class="slide-inner">
      <div class="rule"><span>AbarVa · Source</span><span>Slide ${n} / ${total}</span></div>
      <p class="eyebrow">${escapeHtml(slide.proofLabel)}</p>
      <h2>${escapeHtml(slide.title)}</h2>
      <p class="message">${escapeHtml(slide.message)}</p>
      <div class="metrics">${metrics}</div>
      ${table}
      ${notes}
    </div>
  </section>`;
}

function renderTable(table: NonNullable<SourceCxoSlide['table']>): string {
  return `<figure class="table-wrap">
    <figcaption>${escapeHtml(table.title)}</figcaption>
    <table><thead><tr>${table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
    <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </figure>`;
}

function shortTitle(s: string): string {
  return s.length > 42 ? `${s.slice(0, 39)}…` : s;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function styles(): string {
  return `
*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:Inter,Arial,sans-serif;background:#e8e4da;color:#111}
.deck{display:grid;grid-template-columns:300px minmax(0,1fr);height:100vh}.menu{background:#11100e;color:#f5f1e9;display:flex;flex-direction:column;border-right:1px solid #282621}.menu-head{padding:24px 24px 18px;border-bottom:1px solid #2f2d28}.brand{font:800 11px ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#77a9e6}.menu h1{font:500 25px Georgia,serif;margin:10px 0 5px}.menu p{margin:0;color:#aaa295;font-size:12px}.menu-list{overflow:auto;padding:8px 0;flex:1}.menu-item{width:100%;display:grid;grid-template-columns:28px 1fr;gap:10px;text-align:left;background:transparent;border:0;color:#d7d0c3;padding:11px 18px;border-left:3px solid transparent;cursor:pointer}.menu-item:hover,.menu-item[aria-current=true]{background:#201f1b;color:#fff}.menu-item[aria-current=true]{border-left-color:#77a9e6}.menu-num{font:800 11px ui-monospace,monospace;color:#888}.menu-item strong{display:block;font-size:13px}.menu-item em{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-style:normal;color:#9d968a;font-size:11px;line-height:1.35}.menu-foot{padding:18px 22px;border-top:1px solid #2f2d28}.menu-foot strong{display:block;color:#e3bc5c;text-transform:uppercase;font-size:12px}.menu-foot span{font-size:11px;color:#aaa295}.stage{height:100vh;overflow:auto;padding:34px 44px 94px}.slide{display:none}.slide.is-active{display:block}.slide-inner{max-width:1120px;min-height:calc(100vh - 140px);margin:auto;background:#fbfaf7;border:1px solid #d8d0c1;border-radius:8px;padding:40px 52px}.rule{display:flex;justify-content:space-between;border-bottom:1px solid #e2dacb;padding-bottom:12px;color:#837b6e;font:800 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.eyebrow{margin:24px 0 8px;color:#0b4a91;font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em}.slide h2{font:500 34px/1.12 Georgia,serif;margin:0 0 12px;max-width:900px}.message{font-size:16px;line-height:1.55;max-width:850px;color:#302c27}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.metric{background:#fff;border:1px solid #e1dacd;padding:15px}.metric span{display:block;font:800 10px ui-monospace,monospace;color:#777;text-transform:uppercase;letter-spacing:.08em}.metric strong{display:block;font-size:22px;line-height:1.15;margin:8px 0;color:#111}.metric em{font-style:normal;color:#625d55;font-size:12px}.metric.is-good{border-left:4px solid #2d7d46}.metric.is-warn{border-left:4px solid #bd7b12}.metric.is-bad{border-left:4px solid #9b2d1f}.table-wrap{margin:22px 0 0}.table-wrap figcaption{font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}table{width:100%;border-collapse:collapse;background:#fff}th,td{border:1px solid #ded7c8;padding:10px 11px;text-align:left;vertical-align:top;font-size:12px;line-height:1.35}th{background:#f0ece4;font-size:11px;text-transform:uppercase;letter-spacing:.04em}.notes{margin:20px 0 0;padding-left:18px;color:#4a463f}.deck-controls{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:16px;align-items:center;background:#11100e;color:#fff;border-radius:999px;padding:9px 12px;box-shadow:0 10px 28px #0003}.deck-controls button{border:0;background:#fff;color:#111;border-radius:999px;padding:8px 14px;font-weight:800}
@media(max-width:820px){.deck{grid-template-columns:1fr}.menu{height:300px;position:relative}.stage{height:auto;padding:18px}.slide-inner{padding:24px;min-height:auto}.metrics{grid-template-columns:1fr}.deck-controls{bottom:12px}.slide h2{font-size:28px}}
`;
}
