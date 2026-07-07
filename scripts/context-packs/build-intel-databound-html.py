#!/usr/bin/env python3
"""Build a data-bound standalone of the Intelligence v2 design, rendering all 5
tenants from outputs/intelligence-binding/all-tenants.json with a tenant switcher.
Data inlined so the file is self-contained."""
import json
data = json.load(open("outputs/intelligence-binding/all-tenants.json"))
DATA_JSON = json.dumps(data, ensure_ascii=False)

HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AbarVa · Intelligence v2 · data-bound</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--paper:#FBFAF7;--card:#FFFFFF;--ink:#1A1A18;--muted:#6B6B63;--faint:#9A998E;--line:#E7E3DA;--green:#1F6B3A;--greenbg:#E7F0E9;--amber:#A66A1F;--chip:#F2EFE8;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
.serif{font-family:Fraunces,Georgia,serif}
.mono{font-family:'JetBrains Mono',monospace}
.ey{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.wrap{max-width:1180px;margin:0 auto;padding:0 28px}
nav{display:flex;align-items:center;height:56px;border-bottom:1px solid var(--line);background:rgba(251,250,247,.9);position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.2) blur(6px)}
.logo{font-weight:700;font-size:17px;letter-spacing:-.01em}.logo b{color:#2E7BE6}
.tenant-name{font-family:Fraunces,serif;font-style:italic;font-size:15px;margin-left:14px;padding-left:14px;border-left:1px solid var(--line);color:#2a2a26}
.navlinks{margin-left:auto;display:flex;align-items:center;gap:4px}
.navlink{font-size:13px;color:var(--muted);padding:6px 12px;border-radius:7px;cursor:pointer}
.navlink.active{background:var(--ink);color:#fff}
select{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;border:1px solid var(--line);border-radius:7px;padding:6px 8px;background:var(--card);color:var(--ink);margin-left:12px;cursor:pointer}
.hero{text-align:center;padding:64px 0 8px}
.hero h1{font-family:Fraunces,serif;font-weight:500;font-size:46px;line-height:1.05;letter-spacing:-.015em;margin:14px 0 16px}
.hero .sub{color:var(--muted);font-size:15px;max-width:620px;margin:0 auto}
.ask{max-width:660px;margin:26px auto 0;display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 10px 10px 18px;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.ask input{flex:1;border:none;outline:none;font-size:14px;font-family:Inter;background:transparent;color:var(--ink)}
.ask .spark{color:var(--green)}
.ask button{background:var(--ink);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer}
.chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:760px;margin:16px auto 0}
.chip{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:6px 14px;font-size:12.5px;color:#3a3a34;cursor:pointer}
.chip .spark{color:var(--green);margin-right:5px}
.trust{text-align:center;margin:22px 0 4px}
.trust .mono{font-size:11.5px;color:var(--muted);letter-spacing:.02em}
.trust b{color:var(--ink)}
.tabs{display:flex;justify-content:center;gap:30px;border-bottom:1px solid var(--line);margin-top:18px}
.tab{padding:14px 2px;font-size:14px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:7px}
.tab.active{color:var(--ink);border-bottom-color:var(--green)}
.tab .ct{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--faint)}
.section{padding:26px 0 80px}
.sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px 24px}
.tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.tag{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.tag.sep{color:var(--faint)}
.tag.cross{background:var(--greenbg);color:var(--green);padding:2px 7px;border-radius:4px;letter-spacing:.08em}
.card h3{font-family:Fraunces,serif;font-weight:500;font-size:21px;line-height:1.22;letter-spacing:-.01em;margin-bottom:10px}
.card p.body{color:#3d3d36;font-size:13.5px;line-height:1.6}
.card .rule{height:1px;background:var(--line);margin:16px 0 13px}
.cardfoot{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.conf{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.08em;background:var(--greenbg);color:var(--green);padding:3px 8px;border-radius:4px}
.conf.med{background:#FBF3E3;color:var(--amber)}
.evi{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
.evi .dot{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block}
.act{margin-left:auto;display:flex;gap:18px}
.act a{font-size:12.5px;color:#2a2a26;cursor:pointer;text-decoration:none}
.act a.move{color:var(--green)}
.dimcard{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
.dimhead{display:flex;justify-content:space-between;align-items:start;gap:10px}
.dimcard h4{font-family:Fraunces,serif;font-weight:500;font-size:18px;letter-spacing:-.01em}
.loaded{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;background:var(--greenbg);color:var(--green);padding:3px 7px;border-radius:4px;white-space:nowrap}
.dimcard .desc{color:var(--muted);font-size:12.5px;margin:5px 0 16px}
.stats{display:flex;gap:26px}
.stat .k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.stat .v{font-family:Fraunces,serif;font-size:22px;font-weight:500;margin-top:2px}
.flag{color:var(--amber);font-size:11.5px;margin-top:12px;font-family:'JetBrains Mono',monospace}
.cpat h4{font-family:Fraunces,serif;font-weight:500;font-size:17px;margin-bottom:6px;letter-spacing:-.01em}
.cpat .dom{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.cpat p{color:var(--muted);font-size:12.5px}
.hidden{display:none}
</style></head>
<body>
<nav class="wrap" style="max-width:none;padding:0 28px">
  <span class="logo">Abar<b>Va</b></span><span class="tenant-name" id="tname"></span>
  <span class="navlinks">
    <span class="navlink">Home</span><span class="navlink active">Intelligence</span>
    <span class="navlink">Moves</span><span class="navlink">Source</span><span class="navlink">Tower</span>
    <select id="tsel" title="Switch tenant"></select>
  </span>
</nav>
<div class="wrap">
  <div class="hero">
    <div class="ey" style="color:var(--green)">INTELLIGENCE · RESEARCH &amp; ANALYSIS ENGINE</div>
    <h1 id="hero-h1"></h1>
    <p class="sub" id="hero-sub"></p>
    <div class="ask"><span class="spark">✦</span><input id="askin" readonly><button>Ask</button></div>
    <div class="chips" id="chips"></div>
    <div class="trust"><span class="mono" id="trust"></span></div>
  </div>
  <div class="tabs">
    <div class="tab active" data-tab="signals">Signals <span class="ct" id="ct-signals"></span></div>
    <div class="tab" data-tab="context">Context <span class="ct" id="ct-context"></span></div>
    <div class="tab" data-tab="corpus">Corpus <span class="ct" id="ct-corpus"></span></div>
  </div>
  <div class="section" id="panel"></div>
</div>
<script>
const DATA = __DATA__;
const order = DATA.tenantOrder && DATA.tenantOrder.length ? DATA.tenantOrder : Object.keys(DATA.tenants);
let current = order[0], tab = 'signals';
const $ = s => document.querySelector(s);
function esc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderSignals(t){
  const cards = t.signals.map(s=>{
    const tags = s.domains.map(d=>`<span class="tag">${esc(d)}</span>`).join('<span class="tag sep">·</span>');
    const cross = s.crossDomain ? `<span class="tag cross">CROSS-DOMAIN</span>` : '';
    const conf = (s.confidence||'').toUpperCase().includes('HIGH') ? 'conf' : 'conf med';
    const move = s.move ? `<a class="move" title="${esc(s.move.title)} · ${esc(s.move.owner||'')} · ${esc(s.move.impact||'')}">Shape into Move →</a>` : '';
    return `<div class="card">
      <div class="tags">${tags}${cross}</div>
      <h3>${esc(s.headline)}</h3>
      <p class="body">${esc(s.body)}</p>
      <div class="rule"></div>
      <div class="cardfoot">
        <span class="${conf}">${esc(s.confidence)}</span>
        <span class="evi"><span class="dot"></span>${s.evidencePoints} evidence points · ${s.sources} sources</span>
        <span class="act"><a>Trace evidence →</a>${move}</span>
      </div></div>`;
  }).join('');
  return `<div class="sechead"><span class="ey">EXECUTIVE SIGNALS · WHAT THE CONTEXT IS TELLING US</span>
    <span class="ey">${t.signals.length} ACTIVE · CROSS-DOMAIN</span></div>
    <div class="grid2">${cards}</div>`;
}
function renderContext(t){
  const cards = t.context.map(c=>`<div class="dimcard">
    <div class="dimhead"><h4>${esc(c.dimension)}</h4><span class="loaded">${esc(c.status)}</span></div>
    <div class="desc">${esc(c.description)}</div>
    <div class="stats">
      <div class="stat"><div class="k">Evidence</div><div class="v">${c.evidence}</div></div>
      <div class="stat"><div class="k">Sources</div><div class="v">${c.sources}</div></div>
      <div class="stat"><div class="k">Trust</div><div class="v">${c.trust}%</div></div>
    </div>${c.flag?`<div class="flag">${esc(c.flag)}</div>`:''}</div>`).join('');
  const ev = t.context.reduce((a,c)=>a+(c.evidence||0),0);
  return `<div class="sechead"><span class="ey">LOADED CONTEXT · BROWSE BY DIMENSION</span>
    <span class="ey">${t.context.length} CONNECTED · ${ev.toLocaleString()} EVIDENCE POINTS</span></div>
    <div class="grid3">${cards}</div>`;
}
function renderCorpus(t){
  const cards = t.corpus.map(c=>`<div class="dimcard cpat">
    <div class="dom">${esc(c.domain||'pattern')}</div><h4>${esc(c.patternName)}</h4>
    <p>${esc(c.whenToApply)}</p></div>`).join('') || '<p class="ey">No corpus patterns loaded.</p>';
  return `<div class="sechead"><span class="ey">CORPUS · PATTERNS MATCHED TO THIS CONTEXT</span>
    <span class="ey">${t.corpus.length} PATTERNS</span></div><div class="grid3">${cards}</div>`;
}
function render(){
  const t = DATA.tenants[current];
  $('#tname').textContent = t.tenant.displayName;
  $('#hero-h1').innerHTML = 'Ask anything about<br>'+esc(t.tenant.displayName)+'.';
  $('#hero-sub').textContent = t.ask.contract;
  $('#askin').placeholder = t.ask.placeholder;
  $('#chips').innerHTML = (t.suggestedQuestions||[]).map(q=>`<span class="chip"><span class="spark">✦</span>${esc(q)}</span>`).join('');
  const tl = t.trustLine;
  $('#trust').innerHTML = `<b>${tl.dimensionsLoaded}</b> dimensions loaded · <b>${tl.evidencePoints.toLocaleString()}</b> evidence points · <b>${tl.sources}</b> sources · <b>${tl.searchVerifiedPct}%</b> search-verified`;
  $('#ct-signals').textContent = t.signals.length;
  $('#ct-context').textContent = t.context.length;
  $('#ct-corpus').textContent = t.corpus.length;
  $('#panel').innerHTML = tab==='signals'?renderSignals(t):tab==='context'?renderContext(t):renderCorpus(t);
}
// tenant switcher
const sel = $('#tsel');
order.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=DATA.tenants[k].tenant.displayName;sel.appendChild(o);});
sel.value=current; sel.addEventListener('change',e=>{current=e.target.value;render();});
document.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{
  tab=el.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===el));render();}));
render();
</script></body></html>"""

import shutil, os
out = "outputs/intelligence-binding/AbarVa-Intelligence-v2-databound.html"
open(out, "w", encoding="utf-8").write(HTML.replace("__DATA__", DATA_JSON))
shutil.copy(out, os.path.expanduser("~/Downloads/AbarVa-Intelligence-v2-databound.html"))
print("WROTE", out, "(+ ~/Downloads copy)")
print("tenants:", list(data["tenants"].keys()))
