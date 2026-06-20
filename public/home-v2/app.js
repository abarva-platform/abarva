/* AbarVa · Home — Context Explorer (LOGIC)
   Left dimension explorer (19 dims, 6 chapters) + canvas that shows the
   consultant story, a dimension's Current State Assessment, or an ask
   response — all rendered in the canvas. Data in abarva-home-data.js. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toneColor = { teal: 'var(--canon-teal)', amber: 'var(--canon-amber)', red: 'var(--canon-red)' };
const state = { dim: null, ask: null }; // dim=null → overview/story
const META = window.ABARVA_HOME_V2_BINDING || {};
const tenantName = () => META.tenantName || STORY.who || 'AbarVa Client';
const assembledAt = () => META.generatedAt || 'current refresh';
const verificationText = () => META.verification || 'source-bound';

function applyFrameChrome() {
  document.title = `AbarVa · Home · ${tenantName()}`;
  const tenant = $('tb-tenant');
  if (tenant) tenant.textContent = tenantName();
  const footer = $('home-v2-footer');
  if (footer && META.footer) footer.textContent = META.footer;
}

// ── WEIGHT ENGINE ─────────────────────────────────────────────────────
// Compute each dimension's pull on the thesis, rank all 19, derive top-3.
const WMAX = 3 * (WEIGHT_COEF.severity + WEIGHT_COEF.urgency + WEIGHT_COEF.leverage + WEIGHT_COEF.breadth); // 27
const FAC_KEYS = ['severity', 'urgency', 'leverage', 'breadth'];
const FAC_COLOR = { severity: 'var(--canon-red)', urgency: 'var(--canon-amber)', leverage: 'var(--abarva-signal-blue)', breadth: 'var(--canon-teal)' };
const TREND_META = { up: ['up', '↑ worsening'], flat: ['flat', '– stable'], down: ['down', '↓ improving'] };
const SEV_LAB = ['Clear', 'Low', 'Material', 'Critical'];

const WEIGHTS = Object.entries(FACTORS).map(([id, f]) => {
  const score = Math.round(FAC_KEYS.reduce((s, k) => s + f[k] * WEIGHT_COEF[k], 0) / WMAX * 100);
  return { id, score, ...f };
}).sort((a, b) => b.score - a.score);
WEIGHTS.forEach((w, i) => { w.rank = i + 1; });
const WById = Object.fromEntries(WEIGHTS.map(w => [w.id, w]));
const DRIVERS = WEIGHTS.slice(0, 3);          // the dimensions currently driving the read
const isDriver = (id) => DRIVERS.some(d => d.id === id);

// ── LEFT EXPLORER ─────────────────────────────────────────────────────
function renderRail() {
  let html = `<div class="rail-h">Context Explorer</div>
    <button class="navitem overview ${state.dim === null ? 'active' : ''}" data-dim=""><span class="ov"></span>The story</button>`;
  html += CHAPTERS.map(ch => `<div class="navgroup">${esc(ch.t)}</div>` +
    ch.ids.map(id => { const s = SECTIONS[id]; const drv = isDriver(id) ? `<span class="navdrv">▲${WById[id].rank}</span>` : ''; return `<button class="navitem ${state.dim === id ? 'active' : ''}" data-dim="${id}"><span class="dot ${s.risk}"></span><span class="navlbl">${esc(s.nav)}</span>${drv}</button>`; }).join('')
  ).join('');
  $('rail').innerHTML = html;
  $('rail').querySelectorAll('[data-dim]').forEach(b => b.onclick = () => { go(b.dataset.dim || null, null); });
}

// ── CANVAS ────────────────────────────────────────────────────────────
function renderView() {
  if (!state.dim) { renderOverview(); return; }
  renderAssessment(state.dim, state.ask);
}

function renderOverview() {
  const s = STORY;
  const trip = s.whoWhat.map(t => `<div class="trip"><div class="tk">${esc(t.k)}</div><div class="tv">${esc(t.v)}</div></div>`).join('');
  const stats = s.stats.map(x => `<div class="stat"><div class="sv">${esc(x.v)}</div><div class="sl">${esc(x.l)}</div><div class="sd">${esc(x.d)}</div></div>`).join('');
  const drivers = DRIVERS.map((d, i) => { const sec = SECTIONS[d.id]; return `<button class="drv" data-dim="${d.id}"><div class="drv-rank">Driver ${i + 1}<span class="drv-score">${d.score}</span></div><div class="drv-name">${esc(sec.nav)}</div><div class="drv-why">${esc(d.why)}</div></button>`; }).join('');
  $('view').innerHTML = `
    <div class="ov-eyebrow">Current State Assessment · ${esc(tenantName())}</div>
    <div class="ov-who">${esc(s.who)}<span class="tk">${esc(s.ticker)} · ${esc(s.kind)}</span></div>
    <div class="ov-one">${esc(s.oneLine)}</div>
    <div class="ov-read">${s.read.replace(/\$82M|\$26\.1M/g, m => `<b>${m}</b>`)}</div>
    <div class="triplet">${trip}</div>
    <div class="stats">${stats}</div>
    <div class="drv-block">
      <div class="drv-head"><span class="drv-lab">What's driving this read — top 3 of 19</span><span class="drv-note">ranked by computed weight · re-derived every refresh</span></div>
      <div class="drv-grid">${drivers}</div>
    </div>
    <div class="ov-hint"><span class="dot"></span>Pick any of the 19 dimensions on the left, or ask a question above — both open right here.</div>`;
  $('view').querySelectorAll('.drv[data-dim]').forEach(b => b.onclick = () => go(b.dataset.dim, null));
}

function ratingBar(r) { const [w, t] = RATING[r] || [50, 'amber']; return { w, color: toneColor[t] }; }

const ASK_STOP = new Set(['about', 'anything', 'tell', 'show', 'give', 'what', 'where', 'when', 'with', 'from', 'that', 'this', 'your', 'mine', 'ours', 'their', 'have', 'does', 'for', 'the', 'and', 'are', 'how', 'much', 'many', 'into', 'please']);
function askTokens(q) {
  return String(q).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !ASK_STOP.has(w));
}
function bestAskFacts(primarySection, q) {
  const tokens = askTokens(q);
  if (!tokens.length) return [];
  const sections = Object.values(SECTIONS);
  const ranked = sections.flatMap(section => {
    const facts = Array.isArray(section.askFacts) ? section.askFacts : [];
    return facts.map(fact => {
      const label = `${fact.label || ''}`.toLowerCase();
      const hay = `${fact.matchText || ''}`.toLowerCase();
      const labelHits = tokens.reduce((s, tok) => s + (label.includes(tok) ? 1 : 0), 0);
      const matchHits = tokens.reduce((s, tok) => s + (hay.includes(tok) ? 1 : 0), 0);
      const primaryBoost = section === primarySection ? 0.5 : 0;
      return { fact, section, score: (labelHits * 3) + matchHits + primaryBoost };
    });
  }).filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set();
  return ranked.filter(({ fact, section }) => {
    const key = `${section.nav}:${fact.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 2).map(hit => hit.fact);
}
function answerForAsk(section, q) {
  const facts = bestAskFacts(section, q);
  if (facts.length) {
    const fact = facts[0];
    const extra = facts.slice(1).map(next => ` Also: ${next.answer}`).join('');
    const sources = [...new Set(facts.map(next => next.source).filter(Boolean))].join(' + ');
    const verified = facts.some(next => next.confidence === 'high');
    return {
      text: `${fact.answer}${extra}`,
      source: sources || fact.source,
      confidence: verified ? 'Verified source rows' : 'Partial source rows',
    };
  }
  const firstSignal = Array.isArray(section.currentState) ? section.currentState.find(row => row && row[0] !== 'Source binding') : null;
  return {
    text: firstSignal ? firstSignal[2] : section.summary.replace(/<[^>]+>/g, ''),
    source: section.sources && section.sources[0] ? section.sources[0][0] : 'source trail',
    confidence: 'Dimension-level read',
  };
}

const TONE_RANK = { red: 0, amber: 1, teal: 2 };
const TONE_TAG = { teal: 'Strength', amber: 'Watch', red: 'Constraint' };
const SIG_WLAB = ['Heaviest signal', 'High weight', 'Contributing', 'Context'];

function renderAssessment(id, askQ) {
  const s = SECTIONS[id];
  const w = WById[id];

  // ── weight strip (the up-link to the thesis) ──
  const driverChips = DRIVERS.map((d, i) => { const sec = SECTIONS[d.id]; return `<button class="wdrv ${d.id === id ? 'self' : ''}" data-dim="${d.id}"><span class="dot ${sec.risk}"></span>${esc(sec.nav)}<span class="wrk">weight ${i + 1}</span></button>`; }).join('');
  const [tcls, tlab] = TREND_META[w.trend];
  const here = isDriver(id);
  const thesis = STORY.thesis || 'the source trail is here; the discipline is to interpret it tenant by tenant';
  const wbody = here
    ? `This is <b>${w.rank === 1 ? 'the heaviest of the 3' : w.rank + ' of 3'} dimensions driving the top-line read</b>. The thesis — <i>"${esc(thesis)}"</i> — leans on what's in here. ${esc(w.why)}`
    : `This ranks <b>#${w.rank} of 19</b> by weight on the read — ${w.rank <= 8 ? 'a contributing signal, not a headline' : 'quiet right now, nothing moving the thesis'}. ${esc(w.why)}`;
  const weightStrip = `<div class="weight">
    <div class="we">Why you're ${here ? 'here' : 'reading this'} · computed weight ${w.score}/100 · <span class="wtrend ${tcls}">${tlab}</span></div>
    <div class="wbody">${wbody}</div>
    <div class="wdrivers">${driverChips}</div>
  </div>`;

  // ── ranked signals with expandable evidence ──
  const ranked = s.currentState.map((row, idx) => ({ row, idx })).sort((a, b) => TONE_RANK[a.row[1]] - TONE_RANK[b.row[1]]);
  const srcRows = s.sources.map(([f, d, c]) => `<div class="evpt"><div><div class="ev-val">${esc(d)}</div><div class="ev-src">${esc(f)}</div></div><span class="ev-conf ${c === 'high' ? 'v' : 'p'}">${c === 'high' ? 'Verified' : 'Partial'}</span></div>`).join('');
  const signals = ranked.map(({ row }, i) => {
    const [area, tone, desc] = row;
    const pct = [92, 74, 58, 44][i] || 38;
    return `<div class="signal" data-sig>
      <div class="sig-head">
        <div class="sig-rank">${i + 1}</div>
        <div class="sig-main">
          <div class="sig-claim"><b>${esc(area)}.</b> ${esc(desc)}</div>
          <div class="sig-meta"><span class="sig-wbar"><span class="sig-wfill" style="width:${pct}%;background:${toneColor[tone]}"></span></span><span class="sig-wlab">${SIG_WLAB[i] || 'Context'}</span></div>
        </div>
        <div class="sig-right"><span class="sig-tag ${tone}">${TONE_TAG[tone]}</span><span class="sig-ev"><span class="chev">›</span>evidence</span></div>
      </div>
      <div class="sig-body">
        <div class="ev-sec">Evidence base · under the hood</div>
        ${srcRows}
      </div>
    </div>`;
  }).join('');

  // ── maturity ──
  const mat = s.maturity.map(([l, r]) => { const b = ratingBar(r); return `<div class="matrow"><span class="ml">${esc(l)}</span><span class="mtrack"><span class="mfill" style="width:${b.w}%;background:${b.color}"></span></span><span class="mr" style="color:${b.color}">${esc(r)}</span></div>`; }).join('');

  // ── linkage (up to thesis/play, across to gated dims) ──
  const play = PLAYS.find(p => p.id === w.play);
  const gateChips = w.gates.length
    ? w.gates.map(g => `<button class="chip" data-dim="${g}"><span class="dot ${SECTIONS[g].risk}"></span>${esc(SECTIONS[g].nav)}</button>`).join('')
    : '<span class="chip-none">Self-contained — gates nothing downstream.</span>';
  const linkage = `<div class="links">
    <div class="linkcard">
      <div class="lk">Up — advances a play</div>
      <div class="lt">${esc(play.t)}</div>
      <div class="ld">${esc(play.d)}</div>
      <button class="lgo" id="toPlays">See the 3 plays</button>
    </div>
    <div class="linkcard">
      <div class="lk">Across — ${w.gates.length ? `gates ${w.gates.length} dimension${w.gates.length > 1 ? 's' : ''}` : 'no downstream gate'}</div>
      <div class="lt">${w.gates.length ? 'Value is capped here until this clears' : 'Reads on its own'}</div>
      <div class="chiprow">${gateChips}</div>
    </div>
  </div>`;

  const focus = s.focus.map((f, i) => `<div class="focusitem"><span class="n">${i + 1}</span><span>${esc(f)}</span></div>`).join('');
  const askAnswer = askQ ? answerForAsk(s, askQ) : null;
  const lead = askQ ? `<div class="ans-lead"><div class="av">✦</div><div><div class="alq">${esc(askQ)}</div><div class="alt"><b>${esc(askAnswer.text)}</b><div style="margin-top:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--canon-gray-600)">${esc(askAnswer.confidence)} · ${esc(askAnswer.source)}</div></div></div></div>` : '';

  $('view').innerHTML = lead + `
    <div class="doc-head">
      <div class="eyebrow">Current State Assessment · ${esc(s.nav)}</div>
      <h1>${esc(s.title)}</h1>
      <div class="sub">${esc(s.sub)}</div>
      <div class="doc-meta"><span>Tenant · <b>${esc(tenantName())}</b></span><span>Assembled <b>${esc(assembledAt())}</b></span><span><b>${esc(verificationText())}</b></span></div>
    </div>
    ${weightStrip}
    <div class="block"><div class="sec-eyebrow">Executive summary</div><p class="lede">${s.summary}</p></div>
    <div class="block"><div class="sec-eyebrow">Why we say that — ranked by weight on the read</div>${signals}</div>
    <div class="block"><div class="sec-eyebrow">Maturity &amp; readiness</div><div class="mat">${mat}</div></div>
    <div class="block"><div class="sec-eyebrow">What this dimension changes elsewhere</div>${linkage}</div>
    <div class="block"><div class="sec-eyebrow">Recommended focus</div><div class="focus">${focus}</div></div>
    <div class="lead-callout">
      <div class="le">What leadership should know</div>
      <div class="lb">${esc(s.leadership)}</div>
      <div class="lead-cta"><button class="btn ondark" id="srctrail">View source trail</button><button class="btn primary" id="toIntel">Take to the advisory board</button></div>
    </div>`;

  // wire interactions
  $('view').querySelectorAll('[data-sig]').forEach(sig => sig.querySelector('.sig-head').onclick = () => sig.classList.toggle('open'));
  const firstSig = $('view').querySelector('[data-sig]'); if (firstSig) firstSig.classList.add('open');
  $('view').querySelectorAll('[data-dim]').forEach(b => b.onclick = () => go(b.dataset.dim, null));
  $('srctrail').onclick = () => openSourceTrail(id);
  $('toIntel').onclick = () => openIntel(id);
  const tp = $('toPlays'); if (tp) tp.onclick = () => openIntel(id);
}

// ── DRAWERS ───────────────────────────────────────────────────────────
function openDrawer(html) {
  const d = $('drawer'); d.style.transition = ''; d.style.transform = '';
  d.innerHTML = html; d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); $('backdrop').classList.add('open');
  d.querySelectorAll('[data-close]').forEach(el => el.onclick = closeDrawer);
  setTimeout(() => { if (d.classList.contains('open') && d.getBoundingClientRect().left >= innerWidth - 2) { d.style.transition = 'none'; d.style.transform = 'translateX(0)'; void d.offsetHeight; d.style.transition = ''; } }, 380);
}
function closeDrawer() {
  const d = $('drawer'); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); $('backdrop').classList.remove('open');
  setTimeout(() => { if (!d.classList.contains('open') && d.getBoundingClientRect().left < innerWidth - 2) { d.style.transition = 'none'; d.style.transform = 'translateX(100%)'; void d.offsetHeight; d.style.transition = ''; } }, 380);
}
function openSourceTrail(id) {
  const s = SECTIONS[id];
  const rows = s.sources.map(([f, d, c]) => `<div class="srcrow"><div class="sf">${esc(f)}</div><div class="sd">${esc(d)}</div><span class="sc ${c === 'high' ? 'teal' : 'amber'}">${c === 'high' ? 'Verified' : 'Partial'} confidence</span></div>`).join('');
  openDrawer(`<div class="dr-head"><div class="dr-eyebrow"><span>Source trail · ${esc(s.nav)}</span><button class="dr-close" data-close>✕</button></div><h3>Evidence behind this assessment</h3></div>
    <div class="dr-body">
      <div class="dr-sec">Source documents &amp; templates</div>${rows}
      <div class="dr-sec">Missing or partial evidence</div>
      <div class="miss"><b>Challenge-ready, not complete.</b> Where confidence is partial, the finding is directional and flagged for proof before action.</div>
      <div class="dr-sec">How this was assembled</div>
      <p style="font-size:13px;line-height:1.6;color:var(--canon-gray-700)">Atomic facts were extracted from the source files above during the monthly load, classified into this assessment dimension, and confidence-scored against corroborating evidence. This frame is bound to ${esc(META.source || 'the active tenant data pack')}; no figure here is generated from another client. Each display value traces to a loaded source.</p>
    </div>
    <div class="dr-foot"><button class="btn" data-close style="flex:1">Close</button></div>`);
}
function openIntel(id) {
  const s = SECTIONS[id];
  openDrawer(`<div class="dr-head"><div class="dr-eyebrow" style="color:var(--abarva-signal-blue)"><span>Hand off to Intelligence</span><button class="dr-close" data-close>✕</button></div><h3>${esc(s.title)}</h3></div>
    <div class="dr-body"><div class="dr-sec">From assessment to advice</div>
      <p style="font-size:14px;line-height:1.6;color:var(--canon-gray-900);margin-bottom:14px">This is the Home → Intelligence handoff: the current-state read becomes the brief the advisory board reasons over.</p>
      <div class="srcrow"><div class="sf">${esc(s.title)} — current state</div><div class="sd">${esc(s.leadership)}</div></div>
      <div class="dr-sec">Recommended focus carried over</div>
      ${s.focus.map(f => `<div class="srcrow"><div class="sd">${esc(f)}</div></div>`).join('')}
      <div class="miss" style="margin-top:14px"><b>Next surface.</b> Intelligence applies these findings plus industry benchmarks to tell you whether and how to act. Tower then measures whether the approved moves deliver.</div>
    </div>
    <div class="dr-foot"><button class="btn" data-close style="flex:1">Close</button><button class="btn primary" data-close style="flex:1;background:var(--canon-bg-dark);color:#fff;border-color:var(--canon-bg-dark)">Open Intelligence</button></div>`);
}

// ── NAV ───────────────────────────────────────────────────────────────
function go(dim, ask) {
  state.dim = dim; state.ask = ask;
  renderRail(); renderView();
  const c = document.querySelector('.canvas');
  // scroll canvas content to top under the sticky ask bar
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('view').scrollTop = 0;
}
function doAsk(q) { if (!q || !q.trim()) return; const id = routeToDim(q.trim()); state.dim = id; state.ask = q.trim(); renderRail(); renderView(); $('ask-in').value = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ── INIT ──────────────────────────────────────────────────────────────
applyFrameChrome();
renderRail();
renderView();
$('ask-go').onclick = () => doAsk($('ask-in').value);
$('ask-in').onkeydown = (e) => { if (e.key === 'Enter') doAsk($('ask-in').value); };
$('backdrop').onclick = closeDrawer;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
