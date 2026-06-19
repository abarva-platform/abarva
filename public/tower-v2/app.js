/* AbarVa · IT Investment Tower — LOGIC
   Renders the 5 tabs (Programs / Spend / Vendors / By Function / Actions),
   the table⇄chart toggles, the drawer, and the Nexus agent
   (header ask bar → canvas answer, with dock-to-side/bottom/hide). */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => (n === 0 ? '$0' : '$' + (Number.isInteger(n) ? n : n.toFixed(1)) + 'M');
const pct = (n, d) => d ? Math.round(n / d * 100) : 0;

const catChip = (c) => `<span class="chip ${c.toLowerCase()}">${c}</span>`;
const statusWord = { 'on-track': 'On track', watch: 'Watch', 'at-risk': 'At risk', over: 'Over' };
const verdictWord = { continue: 'Continue', restructure: 'Restructure', hold: 'Hold', kill: 'Kill' };

// colors for category mix
const CATCOLOR = { software: 'var(--canon-teal-dark)', services: 'var(--canon-teal)', hardware: 'var(--canon-gray-700)', cloud: 'var(--canon-amber)', labor: 'var(--canon-gray-300)' };
const CAPEXCOLOR = { capex: 'var(--canon-teal-dark)', opex: 'var(--canon-gray-300)' };
const CATABC = { Run: 'var(--canon-gray-300)', Change: 'var(--canon-teal)', Transform: 'var(--canon-amber)' };

// ── STATE ─────────────────────────────────────────────────────────────
const state = {
  tab: localStorage.getItem('tw-tab') || 'programs',
  sort: 'budget',
  view: { programs: 'table', spend: 'chart', vendors: 'table', fn: 'table' },
  spendSlice: 'capex',
  dock: localStorage.getItem('tw-dock') || 'off', // off | right | left | bottom | hidden
  answer: null,
};

const TABS = [
  { id: 'programs', label: 'Programs', n: PROGRAMS.length },
  { id: 'spend', label: 'Spend', n: null },
  { id: 'vendors', label: 'Vendors', n: VENDORS.length, attn: true },
  { id: 'fn', label: 'By Function', n: Object.keys(FN_OBS).length },
  { id: 'actions', label: 'Actions', n: ACTIONS.length, attn: true },
];
const BINDING = window.ABARVA_TOWER_V2_BINDING || {};
const NO_TOWER_DATA = Boolean(BINDING.fallback);

// ── STATIC HEADER ─────────────────────────────────────────────────────
function renderHeader() {
  const when = document.querySelector('.when');
  if (when) when.innerHTML = `Refreshed Jun 17, 2026<br>${PROGRAMS.length} programs · ${Object.keys(INITS).length} AI initiatives`;
  if (NO_TOWER_DATA) {
    if (when) when.innerHTML = `Tower data not loaded<br>${esc(BINDING.tenantName || 'Active client')}`;
    $('dash-sub').innerHTML = `<b>${esc(BINDING.tenantName || 'This client')}</b> has no committed Tower v4 spend, vendor, benefit, or action rows available to this surface. No other client's sample data is being shown.`;
    $('band').innerHTML = [
      { l: 'FY26 IT budget', v: '$0', c: 'red', d: 'no committed budget rows' },
      { l: 'Programs', v: '0', c: 'red', d: 'no Tower programs bound' },
      { l: 'AI spend YTD', v: '$0', c: 'red', d: 'no committed spend rows' },
      { l: 'Return on AI $', v: 'n/a', c: 'red', d: 'benefits not loaded' },
      { l: 'Renewing soon', v: '$0', c: 'red', d: 'no vendor contracts bound' },
    ].map(x => `<div class="metric"><div class="ml">${x.l}</div><div class="mv ${x.c}">${x.v}</div><div class="md">${x.d}</div></div>`).join('');
    return;
  }
  const topAiValue = Math.max(...Object.values(INITS).map(i => i.realized), 0);
  const renewing = [...VENDORS].sort((a, b) => a.months - b.months).slice(0, 3);
  const renewingValue = sum(renewing, v => v.acv);
  $('dash-sub').innerHTML = `<b>${fmt(TOTAL.budget)}</b> FY26 budget · <b>${fmt(TOTAL.ytd)}</b> spent to date · <b>${fmt(TOTAL.aiYtd)}</b> of it on AI — and <b>${pct(topAiValue, AI_REALIZED)}% of AI value comes from one initiative</b>.`;
  const ratio = (AI_REALIZED / TOTAL.aiYtd).toFixed(2);
  const m = [
    { l: 'FY26 IT budget', v: fmt(TOTAL.budget), c: '', d: `<b>${pct(TOTAL.ytd, TOTAL.budget)}%</b> spent to date` },
    { l: 'Run vs change', v: pct(TOTAL.run, TOTAL.budget) + '<small>%</small>', c: '', d: `<b>${fmt(TOTAL.run)}</b> locked in run` },
    { l: 'AI spend YTD', v: fmt(TOTAL.aiYtd), c: '', d: `<b>${pct(TOTAL.aiYtd, TOTAL.ytd)}%</b> of IT spend` },
    { l: 'Return on AI $', v: ratio + '<small>×</small>', c: 'teal', d: 'one model carries it' },
    { l: 'Renewing soon', v: fmt(renewingValue).replace('M', '<small>M</small>'), c: 'red', d: `<b>${renewing.length} contracts</b> in focus` },
  ];
  $('band').innerHTML = m.map(x => `<div class="metric"><div class="ml">${x.l}</div><div class="mv ${x.c}">${x.v}</div><div class="md">${x.d}</div></div>`).join('');
}

// ── TABS ──────────────────────────────────────────────────────────────
function renderTabs() {
  $('tabs').innerHTML = TABS.map(t => `<button class="tab ${state.tab === t.id ? 'on' : ''} ${t.attn ? 'attn' : ''}" data-tab="${t.id}">${t.label}${t.n != null ? `<span class="tnum">${t.n}</span>` : ''}</button>`).join('');
  $('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; localStorage.setItem('tw-tab', state.tab); render(); });
}

// ── reusable controls ─────────────────────────────────────────────────
function toggleViewBtn(tab) {
  const v = state.view[tab];
  return `<div class="toggle" data-vtoggle="${tab}">
    <button data-v="table" class="${v === 'table' ? 'on' : ''}">▤ Table</button>
    <button data-v="chart" class="${v === 'chart' ? 'on' : ''}">▥ Chart</button>
  </div>`;
}

function bar(label, sub, val, max, color, valText) {
  const w = Math.max(val / max * 100, 1);
  return `<div class="barrow"><div class="blabel">${esc(label)}${sub ? ` <span class="bsub">${esc(sub)}</span>` : ''}</div>
    <div class="bartrack"><i class="${color}" style="width:${w}%"></i></div>
    <div class="barval">${valText}</div></div>`;
}

function stackBar(parts, total) {
  return `<div class="stack">${parts.map(p => `<div class="seg" style="width:${p.v / total * 100}%;background:${p.color}"><div class="sv">${fmt(p.v)}</div><div class="sl">${esc(p.label)} · ${pct(p.v, total)}%</div></div>`).join('')}</div>`;
}

// ════════════════ TAB: PROGRAMS ════════════════
function viewPrograms() {
  const sorters = { budget: (a, b) => b.budget - a.budget, ytd: (a, b) => b.ytd - a.ytd, ai: (a, b) => b.aiYtd - a.aiYtd };
  const ranked = [...PROGRAMS].sort(sorters[state.sort]);
  const maxB = Math.max(...PROGRAMS.map(p => p.budget));

  const ctl = `<div class="vctl">
    <div class="vtitle">All IT investments, ranked</div>
    <div class="vspacer"></div>
    <span class="selr">Rank by
      <select id="sortsel">
        <option value="budget" ${state.sort === 'budget' ? 'selected' : ''}>FY26 budget</option>
        <option value="ytd" ${state.sort === 'ytd' ? 'selected' : ''}>Spent YTD</option>
        <option value="ai" ${state.sort === 'ai' ? 'selected' : ''}>AI spend</option>
      </select></span>
    ${toggleViewBtn('programs')}
  </div>`;

  let main;
  if (state.view.programs === 'chart') {
    main = `<div class="chart">${ranked.map(p => {
      const c = p.status === 'at-risk' ? 'red' : p.status === 'watch' ? 'amber' : 'teal';
      return bar(p.name, p.fn, p.budget, maxB, c, fmt(p.budget));
    }).join('')}</div>
    <div class="legend" style="margin-top:14px"><span><i style="background:var(--canon-teal)"></i>On track</span><span><i style="background:var(--canon-amber)"></i>Watch</span><span><i style="background:var(--canon-red)"></i>At risk</span></div>`;
  } else {
    const rows = ranked.map((p, i) => {
      const sc = p.status === 'at-risk' ? 'none' : p.status === 'watch' ? 'low' : '';
      return `<tr data-prog="${p.id}">
        <td class="rankcell">${i + 1}</td>
        <td><div class="pname">${esc(p.name)}</div><div class="psub">${esc(p.fn)} · ${esc(p.vendor)} ${catChip(p.cat)}${p.aiBudget > 0 ? `<span class="chip ai">AI ${fmt(p.aiYtd)}</span>` : ''}</div></td>
        <td class="num"><div class="bignum">${fmt(p.budget)}</div></td>
        <td class="num"><div class="bignum">${fmt(p.ytd)}</div><div class="cellbar"><i class="${sc}" style="width:${pct(p.ytd, p.budget)}%"></i></div></td>
        <td class="num"><div class="split"><i class="cap" style="width:${pct(p.capex, p.budget)}%"></i><i class="op" style="width:${pct(p.opex, p.budget)}%"></i></div><div class="splitlbl">${pct(p.capex, p.budget)}% cap · ${pct(p.opex, p.budget)}% op</div></td>
        <td class="num"><span class="chip ${p.status}">${statusWord[p.status]}</span></td>
      </tr>`;
    }).join('');
    main = `<table class="tbl"><thead><tr>
      <th></th><th>Program</th><th class="num">FY26 budget</th><th class="num">Spent YTD</th><th class="num">CapEx / OpEx</th><th class="num">Status</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="tnote"><span class="dot teal"></span><span>Bars on <b>Spent YTD</b> = burn against budget. <span class="chip ai" style="vertical-align:middle">AI</span> marks the AI spend tracked inside a program. Click any row for its initiatives and evidence.</span></div>`;
  }

  return ctl + main + programsInsights();
}
function programsInsights() {
  return `<div class="insight2">
    <div class="ins teal"><div class="ik">Where value is</div><div class="ibig">77%</div><div class="itext"><b>Fraud Graph v2</b> (inside Risk & Compliance Tech) produces 77% of all realized AI value — ${fmt(26.12)} avoidance. The other initiatives have returned ${fmt(AI_REALIZED - 26.12)} combined.</div></div>
    <div class="ins red"><div class="ik">Where leakage is</div><div class="ibig">${fmt(TOTAL.run)}</div><div class="itext"><b>${pct(TOTAL.run, TOTAL.budget)}% of the budget is locked in run-and-sustain</b>, and three transform bets (Payments, Wealth, Digital) are behind plan. Run discipline is the lever going into budget season.</div></div>
  </div>`;
}

// ════════════════ TAB: SPEND (slice/dice) ════════════════
const SPEND_SLICES = [
  { id: 'capex', label: 'CapEx vs OpEx' },
  { id: 'cat', label: 'Software / HW / Services / Cloud' },
  { id: 'runchange', label: 'Run vs Change' },
  { id: 'ai', label: 'AI vs non-AI' },
];
function viewSpend() {
  const sub = `<div class="vctl">
    <div class="subseg" id="spendslice">${SPEND_SLICES.map(s => `<button data-slice="${s.id}" class="${state.spendSlice === s.id ? 'on' : ''}">${s.label}</button>`).join('')}</div>
    <div class="vspacer"></div>
    ${toggleViewBtn('spend')}
  </div>`;
  let content;
  const chart = state.view.spend === 'chart';

  if (state.spendSlice === 'capex') {
    const parts = [{ label: 'CapEx', v: TOTAL.capex, color: CAPEXCOLOR.capex }, { label: 'OpEx', v: TOTAL.opex, color: CAPEXCOLOR.opex }];
    content = chart
      ? stackBar(parts, TOTAL.budget) + legend(parts) + capexNote()
      : sliceTable(['Program', 'CapEx', 'OpEx', '% CapEx'], [...PROGRAMS].sort((a, b) => b.budget - a.budget).map(p => [
          progCell(p), fmt(p.capex), fmt(p.opex), pct(p.capex, p.budget) + '%'
        ]), p => p) + capexNote();
  } else if (state.spendSlice === 'cat') {
    const parts = CAT_MIX.map(c => ({ label: c.label, v: c.val, color: CATCOLOR[c.key] }));
    content = chart
      ? `<div class="chart">${CAT_MIX.sort((a, b) => b.val - a.val).map(c => bar(c.label, null, c.val, Math.max(...CAT_MIX.map(x => x.val)), '', fmt(c.val))).join('')}</div>` + catNote()
      : stackBar(parts, TOTAL.budget) + legend(parts) + catTable() + catNote();
  } else if (state.spendSlice === 'runchange') {
    const parts = [{ label: 'Run', v: TOTAL.run, color: CATABC.Run }, { label: 'Change', v: TOTAL.change, color: CATABC.Change }, { label: 'Transform', v: TOTAL.transform, color: CATABC.Transform }];
    content = chart
      ? stackBar(parts, TOTAL.budget) + legend(parts) + runNote()
      : sliceTable(['Program', 'Category', 'FY26 budget', '% of total'], [...PROGRAMS].sort((a, b) => b.budget - a.budget).map(p => [
          progCell(p), catChip(p.cat), fmt(p.budget), pct(p.budget, TOTAL.budget) + '%'
        ])) + runNote();
  } else if (state.spendSlice === 'ai') {
    const nonAi = TOTAL.ytd - TOTAL.aiYtd;
    const parts = [{ label: 'AI spend', v: TOTAL.aiYtd, color: 'var(--canon-teal-dark)' }, { label: 'Non-AI IT', v: nonAi, color: 'var(--canon-gray-300)' }];
    content = chart
      ? stackBar(parts, TOTAL.ytd) + legend(parts) + aiNote()
      : sliceTable(['Program', 'AI spend YTD', 'Total YTD', '% AI'], [...PROGRAMS].filter(p => p.aiYtd > 0).sort((a, b) => b.aiYtd - a.aiYtd).map(p => [
          progCell(p), fmt(p.aiYtd), fmt(p.ytd), pct(p.aiYtd, p.ytd) + '%'
        ])) + aiNote();
  }
  return sub + content;
}
function legend(parts) { return `<div class="legend">${parts.map(p => `<span><i style="background:${p.color}"></i>${esc(p.label)} · ${fmt(p.v)}</span>`).join('')}</div>`; }
function progCell(p) { return `<div class="pname" style="font-size:15px">${esc(p.name)}</div><div class="psub">${esc(p.fn)}</div>`; }
function sliceTable(heads, rows) {
  return `<table class="tbl" style="margin-top:8px"><thead><tr>${heads.map((h, i) => `<th class="${i > 0 ? 'num' : ''}">${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i > 0 ? 'num' : ''}">${i === 0 ? c : `<span class="${i === 1 && /chip/.test(String(c)) ? '' : 'bignum'}" style="font-size:16px">${c}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function catTable() {
  return `<table class="tbl" style="margin-top:18px"><thead><tr><th>Category</th><th class="num">FY26 spend</th><th class="num">% of budget</th></tr></thead><tbody>${[...CAT_MIX].sort((a, b) => b.val - a.val).map(c => `<tr><td><span class="blabel"><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${CATCOLOR[c.key]};margin-right:8px"></i>${c.label}</span></td><td class="num"><span class="bignum" style="font-size:16px">${fmt(c.val)}</span></td><td class="num">${pct(c.val, TOTAL.budget)}%</td></tr>`).join('')}</tbody></table>`;
}
const capexNote = () => `<div class="tnote"><span class="dot teal"></span><span><b>${pct(TOTAL.capex, TOTAL.budget)}% CapEx / ${pct(TOTAL.opex, TOTAL.budget)}% OpEx.</b> OpEx dominates because core banking ($84M, 90% OpEx) and infrastructure run the estate. Transform programs (Payments, Digital) carry the CapEx.</span></div>`;
const catNote = () => `<div class="tnote"><span class="dot amber"></span><span>Software and services are the two largest lines — together <b>${pct((CAT_MIX.find(c=>c.key==='software').val + CAT_MIX.find(c=>c.key==='services').val), TOTAL.budget)}%</b> of spend. Vendor consolidation at renewal is the lever on both.</span></div>`;
const runNote = () => `<div class="tnote"><span class="dot amber"></span><span><b>${pct(TOTAL.run, TOTAL.budget)}% Run · ${pct(TOTAL.change, TOTAL.budget)}% Change · ${pct(TOTAL.transform, TOTAL.budget)}% Transform.</b> A run-heavy ratio is typical for a regional bank, but it leaves limited room for the transform bets that are currently behind plan.</span></div>`;
const aiNote = () => `<div class="tnote"><span class="dot teal"></span><span>AI is <b>${pct(TOTAL.aiYtd, TOTAL.ytd)}% of IT spend YTD</b> (${fmt(TOTAL.aiYtd)}), concentrated in Risk and Payments. Returns are real but narrow — ${fmt(26.12)} of ${fmt(AI_REALIZED)} realized comes from fraud alone.</span></div>`;

// ════════════════ TAB: VENDORS ════════════════
function viewVendors() {
  const sub = `<div class="vctl"><div class="vtitle">Vendor spend & renewal calendar</div><div class="vspacer"></div>${toggleViewBtn('vendors')}</div>`;
  const maxA = Math.max(...VENDORS.map(v => v.acv));
  let main;
  if (state.view.vendors === 'chart') {
    main = `<div class="chart">${[...VENDORS].sort((a, b) => b.acv - a.acv).map(v => {
      const c = v.urgency === 'at-risk' ? 'red' : v.urgency === 'watch' ? 'amber' : 'dark';
      return bar(v.name, v.renew, v.acv, maxA, c, fmt(v.acv) + '/yr');
    }).join('')}</div>
    <div class="legend" style="margin-top:14px"><span><i style="background:var(--canon-red)"></i>Renews &lt; 6 mo</span><span><i style="background:var(--canon-amber)"></i>Renews 6–12 mo</span><span><i style="background:var(--canon-gray-700)"></i>&gt; 12 mo</span></div>`;
  } else {
    const rows = [...VENDORS].sort((a, b) => a.months - b.months).map(v => `<tr data-vendor="${esc(v.name)}">
      <td><div class="pname" style="font-size:16px">${esc(v.name)}</div><div class="psub">${esc(v.cat)} · ${esc(v.prog)}</div></td>
      <td class="num"><div class="bignum" style="font-size:17px">${fmt(v.acv)}</div><div class="subnum">per year</div></td>
      <td class="num"><div style="font-weight:600">${esc(v.renew)}</div><div class="subnum">${v.months} mo</div></td>
      <td class="num"><span class="chip ${v.urgency}">${v.urgency === 'at-risk' ? 'Renew soon' : v.urgency === 'watch' ? 'Watch' : 'Stable'}</span></td>
    </tr>`).join('');
    main = `<table class="tbl"><thead><tr><th>Vendor</th><th class="num">Annual value</th><th class="num">Renews</th><th class="num">Status</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tnote"><span class="dot red"></span><span><b>DXC ($26M), Accenture ($18M) and FIS ($38M) — $82M/yr — renew within 15 months with no consolidation owner.</b> Accenture (Sep 2026) is the first window. Click a vendor for the contract detail.</span></div>`;
  }
  return sub + main;
}

// ════════════════ TAB: BY FUNCTION ════════════════
function viewFn() {
  const fns = Object.keys(FN_OBS).map(name => {
    const itSpend = sum(PROGRAMS.filter(p => p.fn === name), p => p.ytd);
    const aiYtd = sum(PROGRAMS.filter(p => p.fn === name), p => p.aiYtd);
    return { name, itSpend, aiYtd, ...FN_OBS[name] };
  }).sort((a, b) => b.itSpend - a.itSpend);
  const sub = `<div class="vctl"><div class="vtitle">Spend, AI adoption & value by function</div><div class="vspacer"></div>${toggleViewBtn('fn')}</div>`;
  let main;
  if (state.view.fn === 'chart') {
    const maxS = Math.max(...fns.map(f => f.itSpend));
    main = `<div class="chart">${fns.map(f => {
      const c = f.adoption >= 50 ? 'teal' : f.adoption >= 20 ? 'amber' : 'red';
      return `<div class="barrow"><div class="blabel">${esc(f.name)} <span class="bsub">${f.adoption}% AI adoption</span></div><div class="bartrack"><i class="${c}" style="width:${Math.max(f.itSpend / maxS * 100, 1)}%"></i></div><div class="barval">${fmt(f.itSpend)}</div></div>`;
    }).join('')}</div><div class="tnote"><span class="dot amber"></span><span>Bar = IT spend YTD; color = AI adoption (green ≥50%, amber ≥20%, red below). Spend and adoption are not correlated — Retail is large and barely adopting.</span></div>`;
  } else {
    const rows = fns.map(f => {
      const ac = f.adoption >= 50 ? '' : f.adoption >= 20 ? 'low' : 'none';
      return `<tr>
        <td><div class="pname" style="font-size:16px">${esc(f.name)}</div><div class="psub">${esc(f.vnote)}</div></td>
        <td class="num"><div class="bignum" style="font-size:16px">${fmt(f.itSpend)}</div></td>
        <td class="num"><div class="bignum" style="font-size:16px">${fmt(f.aiYtd)}</div></td>
        <td class="num"><div style="font-weight:600">${f.adoption}%</div><div class="cellbar"><i class="${ac}" style="width:${Math.max(f.adoption, 2)}%"></i></div></td>
        <td class="num"><div class="bignum ${f.value >= 1 ? 'teal' : ''}" style="font-size:16px">${fmt(f.value)}</div></td>
      </tr>`;
    }).join('');
    main = `<table class="tbl"><thead><tr><th>Function</th><th class="num">IT spend YTD</th><th class="num">AI spend</th><th class="num">AI adoption</th><th class="num">Value realized</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tnote"><span class="dot red"></span><span><b>Adoption is the ceiling on value.</b> Risk & Compliance turns AI spend into $26.1M of value; Retail (3,200 bankers) sits at 8%, and Ops & Wealth are frozen at 0%.</span></div>`;
  }
  return sub + main;
}

// ════════════════ TAB: ACTIONS ════════════════
function viewActions() {
  const sub = `<div class="vctl"><div class="vtitle">What to do about it</div><div class="vspacer"></div><span class="selr">Each move needs a named approver — Nexus proposes, it never acts.</span></div>`;
  return sub + `<div class="actions">${ACTIONS.map(a => `<article class="acard ${a.kind}" data-action="${a.id}">
    <div class="akick">${esc(a.kicker)}</div>
    <h3>${esc(a.title)}</h3>
    <p class="awhy">${esc(a.why)}</p>
    <div class="afoot"><span class="aimpact">${esc(a.impact)}</span><span class="arev">Review & approve</span></div>
  </article>`).join('')}</div>`;
}

// ── RENDER ────────────────────────────────────────────────────────────
function render() {
  renderTabs();
  if (NO_TOWER_DATA) {
    $('body').innerHTML = noDataView();
    bindBody();
    return;
  }
  const v = { programs: viewPrograms, spend: viewSpend, vendors: viewVendors, fn: viewFn, actions: viewActions }[state.tab];
  $('body').innerHTML = (state.answer && !isDocked() ? answerCard(state.answer) : '') + v();
  bindBody();
}

function noDataView() {
  const tenant = esc(BINDING.tenantName || 'Active client');
  const source = esc(BINDING.source || 'client v4 pack');
  const reason = esc(BINDING.reason || 'required Tower files are not present');
  return `<div class="vctl"><div class="vtitle">Tower data is not loaded for ${tenant}</div></div>
    <section class="answer" style="margin-top:16px">
      <div class="ah"><div class="av">✦</div><div><div class="aq">Fail-closed client binding</div><div class="at">No cross-client fallback is displayed.</div></div></div>
      <div class="abody">
        <div class="aprose">${tenant}'s Tower surface needs the v4 Tower finance, spend, vendor, benefit, initiative, and derived-action templates committed before this dashboard can render live analysis.</div>
        <table class="tbl" style="margin-top:12px">
          <thead><tr><th>Check</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Resolved dataset</td><td>${source}</td></tr>
            <tr><td>Binding result</td><td>${reason}</td></tr>
            <tr><td>Rendered data policy</td><td>Zero rows shown; no First Capital, Lakeshore, Meridian, or SkyHarbor rows are borrowed across tenants.</td></tr>
          </tbody>
        </table>
        <div class="acite">Required files <span class="src">F12_it-budget-financials.csv</span><span class="src">F11_vendors-contracts-licenses.csv</span><span class="src">T01/T07/T08/T12 Tower CSVs</span></div>
      </div>
    </section>`;
}
function bindBody() {
  $('body').querySelectorAll('[data-prog]').forEach(el => el.onclick = () => progDrawer(el.dataset.prog));
  $('body').querySelectorAll('[data-vendor]').forEach(el => el.onclick = () => vendorDrawer(el.dataset.vendor));
  $('body').querySelectorAll('[data-action]').forEach(el => el.onclick = () => actionDrawer(el.dataset.action));
  const ss = $('sortsel'); if (ss) ss.onchange = () => { state.sort = ss.value; render(); };
  const sp = $('spendslice'); if (sp) sp.querySelectorAll('button').forEach(b => b.onclick = () => { state.spendSlice = b.dataset.slice; render(); });
  $('body').querySelectorAll('[data-vtoggle]').forEach(t => t.querySelectorAll('button').forEach(b => b.onclick = () => { state.view[t.dataset.vtoggle] = b.dataset.v; render(); }));
  const ans = $('body').querySelector('[data-ans-close]'); if (ans) ans.onclick = () => { state.answer = null; render(); };
  const dockBtn = $('body').querySelector('[data-ans-dock]'); if (dockBtn) dockBtn.onclick = () => setDock('right');
}

// ════════════════ NEXUS AGENT ════════════════
function answerCard(a, inDock) {
  const ctrl = inDock ? '' : `<div class="actrl"><button data-ans-dock title="Dock to side">⇥</button><button data-ans-close title="Dismiss">✕</button></div>`;
  return `<div class="answer"><div class="ah"><div class="av">✦</div><div><div class="aq">${esc(a.q)}</div><div class="at">${a.h}</div></div>${ctrl}</div>
    <div class="abody"><div class="aprose">${a.p}</div>${a.render || ''}<div class="acite">Evidence ${a.cites.map(c => `<span class="src">${esc(c)}</span>`).join('')}</div></div></div>`;
}

// build a render block (table or chart) for an answer
function ansBarChart(rows, max, unit) {
  return `<div class="chart">${rows.map(r => bar(r.label, r.sub, r.v, max, r.color || '', (unit || '$') + (unit ? '' : '') + (Number.isInteger(r.v) ? r.v : r.v.toFixed(1)) + (unit ? '' : 'M'))).join('')}</div>`;
}

function answerFor(q) {
  const l = q.toLowerCase();
  // Where is the money going
  if (/where.*money|money going|spend by|breakdown|going\??$/.test(l) || l.includes('where is the money')) {
    const ranked = [...PROGRAMS].sort((a, b) => b.budget - a.budget).slice(0, 6);
    const maxB = ranked[0].budget;
    const topShare = pct(sum(ranked, p => p.budget), TOTAL.budget);
    return {
      q, h: `Six programs hold ${topShare}% of the ${fmt(TOTAL.budget)} budget.`,
      p: `${ranked[0].name} (<b>${fmt(ranked[0].budget)}</b>) and ${ranked[1].name} (<b>${fmt(ranked[1].budget)}</b>) alone are <b>${pct(ranked[0].budget + ranked[1].budget, TOTAL.budget)}%</b> of spend. The biggest discretionary lines are the change and transform programs with the largest AI allocation.`,
      render: ansBarChart(ranked.map(p => ({ label: p.name, sub: p.cat, v: p.budget, color: p.status === 'at-risk' ? 'red' : p.status === 'watch' ? 'amber' : '' })), maxB),
      cites: ['F12_it-budget-financials.csv'],
    };
  }
  // CapEx vs OpEx
  if (/capex|opex|cap ?ex|op ?ex/.test(l)) {
    return {
      q, h: `${pct(TOTAL.opex, TOTAL.budget)}% of IT spend is OpEx.`,
      p: `Of <b>${fmt(TOTAL.budget)}</b>, <b>${fmt(TOTAL.opex)}</b> is OpEx and <b>${fmt(TOTAL.capex)}</b> CapEx. OpEx dominates because the core banking and infrastructure run lines are mostly fixed. The CapEx that exists is concentrated in the transform bets — Payments and Digital.`,
      render: stackBar([{ label: 'CapEx', v: TOTAL.capex, color: CAPEXCOLOR.capex }, { label: 'OpEx', v: TOTAL.opex, color: CAPEXCOLOR.opex }], TOTAL.budget) + legend([{ label: 'CapEx', v: TOTAL.capex, color: CAPEXCOLOR.capex }, { label: 'OpEx', v: TOTAL.opex, color: CAPEXCOLOR.opex }]),
      cites: ['F12_it-budget-financials.csv'],
    };
  }
  // Renewals / vendors
  if (/renew|contract|vendor|dxc|fis|accenture|consolidat/.test(l)) {
    const soon = [...VENDORS].sort((a, b) => a.months - b.months).slice(0, 5);
    const soonValue = sum(soon.slice(0, 3), v => v.acv);
    return {
      q, h: `${fmt(soonValue)}/yr renews across the next three priority contracts.`,
      p: `<b>${esc(soon[0].name)}</b> (${fmt(soon[0].acv)}) is first in <b>${esc(soon[0].renew)}</b>, then <b>${esc(soon[1].name)}</b> (${fmt(soon[1].acv)}, ${esc(soon[1].renew)}) and <b>${esc(soon[2].name)}</b> (${fmt(soon[2].acv)}, ${esc(soon[2].renew)}). Together they are the largest negotiable line in the estate and they auto-extend the status quo unless an owner is named.`,
      render: `<table class="tbl" style="margin-top:6px"><thead><tr><th>Vendor</th><th class="num">Annual value</th><th class="num">Renews</th></tr></thead><tbody>${soon.map(v => `<tr><td><div class="pname" style="font-size:15px">${esc(v.name)}</div><div class="psub">${esc(v.cat)}</div></td><td class="num"><span class="bignum" style="font-size:16px">${fmt(v.acv)}</span></td><td class="num" style="font-weight:600">${esc(v.renew)} <span class="subnum">(${v.months} mo)</span></td></tr>`).join('')}</tbody></table>`,
      cites: ['F11_vendors-contracts-licenses.csv'],
    };
  }
  // AI doing
  if (/\bai\b|initiative|fraud|copilot|value|roi|return/.test(l)) {
    const ranked = Object.entries(INITS)
      .map(([id, i]) => ({ id, ...i }))
      .sort((a, b) => b.realized - a.realized)
      .slice(0, 5);
    const top = ranked[0];
    const topShare = top && AI_REALIZED ? pct(top.realized, AI_REALIZED) : 0;
    return {
      q, h: 'AI value is measurable, but concentration risk matters.',
      p: `<b>${fmt(TOTAL.aiYtd)}</b> spent on AI YTD has realized <b>${fmt(AI_REALIZED)}</b>. The top initiative, <b>${esc(top?.t || 'not loaded')}</b>, carries <b>${topShare}%</b> of realized AI value. The scale decision should check whether the next tier has evidence, adoption, and control gates.`,
      render: ansBarChart(ranked.map((i, index) => ({
        label: i.t,
        sub: verdictWord[i.verdict] || i.verdict,
        v: i.realized,
        color: index === 0 ? '' : i.verdict === 'kill' ? 'red' : 'amber',
      })), Math.max(...ranked.map(i => i.realized), 1)),
      cites: ['T02_benefit-realization.csv', 'T08_ai-spend-by-initiative.csv'],
    };
  }
  // What to stop
  if (/stop|kill|cut|sunset|waste|burn/.test(l)) {
    const stop = Object.entries(INITS)
      .map(([id, i]) => ({ id, ...i }))
      .filter(i => i.verdict === 'kill' || i.realized === 0)
      .slice(0, 4);
    const burned = sum(stop, i => i.ytd);
    const committed = sum(stop, i => i.committed);
    return {
      q, h: `Review ${stop.length} stop / hold candidates — ${fmt(burned)} spent YTD.`,
      p: `${stop.map(i => `<b>${esc(i.t)}</b>`).join(', ')} have either zero realized value or a kill/hold verdict. The committed envelope is <b>${fmt(committed)}</b>. See the Actions tab to route the owner-approved decision.`,
      render: '',
      cites: ['T01_initiative-milestones.csv', 'F13_initiatives-portfolio.csv'],
    };
  }
  // fallback
  return {
    q, h: 'Here is the portfolio in one line.',
    p: `<b>${fmt(TOTAL.budget)}</b> FY26 IT budget, <b>${pct(TOTAL.run, TOTAL.budget)}%</b> locked in run. AI is <b>${fmt(TOTAL.aiYtd)}</b> of spend with <b>${fmt(AI_REALIZED)}</b> realized — 77% from one fraud model. The pressing decisions are the $82M of unowned renewals and three kill-candidate initiatives. Try a suggested question below.`,
    render: '',
    cites: ['F12_it-budget-financials.csv'],
  };
}

function askNexus(q) {
  if (!q || !q.trim()) return;
  state.answer = answerFor(q.trim());
  if (isDocked()) { renderDock(); }
  else { render(); $('body').scrollIntoView ? window.scrollTo({ top: $('ask').offsetTop - 70, behavior: 'smooth' }) : null; }
}

// ── DOCK ──────────────────────────────────────────────────────────────
function isDocked() { return ['right', 'left', 'bottom'].includes(state.dock); }
const DOCK_W = 400, DOCK_H = 320;
function applyDockClass() {
  document.body.classList.remove('dock-right', 'dock-left', 'dock-bottom');
  if (isDocked()) document.body.classList.add('dock-' + state.dock);
  $('launcher').style.display = state.dock === 'hidden' ? 'inline-flex' : 'none';
  // Set content offset inline so it never slides under the dock.
  const app = document.querySelector('.app');
  app.style.paddingRight = state.dock === 'right' ? DOCK_W + 'px' : '';
  app.style.paddingLeft = state.dock === 'left' ? DOCK_W + 'px' : '';
  app.style.paddingBottom = state.dock === 'bottom' ? DOCK_H + 'px' : '';
  localStorage.setItem('tw-dock', state.dock);
}
function setDock(pos) {
  state.dock = pos;
  applyDockClass();
  if (isDocked()) renderDock();
  render(); // re-render body (answer moves between canvas/dock)
}
const POS_ICONS = {
  left: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.5"/><rect x="2" y="3" width="5" height="10" rx="1.5" fill="currentColor" stroke="none"/></svg>',
  right: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.5"/><rect x="9" y="3" width="5" height="10" rx="1.5" fill="currentColor" stroke="none"/></svg>',
  bottom: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.5"/><rect x="2" y="9" width="12" height="4" rx="1.5" fill="currentColor" stroke="none"/></svg>',
  hidden: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6l4 4 4-4"/></svg>',
};
function renderDock() {
  const a = state.answer;
  $('dock').innerHTML = `
    <div class="dock-head">
      <div class="dt"><span class="spark">✦</span> Ask Nexus</div>
      <div class="dock-pos">
        ${['left', 'right', 'bottom'].map(p => `<button data-pos="${p}" class="${state.dock === p ? 'on' : ''}" title="Pin ${p}">${POS_ICONS[p]}</button>`).join('')}
        <button data-pos="hidden" title="Hide">${POS_ICONS.hidden}</button>
      </div>
    </div>
    <div class="dock-body">${a ? answerCard(a, true) : dockEmpty()}</div>
    <div class="dock-ask">
      <div class="ask" style="margin:0;box-shadow:none" onclick="document.getElementById('dock-in').focus()">
        <span class="spark">✦</span>
        <input id="dock-in" type="text" placeholder="Ask about spend, vendors, AI…" autocomplete="off">
        <button class="askbtn" id="dock-go">Ask</button>
      </div>
      <div class="askchips" style="margin-top:10px">${NEXUS_CHIPS.slice(0, 3).map(c => `<button class="askchip" data-chip="${esc(c)}"><span class="s">✦</span>${esc(c)}</button>`).join('')}</div>
    </div>`;
  bindDock();
}
function dockEmpty() {
  return `<div style="padding:14px 6px;color:var(--canon-gray-500);font-size:14px;line-height:1.6">Ask anything about the IT portfolio — spend slices, vendor renewals, AI value, what to cut. Answers render here as text plus a table or chart.</div>`;
}
function bindDock() {
  $('dock').querySelectorAll('[data-pos]').forEach(b => b.onclick = () => setDock(b.dataset.pos));
  const di = $('dock-in'), dg = $('dock-go');
  if (dg) dg.onclick = () => askNexus(di.value);
  if (di) di.onkeydown = (e) => { if (e.key === 'Enter') askNexus(di.value); };
  $('dock').querySelectorAll('[data-chip]').forEach(c => c.onclick = () => askNexus(c.dataset.chip));
  const ac = $('dock').querySelector('[data-ans-close]'); if (ac) ac.onclick = () => { state.answer = null; renderDock(); };
}

// ── DRAWER ────────────────────────────────────────────────────────────
function openDrawer(html) {
  const d = $('drawer'); d.style.transition = ''; d.style.transform = '';
  d.innerHTML = html; d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  $('backdrop').classList.add('open');
  $('drawer').querySelectorAll('[data-close]').forEach(el => el.onclick = closeDrawer);
  const act = $('drawer').querySelector('[data-action]'); if (act) act.onclick = () => actionDrawer(act.dataset.action);
}
function closeDrawer() {
  const d = $('drawer'); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); $('backdrop').classList.remove('open');
}
function progDrawer(id) {
  const p = PROGRAMS.find(x => x.id === id); if (!p) return;
  const initRows = p.inits.map(iid => { const i = INITS[iid]; return i ? `<div class="drow"><span class="dk">${esc(i.t)}</span><span class="dv"><span class="chip ${i.verdict} sm">${verdictWord[i.verdict]}</span> ${fmt(i.realized)}</span></div>` : ''; }).join('');
  const mix = Object.entries(p.mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="drow"><span class="dk">${k[0].toUpperCase() + k.slice(1)}</span><span class="dv">${fmt(v)} · ${pct(v, p.budget)}%</span></div>`).join('');
  openDrawer(`<div class="dr-head"><div class="dr-eyebrow"><span>Program · ${esc(p.id)}</span><button class="dr-close" data-close>✕</button></div><h3>${esc(p.name)}</h3></div>
    <div class="dr-body">
      <div class="dr-impact">
        <div><div class="k">FY26 budget</div><div class="v">${fmt(p.budget)}</div></div>
        <div><div class="k">Spent YTD</div><div class="v">${fmt(p.ytd)}</div></div>
        <div><div class="k">CapEx / OpEx</div><div class="v sm">${fmt(p.capex)} / ${fmt(p.opex)}</div></div>
        <div><div class="k">AI spend</div><div class="v sm ${p.aiYtd > 0 ? 'teal' : ''}">${p.aiYtd > 0 ? fmt(p.aiYtd) : '—'}</div></div>
      </div>
      <div class="dr-sec">Profile</div>
      <div class="drow"><span class="dk">Function</span><span class="dv">${esc(p.fn)}</span></div>
      <div class="drow"><span class="dk">Owner</span><span class="dv">${esc(p.owner)}</span></div>
      <div class="drow"><span class="dk">Category</span><span class="dv">${catChip(p.cat)}</span></div>
      <div class="drow"><span class="dk">Primary vendor</span><span class="dv">${esc(p.vendor)}</span></div>
      <div class="drow"><span class="dk">Status</span><span class="dv"><span class="chip ${p.status} sm">${statusWord[p.status]}</span></span></div>
      <div class="dr-sec">Spend by category</div>${mix}
      ${initRows ? `<div class="dr-sec">AI initiatives in this program</div>${initRows}` : ''}
      <div class="dr-sec">Read</div><div class="efact"><div class="es">${esc(p.note)}</div><div class="erow"><span class="eloc"><span class="file">F12_it-budget-financials.csv</span> · ${esc(p.id)}</span></div></div>
    </div>
    <div class="dr-foot"><span class="dr-trust"><span class="dot ${p.status === 'at-risk' ? 'red' : p.status === 'watch' ? 'amber' : 'teal'}"></span>${statusWord[p.status]} · ${esc(p.cat)}</span><button class="btn" data-close>Close</button></div>`);
}
function vendorDrawer(name) {
  const v = VENDORS.find(x => x.name === name); if (!v) return;
  openDrawer(`<div class="dr-head"><div class="dr-eyebrow"><span>Vendor · contract</span><button class="dr-close" data-close>✕</button></div><h3>${esc(v.name)}</h3></div>
    <div class="dr-body">
      <div class="dr-impact">
        <div><div class="k">Annual value</div><div class="v">${fmt(v.acv)}</div></div>
        <div><div class="k">Renews</div><div class="v sm">${esc(v.renew)}</div></div>
        <div><div class="k">Window</div><div class="v sm ${v.months < 6 ? 'red' : v.months < 12 ? 'amber' : ''}">${v.months} months</div></div>
        <div><div class="k">Category</div><div class="v sm">${esc(v.cat)}</div></div>
      </div>
      <div class="dr-sec">Linked program</div>
      <div class="drow"><span class="dk">Program</span><span class="dv">${esc(v.prog)}</span></div>
      <div class="dr-sec">Read</div><div class="efact"><div class="es">${esc(v.note)}</div><div class="erow"><span class="eloc"><span class="file">F11_vendors-contracts-licenses.csv</span></span></div></div>
    </div>
    <div class="dr-foot"><span class="dr-trust"><span class="dot ${v.urgency === 'at-risk' ? 'red' : v.urgency === 'watch' ? 'amber' : 'teal'}"></span>${v.months} months to renewal</span><button class="btn" data-close>Close</button>${v.months < 16 ? `<button class="btn primary" data-action="A4">Review consolidation</button>` : ''}</div>`);
}
function actionDrawer(id) {
  const a = ACTIONS.find(x => x.id === id); if (!a) return;
  const grid = a.grid.map(([k, val]) => `<div><div class="k">${esc(k)}</div><div class="v sm">${esc(val)}</div></div>`).join('');
  openDrawer(`<div class="dr-head"><div class="dr-eyebrow" style="color:${a.kind === 'kill' || a.kind === 'gov' ? 'var(--canon-red)' : 'var(--canon-teal-dark)'}"><span>Action · ${esc(a.kicker)}</span><button class="dr-close" data-close>✕</button></div><h3>${esc(a.title)}</h3></div>
    <div class="dr-body" id="dr-body">
      <div class="dr-impact">${grid}</div>
      <div class="dr-sec">Why now</div><p class="rec-box" style="color:var(--canon-gray-700)">${esc(a.why)}</p>
      <div class="dr-sec">Recommendation</div><p class="rec-box">${a.rec}</p>
      <div class="approve-note"><span class="dot amber"></span><span><b>Human approval required.</b> Approving routes this to <b>${esc(a.owner)}</b> as a Move with its evidence chain attached. No action is taken automatically.</span></div>
    </div>
    <div class="dr-foot"><span class="dr-trust"><span class="dot ${a.kind === 'kill' || a.kind === 'gov' ? 'red' : 'teal'}"></span>Owner · ${esc(a.owner)}</span><button class="btn" data-close>Defer</button><button class="btn primary" id="approve">Approve & route</button></div>`);
  const ap = $('approve'); if (ap) ap.onclick = () => {
    $('dr-body').innerHTML = `<div class="move-done"><div class="mddot">●</div><h4>Routed to ${esc(a.owner)}</h4><p>Created as a Move — “${esc(a.move)}” — with its evidence chain attached. The owner approves activation in Strategic Moves.</p></div>`;
    $('drawer').querySelector('.dr-foot').innerHTML = `<span class="dr-trust"><span class="dot teal"></span>Move created · awaiting owner</span><button class="btn" data-close>Close</button><button class="btn primary" data-close>View in Moves</button>`;
    $('drawer').querySelectorAll('[data-close]').forEach(el => el.onclick = closeDrawer);
  };
}

// ── ASK BAR + chips ───────────────────────────────────────────────────
function bindAsk() {
  $('askchips').innerHTML = NEXUS_CHIPS.map(c => `<button class="askchip" data-chip="${esc(c)}"><span class="s">✦</span>${esc(c)}</button>`).join('');
  $('askchips').querySelectorAll('[data-chip]').forEach(c => c.onclick = () => askNexus(c.dataset.chip));
  $('ask-go').onclick = () => askNexus($('ask-in').value);
  $('ask-in').onkeydown = (e) => { if (e.key === 'Enter') askNexus($('ask-in').value); };
  $('launcher').onclick = () => setDock('right');
}

// ── INIT ──────────────────────────────────────────────────────────────
renderHeader();
bindAsk();
applyDockClass();
if (isDocked()) renderDock();
render();
$('backdrop').onclick = closeDrawer;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
